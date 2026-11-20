import express, { type Request, type Response, type Router } from 'express';
import {
  fetchAirQualityReport,
  reverseGeocodeCoordinates,
  searchCities,
} from '@/src/lib/api/openMeteo';
import { AiConfigurationError, streamGroundedAssistant } from '@/src/lib/ai/provider';
import { TtlCache } from '@/src/lib/cache';
import { UpstreamFetchError } from '@/src/lib/http';
import { InMemoryRateLimiter } from '@/src/lib/rateLimit';
import {
  aqiQuerySchema,
  chatRequestSchema,
  geocodeQuerySchema,
  reverseGeocodeQuerySchema,
} from '@/src/lib/validation/schemas';
import type { AirQualityReport, GeoLocation } from '@/src/types/airQuality';

export interface ApiRouterDeps {
  geocodeCache?: TtlCache<GeoLocation[]>;
  aqiCache?: TtlCache<AirQualityReport>;
  aqiLimiter?: InMemoryRateLimiter;
  chatLimiter?: InMemoryRateLimiter;
  searchCitiesFn?: typeof searchCities;
  reverseGeocodeFn?: typeof reverseGeocodeCoordinates;
  fetchAqiFn?: typeof fetchAirQualityReport;
  streamAssistantFn?: typeof streamGroundedAssistant;
}

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const SIXTY_MINUTES_MS = 60 * 60 * 1000;

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'anonymous';
}

function applyRateLimit(
  limiter: InMemoryRateLimiter,
  req: Request,
  res: Response,
  bucket: string,
): boolean {
  const ip = getClientIp(req);
  const result = limiter.check(`${bucket}:${ip}`);
  res.setHeader('X-RateLimit-Limit', String(result.limit));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAtMs / 1000)));

  if (!result.allowed) {
    res.setHeader('Retry-After', String(result.retryAfterSec));
    res.status(429).json({
      error: 'Too many requests. Please wait before trying again.',
      retryAfterSec: result.retryAfterSec,
    });
    return false;
  }
  return true;
}

/**
 * Creates the Express API router with zod validation, server-side caching,
 * sliding-window rate limiting, and SSE streaming for the AI assistant.
 */
export function createApiRouter(deps: ApiRouterDeps = {}): Router {
  const router = express.Router();

  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
  const aqiMax = Number(process.env.RATE_LIMIT_AQI_MAX) || 60;
  const chatMax = Number(process.env.RATE_LIMIT_CHAT_MAX) || 20;

  const geocodeCache = deps.geocodeCache ?? new TtlCache<GeoLocation[]>(200);
  const aqiCache = deps.aqiCache ?? new TtlCache<AirQualityReport>(200);
  const aqiLimiter = deps.aqiLimiter ?? new InMemoryRateLimiter(windowMs, aqiMax);
  const chatLimiter = deps.chatLimiter ?? new InMemoryRateLimiter(windowMs, chatMax);

  const runSearchCities = deps.searchCitiesFn ?? searchCities;
  const runReverseGeocode = deps.reverseGeocodeFn ?? reverseGeocodeCoordinates;
  const runFetchAqi = deps.fetchAqiFn ?? fetchAirQualityReport;
  const runStreamAssistant = deps.streamAssistantFn ?? streamGroundedAssistant;

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  router.get('/geocode', async (req: Request, res: Response) => {
    if (!applyRateLimit(aqiLimiter, req, res, 'geocode')) return;

    // Support reverse geocoding if lat & lon are supplied
    if (req.query.lat !== undefined || req.query.lon !== undefined) {
      const parsedReverse = reverseGeocodeQuerySchema.safeParse({
        lat: req.query.lat,
        lon: req.query.lon,
      });
      if (!parsedReverse.success) {
        res.status(400).json({
          error: 'Invalid coordinates provided for reverse lookup.',
          details: parsedReverse.error.flatten().fieldErrors,
        });
        return;
      }
      const { lat, lon } = parsedReverse.data;
      const location = await runReverseGeocode(lat, lon);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.json({ results: [location] });
      return;
    }

    const parsed = geocodeQuerySchema.safeParse({ q: req.query.q });
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Invalid city search query.',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const normalizedKey = parsed.data.q.toLowerCase();
    const cached = geocodeCache.get(normalizedKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.json({ results: cached });
      return;
    }

    try {
      const results = await runSearchCities(parsed.data.q);
      geocodeCache.set(normalizedKey, results, SIXTY_MINUTES_MS);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.json({ results });
    } catch (err) {
      const status = err instanceof UpstreamFetchError ? err.status : 502;
      res.status(status).json({
        error: 'Unable to search cities right now. Please try again shortly.',
      });
    }
  });

  router.get('/aqi', async (req: Request, res: Response) => {
    if (!applyRateLimit(aqiLimiter, req, res, 'aqi')) return;

    const parsed = aqiQuerySchema.safeParse({
      lat: req.query.lat,
      lon: req.query.lon,
      name: req.query.name,
      country: req.query.country,
      countryCode: req.query.countryCode,
      admin1: req.query.admin1,
      timezone: req.query.timezone,
    });

    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid latitude or longitude parameters.',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { lat, lon, name, country, countryCode, admin1, timezone } = parsed.data;
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = aqiCache.get(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=300');
      res.json({
        ...cached,
        location: name
          ? {
              ...cached.location,
              name,
              country: country ?? cached.location.country,
              countryCode: countryCode ?? cached.location.countryCode,
              admin1: admin1 ?? cached.location.admin1,
            }
          : cached.location,
      });
      return;
    }

    try {
      const location: GeoLocation = {
        id: cacheKey,
        name: name ?? `Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
        country: country ?? '',
        countryCode: countryCode ?? '',
        admin1,
        latitude: lat,
        longitude: lon,
        timezone,
      };
      const report = await runFetchAqi(location);
      aqiCache.set(cacheKey, report, FIFTEEN_MINUTES_MS);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=300');
      res.json(report);
    } catch (err) {
      const status = err instanceof UpstreamFetchError ? err.status : 502;
      res.status(status).json({
        error: 'Unable to retrieve air quality telemetry for this location. Please try again.',
      });
    }
  });

  router.post('/chat', async (req: Request, res: Response) => {
    if (!applyRateLimit(chatLimiter, req, res, 'chat')) return;

    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Invalid chat request payload.',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const writeSse = (event: string, data: Record<string, unknown>) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      let emittedChars = 0;
      const MAX_RESPONSE_CHARS = 2400;

      for await (const delta of runStreamAssistant(parsed.data)) {
        if (emittedChars >= MAX_RESPONSE_CHARS) break;
        const remaining = MAX_RESPONSE_CHARS - emittedChars;
        const safeDelta = delta.length > remaining ? delta.slice(0, remaining) : delta;
        emittedChars += safeDelta.length;
        writeSse('delta', { text: safeDelta });
      }
      writeSse('done', { completed: true });
      res.end();
    } catch (err) {
      const message =
        err instanceof AiConfigurationError
          ? err.message
          : 'The AI assistant encountered an issue generating a response. Please try again.';
      writeSse('error', { error: message });
      res.end();
    }
  });

  return router;
}
