import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  ActivityLog,
  ChildBadge,
  ChildProfile,
  GroupTeam,
  HabitActivity,
  Kudo,
  ParentProfile,
  Redemption,
  Reward,
} from '@/types';
import { INITIAL_ACTIVITIES, INITIAL_GROUPS, INITIAL_PROFILES, INITIAL_REWARDS } from '@/lib/constants';
import { isSupabaseConfigured } from '@/lib/supabase';
import { emptyExperienceState } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';
import {
  loadLocalFamilyState,
  LOCAL_STORAGE_PREFIX,
  persistLocalFamilyState,
  saveLocalExperience,
} from './local-family-persistence';

type FamilyState = {
  readonly activeChildId: string | null;
  readonly activities: HabitActivity[];
  readonly childBadges: ChildBadge[];
  readonly groups: GroupTeam[];
  readonly isDemoSession: boolean;
  readonly isLoaded: boolean;
  readonly kudos: Kudo[];
  readonly logs: ActivityLog[];
  readonly parentPin: string;
  readonly profiles: ChildProfile[];
  readonly experience: ExperienceState;
  readonly redemptions: Redemption[];
  readonly rewards: Reward[];
  readonly storageMode: 'local' | 'cloud';
};

type FamilySetters = {
  readonly setActiveChildId: Dispatch<SetStateAction<string | null>>;
  readonly setActivities: Dispatch<SetStateAction<HabitActivity[]>>;
  readonly setChildBadges: Dispatch<SetStateAction<ChildBadge[]>>;
  readonly setCloudSyncActive: Dispatch<SetStateAction<boolean>>;
  readonly setFamilyId: Dispatch<SetStateAction<string | null>>;
  readonly setGroups: Dispatch<SetStateAction<GroupTeam[]>>;
  readonly setIsDemoSession: Dispatch<SetStateAction<boolean>>;
  readonly setIsParentUnlocked: Dispatch<SetStateAction<boolean>>;
  readonly setIsLoaded: Dispatch<SetStateAction<boolean>>;
  readonly setIsOnboardingOpen: Dispatch<SetStateAction<boolean>>;
  readonly setKudos: Dispatch<SetStateAction<Kudo[]>>;
  readonly setLogs: Dispatch<SetStateAction<ActivityLog[]>>;
  readonly setMode: Dispatch<SetStateAction<'kid' | 'parent'>>;
  readonly setParentPin: Dispatch<SetStateAction<string>>;
  readonly setParentProfile: Dispatch<SetStateAction<ParentProfile | null>>;
  readonly setProfiles: Dispatch<SetStateAction<ChildProfile[]>>;
  readonly setExperience: Dispatch<SetStateAction<ExperienceState>>;
  readonly setRedemptions: Dispatch<SetStateAction<Redemption[]>>;
  readonly setRewards: Dispatch<SetStateAction<Reward[]>>;
  readonly setStorageMode: Dispatch<SetStateAction<'local' | 'cloud'>>;
};

type Dependencies = {
  readonly resetFamilyScope: () => void;
  readonly state: FamilyState;
  readonly setters: FamilySetters;
  readonly syncNow: () => Promise<void>;
};

