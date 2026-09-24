import { getJourneyHabitText } from '@/lib/i18n/journey-content';
import type { ActivityLog, HabitActivity, JourneyPlan, Language } from '@/types';

const languages: readonly Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

export type JourneyStageProgress = {
  readonly assignedCount: number;
  readonly practicedCount: number;
  readonly totalCount: number;
  readonly complete: boolean;
};

export type JourneyAssignmentTarget = {
  readonly habitIndex: number;
  readonly childId: string | null;
};

export function getJourneyHabitKey(plan: JourneyPlan, index: number): string {
  return `${plan.id}:${plan.habits[index].id}`;
}

export function findJourneyAssignment(
  plan: JourneyPlan,
  index: number,
  childId: string | null,
  activities: readonly HabitActivity[],
): HabitActivity | undefined {
  const habit = plan.habits[index];
  const key = getJourneyHabitKey(plan, index);
  const titles = new Set(languages.map((language) => getJourneyHabitText(plan, index, language).title));
  const scoped = activities.filter((activity) => (
    (activity.childId === childId || (childId !== null && activity.childId === null))
  ));
  return scoped.find((activity) => activity.journeyHabitKey === key)
    ?? scoped.find((activity) => activity.category === habit.category && titles.has(activity.title));
}

export function getMissingJourneyAssignments(
  plan: JourneyPlan,
  targetChildId: string | null,
  childIds: readonly string[],
  activities: readonly HabitActivity[],
): JourneyAssignmentTarget[] {
  if (targetChildId) {
    return plan.habits.flatMap<JourneyAssignmentTarget>((_, habitIndex) => (
      findJourneyAssignment(plan, habitIndex, targetChildId, activities)
        ? [] : [{ habitIndex, childId: targetChildId }]
    ));
  }
  if (childIds.length === 0) return [];

  return plan.habits.flatMap<JourneyAssignmentTarget>((_, habitIndex) => {
    if (findJourneyAssignment(plan, habitIndex, null, activities)) return [];
    const missingChildren = childIds.filter((childId) => (
      !findJourneyAssignment(plan, habitIndex, childId, activities)
    ));
    if (missingChildren.length === childIds.length) return [{ habitIndex, childId: null }];
    return missingChildren.map((childId) => ({ habitIndex, childId }));
  });
}

export function getJourneyStageProgress(
  plan: JourneyPlan,
  childId: string,
  activities: readonly HabitActivity[],
  logs: readonly ActivityLog[],
): JourneyStageProgress {
  const assignments = plan.habits.map((_, index) => findJourneyAssignment(plan, index, childId, activities));
  const practicedCount = assignments.filter((activity) => activity && logs.some((log) => (
    log.activityId === activity.id
    && log.childId === childId
    && (log.status === 'approved' || log.status === 'completed')
  ))).length;
  const assignedCount = assignments.filter(Boolean).length;
  return {
    assignedCount,
    practicedCount,
    totalCount: plan.habits.length,
    complete: assignedCount === plan.habits.length && practicedCount === plan.habits.length,
  };
}

export function getCurrentJourneyIndex(progress: readonly JourneyStageProgress[]): number {
  const firstOpen = progress.findIndex((stage) => !stage.complete);
  return firstOpen === -1 ? Math.max(0, progress.length - 1) : firstOpen;
}
