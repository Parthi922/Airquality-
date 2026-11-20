import type {
  AirQualityReport,
  AqiCategoryMeta,
  GeoLocation,
  HourlyForecastPoint,
  PollutantId,
  PollutantReading,
  PollutantStandard,
} from '@/src/types/airQuality';

/**
 * AQI Breakpoint row following the US EPA AQI Technical Assistance Document.
 * Sources:
 * - US EPA AQI Basics & 2024 PM2.5 Final Rule:
 *   https://www.airnow.gov/aqi/aqi-basics/
 *   https://www.epa.gov/pm-pollution/national-ambient-air-quality-standards-naaqs-pm
 * - WHO Global Air Quality Guidelines (2021):
 *   https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health
 */
export interface Breakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}

export const PM25_BREAKPOINTS_UG_M3: readonly Breakpoint[] = [
  { cLow: 0.0, cHigh: 9.0, iLow: 0, iHigh: 50 },
  { cLow: 9.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 125.4, iLow: 151, iHigh: 200 },
  { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300 },
  { cLow: 225.5, cHigh: 325.4, iLow: 301, iHigh: 500 },
];

export const PM10_BREAKPOINTS_UG_M3: readonly Breakpoint[] = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
  { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 },
];

// US EPA 8-hour O3 breakpoints in ppb (converted from µg/m³ using 1 ppb = 1.96 µg/m³ at 25°C, 1 atm)
export const O3_BREAKPOINTS_PPB: readonly Breakpoint[] = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
  { cLow: 55, cHigh: 70, iLow: 51, iHigh: 100 },
  { cLow: 71, cHigh: 85, iLow: 101, iHigh: 150 },
  { cLow: 86, cHigh: 105, iLow: 151, iHigh: 200 },
  { cLow: 106, cHigh: 200, iLow: 201, iHigh: 300 },
];

