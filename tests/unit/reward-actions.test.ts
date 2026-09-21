import type { Dispatch, SetStateAction } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChildProfile, Redemption, Reward } from '@/types';

const { requestChildDomainCommand, requestDomainCommand } = vi.hoisted(() => ({
  requestChildDomainCommand: vi.fn(),
  requestDomainCommand: vi.fn(),
}));
const requestRewardMutation = vi.hoisted(() => vi.fn());
vi.mock('@/lib/store/domain-command-client', () => ({
  requestChildDomainCommand,
  requestDomainCommand,
}));
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
      storageMode: 'local',
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
    requestDomainCommand.mockResolvedValue({ status: 'ok' });
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
      storageMode: 'cloud',
      refreshChildSession: vi.fn(async () => true),
      syncCloudFamily,
    });

    actions.deliverRedemption(pendingRedemption.id);

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
      storageMode: 'cloud',
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
      storageMode: 'cloud',
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
    requestChildDomainCommand.mockResolvedValue({ status: 'pending' });
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
      storageMode: 'cloud',
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
});
