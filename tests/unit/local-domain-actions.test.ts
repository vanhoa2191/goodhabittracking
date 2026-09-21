import { describe, expect, it } from 'vitest';
import {
  adjustProfilePoints,
  approvePendingLog,
  claimLocalReward,
  removeProfile,
  transitionLocalRedemption,
} from '@/lib/store/local-domain-actions';
import type {
  ActivityLog,
  ChildProfile,
  HabitActivity,
  Redemption,
  Reward,
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

const pendingLog: ActivityLog = {
  id: 'log-1',
  activityId: 'activity-1',
  childId: 'child-1',
  date: '2026-09-20',
  status: 'pending_approval',
  pointsAwarded: 0,
  completedAt: '2026-09-20T01:00:00.000Z',
};

const reward: Reward = {
  id: 'reward-1',
  title: 'Đi công viên',
  icon: '🌳',
  costPoints: 30,
  stock: 1,
  isActive: true,
  createdAt: '2026-09-01T00:00:00.000Z',
};

describe('local store domain actions', () => {
  it('clears the active child when the final profile is removed', () => {
    expect(removeProfile([child], 'child-1', 'child-1')).toEqual({
      profiles: [],
      activeChildId: null,
    });
  });

  it('never creates a negative balance and only grows lifetime earnings', () => {
    expect(adjustProfilePoints([child], 'child-1', -80)[0]).toMatchObject({
      points: 0,
      totalEarned: 190,
      level: 2,
    });
    expect(adjustProfilePoints([child], 'child-1', 20)[0]).toMatchObject({
      points: 70,
      totalEarned: 210,
      level: 3,
    });
  });

  it('approves a pending log and applies activity points exactly once', () => {
    const approved = approvePendingLog([pendingLog], [child], [activity], 'log-1');

    expect(approved.logs[0]).toMatchObject({ status: 'approved', pointsAwarded: 20 });
    expect(approved.profiles[0]).toMatchObject({ points: 70, totalEarned: 210, level: 3 });
    expect(approvePendingLog(approved.logs, approved.profiles, [activity], 'log-1')).toEqual(approved);
  });

  it('claims a reward atomically for local state', () => {
    const claimed = claimLocalReward(
      [child],
      [],
      'child-1',
      reward,
      'redemption-1',
      '2026-09-20T02:00:00.000Z',
    );

    expect(claimed).toEqual({
      profiles: [{ ...child, points: 20 }],
      redemptions: [{
        id: 'redemption-1',
        rewardId: 'reward-1',
        childId: 'child-1',
        pointsSpent: 30,
        status: 'pending',
        requestedAt: '2026-09-20T02:00:00.000Z',
      }],
    });
  });

  it('rejects a redemption and refunds its points once', () => {
    const redemption: Redemption = {
      id: 'redemption-1',
      rewardId: 'reward-1',
      childId: 'child-1',
      pointsSpent: 30,
      status: 'pending',
      requestedAt: '2026-09-20T02:00:00.000Z',
    };

    const rejected = transitionLocalRedemption(
      [redemption],
      [child],
      'redemption-1',
      'reject',
      '2026-09-20T03:00:00.000Z',
    );
    const repeated = transitionLocalRedemption(
      rejected.redemptions,
      rejected.profiles,
      'redemption-1',
      'reject',
      '2026-09-20T04:00:00.000Z',
    );

    expect(rejected.profiles[0].points).toBe(80);
    expect(rejected.redemptions[0]).toMatchObject({ status: 'rejected' });
    expect(repeated).toEqual(rejected);
  });

  it('treats the parent deliver action as approval and delivery in one step', () => {
    const redemption: Redemption = {
      id: 'redemption-1',
      rewardId: 'reward-1',
      childId: 'child-1',
      pointsSpent: 30,
      status: 'pending',
      requestedAt: '2026-09-20T02:00:00.000Z',
    };

    const delivered = transitionLocalRedemption(
      [redemption],
      [child],
      'redemption-1',
      'deliver',
      '2026-09-20T03:00:00.000Z',
    );

    expect(delivered.redemptions[0]).toMatchObject({
      status: 'delivered',
      resolvedAt: '2026-09-20T03:00:00.000Z',
    });
    expect(delivered.profiles).toEqual([child]);
  });

});
