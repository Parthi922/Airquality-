import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAirQualityReport,
  reverseGeocodeCoordinates,
  searchCities,
} from '@/src/lib/api/openMeteo';
import { ClientApiError, fetchCityAirQuality, fetchReverseCity } from '@/src/lib/api/client';
import { POLLUTANT_EXPLAINERS } from '@/src/lib/pollutants/explainer';
import type { GeoLocation } from '@/src/types/airQuality';

describe('Open-Meteo API client functions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('searchCities maps Open-Meteo geocoding results and handles empty results', async () => {
    const mockFetch = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 1850147,
              name: 'Tokyo',
              country: 'Japan',
              country_code: 'jp',
              admin1: 'Tokyo',
              latitude: 35.6895,
              longitude: 139.6917,
              timezone: 'Asia/Tokyo',
              population: 8336599,
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const results = await searchCities('Tokyo', mockFetch);
    expect(results).toHaveLength(1);
    expect(results[0].countryCode).toBe('JP');

    const emptyFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    expect(await searchCities('NowhereCity', emptyFetch)).toEqual([]);
  });

  it('reverseGeocodeCoordinates resolves city name and falls back gracefully on failure', async () => {
    const okFetch = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          address: {
            city: 'Berlin',
            state: 'Berlin',
            country: 'Germany',
            country_code: 'de',
          },
        }),
        { status: 200 },
      ),
    );

    const resolved = await reverseGeocodeCoordinates(52.52, 13.405, okFetch);
    expect(resolved.name).toBe('Berlin');
    expect(resolved.countryCode).toBe('DE');

    const errFetch = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('Network down'));
    const fallback = await reverseGeocodeCoordinates(52.52, 13.405, errFetch);
    expect(fallback.name).toContain('52.52');
  });

  it('fetchAirQualityReport fetches and normalizes Open-Meteo telemetry', async () => {
    const location: GeoLocation = {
      id: '1',
      name: 'Paris',
      country: 'France',
      countryCode: 'FR',
      latitude: 48.8566,
      longitude: 2.3522,
    };

    const mockFetch = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          timezone: 'Europe/Paris',
          current: {
            us_aqi: 48,
            european_aqi: 29,
            pm2_5: 10.5,
            pm10: 18.2,
            nitrogen_dioxide: 21.0,
            ozone: 58.0,
            sulphur_dioxide: 3.2,
            carbon_monoxide: 240.0,
            uv_index: 2.0,
          },
          hourly: {
            time: ['2026-11-20T00:00', '2026-11-20T01:00'],
            us_aqi: [45, 48],
            pm2_5: [9.8, 10.5],
          },
        }),
        { status: 200 },
      ),
    );

    const report = await fetchAirQualityReport(location, mockFetch);
    expect(report.location.timezone).toBe('Europe/Paris');
    expect(report.current.usAqi).toBe(48);
    expect(report.hourly).toHaveLength(2);
  });
});

describe('Client API error handling & pollutant explainers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchReverseCity and fetchCityAirQuality parse responses and surface ClientApiError', async () => {
    const loc: GeoLocation = {
      id: '1',
      name: 'Osaka',
      country: 'Japan',
      countryCode: 'JP',
      latitude: 34.69,
      longitude: 135.5,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ results: [loc] }), { status: 200 }),
    );
    const rev = await fetchReverseCity(34.69, 135.5);
    expect(rev.name).toBe('Osaka');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 }),
    );
    await expect(fetchCityAirQuality(loc)).rejects.toBeInstanceOf(ClientApiError);
  });

  it('provides plain-language explainers for all 6 regulated pollutants', () => {
    const keys = ['pm2_5', 'pm10', 'no2', 'o3', 'so2', 'co'] as const;
    for (const key of keys) {
      expect(POLLUTANT_EXPLAINERS[key].plainSummary.length).toBeGreaterThan(20);
      expect(POLLUTANT_EXPLAINERS[key].urbanSources.length).toBeGreaterThanOrEqual(1);
    }
  });
});
