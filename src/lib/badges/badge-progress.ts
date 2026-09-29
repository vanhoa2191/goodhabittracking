import { HABIT_FRAMEWORK_CATALOG } from '@/lib/habit-framework/catalog';
import type { ActivityLog, Badge, ChildProfile, HabitActivity } from '@/types';

export type BadgeMetrics = {
  readonly completedCount: number;
  readonly streak: number;
  readonly totalEarned: number;
  readonly portraitCounts: ReadonlyMap<string, number>;
};

export type BadgeProgress = {
  readonly current: number;
  readonly target: number;
};

const PORTRAIT_TAG = /^#ChânDung:(CD-\d{2})-/u;

const PORTRAITS_BY_FRAMEWORK_HABIT: ReadonlyMap<string, readonly string[]> = new Map(
  HABIT_FRAMEWORK_CATALOG.map((habit) => {
    const portraits = new Set<string>();
    for (const tag of habit.conceptTags) {
      const match = PORTRAIT_TAG.exec(tag);
      if (match) portraits.add(match[1]);
    }
    return [habit.id, [...portraits]] as const;
  }),
);

function isCounted(log: ActivityLog): boolean {
  return log.status === 'completed' || log.status === 'approved';
}

export function computeBadgeMetrics(
  profile: Pick<ChildProfile, 'id' | 'streak' | 'totalEarned'>,
  logs: readonly ActivityLog[],
  activities: readonly HabitActivity[],
): BadgeMetrics {
  const habitByActivity = new Map(
    activities.flatMap((activity) => activity.frameworkHabitId ? [[activity.id, activity.frameworkHabitId] as const] : []),
  );
  const portraitCounts = new Map<string, number>();
  let completedCount = 0;
  for (const log of logs) {
    if (log.childId !== profile.id || !isCounted(log)) continue;
    completedCount += 1;
    const habitId = habitByActivity.get(log.activityId);
    for (const portraitId of (habitId ? PORTRAITS_BY_FRAMEWORK_HABIT.get(habitId) : undefined) ?? []) {
      portraitCounts.set(portraitId, (portraitCounts.get(portraitId) ?? 0) + 1);
    }
  }
  return { completedCount, streak: profile.streak, totalEarned: profile.totalEarned, portraitCounts };
}

export function badgeProgress(badge: Badge, metrics: BadgeMetrics, heldPortraitBadges: number): BadgeProgress {
  const target = badge.criteriaValue;
  switch (badge.criteriaType) {
    case 'firstTask':
    case 'totalTasks':
      return { current: Math.min(metrics.completedCount, target), target };
    case 'streak':
      return { current: Math.min(metrics.streak, target), target };
    case 'totalPoints':
      return { current: Math.min(metrics.totalEarned, target), target };
    case 'portrait':
      return { current: Math.min(metrics.portraitCounts.get(badge.portraitId ?? '') ?? 0, target), target };
    case 'portraitCollection':
      return { current: Math.min(heldPortraitBadges, target), target };
    default: {
      const unreachable: never = badge.criteriaType;
      return unreachable;
    }
  }
}

/** Ids of every badge the child's current numbers earn. Portrait badges are resolved first so the summit can count them. */
export function qualifiedBadgeIds(
  badges: readonly Badge[],
  metrics: BadgeMetrics,
  alreadyHeld: ReadonlySet<string> = new Set(),
): Set<string> {
  const qualified = new Set<string>();
  const portraitBadges = badges.filter((badge) => badge.criteriaType === 'portrait');
  const meets = (badge: Badge, heldPortraits: number): boolean => {
    const { current, target } = badgeProgress(badge, metrics, heldPortraits);
    return current >= target;
  };
  for (const badge of badges) {
    if (badge.criteriaType !== 'portraitCollection' && meets(badge, 0)) qualified.add(badge.id);
  }
  const heldPortraits = portraitBadges.filter((badge) => qualified.has(badge.id) || alreadyHeld.has(badge.id)).length;
  for (const badge of badges) {
    if (badge.criteriaType === 'portraitCollection' && meets(badge, heldPortraits)) qualified.add(badge.id);
  }
  return qualified;
}

export function countHeldPortraitBadges(badges: readonly Badge[], held: ReadonlySet<string>): number {
  return badges.filter((badge) => badge.criteriaType === 'portrait' && held.has(badge.id)).length;
}