export function useLocalFamilyLifecycle(dependencies: Dependencies) {
  const { resetFamilyScope, syncNow } = dependencies;
  const {
    activeChildId,
    activities,
    childBadges,
    groups,
    isDemoSession,
    isLoaded,
    kudos,
    logs,
    parentPin,
    profiles,
    experience,
    redemptions,
    rewards,
    storageMode,
  } = dependencies.state;
  const {
    setActiveChildId,
    setActivities,
    setChildBadges,
    setCloudSyncActive,
    setFamilyId,
    setGroups,
    setIsDemoSession,
    setIsLoaded,
    setIsOnboardingOpen,
    setIsParentUnlocked,
    setKudos,
    setLogs,
    setMode,
    setParentPin,
    setParentProfile,
    setProfiles,
    setExperience,
    setRedemptions,
    setRewards,
    setStorageMode,
  } = dependencies.setters;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    queueMicrotask(() => {
      try {
        const hydration = loadLocalFamilyState(
          localStorage,
          sessionStorage,
          () => crypto.randomUUID(),
        );
        if (hydration.kind === 'demo') {
          setExperience(emptyExperienceState);
          setProfiles(INITIAL_PROFILES);
          setActiveChildId(INITIAL_PROFILES[0]?.id || null);
          setActivities(INITIAL_ACTIVITIES);
          setRewards(INITIAL_REWARDS);
          setGroups(INITIAL_GROUPS);
          setStorageMode('local');
          setIsDemoSession(true);
          return;
        }
        if (hydration.pin) setParentPin(hydration.pin);
        setFamilyId(hydration.familyId);
        setStorageMode(hydration.storageMode);
        setParentProfile(hydration.parentProfile);
        setProfiles(hydration.profiles);
        setExperience(hydration.experience);
        setActiveChildId(hydration.activeChildId);
        setActivities(hydration.activities);
        setLogs(hydration.logs);
        setRewards(hydration.rewards);
        setRedemptions(hydration.redemptions);
        setChildBadges(hydration.childBadges);
        setGroups(hydration.groups);
        setKudos(hydration.kudos);
      } catch (error: unknown) {
        console.error('Error loading local data:', error);
      } finally {
        setIsLoaded(true);
        setCloudSyncActive(isSupabaseConfigured());
      }
    });
  }, [
    setActiveChildId,
    setActivities,
    setChildBadges,
    setCloudSyncActive,
    setFamilyId,
    setGroups,
    setIsDemoSession,
    setIsLoaded,
    setKudos,
    setLogs,
    setParentPin,
    setParentProfile,
    setProfiles,
    setExperience,
    setRedemptions,
    setRewards,
    setStorageMode,
  ]);

  useEffect(() => {
    if (!isLoaded || isDemoSession || typeof window === 'undefined') return;
    persistLocalFamilyState(localStorage, {
      pin: parentPin,
      storageMode,
      activeChildId,
      profiles,
      activities,
      logs,
      rewards,
      redemptions,
      childBadges,
      groups,
      kudos,
    });
    if (storageMode === 'local') saveLocalExperience(localStorage, experience);
  }, [
    activeChildId,
    activities,
    childBadges,
    groups,
    isDemoSession,
    isLoaded,
    kudos,
    logs,
    parentPin,
    profiles,
    experience,
    redemptions,
    rewards,
    storageMode,
  ]);

  useEffect(() => {
    if (isLoaded && isSupabaseConfigured()) queueMicrotask(() => void syncNow());
  }, [isLoaded, syncNow]);

  const startLocalFamilySetup = (): void => {
    resetFamilyScope();
    setIsDemoSession(false);
    const localFamilyId = crypto.randomUUID();
    setFamilyId(localFamilyId);
    setStorageMode('local');
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}family_id`, localFamilyId);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}storage_mode`, 'local');
    setIsOnboardingOpen(true);
  };

  const startDemoSession = (): void => {
    setExperience(emptyExperienceState);
    setMode('kid');
    setIsParentUnlocked(false);
    setParentPin('1234');
    setProfiles(INITIAL_PROFILES);
    setActiveChildId(INITIAL_PROFILES[0]?.id || null);
    setActivities(INITIAL_ACTIVITIES);
    setLogs([]);
    setRewards(INITIAL_REWARDS);
    setRedemptions([]);
    setChildBadges([]);
    setGroups(INITIAL_GROUPS);
    setKudos([]);
    setStorageMode('local');
    setIsDemoSession(true);
  };

  const deleteLocalFamilyData = (): void => {
    resetFamilyScope();
    setIsDemoSession(false);
    sessionStorage.removeItem('kidhabit_in_app');
    sessionStorage.removeItem('kidhabit_demo_session');
  };

  return { deleteLocalFamilyData, startDemoSession, startLocalFamilySetup };
}