// US EPA 1-hour NO2 breakpoints in ppb (converted from µg/m³ using 1 ppb = 1.88 µg/m³ at 25°C, 1 atm)
export const NO2_BREAKPOINTS_PPB: readonly Breakpoint[] = [
  { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
  { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
  { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
  { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
  { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
  { cLow: 1250, cHigh: 2049, iLow: 301, iHigh: 500 },
];

// US EPA 1-hour SO2 breakpoints in ppb (converted from µg/m³ using 1 ppb = 2.62 µg/m³ at 25°C, 1 atm)
export const SO2_BREAKPOINTS_PPB: readonly Breakpoint[] = [
  { cLow: 0, cHigh: 35, iLow: 0, iHigh: 50 },
  { cLow: 36, cHigh: 75, iLow: 51, iHigh: 100 },
  { cLow: 76, cHigh: 185, iLow: 101, iHigh: 150 },
  { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
  { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
  { cLow: 605, cHigh: 1004, iLow: 301, iHigh: 500 },
];

// US EPA 8-hour CO breakpoints in ppm (converted from µg/m³ using 1 ppm = 1145 µg/m³ at 25°C, 1 atm)
export const CO_BREAKPOINTS_PPM: readonly Breakpoint[] = [
  { cLow: 0.0, cHigh: 4.4, iLow: 0, iHigh: 50 },
  { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
  { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
  { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
  { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
  { cLow: 30.5, cHigh: 50.4, iLow: 301, iHigh: 500 },
];

export const POLLUTANT_STANDARDS: Record<PollutantId, PollutantStandard> = {
  pm2_5: {
    standardName: 'WHO 2021 Guideline (24h)',
    standardUrl:
      'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
    thresholdValue: 15,
    thresholdUnit: 'µg/m³',
    averagingPeriod: '24-hour mean',
  },
  pm10: {
    standardName: 'WHO 2021 Guideline (24h)',
    standardUrl:
      'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
    thresholdValue: 45,
    thresholdUnit: 'µg/m³',
    averagingPeriod: '24-hour mean',
  },
  no2: {
    standardName: 'WHO 2021 Guideline (24h)',
    standardUrl:
      'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
    thresholdValue: 25,
    thresholdUnit: 'µg/m³',
    averagingPeriod: '24-hour mean',
  },
  o3: {
    standardName: 'WHO 2021 Guideline (8h)',
    standardUrl:
      'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
    thresholdValue: 100,
    thresholdUnit: 'µg/m³',
    averagingPeriod: '8-hour daily max',
  },
  so2: {
    standardName: 'WHO 2021 Guideline (24h)',
    standardUrl:
      'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
    thresholdValue: 40,
    thresholdUnit: 'µg/m³',
    averagingPeriod: '24-hour mean',
  },
  co: {
    standardName: 'WHO 2021 Guideline (24h)',
    standardUrl:
      'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
    thresholdValue: 4000,
    thresholdUnit: 'µg/m³',
    averagingPeriod: '24-hour mean',
  },
};

export const POLLUTANT_META: Record<PollutantId, { name: string; formula: string; unit: string }> =
  {
    pm2_5: { name: 'Fine Particulate Matter', formula: 'PM2.5', unit: 'µg/m³' },
    pm10: { name: 'Coarse Particulate Matter', formula: 'PM10', unit: 'µg/m³' },
    no2: { name: 'Nitrogen Dioxide', formula: 'NO₂', unit: 'µg/m³' },
    o3: { name: 'Ground-Level Ozone', formula: 'O₃', unit: 'µg/m³' },
    so2: { name: 'Sulfur Dioxide', formula: 'SO₂', unit: 'µg/m³' },
    co: { name: 'Carbon Monoxide', formula: 'CO', unit: 'µg/m³' },
  };

/**
 * Color-blind-safe WCAG 2.2 AA palette with high-contrast text/surface pairs
 * and distinct geometric symbols so state is never communicated by color alone.
 */
export const AQI_CATEGORIES: readonly AqiCategoryMeta[] = [
  {
    id: 'good',
    label: 'Good',
    shortLabel: 'Good',
    rangeLabel: '0–50',
    description: 'Air quality is satisfactory with minimal health risk.',
    symbol: '●',
    surfaceClass: 'bg-emerald-50 dark:bg-emerald-950/60',
    textClass: 'text-emerald-900 dark:text-emerald-200',
    borderClass: 'border-emerald-300 dark:border-emerald-700',
    accentHex: '#047857',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    shortLabel: 'Moderate',
    rangeLabel: '51–100',
    description:
      'Acceptable air quality; unusually sensitive individuals may notice mild symptoms.',
    symbol: '◐',
    surfaceClass: 'bg-amber-50 dark:bg-amber-950/60',
    textClass: 'text-amber-950 dark:text-amber-200',
    borderClass: 'border-amber-300 dark:border-amber-700',
    accentHex: '#B45309',
  },
  {
    id: 'usg',
    label: 'Unhealthy for Sensitive Groups',
    shortLabel: 'Sensitive Risk',
    rangeLabel: '101–150',
    description:
      'Sensitive groups (children, elderly, asthma, outdoor workers) may experience health effects.',
    symbol: '▲',
    surfaceClass: 'bg-orange-50 dark:bg-orange-950/60',
    textClass: 'text-orange-950 dark:text-orange-200',
    borderClass: 'border-orange-300 dark:border-orange-700',
    accentHex: '#C2410C',
  },
  {
    id: 'unhealthy',
    label: 'Unhealthy',
    shortLabel: 'Unhealthy',
    rangeLabel: '151–200',
    description:
      'Everyone may begin to experience health effects; sensitive groups face heightened risk.',
    symbol: '◆',
    surfaceClass: 'bg-rose-50 dark:bg-rose-950/60',
    textClass: 'text-rose-950 dark:text-rose-200',
    borderClass: 'border-rose-300 dark:border-rose-700',
    accentHex: '#BE123C',
  },
  {
    id: 'very_unhealthy',
    label: 'Very Unhealthy',
    shortLabel: 'Very Unhealthy',
    rangeLabel: '201–300',
    description:
      'Health alert: risk of respiratory and cardiovascular stress increases for everyone.',
    symbol: '⬢',
    surfaceClass: 'bg-indigo-50 dark:bg-indigo-950/60',
    textClass: 'text-indigo-950 dark:text-indigo-200',
    borderClass: 'border-indigo-300 dark:border-indigo-700',
    accentHex: '#4338CA',
  },
  {
    id: 'hazardous',
    label: 'Hazardous',
    shortLabel: 'Hazardous',
    rangeLabel: '301+',
    description: 'Health warning of emergency conditions. Everyone is likely to be affected.',
    symbol: '✖',
    surfaceClass: 'bg-fuchsia-50 dark:bg-fuchsia-950/60',
    textClass: 'text-fuchsia-950 dark:text-fuchsia-200',
    borderClass: 'border-fuchsia-300 dark:border-fuchsia-700',
    accentHex: '#86198F',
  },
];

/**
 * Returns the US EPA AQI category metadata for a numeric AQI value.
 * Values below 0 clamp to Good (0–50); values >= 301 map to Hazardous.
 */
export function getAqiCategory(aqi: number): AqiCategoryMeta {
  const safeAqi = Number.isFinite(aqi) ? Math.max(0, Math.round(aqi)) : 0;
  if (safeAqi <= 50) return AQI_CATEGORIES[0];
  if (safeAqi <= 100) return AQI_CATEGORIES[1];
  if (safeAqi <= 150) return AQI_CATEGORIES[2];
  if (safeAqi <= 200) return AQI_CATEGORIES[3];
  if (safeAqi <= 300) return AQI_CATEGORIES[4];
  return AQI_CATEGORIES[5];
}

function interpolateBreakpoints(
  concentration: number,
  breakpoints: readonly Breakpoint[],
  precisionDecimals: number,
): number {
  const factor = Math.pow(10, precisionDecimals);
  const truncated = Math.floor(Math.max(0, concentration) * factor) / factor;

  for (const bp of breakpoints) {
    if (truncated >= bp.cLow && truncated <= bp.cHigh) {
      const ratio = (bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow);
      return Math.round(ratio * (truncated - bp.cLow) + bp.iLow);
    }
  }

  const last = breakpoints[breakpoints.length - 1];
  if (truncated > last.cHigh) {
    const ratio = (last.iHigh - last.iLow) / (last.cHigh - last.cLow);
    return Math.min(500, Math.round(ratio * (truncated - last.cLow) + last.iLow));
  }
  return 0;
}

/**
 * Calculates the US EPA AQI sub-index for a pollutant concentration reported in µg/m³.
 * Returns null if the reading is null, NaN, or negative.
 */
export function calculateSubIndex(
  pollutant: PollutantId,
  rawValueUgM3: number | null,
): number | null {
  if (rawValueUgM3 === null || !Number.isFinite(rawValueUgM3) || rawValueUgM3 < 0) {
    return null;
  }

  switch (pollutant) {
    case 'pm2_5':
      return interpolateBreakpoints(rawValueUgM3, PM25_BREAKPOINTS_UG_M3, 1);
    case 'pm10':
      return interpolateBreakpoints(rawValueUgM3, PM10_BREAKPOINTS_UG_M3, 0);
    case 'o3': {
      const ppb = rawValueUgM3 / 1.96;
      return interpolateBreakpoints(ppb, O3_BREAKPOINTS_PPB, 0);
    }
    case 'no2': {
      const ppb = rawValueUgM3 / 1.88;
      return interpolateBreakpoints(ppb, NO2_BREAKPOINTS_PPB, 0);
    }
    case 'so2': {
      const ppb = rawValueUgM3 / 2.62;
      return interpolateBreakpoints(ppb, SO2_BREAKPOINTS_PPB, 0);
    }
    case 'co': {
      const ppm = rawValueUgM3 / 1145;
      return interpolateBreakpoints(ppm, CO_BREAKPOINTS_PPM, 1);
    }
  }
}

export interface OpenMeteoAirQualityRaw {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  current?: {
    time?: string;
    us_aqi?: number | null;
    european_aqi?: number | null;
    pm2_5?: number | null;
    pm10?: number | null;
    nitrogen_dioxide?: number | null;
    ozone?: number | null;
    sulphur_dioxide?: number | null;
    carbon_monoxide?: number | null;
    uv_index?: number | null;
  };
  hourly?: {
    time?: string[];
    us_aqi?: Array<number | null>;
    european_aqi?: Array<number | null>;
    pm2_5?: Array<number | null>;
    pm10?: Array<number | null>;
    nitrogen_dioxide?: Array<number | null>;
    ozone?: Array<number | null>;
    sulphur_dioxide?: Array<number | null>;
    carbon_monoxide?: Array<number | null>;
  };
}

function roundToOne(val: number | null | undefined): number | null {
  if (val === null || val === undefined || !Number.isFinite(val)) return null;
  return Math.round(val * 10) / 10;
}

/**
 * Normalizes raw Open-Meteo Air Quality JSON into a strongly typed AirQualityReport.
 * Computes pollutant sub-indices, WHO guideline ratios, dominant pollutant, and 24h summary stats.
 */
export function normalizeOpenMeteoResponse(
  raw: OpenMeteoAirQualityRaw,
  location: GeoLocation,
  fetchedAt: string = new Date().toISOString(),
): AirQualityReport {
  const cur = raw.current ?? {};
  const pollutantValues: Record<PollutantId, number | null> = {
    pm2_5: roundToOne(cur.pm2_5),
    pm10: roundToOne(cur.pm10),
    no2: roundToOne(cur.nitrogen_dioxide),
    o3: roundToOne(cur.ozone),
    so2: roundToOne(cur.sulphur_dioxide),
    co: roundToOne(cur.carbon_monoxide),
  };

  const pollutantIds: PollutantId[] = ['pm2_5', 'pm10', 'no2', 'o3', 'so2', 'co'];
  const pollutants: PollutantReading[] = pollutantIds.map((id) => {
    const val = pollutantValues[id];
    const subIndex = calculateSubIndex(id, val);
    const standard = POLLUTANT_STANDARDS[id];
    const ratio =
      val !== null && standard.thresholdValue > 0
        ? Math.round((val / standard.thresholdValue) * 100) / 100
        : null;
    const statusLabel = subIndex === null ? 'Unavailable' : getAqiCategory(subIndex).shortLabel;

    return {
      id,
      name: POLLUTANT_META[id].name,
      formula: POLLUTANT_META[id].formula,
      value: val,
      unit: POLLUTANT_META[id].unit,
      subIndex,
      statusLabel,
      ratioToWhoLimit: ratio,
      standard,
    };
  });

  let dominantPollutant: PollutantId | null = null;
  let maxSub = -1;
  for (const p of pollutants) {
    if (p.subIndex !== null && p.subIndex > maxSub) {
      maxSub = p.subIndex;
      dominantPollutant = p.id;
    }
  }

  const upstreamUsAqi =
    cur.us_aqi !== null && cur.us_aqi !== undefined && Number.isFinite(cur.us_aqi)
      ? Math.round(cur.us_aqi)
      : null;

  const computedMaxSub = maxSub >= 0 ? maxSub : 0;
  const usAqi = upstreamUsAqi ?? computedMaxSub;
  const europeanAqi =
    cur.european_aqi !== null && cur.european_aqi !== undefined && Number.isFinite(cur.european_aqi)
      ? Math.round(cur.european_aqi)
      : null;

  const hourlyTimes = raw.hourly?.time ?? [];
  const hourly: HourlyForecastPoint[] = [];
  const limit = Math.min(48, hourlyTimes.length);

  for (let i = 0; i < limit; i += 1) {
    const t = hourlyTimes[i];
    if (!t) continue;
    const hUsAqi = raw.hourly?.us_aqi?.[i] ?? null;
    const hPm25 = roundToOne(raw.hourly?.pm2_5?.[i]);
    const fallbackAqi =
      hUsAqi !== null && Number.isFinite(hUsAqi)
        ? Math.round(hUsAqi)
        : calculateSubIndex('pm2_5', hPm25);

    hourly.push({
      time: t,
      usAqi: fallbackAqi,
      europeanAqi:
        raw.hourly?.european_aqi?.[i] !== null && raw.hourly?.european_aqi?.[i] !== undefined
          ? Math.round(raw.hourly.european_aqi[i]!)
          : null,
      pm2_5: hPm25,
      pm10: roundToOne(raw.hourly?.pm10?.[i]),
      no2: roundToOne(raw.hourly?.nitrogen_dioxide?.[i]),
      o3: roundToOne(raw.hourly?.ozone?.[i]),
      so2: roundToOne(raw.hourly?.sulphur_dioxide?.[i]),
      co: roundToOne(raw.hourly?.carbon_monoxide?.[i]),
    });
  }

  const next24Aqis = hourly
    .slice(0, 24)
    .map((h) => h.usAqi)
    .filter((v): v is number => v !== null && Number.isFinite(v));

  const min24hAqi = next24Aqis.length > 0 ? Math.min(...next24Aqis) : null;
  const max24hAqi = next24Aqis.length > 0 ? Math.max(...next24Aqis) : null;
  const avg24hAqi =
    next24Aqis.length > 0
      ? Math.round(next24Aqis.reduce((sum, n) => sum + n, 0) / next24Aqis.length)
      : null;

  return {
    location: {
      ...location,
      timezone: location.timezone ?? raw.timezone,
    },
    fetchedAt,
    source: 'Open-Meteo Air Quality (CAMS Global/Regional)',
    current: {
      usAqi,
      europeanAqi,
      category: getAqiCategory(usAqi),
      dominantPollutant,
      pollutants,
      uvIndex: roundToOne(cur.uv_index),
    },
    hourly,
    summary: {
      min24hAqi,
      max24hAqi,
      avg24hAqi,
    },
  };
}
