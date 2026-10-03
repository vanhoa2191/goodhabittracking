'use client';

import { useAppStore } from '@/lib/store';
import { getParentTodayCopy } from '@/lib/i18n/parent-today-copy';
import { newHabitLimit } from '@/lib/habit-programs/config';
import { useTranslation } from '@/lib/i18n/context';
import { getHabitProgramsCopy } from '@/lib/i18n/habit-programs-copy';
import type { HabitProgramsCopy } from '@/lib/i18n/habit-programs-copy';
import { localizeAgeAdaptedHabit } from '@/lib/i18n/age-habit-copy';
import { localizeDemoActivity } from '@/lib/i18n/demo-content-copy';
import { localDayKey } from '@/lib/habit-fire';
import { childAgeYears, summarizeChildHabits } from '@/lib/habit-programs/summary';
import { fillTemplate, suggestionKey, visibleSuggestions } from '@/lib/habit-programs/suggestion-display';
import type { SuggestionCode } from '@/lib/habit-programs/suggestions';
import type { HabitPhase } from '@/lib/habit-programs/types';
import { useSuggestionDismissals } from '@/lib/habit-programs/use-suggestion-dismissals';
import { HelpTip } from '@/components/help/HelpTip';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { getIndependenceCopy } from '@/lib/i18n/independence-copy';
import { HabitSupportTrend } from './HabitSupportTrend';
import { GraduatedHabitsList } from './HabitGraduation';
import { getCoachCopy } from '@/lib/i18n/coach-copy';
import { kindForSuggestion } from '@/lib/habit-programs/coach';
import { useStartChange } from './use-start-change';

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

const STATUS_STYLE = {
  'not-started': 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-200',
  forming: 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
  'needs-help': 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  steady: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
} as const;
// A mark besides the colour, so the status never depends on colour alone.
const STATUS_MARK = { 'not-started': '○', forming: '◔', 'needs-help': '△', steady: '●' } as const;

