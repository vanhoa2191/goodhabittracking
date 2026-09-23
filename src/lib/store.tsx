'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ChildProfile,
  HabitActivity,
  ActivityLog,
  Reward,
  Redemption,
  Badge,
  ChildBadge,
  GroupTeam,
  LeaderboardEntry,
  LeaderboardScope,
  LeaderboardPeriod,
  Kudo,
  SubscriptionPlan,
  PricingPlan,
  AgeStage,
  ParentProfile,
} from '@/types';
import {
  DEFAULT_BADGES,
} from './constants';
import { getPricingPlan } from './payos';
import { sounds } from './sound';
import { isSupabaseConfigured } from './supabase';
import { emptyExperienceState, parseChildWishlist } from './experience-state';
import { createSessionTracker, sessionMode } from './product-analytics';
import type { ExperienceState } from './experience-state';
import { generateAgeAdaptedHabits } from './wit-framework';
import type { User } from '@supabase/supabase-js';
import { createActivityActions } from './store/activity-actions';
import { createHabitActions } from './store/habit-actions';
import { createProfileActions } from './store/profile-actions';
import { createRewardActions } from './store/reward-actions';
import { createSocialActions } from './store/social-actions';
import { markLocalLetterRead, openLocalLetter } from './store/local-letter-actions';
import { requestTrialActivation } from './store/trial-activation-client';
import { exportFamilyData, importFamilyData } from './store/family-backup-actions';
import {
  clearFamilyScopedStorage,
  LOCAL_STORAGE_PREFIX,
} from './store/local-family-persistence';
import { usePairingLifecycle } from './store/use-pairing-lifecycle';
import { useLocalFamilyLifecycle } from './store/use-local-family-lifecycle';
import { useCloudFamilyIdentity } from './store/use-cloud-family-identity';
import { buildLeaderboard } from './store/leaderboard';
import { buildSubscriptionDetails, checkIsPro } from './store/subscription';
import { adjustProfilePoints } from './store/local-domain-actions';

interface AppStoreContextType {
  isEntryReady: boolean;
  mode: 'kid' | 'parent';
  setMode: (mode: 'kid' | 'parent') => void;
  parentPin: string;
  isParentUnlocked: boolean;
  unlockParent: (enteredPin: string) => boolean;
  lockParent: () => void;
  updateParentPin: (newPin: string) => void;

  currentUser: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  // Parent Profile & Onboarding
  parentProfile: ParentProfile | null;
  updateParentProfile: (profile: Partial<ParentProfile>) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  startLocalFamilySetup: () => void;
  startDemoSession: () => void;
  deleteLocalFamilyData: () => void;

  // 16 Portraits & 7 Givings Framework Modal
  isPortraitModalOpen: boolean;
  setIsPortraitModalOpen: (open: boolean) => void;
  applyAgeHabitsBundle: (childId: string, stage: AgeStage) => Promise<boolean>;

  // Subscription & Pro Features
  isPro: boolean;
  subscriptionPlan: SubscriptionPlan;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  activateFreeTrial: () => Promise<{ success: boolean; error?: string }>;
  getSubscriptionDetails: () => {
    isPro: boolean;
    plan: SubscriptionPlan;
    label: string;
    daysRemaining: number | null;
    statusText: string;
  };
  isPricingModalOpen: boolean;
  setIsPricingModalOpen: (open: boolean) => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  checkoutPlan: PricingPlan | null;
  openPricingModal: () => void;
  openCheckoutModal: (planId: SubscriptionPlan) => void;
  closeCheckoutModal: () => void;

  storageMode: 'local' | 'cloud';
  setStorageMode: (mode: 'local' | 'cloud') => void;

  profiles: ChildProfile[];
  experience: ExperienceState;
  chooseWishlist: (rewardId: string) => Promise<boolean>;
  ensureLocalDailyLetter: (childId: string, date: string, templateKey: string) => void;
  markLocalDailyLetterRead: (childId: string, date: string, templateKey: string) => void;
  activeChildId: string | null;
  activeChild: ChildProfile | null;
  setActiveChildId: (id: string) => void;
  createProfile: (profile: Omit<ChildProfile, 'id' | 'createdAt'>) => Promise<boolean>;
  updateProfile: (id: string, updates: Partial<ChildProfile>) => Promise<boolean>;
  deleteProfile: (id: string) => Promise<boolean>;
  adjustPoints: (childId: string, amount: number, reason?: string) => void;
  updateActiveAvatar: (avatar: string, themeColor: string) => Promise<boolean>;

