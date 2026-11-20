import React, { Suspense, useMemo, useState } from 'react';
import { getAqiCategory } from '@/src/lib/aqi/standards';
import type { HourlyForecastPoint } from '@/src/types/airQuality';

const ForecastChart = React.lazy(() => import('@/src/components/ForecastChart'));

interface ForecastSectionProps {
  cityName: string;
  hourly: readonly HourlyForecastPoint[];
  theme: 'light' | 'dark';
}

function formatHourTimestamp(iso: string): string {
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? `${match[1]} ${match[2]}` : iso;
}

export function ForecastSection({ cityName, hourly, theme }: ForecastSectionProps) {
  const [horizon, setHorizon] = useState<24 | 48>(24);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const visiblePoints = useMemo(() => hourly.slice(0, horizon), [hourly, horizon]);

  const textSummary = useMemo(() => {
    const valid = visiblePoints.filter((p) => p.usAqi !== null);
    if (valid.length === 0) {
      return `Hourly forecast data is currently unavailable for ${cityName}.`;
    }
    const aqis = valid.map((p) => p.usAqi as number);
    const min = Math.min(...aqis);
    const max = Math.max(...aqis);
    const minPoint = valid.find((p) => p.usAqi === min);
    const maxPoint = valid.find((p) => p.usAqi === max);
    return `Over the next ${horizon} hours in ${cityName}, US AQI ranges from ${min} (${getAqiCategory(min).label} around ${formatHourTimestamp(minPoint?.time ?? '')}) to ${max} (${getAqiCategory(max).label} around ${formatHourTimestamp(maxPoint?.time ?? '')}).`;
  }, [visiblePoints, horizon, cityName]);

  return (
    <section
      aria-labelledby="forecast-heading"
      className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center dark:border-slate-800">
        <div>
          <h2
            id="forecast-heading"
            className="text-xl font-bold tracking-tight text-slate-950 dark:text-white"
          >
            Hourly Air Quality Forecast
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{textSummary}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            role="group"
            aria-label="Forecast horizon"
            className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-950"
          >
            <button
              type="button"
              aria-pressed={horizon === 24}
              onClick={() => setHorizon(24)}
              className={`h-9 whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                horizon === 24
                  ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              24 Hours
            </button>
            <button
              type="button"
              aria-pressed={horizon === 48}
              onClick={() => setHorizon(48)}
              className={`h-9 whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                horizon === 48
                  ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              48 Hours
            </button>
          </div>

          <div
            role="group"
            aria-label="Forecast display mode"
            className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-950"
          >
            <button
              type="button"
              aria-pressed={viewMode === 'chart'}
              onClick={() => setViewMode('chart')}
              className={`h-9 whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                viewMode === 'chart'
                  ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Chart View
            </button>
            <button
              type="button"
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
              className={`h-9 whitespace-nowrap rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                viewMode === 'table'
                  ? 'bg-white text-slate-950 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Data Table
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {visiblePoints.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No forecast hours returned for this location.
          </p>
        ) : viewMode === 'chart' ? (
          <Suspense
            fallback={
              <div className="flex h-72 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                Loading interactive chart…
              </div>
            }
          >
            <ForecastChart points={visiblePoints} theme={theme} />
          </Suspense>
        ) : (
          <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
              <caption className="sr-only">
                {horizon}-hour air quality forecast for {cityName}
              </caption>
              <thead className="sticky top-0 bg-slate-100 text-xs uppercase text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Local Time
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">
                    US AQI
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">
                    PM2.5 (µg/m³)
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">
                    PM10 (µg/m³)
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">
                    O₃ (µg/m³)
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-right">
                    NO₂ (µg/m³)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                {visiblePoints.map((point) => {
                  const cat = point.usAqi !== null ? getAqiCategory(point.usAqi) : null;
                  return (
                    <tr key={point.time} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs tabular-nums text-slate-800 dark:text-slate-200">
                        {formatHourTimestamp(point.time)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-slate-950 dark:text-white">
                        {point.usAqi ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300">
                        {cat ? `${cat.symbol} ${cat.shortLabel}` : 'Unavailable'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        {point.pm2_5 ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        {point.pm10 ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        {point.o3 ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        {point.no2 ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
