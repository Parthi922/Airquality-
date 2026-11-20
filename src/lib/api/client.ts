import type {
  AdvisoryOutput,
  AirQualityReport,
  GeoLocation,
  UserProfile,
} from '@/src/types/airQuality';

export class ClientApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ClientApiError';
    this.status = status;
  }
}

export async function fetchCitySuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<GeoLocation[]> {
  const url = `/api/geocode?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal });
  const body = (await res.json()) as { results?: GeoLocation[]; error?: string };
  if (!res.ok) {
    throw new ClientApiError(body.error ?? 'Failed to search cities.', res.status);
  }
  return body.results ?? [];
}

export async function fetchReverseCity(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<GeoLocation> {
  const url = `/api/geocode?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`;
  const res = await fetch(url, { signal });
  const body = (await res.json()) as { results?: GeoLocation[]; error?: string };
  if (!res.ok || !body.results?.[0]) {
    throw new ClientApiError(body.error ?? 'Unable to resolve coordinates.', res.status);
  }
  return body.results[0];
}

export async function fetchCityAirQuality(
  location: GeoLocation,
  signal?: AbortSignal,
): Promise<AirQualityReport> {
  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    name: location.name,
  });
  if (location.country) params.set('country', location.country);
  if (location.countryCode) params.set('countryCode', location.countryCode);
  if (location.admin1) params.set('admin1', location.admin1);
  if (location.timezone) params.set('timezone', location.timezone);

  const res = await fetch(`/api/aqi?${params.toString()}`, { signal });
  const body = (await res.json()) as AirQualityReport & { error?: string };
  if (!res.ok) {
    throw new ClientApiError(body.error ?? 'Unable to fetch air quality data.', res.status);
  }
  return body;
}

export interface StreamChatParams {
  message: string;
  profile: UserProfile;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  report: AirQualityReport;
  advisory: AdvisoryOutput;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
}

export async function streamAssistantChat({
  message,
  profile,
  history,
  report,
  advisory,
  signal,
  onDelta,
}: StreamChatParams): Promise<void> {
  const payload = {
    message,
    profile,
    history: history.slice(-10),
    context: {
      cityName: report.location.name,
      country: report.location.country,
      fetchedAt: report.fetchedAt,
      usAqi: report.current.usAqi,
      europeanAqi: report.current.europeanAqi,
      categoryLabel: report.current.category.label,
      dominantPollutant: report.current.dominantPollutant,
      pollutants: report.current.pollutants.map((p) => ({
        id: p.id,
        formula: p.formula,
        value: p.value,
        unit: p.unit,
        subIndex: p.subIndex,
        statusLabel: p.statusLabel,
        standardThreshold: p.standard.thresholdValue,
        standardName: p.standard.standardName,
      })),
      min24hAqi: report.summary.min24hAqi,
      max24hAqi: report.summary.max24hAqi,
      avg24hAqi: report.summary.avg24hAqi,
      bestWindow: advisory.bestOutdoorWindow
        ? { label: advisory.bestOutdoorWindow.label, avgAqi: advisory.bestOutdoorWindow.avgAqi }
        : null,
      worstWindow: advisory.worstOutdoorWindow
        ? { label: advisory.worstOutdoorWindow.label, avgAqi: advisory.worstOutdoorWindow.avgAqi }
        : null,
      advisoryHeadline: advisory.headline,
      maskGuidance: advisory.maskGuidance,
      exerciseAdvice: advisory.exerciseAdvice,
      ventilationAdvice: advisory.ventilationAdvice,
    },
  };

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok || !res.body) {
    let errMsg = 'Assistant service is currently unavailable.';
    try {
      const errBody = (await res.json()) as { error?: string };
      if (errBody.error) errMsg = errBody.error;
    } catch {
      // keep default message
    }
    throw new ClientApiError(errMsg, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const block of events) {
      const lines = block.split('\n');
      let eventType = 'message';
      let dataLine = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) eventType = line.slice(7).trim();
        if (line.startsWith('data: ')) dataLine = line.slice(6).trim();
      }
      if (!dataLine) continue;

      const parsed = JSON.parse(dataLine) as { text?: string; error?: string };
      if (eventType === 'delta' && parsed.text) {
        onDelta(parsed.text);
      } else if (eventType === 'error') {
        throw new ClientApiError(parsed.error ?? 'Streaming interrupted.', 500);
      }
    }
  }
}
