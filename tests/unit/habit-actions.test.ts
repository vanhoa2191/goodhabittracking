import type { Dispatch, SetStateAction } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityLog, ChildBadge, ChildProfile, HabitActivity } from '@/types';
import { emptyExperienceState } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';

const { requestChildDomainCommand, requestDomainCommand } = vi.hoisted(() => ({
  requestChildDomainCommand: vi.fn(),
  requestDomainCommand: vi.fn(),
}));
vi.mock('@/lib/store/domain-command-client', () => ({
  requestChildDomainCommand,
  requestDomainCommand,
}));
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

function createState(
  storageMode: 'local' | 'cloud',
  currentUser = null as typeof user | null,
  isFamilyConnected = false,
) {
  const analyticsSink = vi.fn();
  let profiles = [child];
  let logs: ActivityLog[] = [];
  let childBadges: ChildBadge[] = [];
  let experience: ExperienceState = emptyExperienceState;
  const setCloudSyncActive = vi.fn();
  const syncCloudFamily = vi.fn(async () => true);
  const refreshChildSession = vi.fn(async () => true);
  const actions = createHabitActions({
    cloud: {
      currentUser,
      familyId: currentUser ? 'family-1' : null,
      isFamilyConnected,
      refreshChildSession,
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
      setExperience: (action) => { experience = typeof action === 'function' ? action(experience) : action; },
    },
    storageMode,
    analyticsSink,
  });
  return {
    actions,
    read: () => ({ profiles, logs, childBadges }),
    readExperience: () => experience,
    setExperience: (value: ExperienceState) => { experience = value; },
    setCloudSyncActive,
    refreshChildSession,
    syncCloudFamily,
    analyticsSink,
  };
}

describe('habit actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('completes a local habit and awards points', async () => {
    // Given
    const fixture = createState('local');

    // When
    const saved = await fixture.actions.toggleActivity(activity.id, '2026-09-20');

    // Then
    expect(saved).toBe(true);
    expect(fixture.read().logs).toEqual([
      expect.objectContaining({ activityId: activity.id, status: 'completed', pointsAwarded: 20 }),
    ]);
    expect(fixture.read().profiles[0]?.points).toBe(20);
    expect(requestDomainCommand).not.toHaveBeenCalled();
    expect(fixture.analyticsSink).toHaveBeenCalledWith({ event: 'task_ticked', action: 'completed', mode: 'local' });
  });

  it('clears a local deferral when the task is completed so undo does not restore it', async () => {
    const fixture = createState('local');
    fixture.setExperience({
      ...emptyExperienceState,
      deferredTasks: [{
        family_id: '11111111-1111-4111-8111-111111111111',
        child_id: child.id,
        activity_id: activity.id,
        local_date: '2026-09-20',
        deferred_at: '2026-09-20T00:00:00.000Z',
      }],
    });

    expect(await fixture.actions.toggleActivity(activity.id, '2026-09-20')).toBe(true);
    expect(fixture.readExperience().deferredTasks).toEqual([]);
  });

  it('never falls back to local state when cloud authentication is missing', async () => {
    // Given
    const fixture = createState('cloud');

    // When
    const saved = await fixture.actions.toggleActivity(activity.id, '2026-09-20');
    fixture.actions.approveLog('log-1');
    fixture.actions.rejectLog('log-1');

    // Then
    expect(saved).toBe(false);
    expect(fixture.read()).toEqual({ profiles: [child], logs: [], childBadges: [] });
    expect(requestDomainCommand).not.toHaveBeenCalled();
    expect(fixture.setCloudSyncActive).toHaveBeenCalledWith(false);
    expect(fixture.analyticsSink).not.toHaveBeenCalled();
  });

  it('persists a cloud completion before authoritative sync without optimistic local state', async () => {
    // Given
    requestDomainCommand.mockResolvedValue({ status: 'completed' });
    const fixture = createState('cloud', user);

    // When
    const saved = await fixture.actions.toggleActivity(activity.id, '2026-09-20');

    // Then
    expect(saved).toBe(true);
    expect(requestDomainCommand).toHaveBeenCalledWith(expect.objectContaining({
      type: 'completeHabit',
      activityId: activity.id,
      childId: child.id,
      date: '2026-09-20',
    }));
    expect(fixture.syncCloudFamily).toHaveBeenCalledWith(user);
    expect(fixture.read()).toEqual({ profiles: [child], logs: [], childBadges: [] });
    expect(fixture.analyticsSink).toHaveBeenCalledWith({ event: 'task_ticked', action: 'completed', mode: 'cloud' });
  });

  it('uses the scoped child command and refreshes the paired session', async () => {
    // Given
    requestChildDomainCommand.mockResolvedValue({ status: 'pending_approval' });
    const fixture = createState('cloud', null, true);

    // When
    const saved = await fixture.actions.toggleActivity(activity.id, '2026-09-20');

    // Then
    expect(saved).toBe(true);
    expect(requestChildDomainCommand).toHaveBeenCalledWith(expect.objectContaining({
      type: 'completeHabit',
      activityId: activity.id,
      date: '2026-09-20',
    }));
    expect(fixture.refreshChildSession).toHaveBeenCalledOnce();
    expect(requestDomainCommand).not.toHaveBeenCalled();
  });

  it('reports a failed cloud completion so the card can roll back', async () => {
    // Given
    requestDomainCommand.mockRejectedValue(new Error('offline'));
    const fixture = createState('cloud', user);

    // When
    const saved = await fixture.actions.toggleActivity(activity.id, '2026-09-20');

    // Then
    expect(saved).toBe(false);
    expect(fixture.read().logs).toEqual([]);
    expect(fixture.setCloudSyncActive).toHaveBeenCalledWith(false);
    expect(fixture.analyticsSink).not.toHaveBeenCalled();
  });

  it('does not count a duplicate cloud command as a completed task', async () => {
    requestDomainCommand.mockResolvedValue({ status: 'duplicate' });
    const fixture = createState('cloud', user);

    expect(await fixture.actions.toggleActivity(activity.id, '2026-09-20')).toBe(true);
    expect(fixture.analyticsSink).not.toHaveBeenCalled();
  });

  it('records a cloud approval only after the server confirms and sync succeeds', async () => {
    const pending: ActivityLog = {
      id: 'log-1', activityId: activity.id, childId: child.id,
      date: '2026-09-20', status: 'pending_approval', pointsAwarded: 0,
      completedAt: '2026-09-20T01:00:00.000Z',
    };
    requestDomainCommand.mockResolvedValue({ status: 'approved' });
    const fixture = createState('cloud', user);
    fixture.read().logs.push(pending);

    fixture.actions.approveLog(pending.id);

    await vi.waitFor(() => expect(fixture.analyticsSink).toHaveBeenCalledWith({
      event: 'habit_reviewed', decision: 'approved', approvalLag: 'over_1d', mode: 'cloud',
    }));
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
    expect(approveFixture.analyticsSink).toHaveBeenCalledWith({ event: 'habit_reviewed', decision: 'approved', approvalLag: 'over_1d', mode: 'local' });

    const rejectFixture = createState('local');
    rejectFixture.read().logs.push(pending);
    rejectFixture.actions.rejectLog(pending.id);
    expect(rejectFixture.read().logs[0]).toEqual(expect.objectContaining({
      status: 'rejected',
      pointsAwarded: 0,
    }));
    expect(rejectFixture.analyticsSink).toHaveBeenCalledWith({ event: 'habit_reviewed', decision: 'rejected', approvalLag: 'over_1d', mode: 'local' });
  });
});
