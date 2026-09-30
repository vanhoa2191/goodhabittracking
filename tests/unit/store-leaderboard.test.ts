import { describe, expect, it } from 'vitest';
import { buildLeaderboard, getLeagueTier, periodStart } from '@/lib/store/leaderboard';
import type { ActivityLog, ChildProfile, GroupTeam } from '@/types';

const baseProfile: ChildProfile = {
  id: 'child-1',
  name: 'Nguyễn An',
  avatar: '🦁',
  themeColor: '#f97316',
  points: 100,
  totalEarned: 240,
  level: 2,
  streak: 4,
  createdAt: '2026-09-01T00:00:00.000Z',
};

function completedLog(overrides: Partial<ActivityLog>): ActivityLog {
  return {
    id: 'log-1',
    activityId: 'activity-1',
    childId: 'child-1',
    date: '2026-09-30',
    status: 'completed',
    pointsAwarded: 35,
    completedAt: '2026-09-30T01:00:00.000Z',
    ...overrides,
  };
}

const board = (overrides: Partial<Parameters<typeof buildLeaderboard>[0]> = {}) => buildLeaderboard({
  profiles: [baseProfile],
  logs: [],
  groups: [],
  activeChildId: 'child-1',
  scope: 'family',
  period: 'weekly',
  today: '2026-09-30',
  ...overrides,
});

describe('league tiers', () => {
  it('use the existing thresholds', () => {
    expect([0, 70, 150, 300].map(getLeagueTier)).toEqual(['bronze', 'silver', 'gold', 'diamond']);
  });
});

describe('the calendar periods', () => {
  it('start today, on Monday of this week, and on the first of this month', () => {
    // 2026-09-30 is a Wednesday.
    expect(periodStart('daily', '2026-09-30')).toBe('2026-09-30');
    expect(periodStart('weekly', '2026-09-30')).toBe('2026-09-28');
    expect(periodStart('weekly', '2026-09-28')).toBe('2026-09-28');
    expect(periodStart('weekly', '2026-09-27')).toBe('2026-09-21');
    expect(periodStart('monthly', '2026-09-30')).toBe('2026-09-01');
  });
});

describe('points on the board', () => {
  it('are exactly what was earned in the period, with no invented minimum', () => {
    const entries = board({
      profiles: [baseProfile, { ...baseProfile, id: 'child-2', name: 'Bình', points: 900, totalEarned: 900 }, { ...baseProfile, id: 'child-3', name: 'Chi', points: 0, totalEarned: 0 }],
    });
    expect(entries.map((entry) => entry.points)).toEqual([0, 0, 0]);
  });

  it('count only completed and approved logs of the period, by the child\'s own local day', () => {
    const logs = [
      completedLog({ id: 'today', pointsAwarded: 30 }),
      completedLog({ id: 'approved', status: 'approved', pointsAwarded: 20, date: '2026-09-29' }),
      completedLog({ id: 'rejected', status: 'rejected', pointsAwarded: 500 }),
      completedLog({ id: 'pending', status: 'pending_approval', pointsAwarded: 500 }),
      completedLog({ id: 'last-week', pointsAwarded: 40, date: '2026-09-27' }),
      completedLog({ id: 'last-month', pointsAwarded: 60, date: '2026-08-31' }),
      completedLog({ id: 'other-child', childId: 'child-9', pointsAwarded: 1000 }),
    ];
    expect(board({ logs, period: 'daily' })[0].points).toBe(30);
    expect(board({ logs, period: 'weekly' })[0].points).toBe(50);
    expect(board({ logs, period: 'monthly' })[0].points).toBe(90);
  });

  it('follow the day of the viewer, not the day in Greenwich', () => {
    const log = completedLog({ id: 'early', date: '2026-09-30', completedAt: '2026-09-29T19:30:00.000Z', pointsAwarded: 30 });
    expect(board({ logs: [log], period: 'daily', today: '2026-09-30' })[0].points).toBe(30);
    expect(board({ logs: [log], period: 'daily', today: '2026-09-29' })[0].points).toBe(0);
  });

  it('do not change when the child spends points', () => {
    const logs = [completedLog({ pointsAwarded: 50 })];
    const before = board({ logs, period: 'monthly' })[0].points;
    const after = board({ logs, period: 'monthly', profiles: [{ ...baseProfile, points: 0 }] })[0].points;
    expect(after).toBe(before);
  });

  it('rank children by them, breaking a tie by name so the order is stable', () => {
    const profiles = [baseProfile, { ...baseProfile, id: 'child-2', name: 'Bình' }, { ...baseProfile, id: 'child-3', name: 'Chi' }];
    const logs = [completedLog({ pointsAwarded: 10 }), completedLog({ id: 'l2', childId: 'child-2', pointsAwarded: 10 }), completedLog({ id: 'l3', childId: 'child-3', pointsAwarded: 25 })];
    expect(board({ profiles, logs }).map((entry) => `${entry.rank}:${entry.childId}`)).toEqual(['1:child-3', '2:child-2', '3:child-1']);
  });

  it('give every child the league of what they have earned in total', () => {
    const entries = board({ profiles: [{ ...baseProfile, totalEarned: 40 }, { ...baseProfile, id: 'child-2', name: 'Bình', totalEarned: 320 }] });
    expect(entries.map((entry) => entry.tier).sort()).toEqual(['bronze', 'diamond']);
  });
});

describe('names on the family and group boards', () => {
  it('use the nickname when there is one, otherwise the name the family gave, never a piece of it', () => {
    const entries = board({
      profiles: [
        { ...baseProfile, nickname: 'Sư Tử Nhỏ' },
        { ...baseProfile, id: 'child-2', name: 'Lê Minh Bình' },
      ],
    });
    expect(entries.map((entry) => entry.nickname).sort()).toEqual(['Lê Minh Bình', 'Sư Tử Nhỏ']);
  });
});

describe('the group board', () => {
  const group: GroupTeam = {
    id: 'g1', name: 'Biệt đội', inviteCode: 'ABC', icon: '👥', memberChildIds: ['child-1', 'child-2'],
    weeklyTargetPoints: 0, rewardType: 'badge', createdAt: '2026-09-01T00:00:00.000Z',
  };
  const profiles = [baseProfile, { ...baseProfile, id: 'child-2', name: 'Bình' }, { ...baseProfile, id: 'child-3', name: 'Chi' }];

  it('shows the children who share a group with the active child, and no one else', () => {
    const entries = board({ profiles, groups: [group], scope: 'group' });
    expect(entries.map((entry) => entry.childId).sort()).toEqual(['child-1', 'child-2']);
  });

  it('shows only the active child while they belong to no group', () => {
    expect(board({ profiles, groups: [], scope: 'group' }).map((entry) => entry.childId)).toEqual(['child-1']);
  });

  it('is different from the family board', () => {
    const family = board({ profiles, groups: [group], scope: 'family' });
    expect(family).toHaveLength(3);
  });
});

describe('the global board', () => {
  it('is not built from local data', () => {
    expect(board({ scope: 'global' })).toEqual([]);
  });
});
