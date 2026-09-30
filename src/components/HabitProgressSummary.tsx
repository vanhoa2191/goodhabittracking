'use client';

import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getHabitProgramsCopy } from '@/lib/i18n/habit-programs-copy';
import type { HabitProgramsCopy } from '@/lib/i18n/habit-programs-copy';
import { localizeAgeAdaptedHabit } from '@/lib/i18n/age-habit-copy';
import { localizeDemoActivity } from '@/lib/i18n/demo-content-copy';
import { localDayKey } from '@/lib/habit-fire';
import { summarizeChildHabits } from '@/lib/habit-programs/summary';
import { fillTemplate, suggestionKey, visibleSuggestions } from '@/lib/habit-programs/suggestion-display';
import type { SuggestionCode } from '@/lib/habit-programs/suggestions';
import type { HabitPhase } from '@/lib/habit-programs/types';
import { useSuggestionDismissals } from '@/lib/habit-programs/use-suggestion-dismissals';

const PHASE_KEY: Record<HabitPhase, 'phaseAnchor' | 'phaseBuild' | 'phaseFade' | 'phaseMaintain'> = {
  anchor: 'phaseAnchor',
  build: 'phaseBuild',
  fade: 'phaseFade',
  maintain: 'phaseMaintain',
};

const REASON_KEY: Record<SuggestionCode, keyof HabitProgramsCopy> = {
  'too-many-new': 'reasonTooManyNew',
  'check-in': 'reasonCheckIn',
  'step-back': 'reasonStepBack',
  'stuck-building': 'reasonStuckBuilding',
  'prompt-reliance': 'reasonPromptReliance',
  'routine-formed': 'reasonRoutineFormed',
  'record-support': 'reasonRecordSupport',
};

/** Where each planned habit stands for each child, with a few plainly worded suggestions. Guidance, never a score. */
export function HabitProgressSummary() {
  const { profiles, activities, logs, experience, familyPausePeriods } = useAppStore();
  const { language } = useTranslation();
  const copy = getHabitProgramsCopy(language);
  const { dismissed, dismiss } = useSuggestionDismissals();
  const now = new Date();
  const today = localDayKey(now);

  const sections = profiles
    .map((child) => ({
      child,
      summary: summarizeChildHabits({ child, activities, logs, experience, pausePeriods: familyPausePeriods, today }),
    }))
    .filter((section) => section.summary.habits.length > 0);

  const titleOf = (activityId: string) => {
    const activity = activities.find((candidate) => candidate.id === activityId);
    return activity ? localizeAgeAdaptedHabit(localizeDemoActivity(activity, language), language).title : '';
  };

  return (
    <section data-testid="habit-progress-summary" aria-labelledby="habit-progress-title" className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <h3 id="habit-progress-title" className="text-base font-extrabold text-slate-800 dark:text-slate-100">{copy.summaryTitle}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-300">{copy.summaryIntro}</p>
      </div>
      {sections.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-300">{copy.summaryEmpty}</p>}
      {sections.map(({ child, summary }) => {
        const suggestions = visibleSuggestions(summary.suggestions, child.id, dismissed, now);
        return (
          <div key={child.id} data-child-id={child.id} className="space-y-3">
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-100">{child.nickname || child.name}</h4>
            <ul className="space-y-2">
              {summary.habits.map((habit) => (
                <li key={habit.activityId} data-activity-id={habit.activityId} data-phase={habit.evaluation.phase} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-zinc-800/60">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">{titleOf(habit.activityId)}</span>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    {copy[PHASE_KEY[habit.evaluation.phase]]}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-300">{copy.typicalTime}</p>
            {suggestions.length > 0 && (
              <ul className="space-y-2">
                {suggestions.map((entry) => {
                  const key = suggestionKey(child.id, entry.habitId, entry.suggestion.code);
                  return (
                    <li key={key} data-suggestion={entry.suggestion.code} className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                      <span>
                        {entry.habitId && <strong className="mr-1">{titleOf(entry.habitId)}:</strong>}
                        {fillTemplate(copy[REASON_KEY[entry.suggestion.code]], entry.suggestion.facts)}
                      </span>
                      <button type="button" onClick={() => dismiss(key)} className="min-h-9 shrink-0 rounded-lg border border-amber-300 px-3 text-xs font-bold hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-950/60">
                        {copy.later}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
