import { describe, expect, it } from 'vitest';
import { DEFAULT_BADGES } from '@/lib/constants';
import { HABIT_FRAMEWORK_CATALOG } from '@/lib/habit-framework/catalog';
import { PORTRAIT_BADGE_COUNT, PORTRAIT_BADGE_TARGET } from '@/lib/badges/badge-catalog';
import { badgeProgress, computeBadgeMetrics, qualifiedBadgeIds } from '@/lib/badges/badge-progress';
import type { ActivityLog, HabitActivity } from '@/types';

const child = { id: 'kid-1', streak: 0, totalEarned: 0 };

function activityFor(frameworkHabitId: string | undefined, id: string): HabitActivity {
  return { id, frameworkHabitId } as HabitActivity;
}

function logs(activityId: string, count: number, status: ActivityLog['status'] = 'completed'): ActivityLog[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${activityId}-${index}`, activityId, childId: child.id, date: `2026-01-${String(index + 1).padStart(2, '0')}`,
    status, pointsAwarded: 10, completedAt: '2026-01-01T00:00:00Z',
  }));
}

const habitsOf = (portraitId: string) => HABIT_FRAMEWORK_CATALOG.filter((habit) => habit.conceptTags.some((tag) => tag.startsWith(`#ChânDung:${portraitId}-`)));

describe('badge catalog', () => {
  it('has unique ids and covers streaks, quests, stars and every portrait', () => {
    const ids = DEFAULT_BADGES.map((badge) => badge.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const type of ['streak', 'totalTasks', 'totalPoints', 'portrait', 'portraitCollection'] as const) {
      expect(DEFAULT_BADGES.some((badge) => badge.criteriaType === type)).toBe(true);
    }
    expect(DEFAULT_BADGES.filter((badge) => badge.criteriaType === 'portrait')).toHaveLength(PORTRAIT_BADGE_COUNT);
    expect(DEFAULT_BADGES.length).toBeGreaterThan(30);
  });

  it('only offers portrait badges that the shipped habits can earn', () => {
    for (const badge of DEFAULT_BADGES.filter((candidate) => candidate.criteriaType === 'portrait')) {
      expect(habitsOf(badge.portraitId ?? '').length, badge.id).toBeGreaterThan(0);
    }
  });
});

describe('badge progress', () => {
  it('counts only completed and approved logs of the child, per portrait', () => {
    const portraitHabit = habitsOf('CD-01')[0];
    const activities = [activityFor(portraitHabit.id, 'a1'), activityFor(undefined, 'a2')];
    const all = [
      ...logs('a1', 3),
      ...logs('a1', 2, 'approved').map((log) => ({ ...log, id: `${log.id}-x`, date: `2027-01-${log.date.slice(-2)}` })),
      ...logs('a1', 4, 'pending_approval').map((log) => ({ ...log, id: `${log.id}-p`, date: `2028-01-${log.date.slice(-2)}` })),
      ...logs('a2', 2),
      { ...logs('a1', 1)[0], id: 'other', childId: 'someone-else' },
    ];
    const metrics = computeBadgeMetrics(child, all, activities);
    expect(metrics.completedCount).toBe(7);
    expect(metrics.portraitCounts.get('CD-01')).toBe(5);
  });

  it('awards a portrait badge at the target and reports progress towards it', () => {
    const portraitHabit = habitsOf('CD-01')[0];
    const activities = [activityFor(portraitHabit.id, 'a1')];
    const badge = DEFAULT_BADGES.find((candidate) => candidate.portraitId === 'CD-01' && candidate.criteriaType === 'portrait')!;

    const before = computeBadgeMetrics(child, logs('a1', PORTRAIT_BADGE_TARGET - 1), activities);
    expect(badgeProgress(badge, before, 0)).toEqual({ current: PORTRAIT_BADGE_TARGET - 1, target: PORTRAIT_BADGE_TARGET });
    expect(qualifiedBadgeIds(DEFAULT_BADGES, before).has(badge.id)).toBe(false);

    const after = computeBadgeMetrics(child, logs('a1', PORTRAIT_BADGE_TARGET), activities);
    expect(qualifiedBadgeIds(DEFAULT_BADGES, after).has(badge.id)).toBe(true);
  });

  it('awards streak, quest and star milestones from the child totals', () => {
    const metrics = { completedCount: 55, streak: 14, totalEarned: 520, portraitCounts: new Map<string, number>() };
    const earned = qualifiedBadgeIds(DEFAULT_BADGES, metrics);
    for (const id of ['badge-first-task', 'badge-streak-3', 'badge-streak-7', 'badge-streak-14', 'badge-tasks-20', 'badge-tasks-50', 'badge-points-500']) {
      expect(earned.has(id), id).toBe(true);
    }
    for (const id of ['badge-streak-30', 'badge-tasks-100', 'badge-points-1000']) {
      expect(earned.has(id), id).toBe(false);
    }
  });

  it('awards the summit only when every portrait badge is held', () => {
    const summit = DEFAULT_BADGES.find((badge) => badge.criteriaType === 'portraitCollection')!;
    const portraitBadges = DEFAULT_BADGES.filter((badge) => badge.criteriaType === 'portrait');
    const metrics = { completedCount: 0, streak: 0, totalEarned: 0, portraitCounts: new Map<string, number>() };

    const oneShort = new Set(portraitBadges.slice(1).map((badge) => badge.id));
    expect(qualifiedBadgeIds(DEFAULT_BADGES, metrics, oneShort).has(summit.id)).toBe(false);
    const all = new Set(portraitBadges.map((badge) => badge.id));
    expect(qualifiedBadgeIds(DEFAULT_BADGES, metrics, all).has(summit.id)).toBe(true);
  });
});
