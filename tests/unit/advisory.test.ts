import { describe, expect, it } from 'vitest';
import { findOutdoorWindows, generateHealthAdvisory } from '@/src/lib/advisory/engine';
import { getAqiCategory } from '@/src/lib/aqi/standards';
import type { AirQualityReport, HourlyForecastPoint, UserProfile } from '@/src/types/airQuality';

function buildReport(
  usAqi: number,
  hourlyAqis: number[] = [40, 42, 45, 95, 110, 105],
): AirQualityReport {
  const hourly: HourlyForecastPoint[] = hourlyAqis.map((aqi, idx) => ({
    time: `2026-11-20T${String(idx).padStart(2, '0')}:00`,
    usAqi: aqi,
    europeanAqi: Math.round(aqi * 0.6),
    pm2_5: 18,
    pm10: 28,
    no2: 20,
    o3: 55,
    so2: 5,
    co: 300,
  }));

  return {
    location: {
      id: 'loc-1',
      name: 'Denver',
      country: 'United States',
      countryCode: 'US',
      latitude: 39.7392,
      longitude: -104.9903,
    },
    fetchedAt: '2026-11-20T00:00:00Z',
    source: 'Test',
    current: {
      usAqi,
      europeanAqi: 40,
      category: getAqiCategory(usAqi),
      dominantPollutant: 'pm2_5',
      uvIndex: 4,
      pollutants: [
        {
          id: 'pm2_5',
          name: 'Fine Particulate Matter',
          formula: 'PM2.5',
          value: 28,
          unit: 'µg/m³',
          subIndex: usAqi,
          statusLabel: getAqiCategory(usAqi).shortLabel,
          ratioToWhoLimit: 1.87,
          standard: {
            standardName: 'WHO 2021 Guideline (24h)',
            standardUrl: 'https://www.who.int/',
            thresholdValue: 15,
            thresholdUnit: 'µg/m³',
            averagingPeriod: '24-hour mean',
          },
        },
      ],
    },
    hourly,
    summary: {
      min24hAqi: Math.min(...hourlyAqis),
      max24hAqi: Math.max(...hourlyAqis),
      avg24hAqi: Math.round(hourlyAqis.reduce((a, b) => a + b, 0) / hourlyAqis.length),
    },
  };
}

describe('findOutdoorWindows', () => {
  it('identifies the lowest and highest 3-hour rolling outdoor windows', () => {
    const hourly: HourlyForecastPoint[] = [35, 30, 32, 88, 120, 115, 50].map((aqi, idx) => ({
      time: `2026-11-20T${String(idx).padStart(2, '0')}:00`,
      usAqi: aqi,
      europeanAqi: null,
      pm2_5: null,
      pm10: null,
      no2: null,
      o3: null,
      so2: null,
      co: null,
    }));

    const { bestWindow, worstWindow } = findOutdoorWindows(hourly);
    expect(bestWindow?.label).toBe('00:00–02:00');
    expect(bestWindow?.avgAqi).toBe(32);
    expect(worstWindow?.label).toBe('03:00–05:00');
    expect(worstWindow?.avgAqi).toBe(108);
  });

  it('handles empty or short hourly arrays gracefully', () => {
    expect(findOutdoorWindows([])).toEqual({ bestWindow: null, worstWindow: null });
    const single = findOutdoorWindows([
      {
        time: '2026-11-20T06:00',
        usAqi: 45,
        europeanAqi: null,
        pm2_5: null,
        pm10: null,
        no2: null,
        o3: null,
        so2: null,
        co: null,
      },
    ]);
    expect(single.bestWindow?.avgAqi).toBe(45);
  });
});

describe('generateHealthAdvisory', () => {
  const allProfiles: UserProfile[] = [
    'general',
    'children',
    'elderly',
    'respiratory',
    'outdoor_worker',
    'athlete',
  ];

  it('returns low risk and open-window guidance when AQI is Good (<=50)', () => {
    for (const profile of allProfiles) {
      const advisory = generateHealthAdvisory(buildReport(32), profile);
      expect(advisory.riskLevel).toBe('low');
      expect(advisory.maskGuidance.toLowerCase()).toContain('no respiratory mask');
      expect(advisory.ventilationAdvice.toLowerCase()).toContain('open windows');
    }
  });

  it('escalates risk for sensitive profiles at Moderate (51-100) and USG (101-150)', () => {
    const genMod = generateHealthAdvisory(buildReport(78), 'general');
    const respMod = generateHealthAdvisory(buildReport(78), 'respiratory');
    expect(genMod.riskLevel).toBe('guarded');
    expect(respMod.riskLevel).toBe('elevated');

    const genUsg = generateHealthAdvisory(buildReport(125), 'general');
    const athleteUsg = generateHealthAdvisory(buildReport(125), 'athlete');
    expect(genUsg.riskLevel).toBe('elevated');
    expect(athleteUsg.riskLevel).toBe('high');
    expect(athleteUsg.exerciseAdvice.toLowerCase()).toContain('cross-training');
  });

  it('recommends N95/FFP2 masks and indoor HEPA filtration at Unhealthy+ (>=151)', () => {
    const respHigh = generateHealthAdvisory(buildReport(172), 'respiratory');
    expect(respHigh.riskLevel).toBe('high');
    expect(respHigh.maskGuidance).toContain('N95');
    expect(respHigh.ventilationAdvice).toContain('HEPA');
    expect(respHigh.actionItems.some((item) => item.toLowerCase().includes('inhaler'))).toBe(true);

    const severe = generateHealthAdvisory(buildReport(235), 'general');
    expect(severe.riskLevel).toBe('severe');
    expect(severe.exerciseAdvice.toLowerCase()).toContain('avoid all outdoor exercise');
  });
});
