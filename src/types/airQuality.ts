export type PollutantId = 'pm2_5' | 'pm10' | 'no2' | 'o3' | 'so2' | 'co';

export type AqiCategoryId =
  'good' | 'moderate' | 'usg' | 'unhealthy' | 'very_unhealthy' | 'hazardous';

export interface AqiCategoryMeta {
  id: AqiCategoryId;
  label: string;
  shortLabel: string;
  rangeLabel: string;
  description: string;
  symbol: string;
  surfaceClass: string;
  textClass: string;
  borderClass: string;
  accentHex: string;
}

export interface GeoLocation {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  population?: number;
}

export interface PollutantStandard {
  standardName: string;
  standardUrl: string;
  thresholdValue: number;
  thresholdUnit: string;
  averagingPeriod: string;
}

export interface PollutantReading {
  id: PollutantId;
  name: string;
  formula: string;
  value: number | null;
  unit: string;
  subIndex: number | null;
  statusLabel: string;
  ratioToWhoLimit: number | null;
  standard: PollutantStandard;
}

export interface HourlyForecastPoint {
  time: string;
  usAqi: number | null;
  europeanAqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
  so2: number | null;
  co: number | null;
}

export interface AirQualitySummaryStats {
  min24hAqi: number | null;
  max24hAqi: number | null;
  avg24hAqi: number | null;
}

export interface AirQualityReport {
  location: GeoLocation;
  fetchedAt: string;
  source: string;
  current: {
    usAqi: number;
    europeanAqi: number | null;
    category: AqiCategoryMeta;
    dominantPollutant: PollutantId | null;
    pollutants: PollutantReading[];
    uvIndex: number | null;
  };
  hourly: HourlyForecastPoint[];
  summary: AirQualitySummaryStats;
}

export type UserProfile =
  'general' | 'children' | 'elderly' | 'respiratory' | 'outdoor_worker' | 'athlete';

export type AdvisoryRiskLevel = 'low' | 'guarded' | 'elevated' | 'high' | 'severe';

export interface TimeWindow {
  startTime: string;
  endTime: string;
  avgAqi: number;
  minAqi: number;
  maxAqi: number;
  label: string;
}

export interface AdvisoryOutput {
  profile: UserProfile;
  profileLabel: string;
  riskLevel: AdvisoryRiskLevel;
  headline: string;
  maskGuidance: string;
  ventilationAdvice: string;
  exerciseAdvice: string;
  bestOutdoorWindow: TimeWindow | null;
  worstOutdoorWindow: TimeWindow | null;
  actionItems: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface PollutantExplainer {
  id: PollutantId;
  name: string;
  formula: string;
  plainSummary: string;
  urbanSources: string[];
  healthEffects: string;
  benchmarkSummary: string;
  reductionTips: string[];
}
