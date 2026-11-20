import { normalizeOpenMeteoResponse, type OpenMeteoAirQualityRaw } from '@/src/lib/aqi/standards';
import { fetchJsonWithRetry } from '@/src/lib/http';
import type { AirQualityReport, GeoLocation } from '@/src/types/airQuality';

const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
const AIR_QUALITY_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const NOMINATIM_REVERSE_BASE = 'https://nominatim.openstreetmap.org/reverse';

interface OpenMeteoGeocodeRaw {
  results?: Array<{
    id?: number;
    name?: string;
    country?: string;
    country_code?: string;
    admin1?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    population?: number;
  }>;
}

interface NominatimReverseRaw {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

/**
 * Searches global cities via Open-Meteo Geocoding API (no API key required).
 */
export async function searchCities(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GeoLocation[]> {
  const url = new URL(GEOCODING_BASE);
  url.searchParams.set('name', query);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const data = await fetchJsonWithRetry<OpenMeteoGeocodeRaw>(url.toString(), {
    fetchImpl,
    timeoutMs: 6000,
    retries: 2,
  });

  if (!Array.isArray(data.results)) {
    return [];
  }

  return data.results
    .filter(
      (
        item,
      ): item is Required<Pick<typeof item, 'name' | 'latitude' | 'longitude'>> & typeof item =>
        typeof item.name === 'string' &&
        typeof item.latitude === 'number' &&
        typeof item.longitude === 'number',
    )
    .map((item) => ({
      id: String(item.id ?? `${item.latitude.toFixed(3)},${item.longitude.toFixed(3)}`),
      name: item.name,
      country: item.country ?? 'Unknown',
      countryCode: (item.country_code ?? '').toUpperCase(),
      admin1: item.admin1,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone,
      population: item.population,
    }));
}

/**
 * Resolves user GPS coordinates to a readable city label with graceful coordinate fallback.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lon: number,
  fetchImpl: typeof fetch = fetch,
): Promise<GeoLocation> {
  const fallback: GeoLocation = {
    id: `${lat.toFixed(3)},${lon.toFixed(3)}`,
    name: `Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
    country: 'Current Coordinates',
    countryCode: '',
    latitude: lat,
    longitude: lon,
  };

  try {
    const url = new URL(NOMINATIM_REVERSE_BASE);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('zoom', '10');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetchImpl(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'UrbanAirQualityAssistant/1.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return fallback;
    const raw = (await res.json()) as NominatimReverseRaw;
    const addr = raw.address;
    const cityName =
      addr?.city ?? addr?.town ?? addr?.village ?? addr?.municipality ?? fallback.name;

    return {
      id: `${lat.toFixed(3)},${lon.toFixed(3)}`,
      name: cityName,
      country: addr?.country ?? fallback.country,
      countryCode: (addr?.country_code ?? '').toUpperCase(),
      admin1: addr?.state,
      latitude: lat,
      longitude: lon,
    };
  } catch {
    return fallback;
  }
}

/**
 * Fetches current and 48-hour hourly air quality telemetry from Open-Meteo Air Quality API.
 */
export async function fetchAirQualityReport(
  location: GeoLocation,
  fetchImpl: typeof fetch = fetch,
): Promise<AirQualityReport> {
  const url = new URL(AIR_QUALITY_BASE);
  url.searchParams.set('latitude', String(location.latitude));
  url.searchParams.set('longitude', String(location.longitude));
  url.searchParams.set(
    'current',
    'us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,uv_index',
  );
  url.searchParams.set(
    'hourly',
    'us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
  );
  url.searchParams.set('forecast_days', '2');
  url.searchParams.set('timezone', 'auto');

  const raw = await fetchJsonWithRetry<OpenMeteoAirQualityRaw>(url.toString(), {
    fetchImpl,
    timeoutMs: 8000,
    retries: 2,
  });

  return normalizeOpenMeteoResponse(raw, location);
}
