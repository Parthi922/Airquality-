import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { POLLUTANT_EXPLAINERS } from '@/src/lib/pollutants/explainer';
import type { PollutantId } from '@/src/types/airQuality';

interface PollutantModalProps {
  pollutantId: PollutantId | null;
  currentValue: number | null;
  unit: string;
  onClose: () => void;
}

export function PollutantModal({ pollutantId, currentValue, unit, onClose }: PollutantModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!pollutantId) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pollutantId, onClose]);

  if (!pollutantId) return null;
  const info = POLLUTANT_EXPLAINERS[pollutantId];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pollutant-modal-title"
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {info.formula}
              {currentValue !== null ? ` · Current: ${currentValue} ${unit}` : ''}
            </p>
            <h2 id="pollutant-modal-title" className="mt-1 text-xl font-semibold">
              {info.name}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={`Close ${info.name} explanation`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">What it is</h3>
            <p className="mt-1">{info.plainSummary}</p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Common urban sources</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {info.urbanSources.map((src) => (
                <li key={src}>{src}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Health impact</h3>
            <p className="mt-1">{info.healthEffects}</p>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="font-semibold text-slate-900 dark:text-white">Measured standard</h3>
            <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-300">
              {info.benchmarkSummary}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Practical protection</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {info.reductionTips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
