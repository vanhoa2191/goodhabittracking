import { useCallback, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type {
  ActivityLog,
  ChildBadge,
  ChildProfile,
  GroupTeam,
  HabitActivity,
  Kudo,
  Redemption,
  Reward,
  SubscriptionPlan,
} from '@/types';
import { sounds } from '@/lib/sound';
import { getSupabase, signInWithGoogle, signOutUser } from '@/lib/supabase';
import { loadCloudFamilySnapshot } from './cloud-family-sync';
import { startCloudIdentitySession } from './cloud-identity-session';
import { LOCAL_STORAGE_PREFIX } from './local-family-persistence';
import type { ExperienceState } from '@/lib/experience-state';

type Setters = {
  readonly setActivities: Dispatch<SetStateAction<HabitActivity[]>>;
  readonly setChildBadges: Dispatch<SetStateAction<ChildBadge[]>>;
  readonly setCloudSyncActive: Dispatch<SetStateAction<boolean>>;
  readonly setCurrentUser: Dispatch<SetStateAction<User | null>>;
  readonly setFamilyId: Dispatch<SetStateAction<string | null>>;
  readonly setGroups: Dispatch<SetStateAction<GroupTeam[]>>;
  readonly setKudos: Dispatch<SetStateAction<Kudo[]>>;
  readonly setLastSyncTime: Dispatch<SetStateAction<string | null>>;
  readonly setLogs: Dispatch<SetStateAction<ActivityLog[]>>;
  readonly setProfiles: Dispatch<SetStateAction<ChildProfile[]>>;
  readonly setExperience: Dispatch<SetStateAction<ExperienceState>>;
  readonly setRedemptions: Dispatch<SetStateAction<Redemption[]>>;
  readonly setRewards: Dispatch<SetStateAction<Reward[]>>;
  readonly setSubscriptionEndsAt: Dispatch<SetStateAction<string | null>>;
  readonly setSubscriptionPlan: Dispatch<SetStateAction<SubscriptionPlan>>;
  readonly setTrialEndsAt: Dispatch<SetStateAction<string | null>>;
};

type Dependencies = {
  readonly currentUser: User | null;
  readonly familyId: string | null;
  readonly resetFamilyScope: () => void;
  readonly setters: Setters;
};

export function useCloudFamilyIdentity(dependencies: Dependencies) {
  const { currentUser, familyId, resetFamilyScope } = dependencies;
  const {
    setActivities,
    setChildBadges,
    setCloudSyncActive,
    setCurrentUser,
    setFamilyId,
    setGroups,
    setKudos,
    setLastSyncTime,
    setLogs,
    setProfiles,
    setExperience,
    setRedemptions,
    setRewards,
    setSubscriptionEndsAt,
    setSubscriptionPlan,
    setTrialEndsAt,
  } = dependencies.setters;

  const syncCloudFamily = useCallback(async (user: User | null): Promise<boolean> => {
    if (!getSupabase() || !user) {
      setCloudSyncActive(false);
      return false;
    }
    try {
      const snapshot = await loadCloudFamilySnapshot(user.id);
      if (familyId && familyId !== snapshot.familyId) resetFamilyScope();
      setFamilyId(snapshot.familyId);
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}family_id`, snapshot.familyId);
      setProfiles(snapshot.profiles);
      setExperience(snapshot.experience);
      setActivities(snapshot.activities);
      setLogs(snapshot.logs);
      setRewards(snapshot.rewards);
      setRedemptions(snapshot.redemptions);
      setChildBadges(snapshot.childBadges);
      setKudos(snapshot.kudos);
      setGroups(snapshot.groups);
      setSubscriptionPlan(snapshot.subscriptionPlan);
      setTrialEndsAt(snapshot.trialEndsAt);
      setSubscriptionEndsAt(snapshot.subscriptionEndsAt);
      setCloudSyncActive(true);
      setLastSyncTime(new Date().toLocaleTimeString());
      return true;
    } catch (error: unknown) {
      setCloudSyncActive(false);
      console.error('Supabase sync failed:', error);
      return false;
    }
  }, [
    familyId,
    resetFamilyScope,
    setActivities,
    setChildBadges,
    setCloudSyncActive,
    setFamilyId,
    setGroups,
    setKudos,
    setLastSyncTime,
    setLogs,
    setProfiles,
    setExperience,
    setRedemptions,
    setRewards,
    setSubscriptionEndsAt,
    setSubscriptionPlan,
    setTrialEndsAt,
  ]);

  const syncNow = useCallback(async (): Promise<void> => {
    await syncCloudFamily(currentUser);
  }, [currentUser, syncCloudFamily]);

  useEffect(() => startCloudIdentitySession({
    onUserChanged: async (user) => {
      setCurrentUser(user);
      if (user) await syncCloudFamily(user);
      else resetFamilyScope();
    },
    onError: (error) => console.error('Supabase auth failed:', error),
  }), [resetFamilyScope, setCurrentUser, syncCloudFamily]);

  const loginWithGoogle = async (): Promise<void> => {
    sounds.playClick();
    const { error } = await signInWithGoogle();
    if (!error) return;
    console.error('Google Sign In Error:', error);
    alert(`Không thể mở đăng nhập Google: ${error.message}`);
  };

  const logout = async (): Promise<void> => {
    sounds.playClick();
    await signOutUser();
    resetFamilyScope();
    setCurrentUser(null);
  };

  return { loginWithGoogle, logout, syncCloudFamily, syncNow };
}
