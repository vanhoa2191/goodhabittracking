import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChildProfile, Redemption, Reward } from '@/types';

const { requestChildDomainCommand, requestDomainCommand } = vi.hoisted(() => ({
  requestChildDomainCommand: vi.fn(), requestDomainCommand: vi.fn(),
}));
const requestRewardMutation = vi.hoisted(() => vi.fn());
vi.mock('@/lib/store/domain-command-client', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/store/domain-command-client')>(),
  requestChildDomainCommand, requestDomainCommand,
}));
import { DomainCommandRequestError } from '@/lib/store/domain-command-client';
vi.mock('@/lib/store/reward-mutation-client', () => ({ requestRewardMutation }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('@/lib/sound', () => ({
  sounds: {
    playClick: vi.fn(),
    playLevelUp: vi.fn(),
    playRewardRedeem: vi.fn(),
  },
}));

import { createRewardActions } from '@/lib/store/reward-actions';

const child: ChildProfile = {
  id: 'child-1',
  name: 'Bé An',
  avatar: '🦁',
  themeColor: '#f97316',
  points: 50,
  totalEarned: 150,
  level: 2,
  streak: 3,
  createdAt: '2026-09-20T00:00:00.000Z',
};

const reward: Reward = {
  id: 'reward-1',
  title: 'Đi công viên',
  icon: '🌳',
  costPoints: 30,
  stock: 1,
  isActive: true,
  createdAt: '2026-09-20T00:00:00.000Z',
};

const pendingRedemption: Redemption = {
  id: 'redemption-1',
  rewardId: reward.id,
  childId: child.id,
  pointsSpent: reward.costPoints,
  status: 'pending',
  requestedAt: '2026-09-20T01:00:00.000Z',
};

function stateSetter<T>(read: () => T[], write: (value: T[]) => void): Dispatch<SetStateAction<T[]>> {
  return (action) => write(typeof action === 'function' ? action(read()) : action);
}

describe('reward actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    { stock: 0, points: 50, success: false, remaining: 0 },
    { stock: 1, points: 50, success: true, remaining: 0 },
    { stock: 3, points: 50, success: true, remaining: 2 },
    { stock: -1, points: 50, success: true, remaining: -1 },
    { stock: -2, points: 50, success: true, remaining: -2 },
    { stock: 3, points: 10, success: false, remaining: 3 },
  ])('enforces demo stock $stock with $points points', async ({ stock, points, success, remaining }) => {
    let profiles = [{ ...child, points }];
    let redemptions: Redemption[] = [];
    let rewards = [{ ...reward, stock }];
    const actions = createRewardActions({
      activeChildId: child.id, currentUser: null, familyId: null,
      isFamilyConnected: false, isDemoSession: true,
      profiles, redemptions, rewards,
      setCloudSyncActive: vi.fn(),
      setProfiles: stateSetter(() => profiles, (value) => { profiles = value; }),
      setRedemptions: stateSetter(() => redemptions, (value) => { redemptions = value; }),
      setRewards: stateSetter(() => rewards, (value) => { rewards = value; }),
      refreshChildSession: vi.fn(async () => true),
      syncCloudFamily: vi.fn(async () => true),
    });

    await expect(actions.claimReward(reward.id)).resolves.toBe(success);
    expect(rewards[0].stock).toBe(remaining);
    expect(profiles[0].points).toBe(success ? points - reward.costPoints : points);
    expect(redemptions).toHaveLength(success ? 1 : 0);
    expect(requestDomainCommand).not.toHaveBeenCalled();
    expect(requestChildDomainCommand).not.toHaveBeenCalled();
  });

  it.each(['pending', 'approved'] as const)('refunds an undelivered %s demo request when its reward is deleted', async (status) => {
    let profiles = [child];
    let redemptions: Redemption[] = [{ ...pendingRedemption, status }];
    let rewards = [reward];
    const actions = createRewardActions({
      activeChildId: child.id, currentUser: null, familyId: null,
      isFamilyConnected: false, isDemoSession: true,
      profiles, redemptions, rewards, setCloudSyncActive: vi.fn(),
      setProfiles: stateSetter(() => profiles, (value) => { profiles = value; }),
      setRedemptions: stateSetter(() => redemptions, (value) => { redemptions = value; }),
      setRewards: stateSetter(() => rewards, (value) => { rewards = value; }),
      refreshChildSession: vi.fn(async () => true), syncCloudFamily: vi.fn(async () => true),
    });
    await expect(actions.deleteReward(reward.id)).resolves.toBe(true);
    expect(profiles[0].points).toBe(child.points + reward.costPoints);
    expect(profiles[0].totalEarned).toBe(child.totalEarned);
    expect(redemptions).toHaveLength(0);
    expect(rewards).toHaveLength(0);
  });

  it.each([0, -1])('restores demo stock on rejection only for finite stock %s', (stock) => {
    let profiles = [child];
    let redemptions: Redemption[] = [pendingRedemption];
    let rewards = [{ ...reward, stock }];
    const actions = createRewardActions({
      activeChildId: child.id, currentUser: null, familyId: null,
      isFamilyConnected: false, isDemoSession: true,
      profiles, redemptions, rewards, setCloudSyncActive: vi.fn(),
      setProfiles: stateSetter(() => profiles, (value) => { profiles = value; }),
      setRedemptions: stateSetter(() => redemptions, (value) => { redemptions = value; }),
      setRewards: stateSetter(() => rewards, (value) => { rewards = value; }),
      refreshChildSession: vi.fn(async () => true), syncCloudFamily: vi.fn(async () => true),
    });
    actions.rejectRedemption(pendingRedemption.id);
    expect(rewards[0].stock).toBe(stock >= 0 ? stock + 1 : stock);
    expect(profiles[0].points).toBe(child.points + reward.costPoints);
  });

  it('claims a local reward with one points and redemption transition', async () => {
    let profiles = [child];
    let redemptions: Redemption[] = [];
    const actions = createRewardActions({
      activeChildId: child.id,
      currentUser: null,
      familyId: null,
      isFamilyConnected: false,
      profiles,
      redemptions,
      rewards: [reward],
      setCloudSyncActive: vi.fn(),
      setProfiles: stateSetter(() => profiles, (value) => { profiles = value; }),
      setRedemptions: stateSetter(() => redemptions, (value) => { redemptions = value; }),
      setRewards: vi.fn(),
      isDemoSession: true,
      refreshChildSession: vi.fn(async () => true),
      syncCloudFamily: vi.fn(async () => true),
    });

    await expect(actions.claimReward(reward.id)).resolves.toBe(true);
    expect(profiles[0]?.points).toBe(20);
    expect(redemptions).toEqual([
      expect.objectContaining({ rewardId: reward.id, childId: child.id, status: 'pending' }),
    ]);
    expect(requestDomainCommand).not.toHaveBeenCalled();
  });

  it('approves then delivers a pending cloud redemption before authoritative sync', async () => {
    requestDomainCommand
      .mockResolvedValueOnce({ status: 'approved' })
      .mockResolvedValueOnce({ status: 'delivered' });
    const syncCloudFamily = vi.fn(async () => true);
    const actions = createRewardActions({
      activeChildId: child.id,
      currentUser: {
        id: 'user-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated',
        created_at: '2026-09-20T00:00:00.000Z',
      },
      familyId: 'family-1',
      isFamilyConnected: false,
      profiles: [child],
      redemptions: [pendingRedemption],
      rewards: [reward],
      setCloudSyncActive: vi.fn(),
      setProfiles: vi.fn(),
      setRedemptions: vi.fn(),
      setRewards: vi.fn(),
      isDemoSession: false,
      refreshChildSession: vi.fn(async () => true),
      syncCloudFamily,
    });

    await actions.deliverRedemption(pendingRedemption.id);

    await vi.waitFor(() => expect(syncCloudFamily).toHaveBeenCalledTimes(1));
    expect(requestDomainCommand.mock.calls.map(([command]) => command)).toEqual([
      { type: 'transitionRedemption', redemptionId: pendingRedemption.id, decision: 'approve' },
      { type: 'transitionRedemption', redemptionId: pendingRedemption.id, decision: 'deliver' },
    ]);
  });

  it('does not mutate local points when cloud mode has no authenticated user', async () => {
    let profiles = [child];
    let redemptions: Redemption[] = [];
    const setCloudSyncActive = vi.fn();
    const actions = createRewardActions({
      activeChildId: child.id,
      currentUser: null,
      familyId: null,
      isFamilyConnected: false,
      profiles,
      redemptions,
      rewards: [reward],
      setCloudSyncActive,
      setProfiles: stateSetter(() => profiles, (value) => { profiles = value; }),
      setRedemptions: stateSetter(() => redemptions, (value) => { redemptions = value; }),
      setRewards: vi.fn(),
      isDemoSession: false,
      refreshChildSession: vi.fn(async () => true),
      syncCloudFamily: vi.fn(async () => true),
    });

    await expect(actions.claimReward(reward.id)).resolves.toBe(false);
    expect(profiles).toEqual([child]);
    expect(redemptions).toEqual([]);
    expect(setCloudSyncActive).toHaveBeenCalledWith(false);
  });

  it('persists cloud reward creation before authoritative sync without optimistic state', async () => {
    requestRewardMutation.mockResolvedValue({ rewardId: reward.id });
    const setRewards = vi.fn();
    const syncCloudFamily = vi.fn(async () => true);
    const actions = createRewardActions({
      activeChildId: child.id,
      currentUser: {
        id: 'user-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated',
        created_at: '2026-09-20T00:00:00.000Z',
      },
      familyId: 'family-1',
      isFamilyConnected: false,
      profiles: [child],
      redemptions: [],
      rewards: [],
      setCloudSyncActive: vi.fn(),
      setProfiles: vi.fn(),
      setRedemptions: vi.fn(),
      setRewards,
      isDemoSession: false,
      refreshChildSession: vi.fn(async () => true),
      syncCloudFamily,
    });

    await expect(actions.createReward({
      title: reward.title,
      description: reward.description,
      icon: reward.icon,
      costPoints: reward.costPoints,
      stock: reward.stock,
      isActive: reward.isActive,
    })).resolves.toBe(true);
    expect(requestRewardMutation).toHaveBeenCalledWith(expect.objectContaining({
      type: 'create',
      reward: expect.objectContaining({ title: reward.title, costPoints: reward.costPoints }),
    }));
    expect(syncCloudFamily).toHaveBeenCalledTimes(1);
    expect(setRewards).not.toHaveBeenCalled();
  });

  it('redeems through the scoped child command on a paired device', async () => {
    requestChildDomainCommand.mockResolvedValue({ status: 'pending', redemptionId: 'server-redemption' });
    const refreshChildSession = vi.fn(async () => true);
    const actions = createRewardActions({
      activeChildId: child.id,
      currentUser: null,
      familyId: null,
      isFamilyConnected: true,
      profiles: [child],
      redemptions: [],
      rewards: [reward],
      setCloudSyncActive: vi.fn(),
      setProfiles: vi.fn(),
      setRedemptions: vi.fn(),
      setRewards: vi.fn(),
      isDemoSession: false,
      refreshChildSession,
      syncCloudFamily: vi.fn(async () => true),
    });

    await expect(actions.claimReward(reward.id)).resolves.toBe(true);
    expect(requestChildDomainCommand).toHaveBeenCalledWith(expect.objectContaining({
      type: 'redeemReward',
      rewardId: reward.id,
    }));
    expect(refreshChildSession).toHaveBeenCalledOnce();
  });

  describe('redemption outcomes resolve to what the server actually did', () => {
    const cloudUser = {
      id: 'user-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated',
      created_at: '2026-09-20T00:00:00.000Z',
    };

    function cloudActions(options: {
      readonly redemptions?: Redemption[];
      readonly syncCloudFamily?: (user: User) => Promise<boolean>;
      readonly setCloudSyncActive?: Dispatch<SetStateAction<boolean>>;
      readonly onRedemptionsChange?: (value: Redemption[]) => void;
      readonly currentUser?: typeof cloudUser | null;
    } = {}) {
      const redemptions = options.redemptions ?? [pendingRedemption];
      const syncCloudFamily = options.syncCloudFamily ?? vi.fn(async () => true);
      const setCloudSyncActive = options.setCloudSyncActive ?? vi.fn();
      const actions = createRewardActions({
        activeChildId: child.id,
        currentUser: options.currentUser === undefined ? cloudUser : options.currentUser,
        familyId: options.currentUser === null ? null : 'family-1',
        isFamilyConnected: false,
        profiles: [child],
        redemptions,
        rewards: [reward],
        setCloudSyncActive,
        setProfiles: vi.fn(),
        setRedemptions: (action) => {
          const value = typeof action === 'function' ? action(redemptions) : action;
          options.onRedemptionsChange?.(value);
        },
        setRewards: vi.fn(),
        isDemoSession: false,
        refreshChildSession: vi.fn(async () => true),
        syncCloudFamily,
      });
      return { actions, syncCloudFamily, setCloudSyncActive };
    }

    it('resolves delivered after the approve and deliver commands both succeed and one reload runs', async () => {
      requestDomainCommand
        .mockResolvedValueOnce({ status: 'approved' })
        .mockResolvedValueOnce({ status: 'delivered' });
      const { actions, syncCloudFamily } = cloudActions();

      await expect(actions.deliverRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'delivered', refresh: 'synced',
      });

      expect(requestDomainCommand.mock.calls.map(([command]) => command)).toEqual([
        { type: 'transitionRedemption', redemptionId: pendingRedemption.id, decision: 'approve' },
        { type: 'transitionRedemption', redemptionId: pendingRedemption.id, decision: 'deliver' },
      ]);
      expect(syncCloudFamily).toHaveBeenCalledTimes(1);
    });

    it('reports an acknowledged approve whose deliver was refused as approved but not delivered', async () => {
      requestDomainCommand
        .mockResolvedValueOnce({ status: 'approved' })
        .mockRejectedValueOnce(Object.assign(new DomainCommandRequestError('RPC refused', 409), { outcome: 'refused' as const }));
      const setCloudSyncActive = vi.fn();
      let redemptions: Redemption[] = [];
      const { actions, syncCloudFamily } = cloudActions({
        redemptions: [pendingRedemption],
        setCloudSyncActive,
        onRedemptionsChange: (value) => { redemptions = value; },
      });

      const outcome = await actions.deliverRedemption(pendingRedemption.id);

      expect(outcome).toEqual({ command: 'failed', refresh: 'synced', unfulfilled: true });
      expect(redemptions).toHaveLength(1);
      expect(redemptions[0]).toMatchObject({ id: pendingRedemption.id, status: 'approved' });
      expect(requestDomainCommand).toHaveBeenCalledTimes(2);
      expect(syncCloudFamily).toHaveBeenCalledOnce();
      expect(setCloudSyncActive).toHaveBeenCalledWith(false);
    });

    it('does not fake a delivered refresh when the reload after a delivered command fails', async () => {
      requestDomainCommand
        .mockResolvedValueOnce({ status: 'approved' })
        .mockResolvedValueOnce({ status: 'delivered' });
      const syncCloudFamily = vi.fn(async () => false);
      const { actions } = cloudActions({ syncCloudFamily });

      await expect(actions.deliverRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'delivered', refresh: 'stale',
      });

      expect(requestDomainCommand).toHaveBeenCalledTimes(2);
      expect(syncCloudFamily).toHaveBeenCalledTimes(1);
    });

    it('reconciles instead of replaying deliver when approve reports an invalid transition', async () => {
      requestDomainCommand.mockResolvedValueOnce({ status: 'invalid_transition' });
      const { actions, syncCloudFamily } = cloudActions();

      await expect(actions.deliverRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'invalid_transition', refresh: 'synced',
      });

      expect(requestDomainCommand.mock.calls.map(([command]) => (command as { decision?: string }).decision)).toEqual(['approve']);
      expect(syncCloudFamily).toHaveBeenCalledTimes(1);
    });

    it('sends only the remaining deliver command for an already acknowledged approval', async () => {
      requestDomainCommand.mockResolvedValueOnce({ status: 'delivered' });
      const { actions } = cloudActions({ redemptions: [{ ...pendingRedemption, status: 'approved' }] });

      await expect(actions.deliverRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'delivered', refresh: 'synced',
      });

      expect(requestDomainCommand.mock.calls.map(([command]) => command)).toEqual([
        { type: 'transitionRedemption', redemptionId: pendingRedemption.id, decision: 'deliver' },
      ]);
    });

    it('fails without commands and without local mutation when no user is signed in', async () => {
      const setCloudSyncActive = vi.fn();
      const { actions } = cloudActions({ currentUser: null, setCloudSyncActive });

      await expect(actions.deliverRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'failed', refresh: 'stale',
      });

      expect(requestDomainCommand).not.toHaveBeenCalled();
      expect(setCloudSyncActive).toHaveBeenCalledWith(false);
    });

    it('resolves an approved cloud approval after one command and one reload', async () => {
      requestDomainCommand.mockResolvedValueOnce({ status: 'approved' });
      let redemptions: Redemption[] = [];
      const { actions, syncCloudFamily } = cloudActions({ onRedemptionsChange: (value) => { redemptions = value; } });

      await expect(actions.approveRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'approved', refresh: 'synced',
      });

      expect(requestDomainCommand).toHaveBeenCalledTimes(1);
      expect(syncCloudFamily).toHaveBeenCalledTimes(1);
      expect(redemptions[0]).toMatchObject({ status: 'approved' });
    });

    it('reports a parsed server refusal as failed without a reload', async () => {
      requestDomainCommand.mockRejectedValue(Object.assign(new DomainCommandRequestError('RPC refused', 409), { outcome: 'refused' as const }));
      const setCloudSyncActive = vi.fn();
      const { actions, syncCloudFamily } = cloudActions({ setCloudSyncActive });

      await expect(actions.approveRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'failed', refresh: 'stale',
      });

      expect(syncCloudFamily).not.toHaveBeenCalled();
      expect(setCloudSyncActive).toHaveBeenCalledWith(false);
    });

    it('resolves an acknowledged cloud rejection without inventing a refreshed balance', async () => {
      requestDomainCommand.mockResolvedValueOnce({ status: 'rejected' });
      let redemptions: Redemption[] = [];
      const { actions, syncCloudFamily } = cloudActions({ onRedemptionsChange: (value) => { redemptions = value; } });

      await expect(actions.rejectRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'rejected', refresh: 'synced',
      });

      expect(redemptions[0]).toMatchObject({ status: 'rejected' });
      expect(syncCloudFamily).toHaveBeenCalledTimes(1);
    });

    it('reports an already settled demo delivery as an invalid transition instead of success', async () => {
      let redemptions: Redemption[] = [{ ...pendingRedemption, status: 'delivered' }];
      let profiles = [child];
      const actions = createRewardActions({
        activeChildId: child.id, currentUser: null, familyId: null,
        isFamilyConnected: false, isDemoSession: true,
        profiles, redemptions, rewards: [reward], setCloudSyncActive: vi.fn(),
        setProfiles: stateSetter(() => profiles, (value) => { profiles = value; }),
        setRedemptions: stateSetter(() => redemptions, (value) => { redemptions = value; }),
        setRewards: vi.fn(),
        refreshChildSession: vi.fn(async () => true), syncCloudFamily: vi.fn(async () => true),
      });

      await expect(actions.deliverRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'invalid_transition', refresh: 'synced',
      });
      expect(redemptions[0]).toMatchObject({ status: 'delivered' });
      expect(requestDomainCommand).not.toHaveBeenCalled();
    });

    it('resolves a demo delivery as delivered once the local row is settled', async () => {
      let redemptions: Redemption[] = [pendingRedemption];
      let profiles = [child];
      const actions = createRewardActions({
        activeChildId: child.id, currentUser: null, familyId: null,
        isFamilyConnected: false, isDemoSession: true,
        profiles, redemptions, rewards: [reward], setCloudSyncActive: vi.fn(),
        setProfiles: stateSetter(() => profiles, (value) => { profiles = value; }),
        setRedemptions: stateSetter(() => redemptions, (value) => { redemptions = value; }),
        setRewards: vi.fn(),
        refreshChildSession: vi.fn(async () => true), syncCloudFamily: vi.fn(async () => true),
      });

      await expect(actions.deliverRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'delivered', refresh: 'synced',
      });
      expect(redemptions[0]).toMatchObject({ status: 'delivered' });
      expect(requestDomainCommand).not.toHaveBeenCalled();
    });

    it('reconciles a lost approval response instead of reporting plain failure', async () => {
      requestDomainCommand.mockRejectedValueOnce(new TypeError('network reset'));
      const { actions, syncCloudFamily } = cloudActions();

      await expect(actions.approveRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'unknown', refresh: 'synced',
      });

      expect(syncCloudFamily).toHaveBeenCalledTimes(1);
    });

    it('keeps an uncertain approval stale when the reconciliation reload also fails', async () => {
      requestDomainCommand.mockRejectedValueOnce(new TypeError('network reset'));
      const syncCloudFamily = vi.fn(async () => false);
      const { actions } = cloudActions({ syncCloudFamily });

      await expect(actions.approveRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'unknown', refresh: 'stale',
      });
    });

    it('stops before deliver when the approval answer is unknown', async () => {
      requestDomainCommand.mockRejectedValueOnce(new TypeError('network reset'));
      const { actions, syncCloudFamily } = cloudActions();

      await expect(actions.deliverRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'unknown', refresh: 'synced',
      });

      expect(requestDomainCommand).toHaveBeenCalledTimes(1);
      expect(syncCloudFamily).toHaveBeenCalledTimes(1);
    });

    it('reports an acknowledged approve whose deliver answer was lost as approved but unconfirmed', async () => {
      requestDomainCommand
        .mockResolvedValueOnce({ status: 'approved' })
        .mockRejectedValueOnce(new TypeError('network reset'));
      let redemptions: Redemption[] = [];
      const { actions, syncCloudFamily } = cloudActions({ onRedemptionsChange: (value) => { redemptions = value; } });

      await expect(actions.deliverRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'unknown', refresh: 'synced', unfulfilled: true,
      });

      expect(redemptions[0]).toMatchObject({ status: 'approved' });
      expect(syncCloudFamily).toHaveBeenCalledTimes(1);
    });

    it('does not treat an unknown response status as an acknowledged delivery', async () => {
      requestDomainCommand
        .mockResolvedValueOnce({ status: 'approved' })
        .mockResolvedValueOnce({ status: 'points_already_spent' });
      let redemptions: Redemption[] = [];
      const { actions } = cloudActions({ onRedemptionsChange: (value) => { redemptions = value; } });

      await expect(actions.deliverRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'unknown', refresh: 'synced', unfulfilled: true,
      });

      expect(redemptions[0]).toMatchObject({ status: 'approved' });
    });

    it('reconciles an unparsable command response instead of guessing a state', async () => {
      requestDomainCommand.mockRejectedValueOnce(new DomainCommandRequestError('The server returned an invalid command response.', 200));
      const { actions, syncCloudFamily } = cloudActions();

      await expect(actions.rejectRedemption(pendingRedemption.id)).resolves.toEqual({
        command: 'unknown', refresh: 'synced',
      });

      expect(syncCloudFamily).toHaveBeenCalledTimes(1);
    });
    it('reconciles unexpected503 instead of treating its error class as proof of refusal', async () => {
      requestDomainCommand.mockRejectedValueOnce(new DomainCommandRequestError('The change could not be saved.', 503));
      const { actions, syncCloudFamily } = cloudActions();
      await expect(actions.rejectRedemption(pendingRedemption.id)).resolves.toEqual({ command: 'unknown', refresh: 'synced' });
      expect(syncCloudFamily).toHaveBeenCalledTimes(1);
    });

    it('gates an acknowledged-stale row against replay and opposite transition until refresh succeeds', async () => {
      requestDomainCommand.mockResolvedValue({ status: 'approved' });
      const syncCloudFamily = vi.fn(async () => false);
      const { actions } = cloudActions({ syncCloudFamily });
      await expect(actions.approveRedemption(pendingRedemption.id)).resolves.toMatchObject({ command: 'approved', refresh: 'stale' });
      await actions.rejectRedemption(pendingRedemption.id);
      await actions.deliverRedemption(pendingRedemption.id);
      expect(requestDomainCommand).toHaveBeenCalledTimes(1);
    });

    it('does not acknowledge the expected status for a different redemption ID', async () => {
      requestDomainCommand.mockResolvedValueOnce({ status: 'rejected', redemptionId: 'another-redemption' });
      const onRedemptionsChange = vi.fn();
      const { actions, syncCloudFamily } = cloudActions({ onRedemptionsChange });
      await expect(actions.rejectRedemption(pendingRedemption.id)).resolves.toEqual({ command: 'unknown', refresh: 'synced' });
      expect(onRedemptionsChange).not.toHaveBeenCalled();
      expect(syncCloudFamily).toHaveBeenCalledOnce();
    });

    it('does not apply a rejection or infer approval from an unexpected approved response', async () => {
      requestDomainCommand.mockResolvedValueOnce({ status: 'approved' });
      const onRedemptionsChange = vi.fn();
      const { actions, syncCloudFamily } = cloudActions({ onRedemptionsChange });
      await expect(actions.rejectRedemption(pendingRedemption.id)).resolves.toEqual({ command: 'unknown', refresh: 'synced' });
      expect(onRedemptionsChange).not.toHaveBeenCalled();
      expect(syncCloudFamily).toHaveBeenCalledOnce();
    });

  });
});
