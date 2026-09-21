import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ChildProfile, HabitActivity } from '@/types';
import { profileMutationSchema, type ProfileMutation } from '@/lib/domain/profile-mutations';
import { generateAgeAdaptedHabits } from '@/lib/wit-framework';
import { requestProfileMutation } from './profile-mutation-client';
import { addProfile, removeProfile, updateProfileList } from './local-domain-actions';

type NewProfile = Omit<ChildProfile, 'id' | 'createdAt'>;

type Dependencies = {
  readonly activeChildId: string | null;
  readonly currentUser: User | null;
  readonly familyId: string | null;
  readonly setActiveChildId: Dispatch<SetStateAction<string | null>>;
  readonly setActivities: Dispatch<SetStateAction<HabitActivity[]>>;
  readonly setCloudSyncActive: Dispatch<SetStateAction<boolean>>;
  readonly setProfiles: Dispatch<SetStateAction<ChildProfile[]>>;
  readonly storageMode: 'local' | 'cloud';
  readonly syncCloudFamily: (user: User) => Promise<boolean>;
};

type ProfileActions = {
  readonly createProfile: (profile: NewProfile) => Promise<boolean>;
  readonly deleteProfile: (id: string) => Promise<boolean>;
  readonly updateProfile: (id: string, updates: Partial<ChildProfile>) => Promise<boolean>;
};

function mutationProfile(profile: ChildProfile) {
  return profileMutationSchema.options[0].shape.profile.parse({
    id: profile.id,
    name: profile.name,
    nickname: profile.nickname,
    showRealNameOnLeaderboard: profile.showRealNameOnLeaderboard,
    isPublicOnLeaderboard: profile.isPublicOnLeaderboard,
    avatar: profile.avatar,
    themeColor: profile.themeColor,
    points: profile.points,
    totalEarned: profile.totalEarned,
    level: profile.level,
    streak: profile.streak,
    birthYear: profile.birthYear,
    ageStage: profile.ageStage,
    leagueTier: profile.leagueTier,
    createdAt: profile.createdAt,
  });
}

function mutationUpdates(updates: Partial<ChildProfile>) {
  const candidates = {
    name: updates.name,
    nickname: updates.nickname,
    showRealNameOnLeaderboard: updates.showRealNameOnLeaderboard,
    isPublicOnLeaderboard: updates.isPublicOnLeaderboard,
    avatar: updates.avatar,
    themeColor: updates.themeColor,
    birthYear: updates.birthYear,
    ageStage: updates.ageStage,
  };
  return Object.fromEntries(
    Object.entries(candidates).filter(([, value]) => value !== undefined),
  );
}

export function createProfileActions(dependencies: Dependencies): ProfileActions {
  const persist = async (mutation: ProfileMutation): Promise<boolean> => {
    if (!dependencies.currentUser || !dependencies.familyId) {
      dependencies.setCloudSyncActive(false);
      return false;
    }
    try {
      const result = await requestProfileMutation(mutation);
      const synced = await dependencies.syncCloudFamily(dependencies.currentUser);
      if (synced && mutation.type === 'create') {
        dependencies.setActiveChildId(result.profileId);
      }
      return synced;
    } catch (error: unknown) {
      dependencies.setCloudSyncActive(false);
      console.error(
        'Saving child profile failed:',
        error instanceof Error ? error.message : 'unknown',
      );
      return false;
    }
  };

  return {
    createProfile: async (profileData) => {
      const createdAt = new Date().toISOString();
      const profile: ChildProfile = { ...profileData, id: crypto.randomUUID(), createdAt };
      const starterActivities: HabitActivity[] = profile.ageStage
        ? generateAgeAdaptedHabits(profile.id, profile.ageStage).map((activity) => ({
            ...activity,
            id: crypto.randomUUID(),
            createdAt,
          }))
        : [];
      if (dependencies.storageMode === 'cloud') {
        return persist({
          type: 'create',
          profile: mutationProfile(profile),
          starterActivities,
        });
      }
      dependencies.setProfiles((previous) => addProfile(previous, profile));
      dependencies.setActiveChildId(profile.id);
      if (starterActivities.length > 0) {
        dependencies.setActivities((previous) => [...previous, ...starterActivities]);
      }
      return true;
    },
    updateProfile: async (id, updates) => {
      if (dependencies.storageMode === 'cloud') {
        return persist({ type: 'update', profileId: id, updates: mutationUpdates(updates) });
      }
      dependencies.setProfiles((previous) => updateProfileList(previous, id, updates));
      return true;
    },
    deleteProfile: async (id) => {
      if (dependencies.storageMode === 'cloud') {
        return persist({ type: 'delete', profileId: id });
      }
      dependencies.setProfiles((previous) => {
        const removal = removeProfile(previous, id, dependencies.activeChildId);
        dependencies.setActiveChildId(removal.activeChildId);
        return removal.profiles;
      });
      return true;
    },
  };
}
