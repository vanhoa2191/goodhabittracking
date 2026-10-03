'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, Gift, Lightbulb } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getParentActionsCopy } from '@/lib/i18n/parent-actions-copy';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { localDayKey } from '@/lib/habit-fire';
import { childAgeYears, summarizeChildHabits } from '@/lib/habit-programs/summary';
import { newHabitLimit } from '@/lib/habit-programs/config';
import { nextProgramStep, type NextProgramStep } from '@/lib/habit-programs/next-step';
import { programsForAge } from '@/lib/habit-programs/programs';
import { isSuggestionHidden } from '@/lib/habit-programs/suggestion-display';
import { useLocalizedFramework } from '@/lib/habit-framework/localized';
import type { ChildProfile } from '@/types';
import { visibleSuggestions } from '@/lib/habit-programs/suggestion-display';
import { useSuggestionDismissals } from '@/lib/habit-programs/use-suggestion-dismissals';
import { selectParentActions, type ParentActionKind } from '@/lib/parent-actions';
import { HelpTip } from '@/components/help/HelpTip';

const HabitProgramStartModal = dynamic(() => import('./HabitProgramStartModal').then((module) => module.HabitProgramStartModal), { ssr: false });

type NextStepTarget = NextProgramStep & { readonly child: ChildProfile; readonly ageYears: number };

const TARGET: Record<ParentActionKind, string> = {
  'review-tasks': 'pending-tasks',
  'review-rewards': 'pending-rewards',
  suggestions: 'habit-progress',
};

const ICON = { 'review-tasks': CheckCircle2, 'review-rewards': Gift, suggestions: Lightbulb } as const;

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}

/** One strip that lists everything waiting for a parent, each with a button that goes straight to it. */
export function ParentActionStrip({ pendingTasks, pendingRewards }: { readonly pendingTasks: number; readonly pendingRewards: number }) {
  const { profiles, activities, logs, experience, familyPausePeriods } = useAppStore();
  const { language } = useTranslation();
  const copy = getParentActionsCopy(language);
  const { dismissed, dismiss } = useSuggestionDismissals();
  const framework = useLocalizedFramework(language);
  const [target, setTarget] = useState<NextStepTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const now = new Date();
  const today = localDayKey(now);

  const suggestions = defaultExperienceFlags.habitPrograms
    ? profiles.reduce((sum, child) => {
        const summary = summarizeChildHabits({ child, activities, logs, experience, pausePeriods: familyPausePeriods, today });
        return sum + visibleSuggestions(summary.suggestions, child.id, dismissed, now).length;
      }, 0)
    : 0;
  const nextSteps: NextStepTarget[] = defaultExperienceFlags.habitPrograms
    ? profiles.flatMap((child) => {
        const ageYears = childAgeYears(child, today);
        const summary = summarizeChildHabits({ child, activities, logs, experience, pausePeriods: familyPausePeriods, today });
        const frameworkIdByActivity = new Map(activities.map((activity) => [activity.id, activity.frameworkHabitId]));
        const phaseByHabitId = new Map(summary.habits.flatMap((habit) => {
          const frameworkId = frameworkIdByActivity.get(habit.activityId);
          return frameworkId ? [[frameworkId, habit.evaluation.phase] as const] : [];
        }));
        const inUse = new Set(activities.flatMap((activity) => (
          activity.isActive && activity.frameworkHabitId && (activity.childId === child.id || activity.childId === null) ? [activity.frameworkHabitId] : []
        )));
        const step = nextProgramStep({
          programs: programsForAge(ageYears),
          inUse,
          phaseByHabitId,
          buildingCount: summary.habits.filter((habit) => habit.evaluation.phase !== 'maintain').length,
          limit: newHabitLimit(ageYears),
        });
        if (!step || isSuggestionHidden(dismissed, `${child.id}:${step.program.id}:next-step`, now)) return [];
        return [{ ...step, child, ageYears }];
      })
    : [];
  const actions = selectParentActions({ pendingTasks, pendingRewards, suggestions });
  const habitName = (habitId: string) => framework.habits.find((habit) => habit.id === habitId)?.name ?? '';
  const label = { 'review-tasks': copy.reviewTasks, 'review-rewards': copy.reviewRewards, suggestions: copy.suggestions } as const;

  return (
    <section data-testid="parent-action-strip" aria-labelledby="parent-action-title" className="space-y-3 rounded-3xl border border-indigo-100 bg-indigo-50/60 p-5 dark:border-indigo-900/50 dark:bg-indigo-950/30">
      <div className="flex items-center gap-1">
        <h3 id="parent-action-title" className="text-sm font-extrabold text-slate-700 dark:text-slate-100">{copy.title}</h3>
        <HelpTip topic="today.actions" />
      </div>
      {actions.length === 0 && nextSteps.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">{copy.nothing}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const Icon = ICON[action.kind];
            return (
              <li key={action.kind}>
                <button
                  type="button"
                  data-action={action.kind}
                  onClick={() => scrollToSection(TARGET[action.kind])}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-indigo-700 shadow-xs transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-zinc-900 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label[action.kind](action.count)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {nextSteps.map((step) => (
        <div key={`${step.child.id}:${step.program.id}`} data-testid="next-program-step" className="flex flex-col gap-2 rounded-2xl bg-white p-3 text-sm text-slate-700 dark:bg-zinc-900 dark:text-slate-200">
          <p>{copy.nextStep(step.child.nickname || step.child.name, habitName(step.nextHabitId), step.program.name)}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setNotice(null); setTarget(step); }} className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">{copy.addNextStep}</button>
            <button type="button" onClick={() => dismiss(`${step.child.id}:${step.program.id}:next-step`)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800">{copy.later}</button>
          </div>
        </div>
      ))}
      {notice && <p role="status" className="text-sm font-bold text-slate-700 dark:text-slate-200">{notice}</p>}
      {target && (
        <HabitProgramStartModal
          program={target.program}
          child={target.child}
          ageYears={target.ageYears}
          onClose={() => setTarget(null)}
          onStarted={() => { setTarget(null); setNotice(copy.nextStepStarted); }}
          onNotConfirmed={() => { setTarget(null); setNotice(copy.nextStepUnconfirmed); }}
        />
      )}
    </section>
  );
}
