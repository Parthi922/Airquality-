import { Info, RefreshCw } from 'lucide-react';
import { POLLUTANT_META } from '@/src/lib/aqi/standards';
import type { AirQualityReport, PollutantId, PollutantReading } from '@/src/types/airQuality';

interface AqiOverviewCardProps {
  report: AirQualityReport;
  isRefreshing: boolean;
  onRefresh: () => void;
  onExplainPollutant: (reading: PollutantReading) => void;
}

function formatObservedTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AqiOverviewCard({
  report,
  isRefreshing,
  onRefresh,
  onExplainPollutant,
}: AqiOverviewCardProps) {
  const { current, location, summary } = report;
  const dominantMeta = current.dominantPollutant ? POLLUTANT_META[current.dominantPollutant] : null;

  return (
    <section
      aria-labelledby="aqi-overview-heading"
      className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start dark:border-slate-800">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{location.country || 'Selected Location'}</span>
            <span aria-hidden="true"> · </span>
            <span className="font-mono tabular-nums">
              {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
            </span>
            <span aria-hidden="true"> · </span>
            <span>Updated {formatObservedTime(report.fetchedAt)}</span>
          </p>
          <h2
            id="aqi-overview-heading"
            className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white"
          >
            {location.name}
            {location.admin1 ? `, ${location.admin1}` : ''}
          </h2>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={`Refresh air quality data for ${location.name}`}
          className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>

      {/* Live region announcing AQI state changes */}
      <div aria-live="polite" className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div
          className={`flex flex-col justify-between rounded-lg border p-5 lg:col-span-5 ${current.category.surfaceClass} ${current.category.borderClass}`}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Current US AQI
            </p>
            <div className="mt-2 flex items-baseline gap-4">
              <span className="font-mono text-5xl font-bold tabular-nums text-slate-950 dark:text-white">
                {current.usAqi}
              </span>
              <span className={`text-base font-semibold ${current.category.textClass}`}>
                <span aria-hidden="true" className="mr-1.5">
                  {current.category.symbol}
                </span>
                {current.category.label}
              </span>
            </div>
            <p className="mt-2 text-xs font-mono text-slate-700 dark:text-slate-300">
              EPA Scale {current.category.rangeLabel}
              {current.europeanAqi !== null ? ` · European AQI ${current.europeanAqi}` : ''}
            </p>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            {current.category.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:col-span-7">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs text-slate-600 dark:text-slate-400">Dominant Pollutant</p>
            <p className="mt-2 font-mono text-xl font-semibold text-slate-950 dark:text-white">
              {dominantMeta ? dominantMeta.formula : 'N/A'}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {dominantMeta ? dominantMeta.name : 'Mixed'}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs text-slate-600 dark:text-slate-400">24h Min AQI</p>
            <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-slate-950 dark:text-white">
              {summary.min24hAqi ?? '—'}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Lowest forecast hour</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs text-slate-600 dark:text-slate-400">24h Mean AQI</p>
            <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-slate-950 dark:text-white">
              {summary.avg24hAqi ?? '—'}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Rolling 24h average</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs text-slate-600 dark:text-slate-400">24h Peak AQI</p>
            <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-slate-950 dark:text-white">
              {summary.max24hAqi ?? '—'}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {current.uvIndex !== null ? `UV Index ${current.uvIndex}` : 'Highest forecast hour'}
            </p>
          </div>
        </div>
      </div>

      {/* Pollutant Breakdown with measured WHO standard */}
      <div className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Pollutant Breakdown &amp; Regulatory Benchmarks
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Measured against WHO 2021 Air Quality Guidelines &amp; US EPA sub-indices
          </p>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {current.pollutants.map((p) => {
            const isDominant = (current.dominantPollutant as PollutantId | null) === p.id;
            return (
              <article
                key={p.id}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                        {p.formula}
                        {isDominant ? ' · Primary Driver' : ''}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{p.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onExplainPollutant(p)}
                      aria-label={`Explain ${p.name} (${p.formula})`}
                      className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Explain</span>
                    </button>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
                      {p.value !== null ? p.value : 'N/A'}
                    </span>
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      {p.unit}
                    </span>
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-200 pt-2.5 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  <p className="font-mono tabular-nums">
                    Sub-index: {p.subIndex !== null ? p.subIndex : 'N/A'} ({p.statusLabel})
                  </p>
                  <p className="mt-0.5 font-mono tabular-nums">
                    {p.standard.standardName}: {p.standard.thresholdValue}{' '}
                    {p.standard.thresholdUnit}
                    {p.ratioToWhoLimit !== null ? ` (${p.ratioToWhoLimit}× limit)` : ''}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
