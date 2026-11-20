import { describe, expect, it } from 'vitest';
import {
  calculateSubIndex,
  getAqiCategory,
  normalizeOpenMeteoResponse,
  type OpenMeteoAirQualityRaw,
} from '@/src/lib/aqi/standards';
import type { GeoLocation } from '@/src/types/airQuality';

describe('getAqiCategory boundary values', () => {
  it('maps exact EPA category boundaries accurately', () => {
    expect(getAqiCategory(-5).id).toBe('good');
    expect(getAqiCategory(0).id).toBe('good');
    expect(getAqiCategory(50).id).toBe('good');
    expect(getAqiCategory(51).id).toBe('moderate');
    expect(getAqiCategory(100).id).toBe('moderate');
    expect(getAqiCategory(101).id).toBe('usg');
    expect(getAqiCategory(150).id).toBe('usg');
    expect(getAqiCategory(151).id).toBe('unhealthy');
    expect(getAqiCategory(200).id).toBe('unhealthy');
    expect(getAqiCategory(201).id).toBe('very_unhealthy');
    expect(getAqiCategory(300).id).toBe('very_unhealthy');
    expect(getAqiCategory(301).id).toBe('hazardous');
    expect(getAqiCategory(500).id).toBe('hazardous');
  });

  it('includes distinct text labels and non-color symbols on every category', () => {
    const samples = [25, 75, 125, 175, 250, 350];
    const symbols = new Set(samples.map((v) => getAqiCategory(v).symbol));
    expect(symbols.size).toBe(6);
    for (const val of samples) {
      const cat = getAqiCategory(val);
      expect(cat.label.length).toBeGreaterThan(0);
      expect(cat.rangeLabel.length).toBeGreaterThan(0);
    }
  });
});

describe('calculateSubIndex', () => {
  it('returns null for null, NaN, or negative inputs', () => {
    expect(calculateSubIndex('pm2_5', null)).toBeNull();
    expect(calculateSubIndex('pm2_5', Number.NaN)).toBeNull();
    expect(calculateSubIndex('pm2_5', -1)).toBeNull();
  });

  it('calculates updated 2024 EPA PM2.5 sub-indices accurately', () => {
    expect(calculateSubIndex('pm2_5', 0)).toBe(0);
    expect(calculateSubIndex('pm2_5', 9.0)).toBe(50);
    expect(calculateSubIndex('pm2_5', 9.1)).toBe(51);
    expect(calculateSubIndex('pm2_5', 35.4)).toBe(100);
    expect(calculateSubIndex('pm2_5', 35.5)).toBe(101);
    expect(calculateSubIndex('pm2_5', 55.4)).toBe(150);
  });

  it('calculates PM10, O3, NO2, SO2, and CO sub-indices from µg/m³', () => {
    expect(calculateSubIndex('pm10', 54)).toBe(50);
    expect(calculateSubIndex('pm10', 55)).toBe(51);
    expect(calculateSubIndex('o3', 100)).toBeLessThanOrEqual(50);
    expect(calculateSubIndex('no2', 50)).toBeLessThanOrEqual(50);
    expect(calculateSubIndex('so2', 50)).toBeLessThanOrEqual(50);
    expect(calculateSubIndex('co', 2000)).toBeLessThanOrEqual(50);
  });
});

describe('normalizeOpenMeteoResponse', () => {
  const sampleLocation: GeoLocation = {
    id: 'test-city',
    name: 'Seattle',
    country: 'United States',
    countryCode: 'US',
    latitude: 47.6062,
    longitude: -122.3321,
  };

  it('normalizes current pollutants, computes dominant pollutant, and 24h summary stats', () => {
    const raw: OpenMeteoAirQualityRaw = {
      timezone: 'America/Los_Angeles',
      current: {
        us_aqi: 78,
        european_aqi: 42,
        pm2_5: 22.4,
        pm10: 31.2,
        nitrogen_dioxide: 18.5,
        ozone: 62.0,
        sulphur_dioxide: 4.1,
        carbon_monoxide: 310.0,
        uv_index: 3.4,
      },
      hourly: {
        time: ['2026-11-20T00:00', '2026-11-20T01:00', '2026-11-20T02:00', '2026-11-20T03:00'],
        us_aqi: [60, 72, 84, 68],
        european_aqi: [35, 40, 46, 38],
        pm2_5: [15, 20, 25, 18],
        pm10: [24, 28, 33, 25],
        nitrogen_dioxide: [15, 18, 22, 16],
        ozone: [50, 55, 60, 58],
        sulphur_dioxide: [3, 4, 4, 3],
        carbon_monoxide: [280, 300, 320, 290],
      },
    };

    const report = normalizeOpenMeteoResponse(raw, sampleLocation, '2026-11-20T00:00:00Z');
    expect(report.current.usAqi).toBe(78);
    expect(report.current.category.id).toBe('moderate');
    expect(report.current.dominantPollutant).toBe('pm2_5');
    expect(report.current.pollutants).toHaveLength(6);
    expect(report.current.pollutants[0].standard.thresholdValue).toBe(15);
    expect(report.hourly).toHaveLength(4);
    expect(report.summary).toEqual({
      min24hAqi: 60,
      max24hAqi: 84,
      avg24hAqi: 71,
    });
  });

  it('handles missing upstream values gracefully without NaN', () => {
    const raw: OpenMeteoAirQualityRaw = {
      current: {
        pm2_5: 12.0,
      },
      hourly: {
        time: ['2026-11-20T00:00'],
        pm2_5: [12.0],
      },
    };

    const report = normalizeOpenMeteoResponse(raw, sampleLocation);
    expect(report.current.usAqi).toBeGreaterThan(50);
    expect(report.current.europeanAqi).toBeNull();
    expect(report.hourly[0].usAqi).toBeGreaterThan(50);
  });
});
