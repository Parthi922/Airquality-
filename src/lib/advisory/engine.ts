import type {
  AdvisoryOutput,
  AdvisoryRiskLevel,
  AirQualityReport,
  HourlyForecastPoint,
  TimeWindow,
  UserProfile,
} from '@/src/types/airQuality';

export const USER_PROFILE_LABELS: Record<UserProfile, string> = {
  general: 'General Public',
  children: 'Children & Families',
  elderly: 'Older Adults (65+)',
  respiratory: 'Asthma & Respiratory',
  outdoor_worker: 'Outdoor Workers',
  athlete: 'Endurance Athletes',
};

const SENSITIVE_PROFILES: ReadonlySet<UserProfile> = new Set([
  'children',
  'elderly',
  'respiratory',
  'outdoor_worker',
  'athlete',
]);

function formatHourRange(startIso: string, endIso: string): string {
  const formatPart = (iso: string): string => {
    const match = iso.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : iso.slice(11, 16) || iso;
  };
  return `${formatPart(startIso)}–${formatPart(endIso)}`;
}

/**
 * Scans the next 24 hours of forecast data using a 3-hour sliding window
 * to identify the lowest-AQI (best) and highest-AQI (worst) outdoor windows.
 */
export function findOutdoorWindows(hourly: readonly HourlyForecastPoint[]): {
  bestWindow: TimeWindow | null;
  worstWindow: TimeWindow | null;
} {
  const slice = hourly.slice(0, 24).filter((p) => p.usAqi !== null);
  if (slice.length < 3) {
    if (slice.length === 0) return { bestWindow: null, worstWindow: null };
    const single = slice[0];
    const aqi = single.usAqi ?? 0;
    const win: TimeWindow = {
      startTime: single.time,
      endTime: single.time,
      avgAqi: aqi,
      minAqi: aqi,
      maxAqi: aqi,
      label: formatHourRange(single.time, single.time),
    };
    return { bestWindow: win, worstWindow: win };
  }

  let best: TimeWindow | null = null;
  let worst: TimeWindow | null = null;

  for (let i = 0; i <= slice.length - 3; i += 1) {
    const windowPoints = slice.slice(i, i + 3);
    const aqis = windowPoints.map((p) => p.usAqi ?? 0);
    const avg = Math.round(aqis.reduce((s, v) => s + v, 0) / aqis.length);
    const candidate: TimeWindow = {
      startTime: windowPoints[0].time,
      endTime: windowPoints[2].time,
      avgAqi: avg,
      minAqi: Math.min(...aqis),
      maxAqi: Math.max(...aqis),
      label: formatHourRange(windowPoints[0].time, windowPoints[2].time),
    };

    if (!best || candidate.avgAqi < best.avgAqi) {
      best = candidate;
    }
    if (!worst || candidate.avgAqi > worst.avgAqi) {
      worst = candidate;
    }
  }

  return { bestWindow: best, worstWindow: worst };
}

function determineRiskLevel(aqi: number, profile: UserProfile): AdvisoryRiskLevel {
  const isSensitive = SENSITIVE_PROFILES.has(profile);
  const isHighRespiratoryOrAthlete =
    profile === 'respiratory' || profile === 'athlete' || profile === 'outdoor_worker';

  if (aqi >= 201) return 'severe';
  if (aqi >= 151) return 'high';
  if (aqi >= 101) return isHighRespiratoryOrAthlete ? 'high' : 'elevated';
  if (aqi >= 51) return isSensitive ? 'elevated' : 'guarded';
  return 'low';
}

function getMaskGuidance(aqi: number, profile: UserProfile): string {
  if (aqi >= 201) {
    return 'Wear a tight-fitting N95, FFP2, or P100 respirator for any unavoidable outdoor exposure.';
  }
  if (aqi >= 151) {
    return profile === 'general'
      ? 'Wear a well-fitted N95 or KN95 mask if spending more than 15–20 minutes outdoors.'
      : 'Strongly wear a well-fitted N95/FFP2 respirator whenever outdoors.';
  }
  if (aqi >= 101) {
    return SENSITIVE_PROFILES.has(profile)
      ? 'Consider wearing a well-fitted N95/KN95 mask outdoors, especially near traffic corridors.'
      : 'Mask not required for short trips; N95/KN95 helpful during prolonged outdoor errands.';
  }
  if (aqi >= 51 && (profile === 'respiratory' || profile === 'outdoor_worker')) {
    return 'Optional KN95/N95 mask if working near heavy traffic or noticing airway irritation.';
  }
  return 'No respiratory mask needed under current conditions.';
}

