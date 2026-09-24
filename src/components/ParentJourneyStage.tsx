import { Check, ChevronDown, Circle, Compass } from 'lucide-react';
import { getJourneyPeriodLabel } from '@/lib/i18n/journey-copy';
import { getJourneyHabitText } from '@/lib/i18n/journey-content';
import { journeyMapCopy } from '@/lib/i18n/journey-map-copy';
import type { JourneyStageProgress } from '@/lib/journey-progress';
import type { JourneyPlan, Language } from '@/types';

type Props = {
  readonly plan: JourneyPlan;
  readonly index: number;
  readonly language: Language;
  readonly progress: JourneyStageProgress;
  readonly current: boolean;
  readonly next: boolean;
  readonly onApply: (plan: JourneyPlan) => void;
  readonly applyLabel: string;
  readonly canApply: boolean;
};

export function ParentJourneyStage({
  plan, index, language, progress, current, next, onApply, applyLabel, canApply,
}: Props) {
  const copy = journeyMapCopy[language];
  const status = progress.complete ? copy.complete : current ? copy.current : next ? copy.next : copy.available;
  const title = plan.title[language] || plan.title.en || plan.title.vi;
  const description = plan.description[language] || plan.description.en || plan.description.vi;

  return (
    <li className="relative min-w-0 pl-9 pb-5 last:pb-0 before:absolute before:left-[15px] before:top-9 before:bottom-0 before:w-px before:bg-sand-200 last:before:hidden dark:before:bg-zinc-700">
      <span className={`absolute left-0 top-4 flex size-8 items-center justify-center rounded-full border-2 text-sm font-extrabold ${progress.complete ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : current ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-sand-200 bg-white text-sand-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-300'}`} aria-hidden="true">
        {progress.complete ? <Check className="size-4" /> : index + 1}
      </span>
      <details className="group min-w-0 rounded-2xl border border-sand-200 bg-white shadow-xs open:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:open:border-indigo-700" open={current}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-2xl p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:p-5 [&::-webkit-details-marker]:hidden" aria-current={current ? 'step' : undefined}>
          <span className="min-w-0 space-y-1">
            <span className="block text-sm font-bold text-indigo-700 dark:text-indigo-300">{getJourneyPeriodLabel(language, plan.type, plan.id)} · {status}</span>
            <span className="block text-base font-extrabold leading-snug text-sand-900 dark:text-slate-100">{title}</span>
            <span className="block text-sm text-sand-700 dark:text-slate-300">{copy.practiced(progress.practicedCount, progress.totalCount)}</span>
          </span>
          <ChevronDown className="mt-1 size-5 shrink-0 text-sand-700 transition-transform group-open:rotate-180 dark:text-slate-300" aria-hidden="true" />
        </summary>
        <div className="space-y-4 border-t border-sand-100 px-4 pb-5 pt-4 dark:border-zinc-800 sm:px-5">
          <p className="max-w-prose text-sm leading-relaxed text-sand-700 dark:text-slate-300">{description}</p>
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold text-sand-700 dark:text-slate-300">
              <span>{copy.assigned(progress.assignedCount, progress.totalCount)}</span>
              <span>{copy.practiced(progress.practicedCount, progress.totalCount)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sand-100 dark:bg-zinc-800" role="progressbar" aria-label={copy.practiced(progress.practicedCount, progress.totalCount)} aria-valuemin={0} aria-valuemax={progress.totalCount} aria-valuenow={progress.practicedCount}>
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progress.totalCount ? 100 * progress.practicedCount / progress.totalCount : 0}%` }} />
            </div>
          </div>
          <ul className="space-y-2">
            {plan.habits.map((habit, habitIndex) => (
              <li key={`${plan.id}:${habitIndex}`} className="flex min-w-0 gap-2 text-sm leading-relaxed text-sand-700 dark:text-slate-300">
                <Circle className="mt-1 size-3 shrink-0 text-indigo-600" aria-hidden="true" />
                <span className="min-w-0 break-words">{getJourneyHabitText(plan, habitIndex, language).title}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => onApply(plan)} disabled={!canApply} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            <Compass className="size-4" aria-hidden="true" />{applyLabel}
          </button>
        </div>
      </details>
    </li>
  );
}
