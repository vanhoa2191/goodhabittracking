'use client';

import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { z } from 'zod';
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
import { emptyExperienceState, mergeHabitPrograms, parseChildWishlist, parseDeferredTask, setDeferredTask as updateDeferredTask } from './experience-state';
import { createProductAnalyticsGate, createSessionTracker, recordLocalWishlistSelection, sessionMode } from './product-analytics';
import type { ProductEventSink } from './product-analytics';
import type { ExperienceState, FamilyPausePeriod } from './experience-state';
import { generateAgeAdaptedHabits } from './wit-framework';
import type { User } from '@supabase/supabase-js';
import { createActivityActions } from './store/activity-actions';
import { createHabitActions } from './store/habit-actions';
import { createProfileActions } from './store/profile-actions';
import type { ProfileCreateResult } from './store/profile-actions';
import { createRewardActions } from './store/reward-actions';
import { createSocialActions } from './store/social-actions';
import { createFamilyPauseAction } from './store/family-pause-actions';
import { markLocalLetterRead, openLocalLetter } from './store/local-letter-actions';
import { loadChildTaskDeferrals } from './store/task-deferral-client';
import { createHabitProgramActions } from './store/habit-program-actions';
import { loadChildHabitPrograms } from './store/habit-programs-client';
import type { CuePlanInput } from './habit-programs/cue-plan-input';
import type { SupportLevel } from './habit-programs/types';
import { createJournalActions } from './store/journal-actions';
import { loadChildJournal, mergeChildJournalEntries } from './store/journal-client';
import { requestTrialActivation } from './store/trial-activation-client';
import {
  changeParentPin,
  readParentPinStatus,
  verifyParentPin,
} from './store/parent-pin-client';
import type {
  ParentPinChange,
  ParentPinStatus,
  ParentPinVerification,
} from './store/parent-pin-client';
import {
  clearDemoFamilyState,
  clearFamilyScopedStorage,
} from './store/local-family-persistence';
import { usePairingLifecycle } from './store/use-pairing-lifecycle';
import { useLocalFamilyLifecycle } from './store/use-local-family-lifecycle';
import { useCloudFamilyIdentity } from './store/use-cloud-family-identity';
import type { FamilyRole } from './store/cloud-family-sync';
import { buildLeaderboard } from './store/leaderboard';
import { buildSubscriptionDetails, checkIsPro } from './store/subscription';
import { adjustProfilePoints } from './store/local-domain-actions';
import { getMascot } from './mascots';
import { defaultExperienceFlags } from './experience-flags';
import { buildLocalCityItem, cityItems, parseCityPurchase, parseCityPurchases } from './dream-city';
import type { CityItemId } from './dream-city';

interface AppStoreContextType {
  isEntryReady: boolean;
  mode: 'kid' | 'parent';
  setMode: (mode: 'kid' | 'parent') => void;
  parentPinConfigured: boolean | null;
  isParentUnlocked: boolean;
  refreshParentPinStatus: () => Promise<ParentPinStatus>;
  unlockParent: (enteredPin: string) => Promise<ParentPinVerification>;
  lockParent: () => void;
  updateParentPin: (input: { readonly currentPin?: string; readonly newPin: string }) => Promise<ParentPinChange>;

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
  startDemoSession: () => void;

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
  isDemoSession: boolean;

  profiles: ChildProfile[];
  experience: ExperienceState;
  isFamilyPaused: boolean;
  familyPausePeriods: readonly FamilyPausePeriod[];
  setFamilyPaused: (paused: boolean) => Promise<boolean>;
  chooseWishlist: (rewardId: string) => Promise<boolean>;
  setTaskDeferred: (activityId: string, date: string, deferred: boolean) => Promise<boolean>;
  recordHabitSupport: (logId: string, level: SupportLevel) => Promise<boolean>;
  saveHabitCuePlan: (activityId: string, input: CuePlanInput, childId?: string) => Promise<boolean>;
  saveJournalEntry: (date: string, text: string) => Promise<boolean>;
  buildCityItem: (itemId: CityItemId) => Promise<'built' | 'already_built' | 'insufficient_points' | 'error'>;
  ensureLocalDailyLetter: (childId: string, date: string, templateKey: string) => void;
  markLocalDailyLetterRead: (childId: string, date: string, templateKey: string) => void;
  recordCloudDailyLetterRead: () => void;
  activeChildId: string | null;
  activeChild: ChildProfile | null;
  setActiveChildId: (id: string) => void;
  createProfile: (
    profile: Omit<ChildProfile, 'id' | 'createdAt'>,
    requestId?: string,
  ) => Promise<ProfileCreateResult>;
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
  familyRole: FamilyRole | null;
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

}

