import { Moon, Sun } from 'lucide-react';
import React, { Suspense, useMemo, useState } from 'react';
import { AqiOverviewCard } from '@/src/components/AqiOverviewCard';
import { CitySearch } from '@/src/components/CitySearch';
import { ForecastSection } from '@/src/components/ForecastSection';
import { HealthAdvisoryPanel } from '@/src/components/HealthAdvisoryPanel';
import { PollutantModal } from '@/src/components/PollutantModal';
import { useAirQuality } from '@/src/hooks/useAirQuality';
import { useTheme } from '@/src/hooks/useTheme';
import { generateHealthAdvisory } from '@/src/lib/advisory/engine';
import type { GeoLocation, PollutantReading, UserProfile } from '@/src/types/airQuality';

const CityCompareView = React.lazy(() => import('@/src/components/CityCompareView'));
const AiAssistantPanel = React.lazy(() => import('@/src/components/AiAssistantPanel'));

type ActiveTab = 'overview' | 'forecast' | 'compare' | 'assistant';

const EXPLORE_CITIES: readonly GeoLocation[] = [
  {
    id: '1850147',
    name: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 35.6895,
    longitude: 139.6917,
  },
  {
    id: '2643743',
    name: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    latitude: 51.5085,
    longitude: -0.1257,
  },
  {
    id: '3448439',
    name: 'São Paulo',
    country: 'Brazil',
    countryCode: 'BR',
    latitude: -23.5475,
    longitude: -46.6361,
  },
  {
    id: '5368361',
    name: 'Los Angeles',
    country: 'United States',
    countryCode: 'US',
    latitude: 34.0522,
    longitude: -118.2437,
  },
];

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { selectedLocation, report, isLoading, error, loadLocation, refresh } = useAirQuality(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [profile, setProfile] = useState<UserProfile>('general');
  const [explainedPollutant, setExplainedPollutant] = useState<PollutantReading | null>(null);

  const advisory = useMemo(() => {
    if (!report) return null;
    return generateHealthAdvisory(report, profile);
  }, [report, profile]);

  const navTabs: ReadonlyArray<{ id: ActiveTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'forecast', label: 'Forecast' },
    { id: 'compare', label: 'Compare' },
    { id: 'assistant', label: 'Assistant' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-sky-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <a
            href="#main-content"
            className="whitespace-nowrap shrink-0 text-lg font-bold tracking-tight text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:text-white"
          >
            Urban Air
          </a>

          <nav
            aria-label="Primary sections"
            className="flex items-center gap-4 sm:gap-6 overflow-x-auto"
          >
            {navTabs.map((tab) => {
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`whitespace-nowrap shrink-0 border-b-2 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                    isCurrent
                      ? 'border-sky-700 text-sky-800 dark:border-sky-400 dark:text-sky-300'
                      : 'border-transparent text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex h-10 items-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section
          aria-labelledby="app-hero-heading"
          className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <h1
            id="app-hero-heading"
            className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white"
            style={{ textWrap: 'balance' }}
          >
            Urban Air Quality Assistant
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Inspect live particulate and gas concentrations against WHO guidelines, plan outdoor
            windows by sensitivity profile, and ask grounded follow-up questions.
          </p>

          <div className="mt-5">
            <CitySearch
              label="Search city or use your current location"
              selectedLocation={selectedLocation}
              onSelectLocation={loadLocation}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>Quick select:</span>
            {EXPLORE_CITIES.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => loadLocation(city)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {city.name}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
          >
            {error}
          </div>
        )}

        {activeTab === 'compare' ? (
          <Suspense
            fallback={
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Loading comparison view…
              </div>
            }
          >
            <CityCompareView primaryLocation={selectedLocation} primaryReport={report} />
          </Suspense>
        ) : isLoading && !report ? (
          <div
            aria-live="polite"
            className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
          >
            Fetching live air quality telemetry for {selectedLocation?.name ?? 'selected city'}…
          </div>
        ) : !report || !advisory ? (
          <section
            aria-label="Getting started"
            className="rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Select a city to view live air quality
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              Type any city name above, click &ldquo;Use my location&rdquo;, or pick one of the
              quick-select cities to inspect real-time US AQI, WHO benchmark comparisons, 48-hour
              forecasts, and personalized guidance.
            </p>
          </section>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <AqiOverviewCard
                  report={report}
                  isRefreshing={isLoading}
                  onRefresh={refresh}
                  onExplainPollutant={setExplainedPollutant}
                />
                <HealthAdvisoryPanel
                  profile={profile}
                  onChangeProfile={setProfile}
                  advisory={advisory}
                />
                <ForecastSection
                  cityName={report.location.name}
                  hourly={report.hourly}
                  theme={theme}
                />
                <Suspense
                  fallback={
                    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                      Loading AI assistant…
                    </div>
                  }
                >
                  <AiAssistantPanel report={report} advisory={advisory} profile={profile} />
                </Suspense>
              </div>
            )}

            {activeTab === 'forecast' && (
              <ForecastSection
                cityName={report.location.name}
                hourly={report.hourly}
                theme={theme}
              />
            )}

            {activeTab === 'assistant' && (
              <Suspense
                fallback={
                  <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    Loading AI assistant…
                  </div>
                }
              >
                <AiAssistantPanel report={report} advisory={advisory} profile={profile} />
              </Suspense>
            )}
          </>
        )}
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 sm:flex-row sm:px-6">
          <p>
            Telemetry: Open-Meteo Air Quality &amp; Geocoding · Standards: US EPA AQI (2024 PM2.5
            update) &amp; WHO 2021 Guidelines
          </p>
          <p>Informational guidance only — not a substitute for clinical medical advice.</p>
        </div>
      </footer>

      <PollutantModal
        pollutantId={explainedPollutant?.id ?? null}
        currentValue={explainedPollutant?.value ?? null}
        unit={explainedPollutant?.unit ?? 'µg/m³'}
        onClose={() => setExplainedPollutant(null)}
      />
    </div>
  );
}
