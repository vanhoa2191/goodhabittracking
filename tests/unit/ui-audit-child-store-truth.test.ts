import type { Dispatch, SetStateAction } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityLog, ChildBadge, ChildProfile, HabitActivity, Redemption, Reward } from '@/types';
import { childDomainCommandSchema, domainCommandSchema, type ChildDomainCommand, type DomainCommand } from '@/lib/domain/commands';
import { emptyExperienceState, type ExperienceState } from '@/lib/experience-state';
import type { requestDomainCommand } from '@/lib/store/domain-command-client';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('@/lib/sound', () => ({ sounds: {
  playClick: vi.fn(), playTaskComplete: vi.fn(), playLevelUp: vi.fn(), playRewardRedeem: vi.fn(),
} }));

import { sounds } from '@/lib/sound';
import type { ChildOperation } from '@/lib/store/habit-actions';
import { createHabitActions } from '@/lib/store/habit-actions';
import { createRewardActions } from '@/lib/store/reward-actions';

type Result = Awaited<ReturnType<typeof requestDomainCommand>>;
type Command = DomainCommand | ChildDomainCommand;
type Mode = 'cloud' | 'paired';
const child: ChildProfile = {
  id: '11111111-1111-4111-8111-111111111111', name: 'An', avatar: '🌱', themeColor: '#f97316',
  points: 40, totalEarned: 40, level: 1, streak: 0, createdAt: '2026-10-19T00:00:00.000Z',
};
const activity: HabitActivity = {
  id: '22222222-2222-4222-8222-222222222222', childId: child.id, title: 'Read', icon: '📚',
  category: 'study', points: 10, recurrenceType: 'daily', recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
  timeOfDay: 'anytime', requiresApproval: false, isActive: true, createdAt: child.createdAt,
};
const reward: Reward = {
  id: '33333333-3333-4333-8333-333333333333', title: 'Park', icon: '🌳', costPoints: 15,
  stock: 3, isActive: true, createdAt: child.createdAt,
};
const logId = '44444444-4444-4444-8444-444444444444';
const redemptionId = '55555555-5555-4555-8555-555555555555';
const date = '2026-10-19';
const user = { id: '66666666-6666-4666-8666-666666666666', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: child.createdAt };

function setter<T>(read: () => T, write: (value: T) => void): Dispatch<SetStateAction<T>> {
  return (action) => write(typeof action === 'function' ? (action as (previous: T) => T)(read()) : action);
}

function fixture(mode: Mode) {
  let profiles: ChildProfile[] = [{ ...child }];
  let logs: ActivityLog[] = [];
  let childBadges: ChildBadge[] = [];
  let redemptions: Redemption[] = [];
  let rewards: Reward[] = [{ ...reward }];
  let experience: ExperienceState = emptyExperienceState;
  const refresh = vi.fn<() => Promise<boolean>>(async () => false);
  const setCloudSyncActive = vi.fn();
  // Getters supply the latest state, as the provider does when a setter causes a render.
  let activeChildId = child.id;
  const state = {
    get activeChildId() { return activeChildId; }, activities: [activity],
    get profiles() { return profiles; }, get logs() { return logs; }, get childBadges() { return childBadges; },
    setProfiles: setter(() => profiles, (value) => { profiles = value; }),
    setLogs: setter(() => logs, (value) => { logs = value; }),
    setChildBadges: setter(() => childBadges, (value) => { childBadges = value; }),
    setExperience: setter(() => experience, (value) => { experience = value; }),
  };
  const identity = {
    currentUser: mode === 'cloud' ? user : null,
    familyId: mode === 'cloud' ? '77777777-7777-4777-8777-777777777777' : null,
    isFamilyConnected: true, refreshChildSession: refresh, syncCloudFamily: refresh, setCloudSyncActive,
  };
  let operations = { active: true, habits: new Map<string, ChildOperation>(), rewards: new Map<string, ChildOperation>() };
  const childOperations = () => operations;
  const makeHabits = () => createHabitActions({ childOperations, cloud: identity, state, isDemoSession: false,
    badges: [{ id: 'first', code: 'first', name: { en: 'First' }, description: { en: 'First practice' }, icon: '🌟', criteriaType: 'firstTask', criteriaValue: 1 }],
    analyticsSink: vi.fn(),
  });
  const makeRewards = () => createRewardActions({ childOperations, ...identity, activeChildId: child.id, isDemoSession: false,
    get profiles() { return profiles; }, get redemptions() { return redemptions; }, get rewards() { return rewards; },
    setProfiles: state.setProfiles,
    setRedemptions: setter(() => redemptions, (value) => { redemptions = value; }),
    setRewards: setter(() => rewards, (value) => { rewards = value; }),
  });
  return { habits: makeHabits(), rewardActions: makeRewards(), makeHabits, makeRewards,
    newSession() { operations.active = false; operations = { active: true, habits: new Map(), rewards: new Map() }; },
    switchChild() { operations.active = false; activeChildId = '77777777-7777-4777-8777-777777777777'; operations = { active: true, habits: new Map(), rewards: new Map() }; },
    refresh, state, read: () => ({ profiles, logs, childBadges, redemptions, rewards }) };
}

