import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AiAssistantPanel from '@/src/components/AiAssistantPanel';
import { AqiOverviewCard } from '@/src/components/AqiOverviewCard';
import { CitySearch } from '@/src/components/CitySearch';
import { ForecastSection } from '@/src/components/ForecastSection';
import { HealthAdvisoryPanel } from '@/src/components/HealthAdvisoryPanel';
import { generateHealthAdvisory } from '@/src/lib/advisory/engine';
import { getAqiCategory } from '@/src/lib/aqi/standards';
import type { AirQualityReport, GeoLocation } from '@/src/types/airQuality';
import { expectNoA11yViolations } from '../a11yHelper';

const mockLocation: GeoLocation = {
  id: '2643743',
  name: 'London',
  country: 'United Kingdom',
  countryCode: 'GB',
  latitude: 51.5085,
  longitude: -0.1257,
};

const mockReport: AirQualityReport = {
  location: mockLocation,
  fetchedAt: '2026-11-20T08:00:00Z',
  source: 'Open-Meteo Air Quality',
  current: {
    usAqi: 82,
    europeanAqi: 46,
    category: getAqiCategory(82),
    dominantPollutant: 'pm2_5',
    uvIndex: 2.3,
    pollutants: [
      {
        id: 'pm2_5',
        name: 'Fine Particulate Matter',
        formula: 'PM2.5',
        value: 26.5,
        unit: 'µg/m³',
        subIndex: 82,
        statusLabel: 'Moderate',
        ratioToWhoLimit: 1.77,
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
  hourly: [
    {
      time: '2026-11-20T06:00',
      usAqi: 42,
      europeanAqi: 24,
      pm2_5: 10,
      pm10: 18,
      no2: 14,
      o3: 48,
      so2: 2,
      co: 210,
    },
    {
      time: '2026-11-20T07:00',
      usAqi: 44,
      europeanAqi: 26,
      pm2_5: 11,
      pm10: 19,
      no2: 15,
      o3: 49,
      so2: 2,
      co: 220,
    },
    {
      time: '2026-11-20T08:00',
      usAqi: 46,
      europeanAqi: 27,
      pm2_5: 12,
      pm10: 20,
      no2: 16,
      o3: 50,
      so2: 2,
      co: 230,
    },
    {
      time: '2026-11-20T09:00',
      usAqi: 92,
      europeanAqi: 54,
      pm2_5: 31,
      pm10: 42,
      no2: 28,
      o3: 70,
      so2: 4,
      co: 290,
    },
  ],
  summary: { min24hAqi: 42, max24hAqi: 92, avg24hAqi: 56 },
};

describe('Dashboard components & accessibility', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('CitySearch debounces suggestions, handles selection, and passes axe checks', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ results: [mockLocation] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const onSelect = vi.fn();
    const { container } = render(
      <CitySearch label="Search city" selectedLocation={null} onSelectLocation={onSelect} />,
    );

    const input = screen.getByRole('combobox', { name: 'Search city' });
    await user.type(input, 'London');

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const option = await screen.findByRole('option');
    await user.click(option);
    expect(onSelect).toHaveBeenCalledWith(mockLocation);

    await expectNoA11yViolations(container);
  });

  it('AqiOverviewCard displays AQI, non-color label, standard benchmark, and passes axe checks', async () => {
    const user = userEvent.setup();
    const onExplain = vi.fn();
    const { container } = render(
      <AqiOverviewCard
        report={mockReport}
        isRefreshing={false}
        onRefresh={vi.fn()}
        onExplainPollutant={onExplain}
      />,
    );

    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getAllByText(/Moderate/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/WHO 2021 Guideline/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Explain Fine Particulate Matter/i }));
    expect(onExplain).toHaveBeenCalledWith(mockReport.current.pollutants[0]);

    await expectNoA11yViolations(container);
  });

  it('HealthAdvisoryPanel switches profiles and passes axe checks', async () => {
    const user = userEvent.setup();
    const onChangeProfile = vi.fn();
    const advisory = generateHealthAdvisory(mockReport, 'athlete');

    const { container } = render(
      <HealthAdvisoryPanel
        profile="athlete"
        onChangeProfile={onChangeProfile}
        advisory={advisory}
      />,
    );

    expect(screen.getByText(/06:00–08:00/)).toBeInTheDocument();
    expect(screen.getByText(/07:00–09:00/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Asthma & Respiratory/i }));
    expect(onChangeProfile).toHaveBeenCalledWith('respiratory');

    await expectNoA11yViolations(container);
  });

  it('ForecastSection switches to accessible Data Table view and passes axe checks', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ForecastSection cityName="London" hourly={mockReport.hourly} theme="light" />,
    );

    await user.click(screen.getByRole('button', { name: 'Data Table' }));
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('2026-11-20 06:00')).toBeInTheDocument();

    await expectNoA11yViolations(container);
  });

  it('AiAssistantPanel streams grounded response from mocked /api/chat and passes axe checks', async () => {
    const user = userEvent.setup();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode('event: delta\ndata: {"text":"At 06:00 US AQI is 42 (Good)."}\n\n'),
        );
        controller.enqueue(encoder.encode('event: done\ndata: {"completed":true}\n\n'));
        controller.close();
      },
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    );

    const advisory = generateHealthAdvisory(mockReport, 'athlete');
    const { container } = render(
      <AiAssistantPanel report={mockReport} advisory={advisory} profile="athlete" />,
    );

    const input = screen.getByPlaceholderText(/Ask about London/i);
    await user.type(input, 'Is it safe to run at 6am?');
    await user.click(screen.getByRole('button', { name: /Ask Assistant/i }));

    await waitFor(() => {
      expect(screen.getByText(/At 06:00 US AQI is 42 \(Good\)\./)).toBeInTheDocument();
    });

    await expectNoA11yViolations(container);
  });
});