const AppStoreContext = createContext<AppStoreContextType | undefined>(undefined);

export function AppStoreProvider({ children, analyticsSink, analyticsOptIn = false }: {
  children: React.ReactNode;
  analyticsSink?: ProductEventSink;
  analyticsOptIn?: boolean;
}) {
  const permittedAnalyticsSink = analyticsOptIn ? analyticsSink : undefined;
  const analyticsGate = useMemo(() => createProductAnalyticsGate(), []);
  useLayoutEffect(() => {
    analyticsGate.setSink(permittedAnalyticsSink);
    return () => analyticsGate.setSink(undefined);
  }, [analyticsGate, permittedAnalyticsSink]);
  const guardedAnalyticsSink = useCallback<ProductEventSink>((event) => {
    analyticsGate.record(event);
  }, [analyticsGate]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIdentityReady, setIsIdentityReady] = useState(false);
  const [isPairingReady, setIsPairingReady] = useState(false);
  const [mode, setModeState] = useState<'kid' | 'parent'>('kid');
  const [isParentUnlocked, setIsParentUnlocked] = useState(false);
  const [parentPin, setParentPin] = useState<string | null>(null);
  const [parentPinConfigured, setParentPinConfigured] = useState<boolean | null>(false);

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
  const [isDemoSession, setIsDemoSession] = useState(false);
  const identityModeInitializedRef = useRef(false);
  const onIdentityReady = useCallback(() => setIsIdentityReady(true), []);
  const onIdentityStart = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('kidhabit_demo_session') === 'true') {
        setStorageModeState('cloud');
      }
      clearDemoFamilyState(sessionStorage);
      sessionStorage.removeItem('kidhabit_demo_session');
    }
    setIsDemoSession(false);
    setParentPinConfigured(null);
  }, []);
  const onIdentityUser = useCallback(() => {
    if (identityModeInitializedRef.current) return;
    identityModeInitializedRef.current = true;
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
  const [familyRole, setFamilyRole] = useState<FamilyRole | null>(null);
  const [childCodes, setChildCodes] = useState<Record<string, string>>({});
  const [isFamilyConnected, setIsFamilyConnected] = useState(false);
  const [pairedFamilyPausedAt, setPairedFamilyPausedAt] = useState<string | null>(null);
  const [pairedFamilyPausePeriods, setPairedFamilyPausePeriods] = useState<FamilyPausePeriod[]>([]);
  const [childSessionRevision, setChildSessionRevision] = useState(0);
  const noteChildSessionHydrated = useCallback(() => setChildSessionRevision((revision) => revision + 1), []);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const sessionTracker = useMemo(() => createSessionTracker(guardedAnalyticsSink), [guardedAnalyticsSink]);
  const wishlistRequestVersion = useRef(0);
  const deferralRequestVersion = useRef(0);
  const journalScopeVersion = useRef(0);
  const cityScopeVersion = useRef(0);
  const habitProgramScope = useRef(0);
  const pendingCityItems = useRef(new Set<string>());
  const locallyBuiltCityItems = useRef(new Set<string>());
  const localCityBalances = useRef(new Map<string, number>());
  const localWishlistSelections = useRef(new Map<string, string>());
  const recordedLocalLetterReads = useRef(new Set<string>());

  useEffect(() => {
    localWishlistSelections.current.clear();
    if (!isDemoSession) return;
    for (const selection of experience.wishlists) {
      localWishlistSelections.current.set(selection.child_id, selection.reward_id);
    }
  }, [experience.wishlists, isDemoSession]);

  useEffect(() => {
    localCityBalances.current = new Map(profiles.map((profile) => [profile.id, profile.points]));
  }, [profiles]);

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
    if (selectedMode) sessionTracker.enter(selectedMode, activeChildId);
    else sessionTracker.leave();
  }, [activeChildId, currentUser, isDemoSession, isFamilyConnected, isLoaded, lastSyncTime, mode, sessionTracker, storageMode]);

  const openConnectModal = () => setIsConnectModalOpen(true);
  const closeConnectModal = () => setIsConnectModalOpen(false);

  const resetFamilyScope = useCallback(() => {
    identityModeInitializedRef.current = false;
    journalScopeVersion.current += 1;
    cityScopeVersion.current += 1;
    habitProgramScope.current += 1;
    pendingCityItems.current.clear();
    locallyBuiltCityItems.current.clear();
    localCityBalances.current.clear();
    setModeState('kid');
    setIsParentUnlocked(false);
    setParentPin(null);
    setParentPinConfigured(false);
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
    setFamilyRole(null);
    setChildCodes({});
    setIsFamilyConnected(false);
    setPairedFamilyPausedAt(null);
    setPairedFamilyPausePeriods([]);
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
    onIdentityStart,
    onIdentityUser,
    familyId,
    resetFamilyScope,
    setters: {
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
    },
  });

  const {
    startDemoSession: beginDemoSession,
  } = useLocalFamilyLifecycle({
    state: {
      activeChildId,
      activities,
      childBadges,
      groups,
      isDemoSession,
      isLoaded,
      kudos,
      logs,
      parentProfile,
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

  const startDemoSession = () => {
    cityScopeVersion.current += 1;
    pendingCityItems.current.clear();
    locallyBuiltCityItems.current.clear();
    localCityBalances.current.clear();
    setParentPinConfigured(false);
    beginDemoSession();
  };

  // PIN security
  const refreshParentPinStatus = useCallback(async (): Promise<ParentPinStatus> => {
    if (!currentUser) {
      const status = { configured: parentPin !== null, lockedUntil: null };
      setParentPinConfigured(status.configured);
      return status;
    }
    const status = await readParentPinStatus();
    setParentPinConfigured(status.configured);
    return status;
  }, [currentUser, parentPin]);

  const unlockParent = async (enteredPin: string): Promise<ParentPinVerification> => {
    const result = currentUser
      ? await verifyParentPin(enteredPin)
      : parentPin === null
        ? { status: 'setup_required' as const }
        : enteredPin === parentPin
          ? { status: 'verified' as const }
          : { status: 'invalid' as const };
    if (result.status === 'verified') {
      setIsParentUnlocked(true);
      setModeState('parent');
      sounds.playClick();
      setParentPinConfigured(true);
    }
    if (result.status === 'setup_required') setParentPinConfigured(false);
    return result;
  };

  const lockParent = () => {
    setIsParentUnlocked(false);
    setModeState('kid');
    sounds.playClick();
  };

  const setMode = (targetMode: 'kid' | 'parent') => {
    if (isFamilyConnected && !currentUser) return;
    if (targetMode === 'parent' && !isParentUnlocked) return;
    setModeState(targetMode);
  };

  const updateParentPin = async (input: { readonly currentPin?: string; readonly newPin: string }): Promise<ParentPinChange> => {
    if (!/^\d{4}$/.test(input.newPin)) return { status: 'invalid_format' };
    if (currentUser) {
      const result = await changeParentPin(input);
      if (result.status === 'updated') {
        setParentPinConfigured(true);
        setIsParentUnlocked(true);
        setModeState('parent');
      }
      return result;
    }
    if (parentPin !== null && input.currentPin !== parentPin) return { status: 'invalid_current' };
    setParentPin(input.newPin);
    setParentPinConfigured(true);
    setIsParentUnlocked(true);
    setModeState('parent');
    return { status: 'updated' };
  };

  const {
    connectWithFamilyCode,
    disconnectFamilyCode,
    generateChildCodes,
    refreshChildSession,
    regenerateChildCode,
  } = usePairingLifecycle({
    currentUser,
    isFamilyConnected,
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
      setPairedFamilyPausedAt,
      setPairedFamilyPausePeriods,
      setProfiles,
      setRedemptions,
      setRewards,
      setStorageMode: setStorageModeState,
    },
  });

  // Active Child
  const activeChild = profiles.find((p) => p.id === activeChildId) || profiles[0] || null;

  useEffect(() => {
    if (isDemoSession || currentUser || !isFamilyConnected || !activeChildId) return;
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
  }, [activeChildId, childSessionRevision, currentUser, isDemoSession, isFamilyConnected]);

  useEffect(() => {
    if (!defaultExperienceFlags.dailyJournal
      || isDemoSession || currentUser || !isFamilyConnected || !activeChildId) return;
    let cancelled = false;
    const scopeVersion = journalScopeVersion.current;
    void loadChildJournal()
      .then((result) => {
        if (cancelled || scopeVersion !== journalScopeVersion.current) return;
        if (result.status !== 'ready') return;
        setExperience((previous) => {
          if (scopeVersion !== journalScopeVersion.current) return previous;
          return {
            ...previous,
            journalEntries: mergeChildJournalEntries(previous.journalEntries, result.entries, activeChildId),
          };
        });
      })
      .catch((error: unknown) => {
        if (!(error instanceof Error)) throw error;
        console.warn('Could not load child journal:', error.message);
      });
    return () => { cancelled = true; };
  }, [activeChildId, childSessionRevision, currentUser, isDemoSession, isFamilyConnected]);

  useEffect(() => {
    if (!defaultExperienceFlags.dreamCity
      || isDemoSession || currentUser || !isFamilyConnected || !activeChildId) return;
    let cancelled = false;
    const scopeVersion = cityScopeVersion.current;
    void fetch('/api/child/city', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) {
          if (!cancelled && scopeVersion === cityScopeVersion.current) resetFamilyScope();
          return;
        }
        if (!response.ok) return;
        const payload: unknown = await response.json();
        const parsed = z.object({ purchases: z.unknown() }).safeParse(payload);
        if (!parsed.success || cancelled || scopeVersion !== cityScopeVersion.current) return;
        const loaded = parseCityPurchases(parsed.data.purchases).filter((purchase) => purchase.child_id === activeChildId);
        setExperience((previous) => {
          if (scopeVersion !== cityScopeVersion.current) return previous;
          const purchases = new Map(previous.cityPurchases.map((purchase) => [`${purchase.child_id}:${purchase.item_id}`, purchase]));
          for (const purchase of loaded) purchases.set(`${purchase.child_id}:${purchase.item_id}`, purchase);
          return { ...previous, cityPurchases: [...purchases.values()] };
        });
      })
      .catch((error: unknown) => {
        if (!(error instanceof Error)) throw error;
        console.warn('Could not load child city:', error.message);
      });
    return () => { cancelled = true; };
  }, [activeChildId, childSessionRevision, currentUser, isDemoSession, isFamilyConnected, resetFamilyScope]);

  useEffect(() => {
    if (isDemoSession || currentUser || !isFamilyConnected || !activeChildId) return;
    let cancelled = false;
    const requestVersion = deferralRequestVersion.current;
    void loadChildTaskDeferrals()
      .then((deferredTasks) => {
        if (cancelled || requestVersion !== deferralRequestVersion.current || !deferredTasks) return;
        setExperience((previous) => ({
          ...previous,
          deferredTasks: [
            ...previous.deferredTasks.filter((row) => row.child_id !== activeChildId),
            ...deferredTasks,
          ],
        }));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [activeChildId, childSessionRevision, currentUser, isDemoSession, isFamilyConnected]);

  useEffect(() => {
    if (isDemoSession || currentUser || !isFamilyConnected || !activeChildId) return;
    let cancelled = false;
    void loadChildHabitPrograms()
      .then((loaded) => {
        if (cancelled || !loaded) return;
        setExperience((previous) => mergeHabitPrograms(previous, loaded));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [activeChildId, childSessionRevision, currentUser, isDemoSession, isFamilyConnected]);

  const chooseWishlist = async (rewardId: string): Promise<boolean> => {
    if (!activeChildId || !rewards.some((reward) => reward.id === rewardId && reward.isActive)) return false;
    const selectedChildId = activeChildId;
    const recordLocalSelection = () => {
      const savedRewardId = experience.wishlists.find((row) => row.child_id === selectedChildId)?.reward_id;
      if (!recordLocalWishlistSelection(localWishlistSelections.current, selectedChildId, rewardId, savedRewardId)) return;
      analyticsGate.record({ event: 'wishlist_selected', mode: 'local' });
    };
    if (isDemoSession) {
      const now = new Date().toISOString();
      setExperience((previous) => ({
        ...previous,
        wishlists: [
          ...previous.wishlists.filter((row) => row.child_id !== activeChildId),
          { family_id: familyId ?? '00000000-0000-4000-8000-000000000000', child_id: activeChildId, reward_id: rewardId, chosen_at: now },
        ],
      }));
      recordLocalSelection();
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
        const parsed = z.object({ wishlist: z.unknown(), changed: z.boolean() }).parse(body);
        const wishlist = parseChildWishlist(parsed.wishlist);
        wishlistRequestVersion.current += 1;
        setExperience((previous) => ({
          ...previous,
          wishlists: [...previous.wishlists.filter((row) => row.child_id !== activeChildId), wishlist],
        }));
        if (parsed.changed) analyticsGate.record({ event: 'wishlist_selected', mode: 'cloud' });
        return true;
      }
      const result: unknown = await response.json();
      const parsed = z.object({ success: z.literal(true), changed: z.boolean() }).parse(result);
      if (parsed.changed) analyticsGate.record({ event: 'wishlist_selected', mode: 'cloud' });
      const synced = await syncFromSupabase(currentUser);
      return synced;
    } catch {
      return false;
    }
  };

  const setTaskDeferred = async (activityId: string, date: string, deferred: boolean): Promise<boolean> => {
    if (!activeChildId) return false;
    const childId = activeChildId;
    const activity = activities.find((row) => row.id === activityId);
    if (!activity?.isActive || (activity.childId !== null && activity.childId !== childId)) return false;
    if (deferred && logs.some((log) => log.childId === childId && log.activityId === activityId
      && log.date === date && log.status !== 'rejected')) return false;

    if (isDemoSession) {
      setExperience((previous) => updateDeferredTask(previous, {
        family_id: familyId ?? '00000000-0000-4000-8000-000000000000',
        child_id: childId,
        activity_id: activityId,
        local_date: date,
        deferred_at: new Date().toISOString(),
      }, deferred));
      return true;
    }

    const paired = !currentUser && isFamilyConnected;
    if (!paired && !currentUser) return false;
    try {
      const response = await fetch(paired ? '/api/child/task-deferrals' : '/api/domain/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paired
          ? { activityId, date, deferred }
          : { type: 'setTaskDeferred', childId, activityId, date, deferred }),
      });
      if (!response.ok) return false;
      const result: unknown = await response.json();
      const saved = z.object({ deferredTask: z.unknown().nullable() }).parse(result);
      const canonical = saved.deferredTask === null ? null : parseDeferredTask(saved.deferredTask);
      if (deferred !== (canonical !== null)
        || (canonical && (canonical.child_id !== childId
          || canonical.activity_id !== activityId || canonical.local_date !== date))) return false;
      deferralRequestVersion.current += 1;
      setExperience((previous) => {
        if (canonical) return updateDeferredTask(previous, canonical, true);
        const existing = previous.deferredTasks.find((row) =>
          row.child_id === childId && row.activity_id === activityId && row.local_date === date,
        );
        return existing ? updateDeferredTask(previous, existing, false) : previous;
      });
      return true;
    } catch {
      return false;
    }
  };

  const habitProgramActions = () => createHabitProgramActions({
    activeChildId,
    familyId,
    isDemoSession,
    isSignedInParent: Boolean(currentUser),
    isPairedChild: !currentUser && isFamilyConnected,
    logs,
    activities,
    setExperience,
    getScope: () => habitProgramScope.current,
    track: (event) => analyticsGate.record(event),
  });
  const recordHabitSupport = (logId: string, level: SupportLevel): Promise<boolean> => (
    habitProgramActions().recordSupport(logId, level)
  );
  const saveHabitCuePlan = (activityId: string, input: CuePlanInput, childId?: string): Promise<boolean> => (
    habitProgramActions().saveCuePlan(activityId, input, childId)
  );

  const setFamilyPaused = createFamilyPauseAction({
    currentUser,
    familyId: isDemoSession ? '00000000-0000-4000-8000-000000000000' : familyId,
    setExperience,
    isDemoSession,
    syncCloudFamily: () => currentUser ? syncFromSupabase(currentUser) : Promise.resolve(false),
  });

  const saveJournalEntry = (date: string, text: string): Promise<boolean> => createJournalActions({
    activeChildId,
    familyId,
    hasParentSession: Boolean(currentUser),
    isFamilyConnected,
    getScopeVersion: () => journalScopeVersion.current,
    now: () => new Date(),
    request: fetch,
    setExperience,
    isDemoSession,
  }).saveJournalEntry(date, text);

  const buildCityItem = async (itemId: CityItemId): Promise<'built' | 'already_built' | 'insufficient_points' | 'error'> => {
    if (!defaultExperienceFlags.dreamCity || !activeChild) return 'error';
    const childId = activeChild.id;
    const scopeVersion = cityScopeVersion.current;
    const key = `${scopeVersion}:${childId}`;
    const itemKey = `${scopeVersion}:${childId}:${itemId}`;
    if (pendingCityItems.current.has(key)) return 'error';
    if (isDemoSession && locallyBuiltCityItems.current.has(itemKey)) return 'already_built';
    pendingCityItems.current.add(key);
    try {
      if (isDemoSession) {
        const builtIds = experience.cityPurchases.filter((purchase) => purchase.child_id === childId).map((purchase) => purchase.item_id);
        const outcome = buildLocalCityItem({
          points: localCityBalances.current.get(childId) ?? activeChild.points,
          totalEarned: activeChild.totalEarned,
        }, builtIds, itemId);
        if (outcome.status !== 'built') return outcome.status;
        const item = cityItems.find((candidate) => candidate.id === itemId);
        if (!item || scopeVersion !== cityScopeVersion.current) return 'error';
        const purchase = {
          family_id: familyId ?? '00000000-0000-4000-8000-000000000000',
          child_id: childId,
          item_id: itemId,
          points_spent: item.cost,
          purchased_at: new Date().toISOString(),
        };
        locallyBuiltCityItems.current.add(itemKey);
        localCityBalances.current.set(childId, outcome.points);
        setProfiles((previous) => previous.map((profile) => profile.id === childId ? { ...profile, points: outcome.points } : profile));
        setExperience((previous) => ({ ...previous, cityPurchases: [...previous.cityPurchases, purchase] }));
        return 'built';
      }
      const paired = !currentUser && isFamilyConnected;
      if (!currentUser && !paired) return 'error';
      const response = await fetch(paired ? '/api/child/city' : '/api/domain/city', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(paired ? { itemId } : { childId, itemId }),
      });
      if (response.status === 409) return 'insufficient_points';
      if (!response.ok) return 'error';
      const payload: unknown = await response.json();
      const parsed = z.object({
        status: z.enum(['built', 'already_built']),
        purchase: z.unknown(),
        remainingPoints: z.number().int().nonnegative(),
      }).safeParse(payload);
      if (!parsed.success || scopeVersion !== cityScopeVersion.current) return 'error';
      const purchase = parseCityPurchase(parsed.data.purchase);
      if (purchase.child_id !== childId || purchase.item_id !== itemId
        || (familyId !== null && purchase.family_id !== familyId)) return 'error';
      setProfiles((previous) => previous.map((profile) => profile.id === childId ? { ...profile, points: parsed.data.remainingPoints } : profile));
      setExperience((previous) => previous.cityPurchases.some((row) => row.child_id === childId && row.item_id === itemId)
        ? previous
        : { ...previous, cityPurchases: [...previous.cityPurchases, purchase] });
      return parsed.data.status;
    } catch (error: unknown) {
      if (!(error instanceof Error)) throw error;
      console.warn('Could not build city item:', error.message);
      return 'error';
    } finally {
      pendingCityItems.current.delete(key);
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
    isDemoSession,
    syncCloudFamily: syncFromSupabase,
  });

  // Profile Management
  const createProfile = async (
    profileData: Omit<ChildProfile, 'id' | 'createdAt'>,
    requestId?: string,
  ): Promise<ProfileCreateResult> => {
    return profileActions.createProfile(profileData, requestId);
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
    getActivities: () => activities,
    setActivities,
    setCloudSyncActive,
    isDemoSession,
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
      setExperience,
    },
    isDemoSession,
    analyticsSink: guardedAnalyticsSink,
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
    isDemoSession,
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
    const previousMascotId = getMascot(activeChild?.avatar ?? '')?.id;
    let saved: boolean;
    if (!isDemoSession && !currentUser && isFamilyConnected) {
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
    const selectedMascotId = getMascot(avatar)?.id;
    if (selectedMascotId && selectedMascotId !== previousMascotId) {
      analyticsGate.record({ event: 'mascot_selected', mode: isDemoSession ? 'local' : 'cloud' });
    }
    sounds.playFanfare();
    try {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 }, disableForReducedMotion: true });
    } catch {}
    return true;
  };

  const ensureLocalDailyLetter = useCallback((childId: string, date: string, templateKey: string): void => {
    if (!isDemoSession) return;
    setExperience((previous) => openLocalLetter(
      previous,
      familyId ?? '00000000-0000-4000-8000-000000000000',
      childId,
      date,
      templateKey,
    ));
  }, [familyId, isDemoSession]);

  const markLocalDailyLetterRead = (childId: string, date: string, templateKey: string): void => {
    if (!isDemoSession) return;
    const wasRead = experience.letters.some((letter) => (
      letter.child_id === childId && letter.local_date === date && letter.read_at !== null
    ));
    const eventKey = `${childId}:${date}`;
    setExperience((previous) => markLocalLetterRead(openLocalLetter(
      previous,
      familyId ?? '00000000-0000-4000-8000-000000000000',
      childId,
      date,
      templateKey,
    ), childId, date, new Date().toISOString()));
    if (!wasRead && !recordedLocalLetterReads.current.has(eventKey)) {
      recordedLocalLetterReads.current.add(eventKey);
      analyticsGate.record({ event: 'mascot_letter_read', mode: 'local' });
    }
  };

  const recordCloudDailyLetterRead = (): void => {
    analyticsGate.record({ event: 'mascot_letter_read', mode: 'cloud' });
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
    isDemoSession,
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
        parentPinConfigured,
        isParentUnlocked,
        refreshParentPinStatus,
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
        startDemoSession,

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
        isDemoSession,

        profiles,
        experience,
        isFamilyPaused: Boolean(isFamilyConnected && !currentUser ? pairedFamilyPausedAt : experience.settings?.paused_at),
        familyPausePeriods: isFamilyConnected && !currentUser ? pairedFamilyPausePeriods : experience.settings?.pause_periods ?? [],
        setFamilyPaused,
        chooseWishlist,
        setTaskDeferred,
        recordHabitSupport,
        saveHabitCuePlan,
        saveJournalEntry,
        buildCityItem,
        ensureLocalDailyLetter,
        markLocalDailyLetterRead,
        recordCloudDailyLetterRead,
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
        familyRole,
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
