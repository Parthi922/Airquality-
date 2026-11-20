import express from 'express';
import { createServer, type Server } from 'http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAqiCategory } from '@/src/lib/aqi/standards';
import { TtlCache } from '@/src/lib/cache';
import { UpstreamFetchError } from '@/src/lib/http';
import { InMemoryRateLimiter } from '@/src/lib/rateLimit';
import { createApiRouter } from '@/src/server/apiRouter';
import type { AirQualityReport, GeoLocation } from '@/src/types/airQuality';

async function withTestServer(
  router: express.Router,
  fn: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  const server: Server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  }
}

const sampleCity: GeoLocation = {
  id: '2643743',
  name: 'London',
  country: 'United Kingdom',
  countryCode: 'GB',
  latitude: 51.5085,
  longitude: -0.1257,
};

const sampleReport: AirQualityReport = {
  location: sampleCity,
  fetchedAt: '2026-11-20T00:00:00Z',
  source: 'Open-Meteo',
  current: {
    usAqi: 54,
    europeanAqi: 30,
    category: getAqiCategory(54),
    dominantPollutant: 'pm2_5',
    pollutants: [],
    uvIndex: 2.1,
  },
  hourly: [],
  summary: { min24hAqi: 38, max24hAqi: 66, avg24hAqi: 51 },
};

describe('API route handlers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates /api/geocode query, caches results, and handles upstream failure', async () => {
    const searchMock = vi.fn().mockResolvedValue([sampleCity]);
    const router = createApiRouter({
      searchCitiesFn: searchMock,
      geocodeCache: new TtlCache(20),
    });

    await withTestServer(router, async (baseUrl) => {
      const badRes = await fetch(`${baseUrl}/api/geocode?q=a`);
      expect(badRes.status).toBe(400);

      const firstRes = await fetch(`${baseUrl}/api/geocode?q=London`);
      expect(firstRes.status).toBe(200);
      expect(firstRes.headers.get('x-cache')).toBe('MISS');
      const firstBody = (await firstRes.json()) as { results: GeoLocation[] };
      expect(firstBody.results[0].name).toBe('London');

      const secondRes = await fetch(`${baseUrl}/api/geocode?q=london`);
      expect(secondRes.status).toBe(200);
      expect(secondRes.headers.get('x-cache')).toBe('HIT');
      expect(searchMock).toHaveBeenCalledTimes(1);
    });

    const failingRouter = createApiRouter({
      searchCitiesFn: vi.fn().mockRejectedValue(new UpstreamFetchError('Upstream down', 502)),
    });
    await withTestServer(failingRouter, async (baseUrl) => {
      const failRes = await fetch(`${baseUrl}/api/geocode?q=London`);
      expect(failRes.status).toBe(502);
    });
  });

  it('validates /api/aqi, caches telemetry, and enforces rate limits', async () => {
    const aqiMock = vi.fn().mockResolvedValue(sampleReport);
    const limiter = new InMemoryRateLimiter(60_000, 2);
    const router = createApiRouter({
      fetchAqiFn: aqiMock,
      aqiCache: new TtlCache(20),
      aqiLimiter: limiter,
    });

    await withTestServer(router, async (baseUrl) => {
      const invalidRes = await fetch(`${baseUrl}/api/aqi?lat=999&lon=0`);
      expect(invalidRes.status).toBe(400);

      const okRes = await fetch(`${baseUrl}/api/aqi?lat=51.51&lon=-0.13&name=London`);
      expect(okRes.status).toBe(200);
      expect(okRes.headers.get('x-cache')).toBe('MISS');

      const limitedRes = await fetch(`${baseUrl}/api/aqi?lat=51.51&lon=-0.13&name=London`);
      expect(limitedRes.status).toBe(429);
      expect(limitedRes.headers.get('retry-after')).toBeTruthy();
    });
  });

  it('streams SSE tokens from /api/chat and validates body', async () => {
    async function* mockStream(): AsyncGenerator<string> {
      yield 'Based on US AQI 54 ';
      yield 'in London, light outdoor exercise is safe.';
    }

    const router = createApiRouter({
      streamAssistantFn: mockStream,
      chatLimiter: new InMemoryRateLimiter(60_000, 10),
    });

    await withTestServer(router, async (baseUrl) => {
      const badChat = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      });
      expect(badChat.status).toBe(400);

      const okChat = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Can I run at 6am?',
          profile: 'athlete',
          history: [],
          context: {
            cityName: 'London',
            country: 'United Kingdom',
            fetchedAt: '2026-11-20T00:00:00Z',
            usAqi: 54,
            europeanAqi: 30,
            categoryLabel: 'Moderate',
            dominantPollutant: 'pm2_5',
            pollutants: [],
            min24hAqi: 38,
            max24hAqi: 66,
            avg24hAqi: 51,
            bestWindow: null,
            worstWindow: null,
            advisoryHeadline: 'Moderate',
            maskGuidance: 'None',
            exerciseAdvice: 'Schedule during best window',
            ventilationAdvice: 'Acceptable',
          },
        }),
      });

      expect(okChat.status).toBe(200);
      expect(okChat.headers.get('content-type')).toContain('text/event-stream');
      const rawSse = await okChat.text();
      expect(rawSse).toContain('Based on US AQI 54');
      expect(rawSse).toContain('event: done');
    });
  });
});
