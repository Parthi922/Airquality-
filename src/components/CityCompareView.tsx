import { CitySearch } from '@/src/components/CitySearch';
import { useAirQuality } from '@/src/hooks/useAirQuality';
import { findOutdoorWindows } from '@/src/lib/advisory/engine';
import { POLLUTANT_META } from '@/src/lib/aqi/standards';
import type { AirQualityReport, GeoLocation } from '@/src/types/airQuality';

interface CityCompareViewProps {
  primaryLocation: GeoLocation | null;
  primaryReport: AirQualityReport | null;
}

function CompareCitySummary({
  slotLabel,
  report,
  isLoading,
  error,
}: {
  slotLabel: string;
  report: AirQualityReport | null;
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        Loading {slotLabel} air quality…
      </div>
    );
  }
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-rose-300 bg-rose-50 p-5 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
      >
        {error}
      </div>
    );
  }
  if (!report) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        Search and select a city to populate {slotLabel}.
      </div>
    );
  }

  const { bestWindow } = findOutdoorWindows(report.hourly);
  const dominant = report.current.dominantPollutant
    ? POLLUTANT_META[report.current.dominantPollutant].formula
    : 'N/A';

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {slotLabel} · {report.location.country}
      </p>
      <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
        {report.location.name}
      </h3>
      <div className="mt-3 flex items-baseline gap-3">
        <span className="font-mono text-4xl font-bold tabular-nums text-slate-950 dark:text-white">
          {report.current.usAqi}
        </span>
        <span className={`text-sm font-semibold ${report.current.category.textClass}`}>
          {report.current.category.symbol} {report.current.category.label}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-xs dark:border-slate-800">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Dominant pollutant</dt>
          <dd className="mt-0.5 font-mono font-semibold text-slate-900 dark:text-white">
            {dominant}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Best 3h window</dt>
          <dd className="mt-0.5 font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
            {bestWindow ? `${bestWindow.label} (${bestWindow.avgAqi})` : 'Unavailable'}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function CityCompareView({ primaryLocation, primaryReport }: CityCompareViewProps) {
  const cityA = useAirQuality(null);
  const cityB = useAirQuality(null);

  const reportA = cityA.report ?? primaryReport;
  const locationA = cityA.selectedLocation ?? primaryLocation;
  const reportB = cityB.report;

  return (
    <section
      aria-labelledby="compare-heading"
      className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h2
          id="compare-heading"
          className="text-xl font-bold tracking-tight text-slate-950 dark:text-white"
        >
          Side-by-Side City Comparison
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Compare live US AQI, pollutant concentrations, and outdoor windows across any two global
          cities.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <CitySearch
            label="City A"
            placeholder="Search first city"
            selectedLocation={locationA}
            onSelectLocation={cityA.loadLocation}
            showGeolocation={false}
          />
          <CompareCitySummary
            slotLabel="City A"
            report={reportA}
            isLoading={cityA.isLoading}
            error={cityA.error}
          />
        </div>

        <div className="space-y-4">
          <CitySearch
            label="City B"
            placeholder="Search second city to compare"
            selectedLocation={cityB.selectedLocation}
            onSelectLocation={cityB.loadLocation}
            showGeolocation={false}
          />
          <CompareCitySummary
            slotLabel="City B"
            report={reportB}
            isLoading={cityB.isLoading}
            error={cityB.error}
          />
        </div>
      </div>

      {reportA && reportB && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
            <caption className="sr-only">
              Pollutant comparison between {reportA.location.name} and {reportB.location.name}
            </caption>
            <thead className="bg-slate-100 text-xs uppercase text-slate-700 dark:bg-slate-950 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Metric
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-right">
                  {reportA.location.name}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-right">
                  {reportB.location.name}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-right">
                  Difference (B − A)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
              <tr>
                <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">US AQI</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                  {reportA.current.usAqi}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                  {reportB.current.usAqi}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                  {reportB.current.usAqi - reportA.current.usAqi > 0 ? '+' : ''}
                  {reportB.current.usAqi - reportA.current.usAqi}
                </td>
              </tr>
              {reportA.current.pollutants.map((pA) => {
                const pB = reportB.current.pollutants.find((item) => item.id === pA.id);
                const diff =
                  pA.value !== null && pB?.value !== null && pB?.value !== undefined
                    ? Math.round((pB.value - pA.value) * 10) / 10
                    : null;
                return (
                  <tr key={pA.id}>
                    <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                      <span className="font-mono font-semibold">{pA.formula}</span>{' '}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({pA.unit})
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {pA.value ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {pB?.value ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {diff !== null ? `${diff > 0 ? '+' : ''}${diff}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