  activities: HabitActivity[];
  createActivity: (activity: Omit<HabitActivity, 'id' | 'createdAt'>) => Promise<boolean>;
  createActivities: (
    activities: readonly Omit<HabitActivity, 'id' | 'createdAt'>[],
  ) => Promise<boolean>;
  updateActivity: (id: string, updates: Partial<HabitActivity>) => Promise<boolean>;
  deleteActivity: (id: string) => Promise<boolean>;

  logs: ActivityLog[];
  toggleActivity: (activityId: string, dateStr: string) => Promise<boolean>;
  approveLog: (logId: string) => void;
  rejectLog: (logId: string) => void;

  rewards: Reward[];
  createReward: (reward: Omit<Reward, 'id' | 'createdAt'>) => Promise<boolean>;
  updateReward: (id: string, updates: Partial<Reward>) => Promise<boolean>;
  deleteReward: (id: string) => Promise<boolean>;

  redemptions: Redemption[];
  claimReward: (rewardId: string) => Promise<boolean>;
  approveRedemption: (redemptionId: string) => void;
  deliverRedemption: (redemptionId: string) => void;
  rejectRedemption: (redemptionId: string) => void;

  badges: Badge[];
  childBadges: ChildBadge[];

  // Group & Leaderboard
  groups: GroupTeam[];
  createGroup: (group: Omit<GroupTeam, 'id' | 'inviteCode' | 'createdAt'>) => Promise<boolean>;
  joinGroup: (inviteCode: string) => Promise<boolean>;
  updateGroupReward: (groupId: string, rewardType: GroupTeam['rewardType'], customRewardText?: string) => Promise<boolean>;
  kudos: Kudo[];
  sendKudo: (toChildId: string, emoji?: string) => Promise<boolean>;
  getLeaderboard: (scope: LeaderboardScope, period: LeaderboardPeriod) => LeaderboardEntry[];

  cloudSyncActive: boolean;
  lastSyncTime: string | null;
  syncNow: () => Promise<void>;