function acknowledge(result: Result): Response {
  return Response.json({ success: true, result });
}

function server(mode: Mode, respond: (command: Command) => Promise<Response>) {
  const commands: Command[] = [];
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (input, init) => {
    expect(String(input)).toBe(mode === 'cloud' ? '/api/domain/commands' : '/api/child/commands');
    expect(init?.method).toBe('POST');
    const payload: unknown = JSON.parse(String(init?.body));
    const command = mode === 'cloud' ? domainCommandSchema.parse(payload) : childDomainCommandSchema.parse(payload);
    commands.push(command);
    return respond(command);
  }));
  return commands;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('Phase04b child store truth (approved contract, before source correction)', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it.each(['cloud', 'paired'] as const)('%s: held nonapproval completion cannot invent verified credit or feedback', async (mode) => {
    const held = deferred<Response>();
    const commands = server(mode, () => held.promise);
    const f = fixture(mode);
    const saving = f.habits.toggleActivity(activity.id, date);

    expect(commands).toHaveLength(1);
    expect.soft(f.read().logs).toEqual([]);
    expect.soft(f.read().profiles).toEqual([child]);
    expect.soft(f.read().childBadges).toEqual([]);
    expect.soft(sounds.playTaskComplete).not.toHaveBeenCalled();
    expect.soft(f.refresh).not.toHaveBeenCalled();
    held.resolve(acknowledge({ status: 'completed', logId, pointsAwarded: 10 }));
    await expect(saving).resolves.toBe(true);
  });

  it.each(['cloud', 'paired'] as const)('%s: actual pending ACK overrides nonapproval metadata and grants zero verified credit', async (mode) => {
    server(mode, async () => acknowledge({ status: 'pending_approval', logId, pointsAwarded: 0 }));
    const f = fixture(mode);
    await expect(f.habits.toggleActivity(activity.id, date)).resolves.toBe(true);
    expect.soft(f.read().logs).toEqual([expect.objectContaining({ id: logId, status: 'pending_approval', pointsAwarded: 0 })]);
    expect.soft(f.read().profiles).toEqual([child]);
    expect.soft(f.read().childBadges).toEqual([]);
    expect.soft(sounds.playTaskComplete).not.toHaveBeenCalled();
    expect(f.refresh).toHaveBeenCalledTimes(1);
  });

  it.each(['cloud', 'paired'] as const)('%s: acknowledged completion and reward stay accepted when refresh returns false', async (mode) => {
    const commands = server(mode, async (command) => acknowledge(command.type === 'completeHabit'
      ? { status: 'completed', logId, pointsAwarded: 10 }
      : { status: 'pending', redemptionId }));
    const f = fixture(mode);
    await expect(f.habits.toggleActivity(activity.id, date)).resolves.toBe(true);
    await expect(f.rewardActions.claimReward(reward.id)).resolves.toBe(true);
    expect(f.refresh).toHaveBeenCalledTimes(2);
    expect(commands.map((command) => command.type)).toEqual(['completeHabit', 'redeemReward']);
    // No guessed reward debit/redemption is warranted by a failed snapshot reload.
    expect(f.read().redemptions).toEqual([]);
  });

  it.each(['cloud', 'paired'] as const)('%s: unrelated valid status and unknown wire status cannot silently succeed', async (mode) => {
    const commands = server(mode, async () => acknowledge({ status: 'adjusted' }));
    const f = fixture(mode);
    expect.soft(await f.habits.toggleActivity(activity.id, date)).toBe(false);
    expect.soft(await f.rewardActions.claimReward(reward.id)).toBe(false);
    expect.soft(f.read().profiles).toEqual([child]);
    expect.soft(f.read().logs).toEqual([]);
    expect.soft(f.read().childBadges).toEqual([]);
    expect.soft(sounds.playTaskComplete).not.toHaveBeenCalled();
    expect.soft(sounds.playRewardRedeem).not.toHaveBeenCalled();
    expect(commands).toHaveLength(2);

    // Deliberately malformed HTTP payload, not an impossible typed client mock.
    server(mode, async () => Response.json({ success: true, result: { status: 'future_unknown_status' } }));
    const unknown = fixture(mode);
    expect.soft(await unknown.habits.toggleActivity(activity.id, date)).toBe(false);
    expect.soft(await unknown.rewardActions.claimReward(reward.id)).toBe(false);
    expect.soft(unknown.read().profiles).toEqual([child]);
    expect.soft(unknown.read().logs).toEqual([]);
  });

  it.each(['cloud', 'paired'] as const)('%s: explicit retry after a committed completion loses its response cannot undo or create a new operation', async (mode) => {
    const operationIds = new Set<string>();
    const commands = server(mode, async (command) => {
      expect(command.type).toBe('completeHabit');
      if (command.type !== 'completeHabit') throw new Error('Unexpected mutation');
      operationIds.add(command.commandId);
      if (commands.length === 1) throw new TypeError('Response lost after commit');
      // SQL deduplicates completion by activity/child/date, even with a new ID.
      // It returns no logId/points on duplicate; do not invent either here.
      return acknowledge({ status: 'duplicate' });
    });
    const f = fixture(mode);
    expect(await f.habits.toggleActivity(activity.id, date)).toBe(false);
    expect(commands).toHaveLength(1); // No automatic command replay.
    await f.habits.toggleActivity(activity.id, date); // Explicit retry, reload remains unavailable.
    expect.soft(commands.map((command) => command.type)).not.toContain('undoHabit');
    expect.soft(operationIds.size).toBe(1);
    expect.soft(new Set(commands.map((command) => 'commandId' in command ? command.commandId : undefined)).size).toBe(1);
    expect.soft(f.read().profiles[0].points).toBeLessThanOrEqual(child.points + activity.points);
  });

  it.each(['cloud', 'paired'] as const)('%s: explicit retry after a committed reward loses its response cannot create a second claim', async (mode) => {
    const committed = new Set<string>();
    let serverPoints = child.points;
    const commands = server(mode, async (command) => {
      expect(command.type).toBe('redeemReward');
      if (command.type !== 'redeemReward') throw new Error('Unexpected mutation');
      const duplicate = committed.has(command.commandId);
      if (!duplicate) { committed.add(command.commandId); serverPoints -= reward.costPoints; }
      if (commands.length === 1) throw new TypeError('Response lost after commit');
      return acknowledge(duplicate ? { status: 'duplicate' } : { status: 'pending', redemptionId: command.commandId });
    });
    const f = fixture(mode);
    expect(await f.rewardActions.claimReward(reward.id)).toBe(false);
    expect(commands).toHaveLength(1);
    expect(f.read().profiles).toEqual([child]);
    await f.rewardActions.claimReward(reward.id);
    expect.soft(committed.size).toBe(1);
    expect.soft(serverPoints).toBe(child.points - reward.costPoints);
    expect.soft(new Set(commands.map((command) => 'commandId' in command ? command.commandId : undefined)).size).toBe(1);
  });
  it.each(['cloud', 'paired'] as const)('%s: operation survives factory recreation and guards same-turn calls', async (mode) => {
    const held = deferred<Response>();
    const commands = server(mode, () => held.promise);
    const f = fixture(mode);
    const saving = f.habits.toggleActivity(activity.id, date);
    expect(await f.makeHabits().toggleActivity(activity.id, date)).toBe(false);
    expect(commands).toHaveLength(1);
    held.resolve(acknowledge({ status: 'completed', logId, pointsAwarded: 3 }));
    expect(await saving).toBe(true);
    expect(f.read().logs[0]).toMatchObject({ id: logId, pointsAwarded: 3 });
    // Accepted but stale cannot expose an opposite action, even after recreation.
    expect(await f.makeHabits().toggleActivity(activity.id, date)).toBe(true);
    expect(commands).toHaveLength(1);
    expect(f.read().profiles).toEqual([child]); // balances/streak/badges need a snapshot
  });

  it.each(['cloud', 'paired'] as const)('%s: lost response reconciles completed snapshot, finishes original then permits later intentional undo', async (mode) => {
    const commands = server(mode, async (command) => {
      if (command.type === 'completeHabit') throw new TypeError('lost committed answer');
      expect(command).toEqual({ type: 'undoHabit', logId });
      return acknowledge({ status: 'undone' });
    });
    const f = fixture(mode);
    expect(await f.habits.toggleActivity(activity.id, date)).toBe(false);
    f.refresh.mockImplementation(async () => {
      f.state.setLogs([{ id: logId, childId: child.id, activityId: activity.id, date,
        status: 'completed', pointsAwarded: 7, completedAt: child.createdAt }]);
      return true;
    });
    const recreated = f.makeHabits();
    expect(await recreated.toggleActivity(activity.id, date)).toBe(true);
    expect(commands).toHaveLength(1);
    expect(recreated.getToggleOutcome(activity.id, date)).toMatchObject({ status: 'completed', pointsAwarded: 7 });
    expect(await f.makeHabits().toggleActivity(activity.id, date)).toBe(true);
    expect(commands.map((c) => c.type)).toEqual(['completeHabit', 'undoHabit']);
  });

  it.each(['cloud', 'paired'] as const)('%s: uncertain reward retains identity across recreation, then a separate intentional claim uses a fresh ID', async (mode) => {
    const commands = server(mode, async (command) => {
      expect(command.type).toBe('redeemReward');
      if (commands.length === 1) throw new TypeError('lost committed answer');
      return acknowledge({ status: 'pending', redemptionId: 'commandId' in command ? command.commandId : redemptionId });
    });
    const f = fixture(mode);
    expect(await f.rewardActions.claimReward(reward.id)).toBe(false);
    // No snapshot available: retain the original identity and do not replay blindly.
    expect(await f.makeRewards().claimReward(reward.id)).toBe(false);
    expect(new Set(commands.map((c) => 'commandId' in c ? c.commandId : '')).size).toBe(1);
    const first = commands[0];
    if (!('commandId' in first)) throw new Error('expected claim identity');
    f.refresh.mockImplementation(async () => {
      // Snapshot identifies the original SQL redemption by its actual command ID.
      const set = f.read().redemptions;
      if (!set.length) set.push({ id: first.commandId, childId: child.id, rewardId: reward.id,
        status: 'pending', pointsSpent: 15, requestedAt: child.createdAt });
      return true;
    });
    expect(await f.makeRewards().claimReward(reward.id)).toBe(true);
    expect(commands).toHaveLength(1);
    expect(await f.makeRewards().claimReward(reward.id)).toBe(true);
    expect(commands).toHaveLength(2);
    expect('commandId' in commands[1] && commands[1].commandId).not.toBe(first.commandId);
  });

  it.each(['cloud', 'paired'] as const)('%s: a new session isolates uncertain IDs and discards old in-flight feedback/state', async (mode) => {
    const held = deferred<Response>();
    const commands = server(mode, () => held.promise);
    const f = fixture(mode);
    const saving = f.habits.toggleActivity(activity.id, date);
    f.newSession();
    held.resolve(acknowledge({ status: 'completed', logId, pointsAwarded: 10 }));
    expect(await saving).toBe(false);
    expect(f.read().logs).toEqual([]);
    expect(f.refresh).not.toHaveBeenCalled();
    server(mode, async () => acknowledge({ status: 'pending_approval', logId, pointsAwarded: 0 }));
    expect(await f.makeHabits().toggleActivity(activity.id, date)).toBe(true);
    expect(commands).toHaveLength(1);
    expect(f.makeHabits().getToggleOutcome(activity.id, date)).toMatchObject({ status: 'pending_approval' });
    const other = fixture(mode);
    expect(other.makeHabits().getToggleOutcome(activity.id, date)).toBeNull();
  });

  it.each(['cloud', 'paired'] as const)('%s: switching the active child fences a held old-child response', async (mode) => {
    const held = deferred<Response>();
    const commands = server(mode, () => held.promise);
    const f = fixture(mode);
    const saving = f.habits.toggleActivity(activity.id, date);
    expect(commands).toHaveLength(1);
    f.switchChild();
    held.resolve(acknowledge({ status: 'completed', logId, pointsAwarded: 10 }));
    await expect(saving).resolves.toBe(false);
    expect(f.read().logs).toEqual([]);
    expect(f.refresh).not.toHaveBeenCalled();
    expect(f.makeHabits().getToggleOutcome(activity.id, date)).toBeNull();
  });

});
