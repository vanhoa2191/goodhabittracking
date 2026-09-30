import { useMemo } from 'react';
import { localDayKey } from '@/lib/habit-fire';
import type { ExperienceState, FamilyPausePeriod } from '@/lib/experience-state';
import type { ActivityLog, ChildProfile, HabitActivity } from '@/types';
import { summarizeChildHabits } from './summary';
import type { HabitPhase } from './types';

type Input = {
  readonly enabled: boolean;
  readonly child: ChildProfile | null | undefined;
  readonly activities: readonly HabitActivity[];
  readonly logs: readonly ActivityLog[];
  readonly experience: ExperienceState;
  readonly pausePeriods: readonly FamilyPausePeriod[];
};

const NONE: ReadonlyMap<string, HabitPhase> = new Map();

/** Each planned habit's phase, worked out once for the whole task list instead of once per card. */
export function useChildHabitPhases({ enabled, child, activities, logs, experience, pausePeriods }: Input): ReadonlyMap<string, HabitPhase> {
  return useMemo(() => {
    if (!enabled || !child || experience.cuePlans.every((plan) => plan.child_id !== child.id)) return NONE;
    const summary = summarizeChildHabits({ child, activities, logs, experience, pausePeriods, today: localDayKey(new Date()) });
    return new Map(summary.habits.map((habit) => [habit.activityId, habit.evaluation.phase]));
  }, [enabled, child, activities, logs, experience, pausePeriods]);
}