  // Family Device Pairing Code (Per-Child)
  familyId: string | null;
  childCodes: Record<string, string>; // childId -> code
  isFamilyConnected: boolean;
  isConnectModalOpen: boolean;
  setIsConnectModalOpen: (open: boolean) => void;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  generateChildCodes: () => Promise<Record<string, string>>;
  regenerateChildCode: (childId: string) => Promise<string | null>;
  connectWithFamilyCode: (code: string) => Promise<{ success: boolean; message?: string; childName?: string; childAvatar?: string; familyName?: string }>;
  disconnectFamilyCode: () => void;

  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

const AppStoreContext = createContext<AppStoreContextType | undefined>(undefined);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIdentityReady, setIsIdentityReady] = useState(false);
  const [isPairingReady, setIsPairingReady] = useState(false);
  const [mode, setModeState] = useState<'kid' | 'parent'>('kid');
  const [isParentUnlocked, setIsParentUnlocked] = useState(false);
  const [parentPin, setParentPin] = useState('1234');

  const [storageMode, setStorageModeState] = useState<'local' | 'cloud'>('cloud');

  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [experience, setExperience] = useState<ExperienceState>(emptyExperienceState);
  const [activeChildId, setActiveChildIdState] = useState<string | null>(null);
  const [activities, setActivities] = useState<HabitActivity[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [badges] = useState<Badge[]>(DEFAULT_BADGES);
  const [childBadges, setChildBadges] = useState<ChildBadge[]>([]);

  // Groups and Kudos
  const [groups, setGroups] = useState<GroupTeam[]>([]);
  const [kudos, setKudos] = useState<Kudo[]>([]);

  const [cloudSyncActive, setCloudSyncActive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const onIdentityReady = useCallback(() => setIsIdentityReady(true), []);
  const onIdentityUser = useCallback(() => {
    setIsParentUnlocked(true);
    setModeState('parent');
  }, []);
  const onPairingReady = useCallback(() => setIsPairingReady(true), []);

  // Subscription & Pro Status
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>('free');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null);

  // Modals for Pricing & Checkout
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);

  // Parent Profile & Onboarding & 16 Portraits
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isPortraitModalOpen, setIsPortraitModalOpen] = useState(false);

  // Family Device Pairing Code (Per-Child)
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [childCodes, setChildCodes] = useState<Record<string, string>>({});
  const [isFamilyConnected, setIsFamilyConnected] = useState(false);
  const [childSessionRevision, setChildSessionRevision] = useState(0);
  const noteChildSessionHydrated = useCallback(() => setChildSessionRevision((revision) => revision + 1), []);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isDemoSession, setIsDemoSession] = useState(false);
  const sessionTracker = useRef(createSessionTracker());
  const wishlistRequestVersion = useRef(0);

  useEffect(() => {
    const selectedMode = sessionMode({
      isLoaded,
      mode,
      activeChildId,
      isDemoSession,
      isFamilyConnected,
      hasCloudSnapshot: Boolean(currentUser && lastSyncTime),
      storageMode,
    });
    if (selectedMode) sessionTracker.current.enter(selectedMode, activeChildId);
    else sessionTracker.current.leave();
  }, [activeChildId, currentUser, isDemoSession, isFamilyConnected, isLoaded, lastSyncTime, mode, storageMode]);

  const openConnectModal = () => setIsConnectModalOpen(true);
  const closeConnectModal = () => setIsConnectModalOpen(false);

  const resetFamilyScope = useCallback(() => {
    setModeState('kid');
    setIsParentUnlocked(false);
    setParentPin('1234');
    setProfiles([]);
    setExperience(emptyExperienceState);
    setActiveChildIdState(null);
    setActivities([]);
    setLogs([]);
    setRewards([]);
    setRedemptions([]);
    setChildBadges([]);
    setGroups([]);
    setKudos([]);
    setSubscriptionPlan('free');
    setTrialEndsAt(null);
    setSubscriptionEndsAt(null);
    setParentProfile(null);
    setFamilyId(null);
    setChildCodes({});
    setIsFamilyConnected(false);
    setCloudSyncActive(false);
    setLastSyncTime(null);

    if (typeof window !== 'undefined') {
      clearFamilyScopedStorage(localStorage);
    }
  }, []);



  const isPro = checkIsPro(subscriptionPlan, trialEndsAt, subscriptionEndsAt);

  const {
    loginWithGoogle,
    logout,
    syncCloudFamily: syncFromSupabase,
    syncNow,
  } = useCloudFamilyIdentity({
    currentUser,
    onIdentityReady,
    onIdentityUser,
    familyId,
    resetFamilyScope,
    setters: {
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
    },
  });

  const setStorageMode = (newMode: 'local' | 'cloud') => {
    setStorageModeState(newMode);
    if (newMode === 'cloud' && isSupabaseConfigured()) {
      syncNow();
    }
  };

  const {
    deleteLocalFamilyData,
    startDemoSession,
    startLocalFamilySetup,
  } = useLocalFamilyLifecycle({
    resetFamilyScope,
    state: {
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
    },
    setters: {
      setActiveChildId: setActiveChildIdState,
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
      setMode: setModeState,
      setParentPin,
      setParentProfile,
      setProfiles,
      setExperience,
      setRedemptions,
      setRewards,
      setStorageMode: setStorageModeState,
    },
    syncNow,
  });

  // PIN security
  const unlockParent = (enteredPin: string): boolean => {
    if (enteredPin === parentPin) {
      setIsParentUnlocked(true);
      setModeState('parent');
      sounds.playClick();
      return true;
    }
    return false;
  };

  const lockParent = () => {
    setIsParentUnlocked(false);
    setModeState('kid');
    sounds.playClick();
  };

  const setMode = (targetMode: 'kid' | 'parent') => {
    if (isFamilyConnected && !currentUser) return;
    if (targetMode === 'parent' && !currentUser && !isParentUnlocked) {
      // Must unlock through PIN modal
      return;
    }
    setModeState(targetMode);
  };

  const updateParentPin = (newPin: string) => {
    if (/^\d{4}$/.test(newPin)) {
      setParentPin(newPin);
    }
  };

  const {
    connectWithFamilyCode,
    disconnectFamilyCode,
    generateChildCodes,
    refreshChildSession,
    regenerateChildCode,
  } = usePairingLifecycle({
    currentUser,
    isIdentityReady,
    isLoaded,
    onPairingReady,
    mode,
    onHydrateChildSession: noteChildSessionHydrated,
    profiles,
    resetFamilyScope,
    setters: {
      setActivities,
      setActiveChildId: setActiveChildIdState,
      setChildCodes,
      setIsFamilyConnected,
      setLogs,
      setMode: setModeState,
      setProfiles,
      setRedemptions,
      setRewards,
      setStorageMode: setStorageModeState,
    },
  });

  // Active Child
  const activeChild = profiles.find((p) => p.id === activeChildId) || profiles[0] || null;

  useEffect(() => {
    if (storageMode !== 'cloud' || currentUser || !isFamilyConnected || !activeChildId) return;
    const requestVersion = ++wishlistRequestVersion.current;
    const controller = new AbortController();
    void fetch('/api/child/wishlist', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const body: unknown = await response.json();
        if (!body || typeof body !== 'object' || !('wishlist' in body)) return;
        const wishlist = body.wishlist === null ? null : parseChildWishlist(body.wishlist);
        if (controller.signal.aborted || wishlistRequestVersion.current !== requestVersion) return;
        setExperience((previous) => ({
          ...previous,
          wishlists: [...previous.wishlists.filter((row) => row.child_id !== activeChildId), ...(wishlist ? [wishlist] : [])],
        }));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [activeChildId, childSessionRevision, currentUser, isFamilyConnected, storageMode]);

  const chooseWishlist = async (rewardId: string): Promise<boolean> => {
    if (!activeChildId || !rewards.some((reward) => reward.id === rewardId && reward.isActive)) return false;
    if (storageMode === 'local') {
      const now = new Date().toISOString();
      setExperience((previous) => ({
        ...previous,
        wishlists: [
          ...previous.wishlists.filter((row) => row.child_id !== activeChildId),
          { family_id: familyId ?? '00000000-0000-4000-8000-000000000000', child_id: activeChildId, reward_id: rewardId, chosen_at: now },
        ],
      }));
      return true;
    }
    try {
      const paired = !currentUser && isFamilyConnected;
      const response = await fetch(paired ? '/api/child/wishlist' : '/api/domain/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paired ? { rewardId } : { type: 'chooseWishlist', childId: activeChildId, rewardId }),
      });
      if (!response.ok) return false;
      if (paired) {
        const body: unknown = await response.json();
        if (!body || typeof body !== 'object' || !('wishlist' in body)) return false;
        const wishlist = parseChildWishlist(body.wishlist);
        wishlistRequestVersion.current += 1;
        setExperience((previous) => ({
          ...previous,
          wishlists: [...previous.wishlists.filter((row) => row.child_id !== activeChildId), wishlist],
        }));
        return true;
      }
      return await syncFromSupabase(currentUser);
    } catch {
      return false;
    }
  };

  const setActiveChildId = (id: string) => {
    setActiveChildIdState(id);
    sounds.playClick();
  };

  const openOnboarding = () => {
    sounds.playClick();
    setIsOnboardingOpen(true);
  };

  const closeOnboarding = () => {
    setIsOnboardingOpen(false);
  };

  const updateParentProfile = (profileUpdates: Partial<ParentProfile>) => {
    setParentProfile((prev) => {
      const updated: ParentProfile = {
        name: profileUpdates.name || prev?.name || 'Phụ huynh',
        role: profileUpdates.role || prev?.role || 'mother',
        phoneOrEmail: profileUpdates.phoneOrEmail || prev?.phoneOrEmail,
        onboardedAt: prev?.onboardedAt || new Date().toISOString(),
        ...profileUpdates,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}parent_profile`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const applyAgeHabitsBundle = async (childId: string, stage: AgeStage): Promise<boolean> => {
    const starterHabits = generateAgeAdaptedHabits(childId, stage);
    const saved = await createActivities(starterHabits);
    if (!saved) return false;
    sounds.playSuccess();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, disableForReducedMotion: true });
    return true;
  };

  const profileActions = createProfileActions({
    activeChildId,
    currentUser,
    experience,
    familyId,
    profiles,
    setActiveChildId: setActiveChildIdState,
    setActivities,
    setCloudSyncActive,
    setExperience,
    setProfiles,
    storageMode,
    syncCloudFamily: syncFromSupabase,
  });

  // Profile Management
  const createProfile = async (
    profileData: Omit<ChildProfile, 'id' | 'createdAt'>,
  ): Promise<boolean> => {
    // Enforce Free plan limit (1 child max)
    if (!isPro && profiles.length >= 1) {
      sounds.playClick();
      alert('Gói Miễn Phí (Starter) hỗ trợ tối đa 1 bé. Vui lòng kích hoạt Dùng thử 7 ngày hoặc nâng cấp Pro để quản lý không giới hạn số bé!');
      setIsPricingModalOpen(true);
      return false;
    }
    return profileActions.createProfile(profileData);
  };

  const updateProfile = profileActions.updateProfile;
  const deleteProfile = profileActions.deleteProfile;

  const adjustPoints = (childId: string, amount: number) => {
    setProfiles((prev) => adjustProfilePoints(prev, childId, amount));
  };

  // Activity Management
  const {
    createActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  } = createActivityActions({
    currentUser,
    familyId,
    setActivities,
    setCloudSyncActive,
    storageMode,
    syncCloudFamily: syncFromSupabase,
  });

  const { approveLog, rejectLog, toggleActivity } = createHabitActions({
    cloud: {
      currentUser,
      familyId,
      isFamilyConnected,
      refreshChildSession,
      setCloudSyncActive,
      syncCloudFamily: syncFromSupabase,
    },
    state: {
      activeChildId,
      activities,
      profiles,
      logs,
      childBadges,
      setProfiles,
      setLogs,
      setChildBadges,
    },
    storageMode,
  });

  const rewardActions = createRewardActions({
    activeChildId,
    currentUser,
    familyId,
    isFamilyConnected,
    profiles,
    redemptions,
    rewards,
    setCloudSyncActive,
    setProfiles,
    setRedemptions,
    setRewards,
    storageMode,
    refreshChildSession,
    syncCloudFamily: syncFromSupabase,
  });
  const {
    approveRedemption,
    claimReward,
    createReward,
    deleteReward,
    deliverRedemption,
    rejectRedemption,
    updateReward,
  } = rewardActions;

  // Quick avatar & color update for active child
  const updateActiveAvatar = async (avatar: string, themeColor: string): Promise<boolean> => {
    if (!activeChildId) return false;
    let saved: boolean;
    if (storageMode === 'cloud' && !currentUser && isFamilyConnected) {
      try {
        const response = await fetch('/api/child/mascot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar, themeColor }),
        });
        saved = response.ok && await refreshChildSession();
      } catch {
        saved = false;
      }
    } else {
      saved = await updateProfile(activeChildId, { avatar, themeColor });
    }
    if (!saved) return false;
    sounds.playFanfare();
    try {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 }, disableForReducedMotion: true });
    } catch {}
    return true;
  };

  const ensureLocalDailyLetter = useCallback((childId: string, date: string, templateKey: string): void => {
    if (storageMode !== 'local') return;
    setExperience((previous) => openLocalLetter(
      previous,
      familyId ?? '00000000-0000-4000-8000-000000000000',
      childId,
      date,
      templateKey,
    ));
  }, [familyId, storageMode]);

  const markLocalDailyLetterRead = (childId: string, date: string, templateKey: string): void => {
    if (storageMode !== 'local') return;
    setExperience((previous) => markLocalLetterRead(openLocalLetter(
      previous,
      familyId ?? '00000000-0000-4000-8000-000000000000',
      childId,
      date,
      templateKey,
    ), childId, date, new Date().toISOString()));
  };

  const {
    createGroup,
    joinGroup,
    sendKudo,
    updateGroupReward,
  } = createSocialActions({
    cloud: {
      currentUser,
      familyId,
      setCloudSyncActive,
      syncCloudFamily: syncFromSupabase,
    },
    state: {
      activeChild,
      groups,
      setGroups,
      setKudos,
    },
    storageMode,
  });

  // Leaderboard Calculation across scopes (global, group, family) and periods (daily, weekly, monthly)
  const getLeaderboard = (
    scope: LeaderboardScope,
    period: LeaderboardPeriod
  ): LeaderboardEntry[] => buildLeaderboard({
    profiles,
    logs,
    activeChildId,
    scope,
    period,
  });

  // Data Export & Import
  const exportData = (): string => exportFamilyData({
      pin: parentPin,
      storageMode,
      activeChildId,
      parentProfile,
      subscriptionPlan,
      trialEndsAt,
      subscriptionEndsAt,
      profiles,
      activities,
      logs,
      rewards,
      redemptions,
      childBadges,
      groups,
      kudos,
    });

  const importData = (jsonData: string): boolean => importFamilyData(
    jsonData,
    (parsed) => {
      if (parsed.pin) setParentPin(parsed.pin);
      setStorageModeState(parsed.storageMode ?? 'local');
      setParentProfile(parsed.parentProfile ?? null);
      setSubscriptionPlan(parsed.subscriptionPlan ?? 'free');
      setTrialEndsAt(parsed.trialEndsAt ?? null);
      setSubscriptionEndsAt(parsed.subscriptionEndsAt ?? null);
      setProfiles(parsed.profiles);
      setActivities(parsed.activities);
      setLogs(parsed.logs);
      setRewards(parsed.rewards);
      setRedemptions(parsed.redemptions);
      setChildBadges(parsed.childBadges);
      setGroups(parsed.groups);
      setKudos(parsed.kudos);
      setActiveChildIdState(parsed.activeChildId);
      setIsDemoSession(false);
    },
    localStorage,
    sessionStorage,
  );

  // Subscription Operations
  const activateFreeTrial = async (): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Vui lòng đăng nhập để kích hoạt dùng thử.' };

    const result = await requestTrialActivation();
    if (!result.success) return result;

    await syncFromSupabase(currentUser);
    sounds.playFanfare();
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
    return { success: true };
  };

  const getSubscriptionDetails = () => buildSubscriptionDetails(
    subscriptionPlan,
    trialEndsAt,
    subscriptionEndsAt,
    isPro,
  );

  const openPricingModal = () => {
    sounds.playClick();
    setIsPricingModalOpen(true);
  };

  const openCheckoutModal = (planId: SubscriptionPlan) => {
    sounds.playClick();
    const plan = getPricingPlan(planId);
    setCheckoutPlan(plan);
    setIsPricingModalOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const closeCheckoutModal = () => {
    setIsCheckoutModalOpen(false);
    setCheckoutPlan(null);
  };

  return (
    <AppStoreContext.Provider
      value={{
        isEntryReady: isLoaded && isIdentityReady && isPairingReady,
        mode,
        setMode,
        parentPin,
        isParentUnlocked,
        unlockParent,
        lockParent,
        updateParentPin,

        currentUser,
        loginWithGoogle,
        logout,

        // Parent Profile & Onboarding
        parentProfile,
        updateParentProfile,
        isOnboardingOpen,
        setIsOnboardingOpen,
        openOnboarding,
        closeOnboarding,
        startLocalFamilySetup,
        startDemoSession,
        deleteLocalFamilyData,

        // 16 Portraits & 7 Givings Framework
        isPortraitModalOpen,
        setIsPortraitModalOpen,
        applyAgeHabitsBundle,

        // Subscription & Pro
        isPro,
        subscriptionPlan,
        trialEndsAt,
        subscriptionEndsAt,
        activateFreeTrial,
        getSubscriptionDetails,
        isPricingModalOpen,
        setIsPricingModalOpen,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        checkoutPlan,
        openPricingModal,
        openCheckoutModal,
        closeCheckoutModal,

        storageMode,
        setStorageMode,

        profiles,
        experience,
        chooseWishlist,
        ensureLocalDailyLetter,
        markLocalDailyLetterRead,
        activeChildId,
        activeChild,
        setActiveChildId,
        createProfile,
        updateProfile,
        deleteProfile,
        adjustPoints,
        updateActiveAvatar,

        activities,
        createActivity,
        createActivities,
        updateActivity,
        deleteActivity,

        logs,
        toggleActivity,
        approveLog,
        rejectLog,

        rewards,
        createReward,
        updateReward,
        deleteReward,

        redemptions,
        claimReward,
        approveRedemption,
        deliverRedemption,
        rejectRedemption,

        badges,
        childBadges,

        groups,
        createGroup,
        joinGroup,
        updateGroupReward,
        kudos,
        sendKudo,
        getLeaderboard,

        cloudSyncActive,
        lastSyncTime,
        syncNow,

        // Family Device Pairing Code
        familyId,
        childCodes,
        isFamilyConnected,
        isConnectModalOpen,
        setIsConnectModalOpen,
        openConnectModal,
        closeConnectModal,
        generateChildCodes,
        regenerateChildCode,
        connectWithFamilyCode,
        disconnectFamilyCode,

        exportData,
        importData,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
}
