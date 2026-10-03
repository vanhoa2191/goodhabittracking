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

import { createHabitActions, getLastToggleFailure } from '@/lib/store/habit-actions';

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
  sessionType: 'demo' | 'cloud',
  currentUser = null as typeof user | null,
  isFamilyConnected = false,
  initialLogs: ActivityLog[] = [],
) {
  const analyticsSink = vi.fn();
  let profiles = [child];
  let logs: ActivityLog[] = initialLogs;
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
    isDemoSession: sessionType === 'demo',
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
    const fixture = createState('demo');

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
    const fixture = createState('demo');
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
    expect(getLastToggleFailure()).toBe('no-session');
    expect(fixture.read()).toEqual({ profiles: [child], logs: [], childBadges: [] });
    expect(requestDomainCommand).not.toHaveBeenCalled();
    expect(fixture.setCloudSyncActive).toHaveBeenCalledWith(false);
    expect(fixture.analyticsSink).not.toHaveBeenCalled();
  });

  it('shows a cloud completion at once and lets the server reload settle it afterwards', async () => {
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
    expect(fixture.read().logs).toEqual([
      expect.objectContaining({ activityId: activity.id, status: 'completed', pointsAwarded: 20 }),
    ]);
    expect(fixture.read().profiles[0]?.points).toBe(20);
    expect(fixture.analyticsSink).toHaveBeenCalledWith({ event: 'task_ticked', action: 'completed', mode: 'cloud' });
  });

  it('reports an undo that would take back spent points as not saved', async () => {
    // Given
    requestDomainCommand.mockResolvedValue({ status: 'points_already_spent' });
    const fixture = createState('cloud', user, false, [{ id: 'log-1', activityId: activity.id, childId: child.id, date: '2026-09-20', status: 'completed', pointsAwarded: 20, completedAt: '2026-09-20T10:00:00.000Z' }]);

    // When
    const saved = await fixture.actions.toggleActivity(activity.id, '2026-09-20');

    // Then
    expect(saved).toBe(false);
    expect(fixture.analyticsSink).not.toHaveBeenCalled();
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
    expect(getLastToggleFailure()).toBe('error-Error');
    expect(fixture.read().logs).toEqual([]);
    expect(fixture.setCloudSyncActive).toHaveBeenCalledWith(false);
    expect(fixture.analyticsSink).not.toHaveBeenCalled();
  });

  it('names the failing step with a short code the child screen can show', async () => {
    const withStatus = (status: number) => Object.assign(new Error('refused'), { status });
    requestDomainCommand.mockRejectedValueOnce(withStatus(401));
    const unauthorised = createState('cloud', user);
    await unauthorised.actions.toggleActivity(activity.id, '2026-09-20');
    expect(getLastToggleFailure()).toBe('request-401');

    // A reload that fails after the server saved the tick does not turn the tick into a failure.
    requestDomainCommand.mockResolvedValueOnce({ status: 'completed' });
    const notSynced = createState('cloud', user);
    notSynced.syncCloudFamily.mockResolvedValueOnce(false);
    await expect(notSynced.actions.toggleActivity(activity.id, '2026-09-20')).resolves.toBe(true);
    expect(getLastToggleFailure()).toBeNull();

    requestDomainCommand.mockResolvedValueOnce({ status: 'completed' });
    const worked = createState('cloud', user);
    await expect(worked.actions.toggleActivity(activity.id, '2026-09-20')).resolves.toBe(true);
    expect(getLastToggleFailure()).toBeNull();

    const missing = createState('demo');
    await missing.actions.toggleActivity('not-an-activity', '2026-09-20');
    expect(getLastToggleFailure()).toBe('no-activity');
  });

  it('puts the card on screen before the server answers and rolls it back when the server refuses', async () => {
    let refuse: (reason: Error) => void = () => undefined;
    requestDomainCommand.mockReturnValue(new Promise((_, reject) => { refuse = reject; }));
    const fixture = createState('cloud', user);

    const pending = fixture.actions.toggleActivity(activity.id, '2026-09-20');
    expect(fixture.read().logs).toHaveLength(1);
    expect(fixture.read().profiles[0]?.points).toBe(20);

    refuse(Object.assign(new Error('refused'), { status: 409 }));
    expect(await pending).toBe(false);
    expect(fixture.read()).toEqual({ profiles: [child], logs: [], childBadges: [] });
    expect(fixture.syncCloudFamily).not.toHaveBeenCalled();
  });

  it('restores the card when an undo would take back spent points', async () => {
    const log: ActivityLog = { id: 'log-1', activityId: activity.id, childId: child.id, date: '2026-09-20', status: 'completed', pointsAwarded: 20, completedAt: '2026-09-20T10:00:00.000Z' };
    requestDomainCommand.mockResolvedValue({ status: 'points_already_spent' });
    const fixture = createState('cloud', user, false, [log]);

    expect(await fixture.actions.toggleActivity(activity.id, '2026-09-20')).toBe(false);
    expect(fixture.read().logs).toEqual([log]);
  });

  it.each([
    ['not_reversible', 'not-reversible'],
    ['not_found', 'not-found'],
    ['something_new', 'status-something-new'],
  ])('restores the card and reports %s when the server refuses an undo', async (status, code) => {
    const log: ActivityLog = { id: 'log-1', activityId: activity.id, childId: child.id, date: '2026-09-20', status: 'completed', pointsAwarded: 20, completedAt: '2026-09-20T10:00:00.000Z' };
    requestDomainCommand.mockResolvedValue({ status });
    const fixture = createState('cloud', user, false, [log]);

    expect(await fixture.actions.toggleActivity(activity.id, '2026-09-20')).toBe(false);
    expect(getLastToggleFailure()).toBe(code);
    expect(fixture.read().logs).toEqual([log]);
    expect(fixture.read().profiles).toEqual([child]);
    expect(fixture.analyticsSink).not.toHaveBeenCalled();
    expect(fixture.syncCloudFamily).toHaveBeenCalledWith(user);
  });

  it('restores the card when the scoped child command refuses an undo', async () => {
    const log: ActivityLog = { id: 'log-1', activityId: activity.id, childId: child.id, date: '2026-09-20', status: 'completed', pointsAwarded: 20, completedAt: '2026-09-20T10:00:00.000Z' };
    requestChildDomainCommand.mockResolvedValue({ status: 'not_reversible' });
    const fixture = createState('cloud', null, true, [log]);

    expect(await fixture.actions.toggleActivity(activity.id, '2026-09-20')).toBe(false);
    expect(getLastToggleFailure()).toBe('not-reversible');
    expect(fixture.read().logs).toEqual([log]);
    expect(fixture.refreshChildSession).toHaveBeenCalledOnce();
  });

  it('gives the optimistic log the id the server created so an immediate undo can find it', async () => {
    const serverId = '33333333-3333-4333-8333-333333333333';
    requestDomainCommand.mockResolvedValue({ status: 'completed', logId: serverId });
    const fixture = createState('cloud', user);

    await fixture.actions.toggleActivity(activity.id, '2026-09-20');
    expect(fixture.read().logs.map((log) => log.id)).toEqual([serverId]);
  });

  it('runs one family reload at a time and one follow-up for the taps made meanwhile', async () => {
    requestDomainCommand.mockResolvedValue({ status: 'completed' });
    const fixture = createState('cloud', user);
    let finish: (ok: boolean) => void = () => undefined;
    fixture.syncCloudFamily.mockReturnValueOnce(new Promise<boolean>((resolve) => { finish = resolve; }));

    await fixture.actions.toggleActivity(activity.id, '2026-09-20');
    await fixture.actions.toggleActivity(activity.id, '2026-09-21');
    await fixture.actions.toggleActivity(activity.id, '2026-09-22');
    expect(fixture.syncCloudFamily).toHaveBeenCalledTimes(1);

    finish(true);
    await vi.waitFor(() => expect(fixture.syncCloudFamily).toHaveBeenCalledTimes(2));
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
    const approveFixture = createState('demo');
    approveFixture.read().logs.push(pending);
    approveFixture.actions.approveLog(pending.id);
    expect(approveFixture.read().logs[0]).toEqual(expect.objectContaining({
      status: 'approved',
      pointsAwarded: activity.points,
    }));
    expect(approveFixture.read().profiles[0]?.points).toBe(activity.points);
    expect(approveFixture.analyticsSink).toHaveBeenCalledWith({ event: 'habit_reviewed', decision: 'approved', approvalLag: 'over_1d', mode: 'local' });

    const rejectFixture = createState('demo');
    rejectFixture.read().logs.push(pending);
    rejectFixture.actions.rejectLog(pending.id);
    expect(rejectFixture.read().logs[0]).toEqual(expect.objectContaining({
      status: 'rejected',
      pointsAwarded: 0,
    }));
    expect(rejectFixture.analyticsSink).toHaveBeenCalledWith({ event: 'habit_reviewed', decision: 'rejected', approvalLag: 'over_1d', mode: 'local' });
  });
  describe('reviewing several logs at once', () => {
    const pendingLog = (id: string): ActivityLog => ({
      id,
      activityId: activity.id,
      childId: child.id,
      date: '2026-09-20',
      status: 'pending_approval',
      pointsAwarded: 0,
      completedAt: '2026-09-20T01:00:00.000Z',
    });

    it('approves every waiting local log once and credits the stars once each', async () => {
      const fixture = createState('demo');
      fixture.read().logs.push(pendingLog('log-1'), pendingLog('log-2'));

      const outcome = await fixture.actions.reviewLogs(['log-1', 'log-2', 'log-1'], 'approve');

      expect(outcome).toEqual({ approved: 2, rejected: 0, skipped: 0 });
      expect(fixture.read().logs.map((log) => log.status)).toEqual(['approved', 'approved']);
      expect(fixture.read().profiles[0]?.points).toBe(activity.points * 2);
    });

    it('skips local logs that are no longer waiting', async () => {
      const fixture = createState('demo');
      fixture.read().logs.push({ ...pendingLog('log-1'), status: 'approved', pointsAwarded: activity.points });

      const outcome = await fixture.actions.reviewLogs(['log-1'], 'approve');

      expect(outcome).toEqual({ approved: 0, rejected: 0, skipped: 1 });
      expect(fixture.read().profiles[0]?.points).toBe(0);
    });

    it('rejects local logs without awarding stars', async () => {
      const fixture = createState('demo');
      fixture.read().logs.push(pendingLog('log-1'));

      const outcome = await fixture.actions.reviewLogs(['log-1'], 'reject');

      expect(outcome).toEqual({ approved: 0, rejected: 1, skipped: 0 });
      expect(fixture.read().logs[0]).toEqual(expect.objectContaining({ status: 'rejected', pointsAwarded: 0 }));
    });

    it('sends one batch command in a cloud family and counts each log outcome', async () => {
      requestDomainCommand.mockResolvedValue({
        status: 'reviewed',
        results: [
          { logId: 'log-1', status: 'approved', pointsAwarded: 20 },
          { logId: 'log-2', status: 'already_reviewed' },
          { logId: 'log-3', status: 'not_found' },
        ],
      });
      const fixture = createState('cloud', user, true);

      const outcome = await fixture.actions.reviewLogs(['log-1', 'log-2', 'log-3'], 'approve');

      expect(requestDomainCommand).toHaveBeenCalledTimes(1);
      expect(requestDomainCommand).toHaveBeenCalledWith({ type: 'reviewHabits', logIds: ['log-1', 'log-2', 'log-3'], decision: 'approve' });
      expect(outcome).toEqual({ approved: 1, rejected: 0, skipped: 2 });
      expect(fixture.syncCloudFamily).toHaveBeenCalledTimes(1);
    });

    it('returns null and reloads nothing when the server refuses the batch', async () => {
      requestDomainCommand.mockRejectedValue(new Error('locked'));
      const fixture = createState('cloud', user, true);

      await expect(fixture.actions.reviewLogs(['log-1'], 'approve')).resolves.toBeNull();
      expect(fixture.syncCloudFamily).not.toHaveBeenCalled();
    });

    it('never sends more than the batch limit', async () => {
      requestDomainCommand.mockResolvedValue({ status: 'reviewed', results: [] });
      const fixture = createState('cloud', user, true);
      const ids = Array.from({ length: 60 }, (_, index) => `log-${index}`);

      await fixture.actions.reviewLogs(ids, 'approve');

      const sent = requestDomainCommand.mock.calls[0]?.[0] as { logIds: string[] };
      expect(sent.logIds).toHaveLength(50);
    });
  });
});
