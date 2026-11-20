import { USER_PROFILE_LABELS } from '@/src/lib/advisory/engine';
import type { AdvisoryOutput, AdvisoryRiskLevel, UserProfile } from '@/src/types/airQuality';

interface HealthAdvisoryPanelProps {
  profile: UserProfile;
  onChangeProfile: (profile: UserProfile) => void;
  advisory: AdvisoryOutput;
}

const PROFILE_OPTIONS: UserProfile[] = [
  'general',
  'children',
  'elderly',
  'respiratory',
  'outdoor_worker',
  'athlete',
];

const RISK_STYLES: Record<AdvisoryRiskLevel, { label: string; className: string }> = {
  low: {
    label: 'Low Risk',
    className: 'text-emerald-800 dark:text-emerald-300',
  },
  guarded: {
    label: 'Guarded',
    className: 'text-amber-800 dark:text-amber-300',
  },
  elevated: {
    label: 'Elevated Risk',
    className: 'text-orange-800 dark:text-orange-300',
  },
  high: {
    label: 'High Risk',
    className: 'text-rose-800 dark:text-rose-300',
  },
  severe: {
    label: 'Severe Alert',
    className: 'text-fuchsia-800 dark:text-fuchsia-300',
  },
};

export function HealthAdvisoryPanel({
  profile,
  onChangeProfile,
  advisory,
}: HealthAdvisoryPanelProps) {
  const riskMeta = RISK_STYLES[advisory.riskLevel];

  return (
    <section
      aria-labelledby="advisory-heading"
      className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h2
            id="advisory-heading"
            className="text-xl font-bold tracking-tight text-slate-950 dark:text-white"
          >
            Personalized Health Advisory
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Deterministic guidance calibrated to your sensitivity profile and the next 24 hours of
            forecast air quality.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Select health sensitivity profile"
          className="flex flex-wrap gap-2"
        >
          {PROFILE_OPTIONS.map((opt) => {
            const active = profile === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChangeProfile(opt)}
                className={`h-10 whitespace-nowrap rounded-lg border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                  active
                    ? 'border-sky-700 bg-sky-700 text-white dark:border-sky-500 dark:bg-sky-600'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {USER_PROFILE_LABELS[opt]}
              </button>
            );
          })}
        </div>
      </div>

      <div aria-live="polite" className="mt-5 space-y-5">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${riskMeta.className}`}>
            {riskMeta.label} · {advisory.profileLabel}
          </p>
          <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
            {advisory.headline}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Outdoor Time Windows
            </h3>
            <div className="mt-2 space-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Best 3h window</p>
                <p className="font-mono font-semibold tabular-nums text-emerald-800 dark:text-emerald-300">
                  {advisory.bestOutdoorWindow
                    ? `${advisory.bestOutdoorWindow.label} (avg AQI ${advisory.bestOutdoorWindow.avgAqi})`
                    : 'Unavailable'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Highest AQI window</p>
                <p className="font-mono font-semibold tabular-nums text-rose-800 dark:text-rose-300">
                  {advisory.worstOutdoorWindow
                    ? `${advisory.worstOutdoorWindow.label} (avg AQI ${advisory.worstOutdoorWindow.avgAqi})`
                    : 'Unavailable'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Mask Guidance
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {advisory.maskGuidance}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Exercise &amp; Exertion
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {advisory.exerciseAdvice}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Indoor Ventilation
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {advisory.ventilationAdvice}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
