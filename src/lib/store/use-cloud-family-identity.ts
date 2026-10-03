import { useCallback, useEffect, useRef } from 'react';
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
import { loadCloudIdentitySnapshot } from './caregiver-progress';
import type { CaregiverProgress } from './caregiver-progress';
import type { FamilyRole } from './cloud-family-sync';
import { startCloudIdentitySession } from './cloud-identity-session';
import { LOCAL_STORAGE_PREFIX } from './local-family-persistence';
import type { ExperienceState } from '@/lib/experience-state';

type Setters = {
  readonly setCaregiverProgress: Dispatch<SetStateAction<CaregiverProgress | null>>;
  readonly setActivities: Dispatch<SetStateAction<HabitActivity[]>>;
  readonly setChildBadges: Dispatch<SetStateAction<ChildBadge[]>>;
  readonly setCloudSyncActive: Dispatch<SetStateAction<boolean>>;
  readonly setCurrentUser: Dispatch<SetStateAction<User | null>>;
  readonly setFamilyId: Dispatch<SetStateAction<string | null>>;
  readonly setFamilyRole: Dispatch<SetStateAction<FamilyRole | null>>;
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
  readonly onIdentityReady: () => void;
  readonly onIdentityStart: () => void;
  readonly onIdentityUser: () => void;
  /** Receives the reason when Google sign-in cannot be opened (null clears it); the page shows it. */
  readonly onSignInError: (message: string | null) => void;
  readonly setters: Setters;
};

type IdentityChange = {
  readonly previousUserId: string | null;
  readonly user: User | null;
  readonly resetFamilyScope: () => void;
  readonly setCurrentUser: Dispatch<SetStateAction<User | null>>;
  readonly onIdentityStart: () => void;
  readonly onIdentityUser: () => void;
  readonly syncCloudFamily: (user: User | null) => Promise<boolean>;
};

export async function applyCloudIdentityChange(input: IdentityChange): Promise<string | null> {
  const nextUserId = input.user?.id ?? null;
  const identityChanged = input.previousUserId !== nextUserId;
  if (identityChanged) input.resetFamilyScope();
  input.setCurrentUser(input.user);
  if (!input.user) return null;
  if (identityChanged) {
    input.onIdentityStart();
    input.onIdentityUser();
  }
  await input.syncCloudFamily(input.user);
  return input.user.id;
}

export function shouldApplyCloudSnapshot(requestedUserId: string, activeUserId: string | null): boolean {
  return requestedUserId === activeUserId;
}

export function useCloudFamilyIdentity(dependencies: Dependencies) {
  const { currentUser, familyId, resetFamilyScope, onIdentityReady, onIdentityStart, onIdentityUser, onSignInError } = dependencies;
  const familyIdRef = useRef(familyId);
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    familyIdRef.current = familyId;
  }, [familyId]);
  const {
    setCaregiverProgress,
    setActivities,
    setChildBadges,
    setCloudSyncActive,
    setCurrentUser,
    setFamilyId,
    setFamilyRole,
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
      const result = await loadCloudIdentitySnapshot(user.id);
      if (!shouldApplyCloudSnapshot(user.id, currentUserRef.current?.id ?? null)) return false;
      if (result.familyRole === 'caregiver') {
        resetFamilyScope();
        setFamilyId(result.progress.familyId);
        setFamilyRole('caregiver');
        setCaregiverProgress(result.progress);
        setCloudSyncActive(true);
        setLastSyncTime(new Date().toLocaleTimeString());
        return true;
      }
      const snapshot = result.snapshot;
      setCaregiverProgress(null);
      if (familyIdRef.current && familyIdRef.current !== snapshot.familyId) resetFamilyScope();
      setFamilyId(snapshot.familyId);
      setFamilyRole(snapshot.familyRole);
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
      if (shouldApplyCloudSnapshot(user.id, currentUserRef.current?.id ?? null)) {
        setCaregiverProgress(null);
        setCloudSyncActive(false);
      }
      console.error('Supabase sync failed:', error);
      return false;
    }
  }, [
    resetFamilyScope,
    setCaregiverProgress,
    setActivities,
    setChildBadges,
    setCloudSyncActive,
    setFamilyId,
    setFamilyRole,
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
      const previousUserId = currentUserRef.current?.id ?? null;
      currentUserRef.current = user;
      await applyCloudIdentityChange({
        previousUserId,
        user,
        resetFamilyScope,
        setCurrentUser,
        onIdentityStart,
        onIdentityUser,
        syncCloudFamily,
      });
    },
    onReady: onIdentityReady,
    onError: (error) => console.error('Supabase auth failed:', error),
  }), [onIdentityReady, onIdentityStart, onIdentityUser, resetFamilyScope, setCurrentUser, syncCloudFamily]);

  const loginWithGoogle = async (): Promise<void> => {
    sounds.playClick();
    onSignInError(null);
    const { error } = await signInWithGoogle();
    if (!error) return;
    console.error('Google Sign In Error:', error);
    onSignInError(error.message);
  };

  const logout = async (): Promise<void> => {
    sounds.playClick();
    await signOutUser();
    currentUserRef.current = null;
    resetFamilyScope();
    setCurrentUser(null);
  };

  return { loginWithGoogle, logout, syncCloudFamily, syncNow };
}
