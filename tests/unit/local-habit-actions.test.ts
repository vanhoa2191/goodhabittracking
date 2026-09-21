import { describe, expect, it } from 'vitest';
import { toggleLocalHabit } from '@/lib/store/local-habit-actions';
import type {
  ActivityLog,
  Badge,
  ChildBadge,
  ChildProfile,
  HabitActivity,
} from '@/types';

const child: ChildProfile = {
  id: 'child-1',
  name: 'Bé An',
  avatar: '🦁',
  themeColor: '#f97316',
  points: 50,
  totalEarned: 190,
  level: 2,
  streak: 3,
  createdAt: '2026-09-01T00:00:00.000Z',
};

const activity: HabitActivity = {
  id: 'activity-1',
  childId: 'child-1',
  title: 'Đọc sách',
  icon: '📚',
  category: 'study',
  points: 20,
  recurrenceType: 'daily',
  recurrenceDays: [],
  timeOfDay: 'evening',
  requiresApproval: true,
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
};

const automaticActivity: HabitActivity = {
  ...activity,
  requiresApproval: false,
};

const badges: readonly Badge[] = [
  {
    id: 'first-task',
    code: 'first-task',
    name: { vi: 'Bước đầu tiên' },
    description: { vi: 'Hoàn thành nhiệm vụ đầu tiên' },
    icon: '🌱',
    criteriaType: 'firstTask',
    criteriaValue: 1,
  },
  {
    id: 'two-hundred-points',
    code: 'two-hundred-points',
    name: { vi: 'Hai trăm sao' },
    description: { vi: 'Đạt 200 sao' },
    icon: '⭐',
    criteriaType: 'totalPoints',
    criteriaValue: 200,
  },
];

const existingChildBadges: readonly ChildBadge[] = [{
  childId: 'child-1',
  badgeId: 'first-task',
  unlockedAt: '2026-09-19T00:00:00.000Z',
}];

describe('local habit actions', () => {
  it('completes an automatic habit atomically and unlocks each newly qualified badge once', () => {
    // Given
    const childBeforeCompletion = { ...child, lastActiveDate: '2026-09-19' };

    // When
    const completed = toggleLocalHabit({
      profiles: [childBeforeCompletion],
      logs: [],
      childBadges: existingChildBadges,
      badges,
      activity: automaticActivity,
      childId: 'child-1',
      date: '2026-09-20',
      today: '2026-09-20',
      logId: 'log-new',
      completedAt: '2026-09-20T02:00:00.000Z',
    });

    // Then
    expect(completed.kind).toBe('completed');
    expect(completed.logs[0]).toEqual({
      id: 'log-new',
      activityId: 'activity-1',
      childId: 'child-1',
      date: '2026-09-20',
      status: 'completed',
      pointsAwarded: 20,
      completedAt: '2026-09-20T02:00:00.000Z',
    });
    expect(completed.profiles[0]).toMatchObject({
      points: 70,
      totalEarned: 210,
      level: 3,
      streak: 4,
      lastActiveDate: '2026-09-20',
    });
    expect(completed.childBadges).toEqual([
      ...existingChildBadges,
      {
        childId: 'child-1',
        badgeId: 'two-hundred-points',
        unlockedAt: '2026-09-20T02:00:00.000Z',
      },
    ]);
    expect(completed.unlockedBadgeCount).toBe(1);
  });

  it('creates a pending log without changing points, streak, or badges when approval is required', () => {
    // Given / When
    const pending = toggleLocalHabit({
      profiles: [child],
      logs: [],
      childBadges: existingChildBadges,
      badges,
      activity,
      childId: 'child-1',
      date: '2026-09-20',
      today: '2026-09-20',
      logId: 'log-new',
      completedAt: '2026-09-20T02:00:00.000Z',
    });

    // Then
    expect(pending.kind).toBe('pending_approval');
    expect(pending.logs[0]).toMatchObject({ status: 'pending_approval', pointsAwarded: 0 });
    expect(pending.profiles).toEqual([child]);
    expect(pending.childBadges).toEqual(existingChildBadges);
    expect(pending.unlockedBadgeCount).toBe(0);
  });

  it('undoes a completed habit without allowing negative current or lifetime points', () => {
    // Given
    const awardedLog: ActivityLog = {
      id: 'log-1',
      activityId: 'activity-1',
      childId: 'child-1',
      date: '2026-09-20',
      status: 'completed',
      pointsAwarded: 20,
      completedAt: '2026-09-20T01:00:00.000Z',
    };
    const lowBalanceChild = { ...child, points: 10, totalEarned: 5 };

    // When
    const undone = toggleLocalHabit({
      profiles: [lowBalanceChild],
      logs: [awardedLog],
      childBadges: existingChildBadges,
      badges,
      activity: automaticActivity,
      childId: 'child-1',
      date: '2026-09-20',
      today: '2026-09-20',
      logId: 'unused-log-id',
      completedAt: '2026-09-20T02:00:00.000Z',
    });

    // Then
    expect(undone.kind).toBe('undone');
    expect(undone.logs).toEqual([]);
    expect(undone.profiles[0]).toMatchObject({ points: 0, totalEarned: 0 });
    expect(undone.childBadges).toEqual(existingChildBadges);
  });
});
