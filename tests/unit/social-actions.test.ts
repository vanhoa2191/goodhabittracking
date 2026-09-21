import type { Dispatch, SetStateAction } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChildProfile, GroupTeam, Kudo } from '@/types';

const requestSocialMutation = vi.hoisted(() => vi.fn());
vi.mock('@/lib/store/social-mutation-client', () => ({ requestSocialMutation }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('@/lib/sound', () => ({
  sounds: { playClick: vi.fn(), playFanfare: vi.fn() },
}));

import { createSocialActions } from '@/lib/store/social-actions';

const child: ChildProfile = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Bé An',
  avatar: '🦁',
  themeColor: '#f97316',
  points: 50,
  totalEarned: 150,
  level: 2,
  streak: 3,
  createdAt: '2026-09-20T00:00:00.000Z',
};

function stateSetter<T>(read: () => T[], write: (value: T[]) => void): Dispatch<SetStateAction<T[]>> {
  return (action) => write(typeof action === 'function' ? action(read()) : action);
}

describe('social actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a local group and includes the active child', async () => {
    let groups: GroupTeam[] = [];
    const actions = createSocialActions({
      cloud: {
        currentUser: null,
        familyId: null,
        setCloudSyncActive: vi.fn(),
        syncCloudFamily: vi.fn(async () => true),
      },
      state: {
        activeChild: child,
        groups,
        setGroups: stateSetter(() => groups, (value) => { groups = value; }),
        setKudos: vi.fn(),
      },
      storageMode: 'local',
    });

    await expect(actions.createGroup({
      name: 'Biệt đội Tử tế',
      icon: '🚀',
      createdByChildId: child.id,
      memberChildIds: [child.id],
      weeklyTargetPoints: 300,
      rewardType: 'badge',
    })).resolves.toBe(true);

    expect(groups).toEqual([
      expect.objectContaining({
        name: 'Biệt đội Tử tế',
        createdByChildId: child.id,
        memberChildIds: [child.id],
      }),
    ]);
  });

  it('does not mutate local social state when cloud mode has no authenticated parent', async () => {
    let groups: GroupTeam[] = [];
    let kudos: Kudo[] = [];
    const setCloudSyncActive = vi.fn();
    const actions = createSocialActions({
      cloud: {
        currentUser: null,
        familyId: null,
        setCloudSyncActive,
        syncCloudFamily: vi.fn(async () => true),
      },
      state: {
        activeChild: child,
        groups,
        setGroups: stateSetter(() => groups, (value) => { groups = value; }),
        setKudos: stateSetter(() => kudos, (value) => { kudos = value; }),
      },
      storageMode: 'cloud',
    });

    await expect(actions.createGroup({
      name: 'Không được tạo cục bộ',
      icon: '🚀',
      createdByChildId: child.id,
      memberChildIds: [child.id],
      weeklyTargetPoints: 300,
      rewardType: 'badge',
    })).resolves.toBe(false);
    await expect(actions.sendKudo(child.id, '👏')).resolves.toBe(false);

    expect(groups).toEqual([]);
    expect(kudos).toEqual([]);
    expect(requestSocialMutation).not.toHaveBeenCalled();
    expect(setCloudSyncActive).toHaveBeenCalledWith(false);
  });

  it('persists a cloud group before authoritative sync without optimistic state', async () => {
    requestSocialMutation.mockResolvedValue({
      entityId: '22222222-2222-4222-8222-222222222222',
    });
    const setGroups = vi.fn();
    const syncCloudFamily = vi.fn(async () => true);
    const actions = createSocialActions({
      cloud: {
        currentUser: {
          id: 'user-1', app_metadata: {}, user_metadata: {}, aud: 'authenticated',
          created_at: '2026-09-20T00:00:00.000Z',
        },
        familyId: '33333333-3333-4333-8333-333333333333',
        setCloudSyncActive: vi.fn(),
        syncCloudFamily,
      },
      state: {
        activeChild: child,
        groups: [],
        setGroups,
        setKudos: vi.fn(),
      },
      storageMode: 'cloud',
    });

    await expect(actions.createGroup({
      name: 'Biệt đội Đồng bộ',
      icon: '☁️',
      createdByChildId: child.id,
      memberChildIds: [child.id],
      weeklyTargetPoints: 400,
      rewardType: 'stars',
    })).resolves.toBe(true);

    expect(requestSocialMutation).toHaveBeenCalledWith(expect.objectContaining({
      type: 'createGroup',
      group: expect.objectContaining({ name: 'Biệt đội Đồng bộ' }),
    }));
    expect(syncCloudFamily).toHaveBeenCalledTimes(1);
    expect(setGroups).not.toHaveBeenCalled();
  });
});
