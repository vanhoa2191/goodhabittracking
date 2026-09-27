import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChildProfile, HabitActivity } from '@/types';
import { emptyExperienceState } from '@/lib/experience-state';

const requestProfileMutation = vi.hoisted(() => vi.fn());
vi.mock('@/lib/store/profile-mutation-client', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/store/profile-mutation-client')>(),
  requestProfileMutation,
}));

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
      experience: emptyExperienceState,
      familyId: 'family-a',
      profiles,
      setActiveChildId: vi.fn(),
      setActivities: vi.fn(),
      setCloudSyncActive: vi.fn(),
      setExperience: vi.fn(),
      setProfiles,
      isDemoSession: false,
      syncCloudFamily: vi.fn(async () => true),
    });

    await expect(actions.createProfile(baseProfile)).resolves.toMatchObject({
      success: false,
      code: 'profile_service_unavailable',
    });
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
      experience: emptyExperienceState,
      familyId: 'family-a',
      profiles: [],
      setActiveChildId,
      setActivities: vi.fn(),
      setCloudSyncActive: vi.fn(),
      setExperience: vi.fn(),
      setProfiles: vi.fn(),
      isDemoSession: false,
      syncCloudFamily,
    });

    await expect(actions.createProfile({ ...baseProfile, ageStage: '3-6' })).resolves.toMatchObject({
      success: true,
      refreshed: true,
    });
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

  it('treats a committed profile as saved when the follow-up refresh fails', async () => {
    requestProfileMutation.mockResolvedValue({
      profileId: '11111111-1111-4111-8111-111111111111',
    });
    const setActiveChildId = vi.fn();
    const actions = createProfileActions({
      activeChildId: null,
      currentUser: {
        id: 'user-a', app_metadata: {}, user_metadata: {}, aud: 'authenticated',
        created_at: '2026-09-20T00:00:00.000Z',
      },
      experience: emptyExperienceState,
      familyId: 'family-a',
      profiles: [],
      setActiveChildId,
      setActivities: vi.fn(),
      setCloudSyncActive: vi.fn(),
      setExperience: vi.fn(),
      setProfiles: vi.fn(),
      isDemoSession: false,
      syncCloudFamily: vi.fn(async () => false),
    });

    await expect(actions.createProfile(baseProfile)).resolves.toMatchObject({
      success: true,
      refreshed: false,
    });
    expect(setActiveChildId).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
  });

  it('reuses the caller request ID for idempotent create retries', async () => {
    requestProfileMutation.mockImplementation(async (mutation) => ({
      profileId: mutation.type === 'create' ? mutation.profile.id : mutation.profileId,
    }));
    const actions = createProfileActions({
      activeChildId: null,
      currentUser: {
        id: 'user-a', app_metadata: {}, user_metadata: {}, aud: 'authenticated',
        created_at: '2026-09-20T00:00:00.000Z',
      },
      experience: emptyExperienceState,
      familyId: 'family-a',
      profiles: [],
      setActiveChildId: vi.fn(),
      setActivities: vi.fn(),
      setCloudSyncActive: vi.fn(),
      setExperience: vi.fn(),
      setProfiles: vi.fn(),
      isDemoSession: false,
      syncCloudFamily: vi.fn(async () => true),
    });
    const requestId = '33333333-3333-4333-8333-333333333333';

    await actions.createProfile(baseProfile, requestId);
    await actions.createProfile(baseProfile, requestId);

    expect(requestProfileMutation).toHaveBeenCalledTimes(2);
    expect(requestProfileMutation).toHaveBeenNthCalledWith(1, expect.objectContaining({
      type: 'create',
      profile: expect.objectContaining({ id: requestId }),
    }));
    expect(requestProfileMutation).toHaveBeenNthCalledWith(2, expect.objectContaining({
      type: 'create',
      profile: expect.objectContaining({ id: requestId }),
    }));
  });

  it('keeps local profile creation fully local', async () => {
    let profiles: ChildProfile[] = [];
    let activities: HabitActivity[] = [];
    const actions = createProfileActions({
      activeChildId: null,
      currentUser: null,
      experience: emptyExperienceState,
      familyId: null,
      profiles,
      setActiveChildId: vi.fn(),
      setActivities: vi.fn((updater) => { activities = updater(activities); }),
      setCloudSyncActive: vi.fn(),
      setExperience: vi.fn(),
      setProfiles: vi.fn((updater) => { profiles = updater(profiles); }),
      isDemoSession: true,
      syncCloudFamily: vi.fn(async () => false),
    });

    await expect(actions.createProfile({ ...baseProfile, ageStage: '3-6' })).resolves.toMatchObject({ success: true });
    expect(profiles).toHaveLength(1);
    expect(activities.length).toBeGreaterThan(0);
    expect(requestProfileMutation).not.toHaveBeenCalled();
  });

  it('records a local mascot choice and blocks a second choice during the cooldown', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T10:00:00.000Z'));
    try {
      const childId = '11111111-1111-4111-8111-111111111111';
      const familyId = '22222222-2222-4222-8222-222222222222';
      let profiles: ChildProfile[] = [{
        ...baseProfile, id: childId, createdAt: '2026-09-20T00:00:00.000Z',
      }];
      let experience = emptyExperienceState;
      const setProfiles = vi.fn((updater) => { profiles = updater(profiles); });
      const setExperience = vi.fn((updater) => { experience = updater(experience); });
      const dependencies = {
        activeChildId: childId,
        currentUser: null,
        familyId,
        setActiveChildId: vi.fn(),
        setActivities: vi.fn(),
        setCloudSyncActive: vi.fn(),
        setExperience,
        setProfiles,
        isDemoSession: true,
        syncCloudFamily: vi.fn(async () => false),
      };

      const first = createProfileActions({ ...dependencies, profiles, experience });
      await expect(first.updateProfile(childId, { avatar: 'mascot:fox' })).resolves.toBe(true);
      expect(experience.children[0]?.mascot_selected_at).toBe('2026-09-23T10:00:00.000Z');

      const second = createProfileActions({ ...dependencies, profiles, experience });
      await expect(second.updateProfile(childId, { avatar: 'mascot:bee' })).resolves.toBe(false);
      await expect(second.updateProfile(childId, { avatar: '🐝' })).resolves.toBe(false);
      await expect(second.updateProfile(childId, { avatar: '🦊' })).resolves.toBe(true);
      expect(experience.children[0]?.mascot_selected_at).toBe('2026-09-23T10:00:00.000Z');
      expect(profiles[0]?.avatar).toBe('🦊');
    } finally {
      vi.useRealTimers();
    }
  });

  it('records a non-default mascot selected during local profile creation', async () => {
    const familyId = '22222222-2222-4222-8222-222222222222';
    let experience = emptyExperienceState;
    const actions = createProfileActions({
      activeChildId: null,
      currentUser: null,
      experience,
      familyId,
      profiles: [],
      setActiveChildId: vi.fn(),
      setActivities: vi.fn(),
      setCloudSyncActive: vi.fn(),
      setExperience: vi.fn((updater) => { experience = updater(experience); }),
      setProfiles: vi.fn(),
      isDemoSession: true,
      syncCloudFamily: vi.fn(async () => false),
    });

    await expect(actions.createProfile({ ...baseProfile, avatar: 'mascot:bee' })).resolves.toMatchObject({ success: true });
    expect(experience.children).toEqual([expect.objectContaining({
      family_id: familyId,
      mascot_selected_at: expect.any(String),
    })]);
  });
});
