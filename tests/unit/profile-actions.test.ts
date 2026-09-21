import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChildProfile, HabitActivity } from '@/types';

const requestProfileMutation = vi.hoisted(() => vi.fn());
vi.mock('@/lib/store/profile-mutation-client', () => ({ requestProfileMutation }));

import { createProfileActions } from '@/lib/store/profile-actions';

const baseProfile = {
  name: 'Bé An',
  avatar: '🦁',
  themeColor: '#3b82f6',
  points: 0,
  totalEarned: 0,
  level: 1,
  streak: 0,
} as const;

describe('profile actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not change cloud UI state before mutation and authoritative sync succeed', async () => {
    let profiles: ChildProfile[] = [];
    const setProfiles = vi.fn((updater) => { profiles = updater(profiles); });
    requestProfileMutation.mockRejectedValue(new Error('offline'));
    const actions = createProfileActions({
      activeChildId: null,
      currentUser: {
        id: 'user-a', app_metadata: {}, user_metadata: {}, aud: 'authenticated',
        created_at: '2026-09-20T00:00:00.000Z',
      },
      familyId: 'family-a',
      setActiveChildId: vi.fn(),
      setActivities: vi.fn(),
      setCloudSyncActive: vi.fn(),
      setProfiles,
      storageMode: 'cloud',
      syncCloudFamily: vi.fn(async () => true),
    });

    await expect(actions.createProfile(baseProfile)).resolves.toBe(false);
    expect(profiles).toEqual([]);
    expect(setProfiles).not.toHaveBeenCalled();
  });

  it('sends profile and starter activities in one cloud mutation', async () => {
    requestProfileMutation.mockImplementation(async (mutation) => ({
      profileId: mutation.profile.id,
    }));
    const syncCloudFamily = vi.fn(async () => true);
    const setActiveChildId = vi.fn();
    const actions = createProfileActions({
      activeChildId: null,
      currentUser: {
        id: 'user-a', app_metadata: {}, user_metadata: {}, aud: 'authenticated',
        created_at: '2026-09-20T00:00:00.000Z',
      },
      familyId: 'family-a',
      setActiveChildId,
      setActivities: vi.fn(),
      setCloudSyncActive: vi.fn(),
      setProfiles: vi.fn(),
      storageMode: 'cloud',
      syncCloudFamily,
    });

    await expect(actions.createProfile({ ...baseProfile, ageStage: '3-6' })).resolves.toBe(true);
    expect(requestProfileMutation).toHaveBeenCalledWith(expect.objectContaining({
      type: 'create',
      profile: expect.objectContaining({ name: 'Bé An', ageStage: '3-6' }),
      starterActivities: expect.arrayContaining([
        expect.objectContaining({ childId: expect.any(String) }),
      ]),
    }));
    expect(syncCloudFamily).toHaveBeenCalledTimes(1);
    expect(setActiveChildId).toHaveBeenCalledWith(expect.any(String));
  });

  it('keeps local profile creation fully local', async () => {
    let profiles: ChildProfile[] = [];
    let activities: HabitActivity[] = [];
    const actions = createProfileActions({
      activeChildId: null,
      currentUser: null,
      familyId: null,
      setActiveChildId: vi.fn(),
      setActivities: vi.fn((updater) => { activities = updater(activities); }),
      setCloudSyncActive: vi.fn(),
      setProfiles: vi.fn((updater) => { profiles = updater(profiles); }),
      storageMode: 'local',
      syncCloudFamily: vi.fn(async () => false),
    });

    await expect(actions.createProfile({ ...baseProfile, ageStage: '3-6' })).resolves.toBe(true);
    expect(profiles).toHaveLength(1);
    expect(activities.length).toBeGreaterThan(0);
    expect(requestProfileMutation).not.toHaveBeenCalled();
  });
});
