import type { Dispatch, SetStateAction } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityLog, ChildBadge, ChildProfile, HabitActivity } from '@/types';

const requestDomainCommand = vi.hoisted(() => vi.fn());
vi.mock('@/lib/store/domain-command-client', () => ({ requestDomainCommand }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('@/lib/sound', () => ({
  sounds: {
    playClick: vi.fn(),
    playLevelUp: vi.fn(),
    playTaskComplete: vi.fn(),
  },
}));

import { createHabitActions } from '@/lib/store/habit-actions';

const child: ChildProfile = {
  id: 'child-1',
  name: 'Bé An',
  avatar: '🦁',
  themeColor: '#f97316',
  points: 0,
  totalEarned: 0,
  level: 1,
  streak: 0,
  createdAt: '2026-09-20T00:00:00.000Z',
};

const activity: HabitActivity = {
  id: 'activity-1',
  childId: child.id,
  title: 'Đọc sách',
  description: 'Đọc 15 phút',
  icon: '📚',
  category: 'study',
  points: 20,
  recurrenceType: 'daily',
  recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
  timeOfDay: 'evening',
  durationMinutes: 15,
  requiresApproval: false,
  isActive: true,
  createdAt: '2026-09-20T00:00:00.000Z',
};

const user = {
  id: 'user-1',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-09-20T00:00:00.000Z',
};

function stateSetter<T>(read: () => T[], write: (value: T[]) => void): Dispatch<SetStateAction<T[]>> {
  return (action) => write(typeof action === 'function' ? action(read()) : action);
}

function createState(storageMode: 'local' | 'cloud', currentUser = null as typeof user | null) {
  let profiles = [child];
  let logs: ActivityLog[] = [];
  let childBadges: ChildBadge[] = [];
  const setCloudSyncActive = vi.fn();
  const syncCloudFamily = vi.fn(async () => true);
  const actions = createHabitActions({
    cloud: {
      currentUser,
      familyId: currentUser ? 'family-1' : null,
      setCloudSyncActive,
      syncCloudFamily,
    },
    state: {
      activeChildId: child.id,
      activities: [activity],
      profiles,
      logs,
      childBadges,
      setProfiles: stateSetter(() => profiles, (value) => { profiles = value; }),
      setLogs: stateSetter(() => logs, (value) => { logs = value; }),
      setChildBadges: stateSetter(() => childBadges, (value) => { childBadges = value; }),
    },
    storageMode,
  });
  return {
    actions,
    read: () => ({ profiles, logs, childBadges }),
    setCloudSyncActive,
    syncCloudFamily,
  };
}

describe('habit actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('completes a local habit and awards points', async () => {
    const fixture = createState('local');

    await fixture.actions.toggleActivity(activity.id, '2026-09-20');

    expect(fixture.read().logs).toEqual([
      expect.objectContaining({ activityId: activity.id, status: 'completed', pointsAwarded: 20 }),
    ]);
    expect(fixture.read().profiles[0]?.points).toBe(20);
    expect(requestDomainCommand).not.toHaveBeenCalled();
  });

  it('never falls back to local state when cloud authentication is missing', async () => {
    const fixture = createState('cloud');

    await fixture.actions.toggleActivity(activity.id, '2026-09-20');
    fixture.actions.approveLog('log-1');
    fixture.actions.rejectLog('log-1');

    expect(fixture.read()).toEqual({ profiles: [child], logs: [], childBadges: [] });
    expect(requestDomainCommand).not.toHaveBeenCalled();
    expect(fixture.setCloudSyncActive).toHaveBeenCalledWith(false);
  });

  it('persists a cloud completion before authoritative sync without optimistic local state', async () => {
    requestDomainCommand.mockResolvedValue({ status: 'completed' });
    const fixture = createState('cloud', user);

    await fixture.actions.toggleActivity(activity.id, '2026-09-20');

    expect(requestDomainCommand).toHaveBeenCalledWith(expect.objectContaining({
      type: 'completeHabit',
      activityId: activity.id,
      childId: child.id,
      date: '2026-09-20',
    }));
    expect(fixture.syncCloudFamily).toHaveBeenCalledWith(user);
    expect(fixture.read()).toEqual({ profiles: [child], logs: [], childBadges: [] });
  });

  it('approves and rejects local pending logs through guarded transitions', () => {
    const pending: ActivityLog = {
      id: 'log-1',
      activityId: activity.id,
      childId: child.id,
      date: '2026-09-20',
      status: 'pending_approval',
      pointsAwarded: 0,
      completedAt: '2026-09-20T01:00:00.000Z',
    };
    const approveFixture = createState('local');
    approveFixture.read().logs.push(pending);
    approveFixture.actions.approveLog(pending.id);
    expect(approveFixture.read().logs[0]).toEqual(expect.objectContaining({
      status: 'approved',
      pointsAwarded: activity.points,
    }));
    expect(approveFixture.read().profiles[0]?.points).toBe(activity.points);

    const rejectFixture = createState('local');
    rejectFixture.read().logs.push(pending);
    rejectFixture.actions.rejectLog(pending.id);
    expect(rejectFixture.read().logs[0]).toEqual(expect.objectContaining({
      status: 'rejected',
      pointsAwarded: 0,
    }));
  });
});