/** Where each planned habit stands for each child, with a few plainly worded suggestions. Guidance, never a score. */
export function HabitProgressSummary({ childId, onOpenHabits }: { readonly childId?: string; readonly onOpenHabits?: () => void } = {}) {
  const { profiles, activities, logs, experience, familyPausePeriods } = useAppStore();
  const { language } = useTranslation();
  const copy = getHabitProgramsCopy(language);
  const today_ = getParentTodayCopy(language);
  const independence = getIndependenceCopy(language);
  const showIndependence = defaultExperienceFlags.independence;
  const coachCopy = getCoachCopy(language);
  const startChange = useStartChange();
  const { dismissed, dismiss } = useSuggestionDismissals();
  const now = new Date();
  const today = localDayKey(now);

  const sections = profiles
    .filter((child) => !childId || child.id === childId)
    .map((child) => ({
      child,
      summary: summarizeChildHabits({ child, activities, logs, experience, pausePeriods: familyPausePeriods, today }),
    }))
    .filter((section) => section.summary.habits.length > 0);

  const titleOf = (activityId: string) => {
    const activity = activities.find((candidate) => candidate.id === activityId);
    return activity ? localizeAgeAdaptedHabit(localizeDemoActivity(activity, language), language).title : '';
  };

  const childForLimit = profiles.find((profile) => !childId || profile.id === childId);
  const limit = childForLimit ? newHabitLimit(childAgeYears(childForLimit, today)) : 3;
  const buildingCount = sections.reduce((sum, { summary }) => sum + summary.habits.filter((habit) => habit.evaluation.phase !== 'maintain').length, 0);

  return (
    <section data-testid="habit-progress-summary" id="habit-progress" aria-labelledby="habit-progress-title" className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex items-center gap-1"><h3 id="habit-progress-title" className="text-base font-extrabold text-slate-800 dark:text-slate-100">
          {copy.summaryTitle}{sections.length > 0 ? ` · ${today_.building(buildingCount, limit)}` : ''}
        </h3><HelpTip topic="progress.summary" /></div>
        <p className="text-xs text-slate-500 dark:text-slate-300">{copy.summaryIntro}</p>
      </div>
      {sections.length === 0 && (
        <div className="space-y-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
          <p className="text-sm text-slate-700 dark:text-slate-200">{copy.summaryEmpty}</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{today_.emptyTitle}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{today_.emptyBody}</p>
          {onOpenHabits && (
            <button type="button" data-testid="habit-progress-empty-cta" onClick={onOpenHabits} className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              {today_.emptyCta}
            </button>
          )}
        </div>
      )}
      {sections.map(({ child, summary }) => {
        const suggestions = visibleSuggestions(summary.suggestions, child.id, dismissed, now);
        return (
          <div key={child.id} data-child-id={child.id} className="space-y-3">
            {!childId && <h4 className="text-sm font-black text-slate-700 dark:text-slate-100">{child.nickname || child.name}</h4>}
            <ul className="grid gap-3 md:grid-cols-2">
              {summary.habits.map((habit) => {
                const doneDays = habit.recent.filter((dot) => dot.state === 'done').length;
                return (
                  <li key={habit.activityId} data-activity-id={habit.activityId} data-phase={habit.evaluation.phase} className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/60">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{titleOf(habit.activityId)}</span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        {showIndependence && (
                          <span data-testid="habit-status" data-status={habit.status} className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[habit.status]}`}>
                            {STATUS_MARK[habit.status]} {independence.status[habit.status]}
                          </span>
                        )}
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                          {copy[PHASE_KEY[habit.evaluation.phase]]}
                        </span>
                      </span>
                    </div>
                    {habit.recent.length > 0 && (
                      <>
                        <ul aria-label={today_.lastSevenDays} className="flex gap-1">
                          {habit.recent.map((dot) => (
                            <li
                              key={dot.date}
                              data-day-state={dot.state}
                              title={`${dot.date}: ${dot.state === 'done' ? today_.dayDone : dot.state === 'missed' ? today_.dayMissed : today_.dayNone}`}
                              className={`h-2.5 flex-1 rounded-full ${dot.state === 'done' ? 'bg-indigo-600' : dot.state === 'missed' ? 'bg-slate-300 dark:bg-zinc-600' : 'bg-slate-100 dark:bg-zinc-800'}`}
                            >
                              <span className="sr-only">{dot.date}: {dot.state === 'done' ? today_.dayDone : dot.state === 'missed' ? today_.dayMissed : today_.dayNone}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {today_.doneOfSeven(doneDays)}{habit.lean ? ` · ${today_.lean[habit.lean]}` : ''}
                        </p>
                      </>
                    )}
                    {showIndependence && habit.trend.length > 0 && (
                      <div className="flex items-start gap-1 text-xs">
                        <details className="min-w-0 flex-1">
                          <summary className="flex min-h-11 cursor-pointer items-center font-bold text-indigo-700 dark:text-indigo-300">{independence.trendTitle}</summary>
                          <HabitSupportTrend buckets={habit.trend} verdict={habit.trendVerdict} copy={independence} />
                        </details>
                        <HelpTip topic="progress.supportTrend" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {showIndependence && <GraduatedHabitsList childId={child.id} />}
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
                      <span className="flex shrink-0 flex-col gap-1">
                        {defaultExperienceFlags.habitCoach && entry.habitId && kindForSuggestion(entry.suggestion.code) && !experience.habitTries.some((row) => row.child_id === child.id && row.outcome === null) && (
                          <button
                            type="button"
                            data-testid="suggestion-try"
                            onClick={() => { const kind = kindForSuggestion(entry.suggestion.code); if (kind && entry.habitId) void startChange(entry.habitId, child.id, kind); }}
                            className="min-h-9 rounded-lg bg-amber-700 px-3 text-xs font-bold text-white hover:bg-amber-800"
                          >
                            {coachCopy.tryIt}
                          </button>
                        )}
                        <button type="button" onClick={() => dismiss(key)} className="min-h-9 rounded-lg border border-amber-300 px-3 text-xs font-bold hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-950/60">
                          {copy.later}
                        </button>
                      </span>
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