function getVentilationAdvice(aqi: number, profile: UserProfile): string {
  if (aqi >= 151) {
    return 'Keep windows and doors closed. Run HEPA air purifiers on medium/high and set HVAC to recirculate.';
  }
  if (aqi >= 101) {
    return 'Keep windows closed during peak traffic/ozone hours; rely on indoor filtration or recirculated air.';
  }
  if (aqi >= 51) {
    return SENSITIVE_PROFILES.has(profile)
      ? 'Prefer brief cross-ventilation during the lowest-AQI window rather than keeping windows open all day.'
      : 'Natural ventilation is acceptable; close street-facing windows during rush hour.';
  }
  return 'Safe to open windows for natural cross-ventilation throughout the day.';
}

function getExerciseAdvice(aqi: number, profile: UserProfile): string {
  if (aqi >= 201) {
    return 'Avoid all outdoor exercise. Move workouts indoors with filtered air.';
  }
  if (aqi >= 151) {
    return profile === 'general'
      ? 'Move vigorous workouts indoors; limit outdoor activity to brief, low-effort walks.'
      : 'Cancel outdoor training or heavy labor; shift strictly indoors.';
  }
  if (aqi >= 101) {
    switch (profile) {
      case 'athlete':
        return 'Replace high-intensity outdoor intervals with indoor cross-training or shorten sessions by 50%.';
      case 'outdoor_worker':
        return 'Schedule heavy physical tasks during the best outdoor window and take frequent indoor breaks.';
      case 'respiratory':
        return 'Exercise indoors today and keep rescue medication accessible.';
      case 'children':
      case 'elderly':
        return 'Keep outdoor play or walks gentle and brief; avoid strenuous exertion.';
      default:
        return 'Reduce prolonged or intense outdoor exertion; take more breaks.';
    }
  }
  if (aqi >= 51) {
    switch (profile) {
      case 'respiratory':
        return 'Light-to-moderate outdoor activity is acceptable; stop immediately if coughing or wheezing starts.';
      case 'athlete':
        return 'Normal training is fine, but schedule peak-effort sessions during the lowest-AQI window away from major roads.';
      case 'outdoor_worker':
        return 'Normal shift pace is fine; hydrate regularly and monitor symptoms if working near combustion sources.';
      default:
        return 'Good conditions for outdoor walking, cycling, and routine exercise.';
    }
  }
  return 'Ideal conditions for full-intensity outdoor exercise and active commuting.';
}

/**
 * Generates deterministic, unit-testable health and behavioral guidance from an
 * AirQualityReport and a target UserProfile.
 */
export function generateHealthAdvisory(
  report: AirQualityReport,
  profile: UserProfile,
): AdvisoryOutput {
  const aqi = report.current.usAqi;
  const riskLevel = determineRiskLevel(aqi, profile);
  const { bestWindow, worstWindow } = findOutdoorWindows(report.hourly);
  const dominant = report.current.dominantPollutant;
  const dominantReading = report.current.pollutants.find((p) => p.id === dominant);
  const dominantText = dominantReading
    ? `${dominantReading.formula} (${dominantReading.value ?? 'N/A'} ${dominantReading.unit})`
    : 'mixed urban pollutants';

  const maskGuidance = getMaskGuidance(aqi, profile);
  const ventilationAdvice = getVentilationAdvice(aqi, profile);
  const exerciseAdvice = getExerciseAdvice(aqi, profile);

  const headlineMap: Record<AdvisoryRiskLevel, string> = {
    low: `Low air quality risk for ${USER_PROFILE_LABELS[profile]} (US AQI ${aqi}).`,
    guarded: `Moderate conditions (US AQI ${aqi}); stay aware of ${dominantText}.`,
    elevated: `Elevated exposure risk for ${USER_PROFILE_LABELS[profile]} driven by ${dominantText}.`,
    high: `High health impact warning (US AQI ${aqi}) — limit outdoor exertion.`,
    severe: `Severe air pollution alert (US AQI ${aqi}) — remain indoors with filtered air.`,
  };

  const actionItems: string[] = [exerciseAdvice, maskGuidance, ventilationAdvice];

  if (bestWindow && aqi > 50) {
    actionItems.push(
      `Plan essential outdoor errands during ${bestWindow.label} when forecast AQI dips to ~${bestWindow.avgAqi}.`,
    );
  }
  if (worstWindow && worstWindow.avgAqi >= 101) {
    actionItems.push(
      `Avoid unnecessary outdoor time around ${worstWindow.label} (forecast peak ~${worstWindow.avgAqi} AQI).`,
    );
  }
  if (profile === 'respiratory') {
    actionItems.push('Keep prescribed reliever inhaler and asthma action plan within reach.');
  }

  return {
    profile,
    profileLabel: USER_PROFILE_LABELS[profile],
    riskLevel,
    headline: headlineMap[riskLevel],
    maskGuidance,
    ventilationAdvice,
    exerciseAdvice,
    bestOutdoorWindow: bestWindow,
    worstOutdoorWindow: worstWindow,
    actionItems,
  };
}
