import { describe, expect, it } from 'vitest';
import { buildLeaderboard, getLeagueTier } from '@/lib/store/leaderboard';
import type { ActivityLog, ChildProfile } from '@/types';

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
    date: '2026-09-20',
    status: 'completed',
    pointsAwarded: 35,
    completedAt: '2026-09-20T01:00:00.000Z',
    ...overrides,
  };
}

describe('leaderboard domain', () => {
  it('uses the existing tier thresholds', () => {
    expect([0, 70, 150, 300].map(getLeagueTier)).toEqual([
      'bronze',
      'silver',
      'gold',
      'diamond',
    ]);
  });

  it('protects names and excludes private non-active children globally', () => {
    const profiles: ChildProfile[] = [
      { ...baseProfile, nickname: 'Sư Tử Nhỏ' },
      { ...baseProfile, id: 'child-2', name: 'Lê Minh Bình', isPublicOnLeaderboard: false },
      { ...baseProfile, id: 'child-3', name: 'Trần Hà', showRealNameOnLeaderboard: true },
    ];

    const entries = buildLeaderboard({
      profiles,
      logs: [],
      activeChildId: 'child-1',
      scope: 'global',
      period: 'monthly',
      now: new Date('2026-09-20T12:00:00.000Z'),
    });

    expect(entries.map((entry) => entry.childId)).toEqual(['child-1', 'child-3']);
    expect(entries.map((entry) => entry.nickname)).toEqual(['Sư Tử Nhỏ', 'Trần Hà']);
  });

  it('keeps the active private child and derives a safe fallback nickname', () => {
    const entries = buildLeaderboard({
      profiles: [{ ...baseProfile, isPublicOnLeaderboard: false }],
      logs: [],
      activeChildId: 'child-1',
      scope: 'global',
      period: 'monthly',
      now: new Date('2026-09-20T12:00:00.000Z'),
    });

    expect(entries[0]).toMatchObject({ nickname: 'Bé An', isCurrentChild: true });
  });

  it('calculates period points, rank, and tier without counting rejected logs', () => {
    const profiles: ChildProfile[] = [
      baseProfile,
      { ...baseProfile, id: 'child-2', name: 'Bình', points: 400 },
    ];
    const logs: ActivityLog[] = [
      completedLog({ id: 'today', pointsAwarded: 80 }),
      completedLog({ id: 'rejected', status: 'rejected', pointsAwarded: 500 }),
    ];

    const entries = buildLeaderboard({
      profiles,
      logs,
      activeChildId: 'child-1',
      scope: 'family',
      period: 'daily',
      now: new Date('2026-09-20T12:00:00.000Z'),
    });

    expect(entries.map(({ childId, points, rank, tier }) => ({ childId, points, rank, tier }))).toEqual([
      { childId: 'child-1', points: 80, rank: 1, tier: 'silver' },
      { childId: 'child-2', points: 80, rank: 2, tier: 'silver' },
    ]);
  });
});
