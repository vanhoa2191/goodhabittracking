'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ChildProfile,
  HabitActivity,
  ActivityLog,
  Reward,
  Redemption,
  Badge,
  ChildBadge,
  ParentConfig,
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
  INITIAL_PROFILES,
  INITIAL_ACTIVITIES,
  INITIAL_REWARDS,
  INITIAL_GROUPS,
} from './constants';
import { PRICING_PLANS, getPricingPlan } from './payos';
import { sounds } from './sound';
import { getSupabase, isSupabaseConfigured, signInWithGoogle, signOutUser } from './supabase';
import { generateAgeAdaptedHabits } from './wit-framework';
import type { User } from '@supabase/supabase-js';

interface AppStoreContextType {
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

  // 16 Portraits & 7 Givings Framework Modal
  isPortraitModalOpen: boolean;
  setIsPortraitModalOpen: (open: boolean) => void;
  applyAgeHabitsBundle: (childId: string, stage: AgeStage) => void;

  // Subscription & Pro Features
  isPro: boolean;
  subscriptionPlan: SubscriptionPlan;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  activateFreeTrial: () => boolean;
  upgradePlan: (plan: 'monthly' | 'yearly' | 'lifetime') => void;
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
  activeChildId: string | null;
  activeChild: ChildProfile | null;
  setActiveChildId: (id: string) => void;
  createProfile: (profile: Omit<ChildProfile, 'id' | 'createdAt'>) => void;
  updateProfile: (id: string, updates: Partial<ChildProfile>) => void;
  deleteProfile: (id: string) => void;
  adjustPoints: (childId: string, amount: number, reason?: string) => void;
  updateActiveAvatar: (avatar: string, themeColor: string) => void;

  activities: HabitActivity[];
  createActivity: (activity: Omit<HabitActivity, 'id' | 'createdAt'>) => void;
  updateActivity: (id: string, updates: Partial<HabitActivity>) => void;
  deleteActivity: (id: string) => void;

  logs: ActivityLog[];
  toggleActivity: (activityId: string, dateStr: string) => Promise<void>;
  approveLog: (logId: string) => void;
  rejectLog: (logId: string) => void;

  rewards: Reward[];
  createReward: (reward: Omit<Reward, 'id' | 'createdAt'>) => void;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  deleteReward: (id: string) => void;

  redemptions: Redemption[];
  claimReward: (rewardId: string) => boolean;
  approveRedemption: (redemptionId: string) => void;
  deliverRedemption: (redemptionId: string) => void;
  rejectRedemption: (redemptionId: string) => void;

  badges: Badge[];
  childBadges: ChildBadge[];

  // Group & Leaderboard
  groups: GroupTeam[];
  createGroup: (group: Omit<GroupTeam, 'id' | 'inviteCode' | 'createdAt'>) => GroupTeam;
  joinGroup: (inviteCode: string) => boolean;
  updateGroupReward: (groupId: string, rewardType: GroupTeam['rewardType'], customRewardText?: string) => void;
  kudos: Kudo[];
  sendKudo: (toChildId: string, emoji?: string) => void;
  getLeaderboard: (scope: LeaderboardScope, period: LeaderboardPeriod) => LeaderboardEntry[];

  cloudSyncActive: boolean;
  lastSyncTime: string | null;
  syncNow: () => Promise<void>;

  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

const AppStoreContext = createContext<AppStoreContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'kidhabit_';

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mode, setModeState] = useState<'kid' | 'parent'>('kid');
  const [isParentUnlocked, setIsParentUnlocked] = useState(false);
  const [parentPin, setParentPin] = useState('1234');

  const [storageMode, setStorageModeState] = useState<'local' | 'cloud'>('cloud');

  const [profiles, setProfiles] = useState<ChildProfile[]>(INITIAL_PROFILES);
  const [activeChildId, setActiveChildIdState] = useState<string | null>(INITIAL_PROFILES[0]?.id || null);
  const [activities, setActivities] = useState<HabitActivity[]>(INITIAL_ACTIVITIES);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [rewards, setRewards] = useState<Reward[]>(INITIAL_REWARDS);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [badges] = useState<Badge[]>(DEFAULT_BADGES);
  const [childBadges, setChildBadges] = useState<ChildBadge[]>([]);

  // Groups and Kudos
  const [groups, setGroups] = useState<GroupTeam[]>(INITIAL_GROUPS);
  const [kudos, setKudos] = useState<Kudo[]>([]);

  const [cloudSyncActive, setCloudSyncActive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  const checkIsPro = useCallback(
    (plan: SubscriptionPlan, trialEnd: string | null, subEnd: string | null): boolean => {
      const now = Date.now();
      if (plan === 'lifetime') return true;
      if (plan === 'monthly' || plan === 'yearly') {
        if (!subEnd) return true;
        return new Date(subEnd).getTime() > now;
      }
      if (plan === 'trial') {
        if (!trialEnd) return false;
        return new Date(trialEnd).getTime() > now;
      }
      return false;
    },
    []
  );

  const isPro = checkIsPro(subscriptionPlan, trialEndsAt, subscriptionEndsAt);

  // Check and listen to Supabase Auth State
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      if (session?.user) {
        syncNow();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    sounds.playClick();
    const { error } = await signInWithGoogle();
    if (error) {
      console.error('Google Sign In Error:', error);
      alert('Không thể mở đăng nhập Google: ' + error.message);
    }
  };

  const logout = async () => {
    sounds.playClick();
    await signOutUser();
    setCurrentUser(null);
  };

  // 1. Load initial data from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedPin = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}pin`);
      if (savedPin) setParentPin(savedPin);

      const savedStorageMode = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}storage_mode`);
      if (savedStorageMode === 'local' || savedStorageMode === 'cloud') {
        // If Supabase is preconfigured in system, default to cloud unless explicitly overridden
        setStorageModeState(isSupabaseConfigured() ? 'cloud' : savedStorageMode);
      } else if (isSupabaseConfigured()) {
        setStorageModeState('cloud');
      }

      const savedParentProfile = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}parent_profile`);
      if (savedParentProfile) {
        try {
          setParentProfile(JSON.parse(savedParentProfile));
        } catch {
          // ignore
        }
      }

      const savedProfiles = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}profiles`);
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProfiles(parsed);
          setActiveChildIdState(parsed[0].id);
        }
      }

      const savedActiveChild = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}activeChildId`);
      if (savedActiveChild) setActiveChildIdState(savedActiveChild);

      const savedActivities = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}activities`);
      if (savedActivities) {
        const parsed = JSON.parse(savedActivities);
        if (Array.isArray(parsed)) setActivities(parsed);
      }

      const savedLogs = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}logs`);
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed)) setLogs(parsed);
      }

      const savedRewards = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}rewards`);
      if (savedRewards) {
        const parsed = JSON.parse(savedRewards);
        if (Array.isArray(parsed)) setRewards(parsed);
      }

      const savedRedemptions = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}redemptions`);
      if (savedRedemptions) {
        const parsed = JSON.parse(savedRedemptions);
        if (Array.isArray(parsed)) setRedemptions(parsed);
      }

      const savedChildBadges = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}child_badges`);
      if (savedChildBadges) {
        const parsed = JSON.parse(savedChildBadges);
        if (Array.isArray(parsed)) setChildBadges(parsed);
      }

      const savedGroups = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}groups`);
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups);
        if (Array.isArray(parsed) && parsed.length > 0) setGroups(parsed);
      }

      const savedKudos = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}kudos`);
      if (savedKudos) {
        const parsed = JSON.parse(savedKudos);
        if (Array.isArray(parsed)) setKudos(parsed);
      }

      const savedPlan = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}subscription_plan`);
      if (savedPlan && ['free', 'trial', 'monthly', 'yearly', 'lifetime'].includes(savedPlan)) {
        setSubscriptionPlan(savedPlan as SubscriptionPlan);
      }

      const savedTrialEnd = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}trial_ends_at`);
      if (savedTrialEnd) setTrialEndsAt(savedTrialEnd);

      const savedSubEnd = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}subscription_ends_at`);
      if (savedSubEnd) setSubscriptionEndsAt(savedSubEnd);
    } catch (e) {
      console.error('Error loading local data:', e);
    } finally {
      setIsLoaded(true);
      setCloudSyncActive(isSupabaseConfigured());
    }
  }, []);

  // 2. Persist to localStorage whenever data changes
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}pin`, parentPin);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}storage_mode`, storageMode);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}profiles`, JSON.stringify(profiles));
    if (activeChildId) {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}activeChildId`, activeChildId);
    }
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}activities`, JSON.stringify(activities));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}logs`, JSON.stringify(logs));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}rewards`, JSON.stringify(rewards));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}redemptions`, JSON.stringify(redemptions));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}child_badges`, JSON.stringify(childBadges));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}groups`, JSON.stringify(groups));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}kudos`, JSON.stringify(kudos));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}subscription_plan`, subscriptionPlan);
    if (trialEndsAt) {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}trial_ends_at`, trialEndsAt);
    } else {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}trial_ends_at`);
    }
    if (subscriptionEndsAt) {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}subscription_ends_at`, subscriptionEndsAt);
    } else {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}subscription_ends_at`);
    }
  }, [
    isLoaded,
    parentPin,
    storageMode,
    profiles,
    activeChildId,
    activities,
    logs,
    rewards,
    redemptions,
    childBadges,
    groups,
    kudos,
    subscriptionPlan,
    trialEndsAt,
    subscriptionEndsAt,
  ]);

  const setStorageMode = (newMode: 'local' | 'cloud') => {
    setStorageModeState(newMode);
    if (newMode === 'cloud' && isSupabaseConfigured()) {
      syncNow();
    }
  };

  // Sync with Supabase if configured
  const syncNow = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setCloudSyncActive(false);
      return;
    }

    try {
      setCloudSyncActive(true);
      // Fetch latest profiles
      const { data: dbProfiles } = await supabase.from('child_profiles').select('*');
      if (dbProfiles && dbProfiles.length > 0) {
        const mapped: ChildProfile[] = dbProfiles.map((p) => ({
          id: p.id,
          name: p.name,
          nickname: p.nickname || undefined,
          showRealNameOnLeaderboard: p.show_real_name_on_leaderboard ?? false,
          isPublicOnLeaderboard: p.is_public_on_leaderboard ?? true,
          avatar: p.avatar,
          themeColor: p.theme_color,
          points: p.points,
          totalEarned: p.total_earned,
          level: p.level,
          streak: p.streak,
          lastActiveDate: p.last_active_date,
          createdAt: p.created_at,
        }));
        setProfiles(mapped);
      }

      // Fetch latest activities
      const { data: dbActivities } = await supabase.from('habit_activities').select('*');
      if (dbActivities && dbActivities.length > 0) {
        const mapped: HabitActivity[] = dbActivities.map((a) => ({
          id: a.id,
          childId: a.child_id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          category: a.category,
          points: a.points,
          recurrenceType: a.recurrence_type,
          recurrenceDays: a.recurrence_days || [0, 1, 2, 3, 4, 5, 6],
          timeOfDay: a.time_of_day,
          durationMinutes: a.duration_minutes || 0,
          requiresApproval: a.requires_approval,
          isActive: a.is_active,
          createdAt: a.created_at,
        }));
        setActivities(mapped);
      }

      // Check user subscription in Supabase
      if (currentUser?.id) {
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('plan, status, trial_ends_at, subscription_ends_at')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (subData) {
          if (subData.plan) setSubscriptionPlan(subData.plan as SubscriptionPlan);
          if (subData.trial_ends_at) setTrialEndsAt(subData.trial_ends_at);
          if (subData.subscription_ends_at) setSubscriptionEndsAt(subData.subscription_ends_at);
        }
      }

      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Supabase sync skipped / failed:', err);
    }
  }, [currentUser]);

  // Try sync once on load if configured
  useEffect(() => {
    if (isLoaded && isSupabaseConfigured()) {
      syncNow();
    }
  }, [isLoaded, syncNow]);

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
    if (targetMode === 'parent' && !isParentUnlocked) {
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

  // Active Child
  const activeChild = profiles.find((p) => p.id === activeChildId) || profiles[0] || null;

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

  const applyAgeHabitsBundle = (childId: string, stage: AgeStage) => {
    const starterHabits = generateAgeAdaptedHabits(childId, stage);
    const newActivities: HabitActivity[] = starterHabits.map((h, idx) => ({
      ...h,
      id: 'act-' + Date.now() + '-' + idx,
      createdAt: new Date().toISOString(),
    }));
    setActivities((prev) => [...prev, ...newActivities]);
    sounds.playSuccess();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  // Profile Management
  const createProfile = (profileData: Omit<ChildProfile, 'id' | 'createdAt'>) => {
    // Enforce Free plan limit (1 child max)
    if (!isPro && profiles.length >= 1) {
      sounds.playClick();
      alert('Gói Miễn Phí (Starter) hỗ trợ tối đa 1 bé. Vui lòng kích hoạt Dùng thử 7 ngày hoặc nâng cấp Pro để quản lý không giới hạn số bé!');
      setIsPricingModalOpen(true);
      return;
    }

    const newProfile: ChildProfile = {
      ...profileData,
      id: 'child-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setProfiles((prev) => [...prev, newProfile]);
    setActiveChildIdState(newProfile.id);

    // If child has ageStage, automatically apply age-adapted starter habits
    if (newProfile.ageStage) {
      const starter = generateAgeAdaptedHabits(newProfile.id, newProfile.ageStage);
      const newActs: HabitActivity[] = starter.map((s, idx) => ({
        ...s,
        id: 'act-' + Date.now() + '-' + idx,
        createdAt: new Date().toISOString(),
      }));
      setActivities((prev) => [...prev, ...newActs]);
    }

    // Sync to Supabase in background
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('child_profiles').insert({
        name: newProfile.name,
        nickname: newProfile.nickname,
        show_real_name_on_leaderboard: newProfile.showRealNameOnLeaderboard ?? false,
        is_public_on_leaderboard: newProfile.isPublicOnLeaderboard ?? true,
        avatar: newProfile.avatar,
        theme_color: newProfile.themeColor,
        points: newProfile.points,
        total_earned: newProfile.totalEarned,
        level: newProfile.level,
        streak: newProfile.streak,
        user_id: currentUser?.id,
      }).then();
    }
  };

  const updateProfile = (id: string, updates: Partial<ChildProfile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    const supabase = getSupabase();
    if (supabase) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.nickname !== undefined) dbUpdates.nickname = updates.nickname;
      if (updates.showRealNameOnLeaderboard !== undefined) {
        dbUpdates.show_real_name_on_leaderboard = updates.showRealNameOnLeaderboard;
      }
      if (updates.isPublicOnLeaderboard !== undefined) {
        dbUpdates.is_public_on_leaderboard = updates.isPublicOnLeaderboard;
      }
      if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
      if (updates.themeColor !== undefined) dbUpdates.theme_color = updates.themeColor;
      if (updates.points !== undefined) dbUpdates.points = updates.points;
      if (updates.level !== undefined) dbUpdates.level = updates.level;
      if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
      if (Object.keys(dbUpdates).length > 0) {
        supabase.from('child_profiles').update(dbUpdates).eq('id', id).then();
      }
    }
  };

  const deleteProfile = (id: string) => {
    setProfiles((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (activeChildId === id && filtered.length > 0) {
        setActiveChildIdState(filtered[0].id);
      }
      return filtered;
    });
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('child_profiles').delete().eq('id', id).then();
    }
  };

  const adjustPoints = (childId: string, amount: number) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== childId) return p;
        const newPoints = Math.max(0, p.points + amount);
        const newTotal = amount > 0 ? p.totalEarned + amount : p.totalEarned;
        const newLevel = Math.max(1, Math.floor(newTotal / 100) + 1);
        return {
          ...p,
          points: newPoints,
          totalEarned: newTotal,
          level: newLevel,
        };
      })
    );
  };

  // Activity Management
  const createActivity = (data: Omit<HabitActivity, 'id' | 'createdAt'>) => {
    const newAct: HabitActivity = {
      ...data,
      id: 'act-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setActivities((prev) => [newAct, ...prev]);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('habit_activities').insert({
        child_id: newAct.childId,
        title: newAct.title,
        description: newAct.description,
        icon: newAct.icon,
        category: newAct.category,
        points: newAct.points,
        recurrence_type: newAct.recurrenceType,
        recurrence_days: newAct.recurrenceDays,
        time_of_day: newAct.timeOfDay,
        duration_minutes: newAct.durationMinutes,
        requires_approval: newAct.requiresApproval,
        is_active: newAct.isActive,
        user_id: currentUser?.id,
      }).then();
    }
  };

  const updateActivity = (id: string, updates: Partial<HabitActivity>) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  // Badges unlocking helper
  const checkAndUnlockBadges = (childId: string, updatedProfile: ChildProfile, totalCompletedCount: number) => {
    const existingBadgeIds = new Set(
      childBadges.filter((cb) => cb.childId === childId).map((cb) => cb.badgeId)
    );

    const newBadges: ChildBadge[] = [];

    DEFAULT_BADGES.forEach((b) => {
      if (existingBadgeIds.has(b.id)) return;

      let qualified = false;
      if (b.criteriaType === 'firstTask' && totalCompletedCount >= 1) qualified = true;
      if (b.criteriaType === 'streak' && updatedProfile.streak >= b.criteriaValue) qualified = true;
      if (b.criteriaType === 'totalTasks' && totalCompletedCount >= b.criteriaValue) qualified = true;
      if (b.criteriaType === 'totalPoints' && updatedProfile.totalEarned >= b.criteriaValue) qualified = true;

      if (qualified) {
        newBadges.push({
          childId,
          badgeId: b.id,
          unlockedAt: new Date().toISOString(),
        });
      }
    });

    if (newBadges.length > 0) {
      setChildBadges((prev) => [...prev, ...newBadges]);
      sounds.playLevelUp();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  // Toggle Activity Completion
  const toggleActivity = async (activityId: string, dateStr: string) => {
    if (!activeChildId) return;

    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const existingLog = logs.find(
      (l) => l.activityId === activityId && l.childId === activeChildId && l.date === dateStr
    );

    if (existingLog) {
      // Untick / Remove log
      const awarded = existingLog.pointsAwarded;
      setLogs((prev) => prev.filter((l) => l.id !== existingLog.id));

      // Subtract points if they were awarded
      if (awarded > 0) {
        setProfiles((prev) =>
          prev.map((p) => {
            if (p.id !== activeChildId) return p;
            return {
              ...p,
              points: Math.max(0, p.points - awarded),
              totalEarned: Math.max(0, p.totalEarned - awarded),
            };
          })
        );
      }
      sounds.playClick();
    } else {
      // Tick Completed!
      const requiresApproval = activity.requiresApproval;
      const status = requiresApproval ? 'pending_approval' : 'completed';
      const pointsToAward = requiresApproval ? 0 : activity.points;

      const newLog: ActivityLog = {
        id: 'log-' + Date.now(),
        activityId,
        childId: activeChildId,
        date: dateStr,
        status,
        pointsAwarded: pointsToAward,
        completedAt: new Date().toISOString(),
      };

      setLogs((prev) => [newLog, ...prev]);

      if (!requiresApproval) {
        // Gamification effects
        sounds.playTaskComplete();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
        });

        // Update child points, streak, level
        setProfiles((prev) =>
          prev.map((p) => {
            if (p.id !== activeChildId) return p;
            const newPoints = p.points + pointsToAward;
            const newTotal = p.totalEarned + pointsToAward;
            const newLevel = Math.max(1, Math.floor(newTotal / 100) + 1);

            // Streak calculation
            let newStreak = p.streak;
            const today = new Date().toISOString().split('T')[0];
            if (dateStr === today) {
              if (p.lastActiveDate !== today) {
                newStreak = (p.streak || 0) + 1;
              }
            }

            const updated = {
              ...p,
              points: newPoints,
              totalEarned: newTotal,
              level: newLevel,
              streak: newStreak,
              lastActiveDate: today,
            };

            const childLogsCount = logs.filter(
              (l) => l.childId === activeChildId && (l.status === 'completed' || l.status === 'approved')
            ).length + 1;

            checkAndUnlockBadges(activeChildId, updated, childLogsCount);
            return updated;
          })
        );
      } else {
        sounds.playClick();
      }
    }
  };

  // Approvals for task logs
  const approveLog = (logId: string) => {
    const log = logs.find((l) => l.id === logId);
    if (!log || log.status !== 'pending_approval') return;

    const activity = activities.find((a) => a.id === log.activityId);
    const points = activity?.points || 10;

    setLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, status: 'approved', pointsAwarded: points } : l))
    );

    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id !== log.childId) return p;
        const newPoints = p.points + points;
        const newTotal = p.totalEarned + points;
        const newLevel = Math.max(1, Math.floor(newTotal / 100) + 1);
        return {
          ...p,
          points: newPoints,
          totalEarned: newTotal,
          level: newLevel,
        };
      })
    );
    sounds.playTaskComplete();
  };

  const rejectLog = (logId: string) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, status: 'rejected', pointsAwarded: 0 } : l))
    );
    sounds.playClick();
  };

  // Rewards Management
  const createReward = (rewardData: Omit<Reward, 'id' | 'createdAt'>) => {
    const newRew: Reward = {
      ...rewardData,
      id: 'rew-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setRewards((prev) => [newRew, ...prev]);
  };

  const updateReward = (id: string, updates: Partial<Reward>) => {
    setRewards((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteReward = (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  };

  // Claim Reward (Redemption)
  const claimReward = (rewardId: string): boolean => {
    if (!activeChildId) return false;
    const reward = rewards.find((r) => r.id === rewardId);
    const child = profiles.find((p) => p.id === activeChildId);
    if (!reward || !child) return false;

    if (child.points < reward.costPoints) {
      return false;
    }

    // Deduct points immediately
    setProfiles((prev) =>
      prev.map((p) => (p.id === activeChildId ? { ...p, points: p.points - reward.costPoints } : p))
    );

    // Create redemption record
    const newRedemption: Redemption = {
      id: 'red-' + Date.now(),
      rewardId,
      childId: activeChildId,
      pointsSpent: reward.costPoints,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    setRedemptions((prev) => [newRedemption, ...prev]);

    // Reward sound & celebration
    sounds.playRewardRedeem();
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#ec4899', '#f59e0b', '#3b82f6'],
    });

    return true;
  };

  const approveRedemption = (redemptionId: string) => {
    setRedemptions((prev) =>
      prev.map((r) =>
        r.id === redemptionId ? { ...r, status: 'approved', resolvedAt: new Date().toISOString() } : r
      )
    );
    sounds.playClick();
  };

  const deliverRedemption = (redemptionId: string) => {
    setRedemptions((prev) =>
      prev.map((r) =>
        r.id === redemptionId ? { ...r, status: 'delivered', resolvedAt: new Date().toISOString() } : r
      )
    );
    sounds.playLevelUp();
  };

  const rejectRedemption = (redemptionId: string) => {
    const red = redemptions.find((r) => r.id === redemptionId);
    if (!red) return;

    // Refund points
    setProfiles((prev) =>
      prev.map((p) => (p.id === red.childId ? { ...p, points: p.points + red.pointsSpent } : p))
    );

    setRedemptions((prev) =>
      prev.map((r) =>
        r.id === redemptionId ? { ...r, status: 'rejected', resolvedAt: new Date().toISOString() } : r
      )
    );
    sounds.playClick();
  };

  // Quick avatar & color update for active child
  const updateActiveAvatar = (avatar: string, themeColor: string) => {
    if (!activeChildId) return;
    updateProfile(activeChildId, { avatar, themeColor });
    sounds.playFanfare();
    try {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    } catch {}
  };

  // Group Management
  const createGroup = (groupData: Omit<GroupTeam, 'id' | 'inviteCode' | 'createdAt'>): GroupTeam => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newGroup: GroupTeam = {
      ...groupData,
      id: 'grp-' + Date.now(),
      inviteCode: code,
      createdAt: new Date().toISOString(),
    };

    setGroups((prev) => [newGroup, ...prev]);
    sounds.playFanfare();
    return newGroup;
  };

  const joinGroup = (inviteCode: string): boolean => {
    const cleanCode = inviteCode.trim().toUpperCase();
    const groupIndex = groups.findIndex((g) => g.inviteCode.toUpperCase() === cleanCode);
    if (groupIndex === -1) return false;

    if (!activeChildId) return false;

    const group = groups[groupIndex];
    if (!group.memberChildIds.includes(activeChildId)) {
      const updatedMembers = [...group.memberChildIds, activeChildId];
      const updatedGroups = [...groups];
      updatedGroups[groupIndex] = { ...group, memberChildIds: updatedMembers };
      setGroups(updatedGroups);
    }
    sounds.playFanfare();
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    } catch {}
    return true;
  };

  const updateGroupReward = (
    groupId: string,
    rewardType: GroupTeam['rewardType'],
    customRewardText?: string
  ) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, rewardType, customRewardText } : g))
    );
    sounds.playClick();
  };

  // Social Kudos (High-Five / Encouragement)
  const sendKudo = (toChildId: string, emoji: string = '👏') => {
    const fromName = activeChild?.name || 'Bạn nhỏ';
    const newKudo: Kudo = {
      id: 'kudo-' + Date.now(),
      fromChildName: fromName,
      toChildId,
      emoji,
      sentAt: new Date().toISOString(),
    };
    setKudos((prev) => [newKudo, ...prev.slice(0, 49)]);
    sounds.playFanfare();
    try {
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
    } catch {}
  };

  // Compute League Tier helper
  const getLeagueTier = (points: number): import('@/types').LeagueTier => {
    if (points >= 300) return 'diamond';
    if (points >= 150) return 'gold';
    if (points >= 70) return 'silver';
    return 'bronze';
  };

  // Leaderboard Calculation across scopes (global, group, family) and periods (daily, weekly, monthly)
  const getLeaderboard = (
    scope: LeaderboardScope,
    period: LeaderboardPeriod
  ): LeaderboardEntry[] => {
    // 1. Build list of potential participants
    // Include family profiles (hiding from global if isPublicOnLeaderboard is false unless active child)
    let entries: {
      childId: string;
      nickname: string;
      avatar: string;
      themeColor: string;
      basePoints: number;
      streak: number;
      isCurrentChild: boolean;
      groupName?: string;
    }[] = profiles
      .filter((p) => {
        if (scope === 'global' && p.isPublicOnLeaderboard === false && p.id !== activeChildId) {
          return false;
        }
        return true;
      })
      .map((p) => {
        // Calculate period points based on actual activity logs
        let periodPoints = p.points;
        const childLogs = logs.filter(
          (l) => l.childId === p.id && (l.status === 'completed' || l.status === 'approved')
        );

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        if (period === 'daily') {
          const todayEarned = childLogs
            .filter((l) => l.date === todayStr)
            .reduce((sum, l) => sum + l.pointsAwarded, 0);
          periodPoints = Math.max(todayEarned, Math.round(p.points * 0.2) || 10);
        } else if (period === 'weekly') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];
          const weekEarned = childLogs
            .filter((l) => l.date >= sevenDaysStr)
            .reduce((sum, l) => sum + l.pointsAwarded, 0);
          periodPoints = Math.max(weekEarned, Math.round(p.points * 0.6) || 25);
        } else {
          periodPoints = p.totalEarned || p.points;
        }

        // Tùy chọn hiển thị tên của phụ huynh: Tên thật hoặc Biệt danh
        let displayName = p.name;
        if (p.showRealNameOnLeaderboard === true) {
          displayName = p.name;
        } else if (p.nickname && p.nickname.trim().length > 0) {
          displayName = p.nickname.trim();
        } else {
          // Mặc định an toàn: Tên gọi thân mật
          const parts = p.name.trim().split(/\s+/);
          displayName = `Bé ${parts[parts.length - 1]}`;
        }

        return {
          childId: p.id,
          nickname: displayName,
          avatar: p.avatar,
          themeColor: p.themeColor,
          basePoints: periodPoints,
          streak: p.streak,
          isCurrentChild: p.id === activeChildId,
        };
      });

    // 2. If Global or Group scope, inject friendly peers/rivals for rich gamified competition
    if (scope === 'global' || scope === 'group') {
      const mockPeers = [
        { id: 'mock-1', name: 'Bé Khôi (Ninja Panda)', avatar: '🐼', color: '#10b981', pts: 185, streak: 9 },
        { id: 'mock-2', name: 'Bé Linh (Star Girl)', avatar: '⭐', color: '#f59e0b', pts: 160, streak: 6 },
        { id: 'mock-3', name: 'Bé Nam (Rocket)', avatar: '🚀', color: '#8b5cf6', pts: 125, streak: 5 },
        { id: 'mock-4', name: 'Bé Vy (Smart Fox)', avatar: '🦊', color: '#f97316', pts: 95, streak: 4 },
        { id: 'mock-5', name: 'Bé Minh (Dragon)', avatar: '🦖', color: '#06b6d4', pts: 65, streak: 3 },
      ];

      const multiplier = period === 'daily' ? 0.25 : period === 'weekly' ? 0.7 : 1.2;

      mockPeers.forEach((m) => {
        entries.push({
          childId: m.id,
          nickname: m.name,
          avatar: m.avatar,
          themeColor: m.color,
          basePoints: Math.round(m.pts * multiplier),
          streak: m.streak,
          isCurrentChild: false,
          groupName: 'Biệt Đội Siêu Anh Hùng Nhỏ',
        });
      });
    }

    // Sort descending by basePoints
    entries.sort((a, b) => b.basePoints - a.basePoints);

    // Assign ranks and league tiers
    return entries.map((entry, index) => ({
      childId: entry.childId,
      nickname: entry.nickname,
      avatar: entry.avatar,
      themeColor: entry.themeColor,
      points: entry.basePoints,
      streak: entry.streak,
      tier: getLeagueTier(entry.basePoints),
      rank: index + 1,
      isCurrentChild: entry.isCurrentChild,
      groupName: entry.groupName,
    }));
  };

  // Data Export & Import
  const exportData = (): string => {
    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      pin: parentPin,
      storageMode,
      profiles,
      activities,
      logs,
      rewards,
      redemptions,
      childBadges,
      groups,
      kudos,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.profiles || !Array.isArray(parsed.profiles)) return false;

      if (parsed.pin) setParentPin(parsed.pin);
      if (parsed.storageMode) setStorageModeState(parsed.storageMode);
      if (parsed.profiles) setProfiles(parsed.profiles);
      if (parsed.activities) setActivities(parsed.activities);
      if (parsed.logs) setLogs(parsed.logs);
      if (parsed.rewards) setRewards(parsed.rewards);
      if (parsed.redemptions) setRedemptions(parsed.redemptions);
      if (parsed.childBadges) setChildBadges(parsed.childBadges);
      if (parsed.groups && Array.isArray(parsed.groups)) setGroups(parsed.groups);
      if (parsed.kudos && Array.isArray(parsed.kudos)) setKudos(parsed.kudos);

      if (parsed.profiles.length > 0) {
        setActiveChildIdState(parsed.profiles[0].id);
      }
      return true;
    } catch {
      return false;
    }
  };

  // Subscription Operations
  const activateFreeTrial = (): boolean => {
    const end = new Date();
    end.setDate(end.getDate() + 7);
    const endStr = end.toISOString();

    setSubscriptionPlan('trial');
    setTrialEndsAt(endStr);

    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}subscription_plan`, 'trial');
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}trial_ends_at`, endStr);

    sounds.playFanfare();
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });

    // Supabase sync if logged in
    const supabase = getSupabase();
    if (supabase && currentUser) {
      supabase
        .from('user_subscriptions')
        .upsert({
          user_id: currentUser.id,
          plan: 'trial',
          status: 'active',
          trial_ends_at: endStr,
          updated_at: new Date().toISOString(),
        })
        .then();
    }
    return true;
  };

  const upgradePlan = (plan: 'monthly' | 'yearly' | 'lifetime') => {
    let subEndStr: string | null = null;
    const now = new Date();

    if (plan === 'monthly') {
      now.setMonth(now.getMonth() + 1);
      subEndStr = now.toISOString();
    } else if (plan === 'yearly') {
      now.setFullYear(now.getFullYear() + 1);
      subEndStr = now.toISOString();
    } // 'lifetime' remains null = forever

    setSubscriptionPlan(plan);
    setSubscriptionEndsAt(subEndStr);

    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}subscription_plan`, plan);
    if (subEndStr) {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}subscription_ends_at`, subEndStr);
    } else {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}subscription_ends_at`);
    }

    sounds.playLevelUp();
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#ec4899', '#6366f1', '#10b981'],
    });

    const supabase = getSupabase();
    if (supabase && currentUser) {
      supabase
        .from('user_subscriptions')
        .upsert({
          user_id: currentUser.id,
          plan,
          status: 'active',
          subscription_ends_at: subEndStr,
          updated_at: new Date().toISOString(),
        })
        .then();
    }
  };

  const getSubscriptionDetails = () => {
    const now = Date.now();
    let daysRemaining: number | null = null;
    let label = 'Miễn phí';
    let statusText = 'Gói Miễn Phí (Tối đa 1 bé)';

    if (subscriptionPlan === 'lifetime') {
      label = 'Trọn Đời';
      statusText = '👑 Thành viên Trọn Đời (Vĩnh viễn)';
    } else if (subscriptionPlan === 'yearly') {
      label = 'Gói Năm';
      if (subscriptionEndsAt) {
        const diffDays = Math.ceil((new Date(subscriptionEndsAt).getTime() - now) / (1000 * 60 * 60 * 24));
        daysRemaining = Math.max(0, diffDays);
        statusText = `Gói Năm (${daysRemaining} ngày còn lại)`;
      } else {
        statusText = 'Gói Năm (Đang hoạt động)';
      }
    } else if (subscriptionPlan === 'monthly') {
      label = 'Gói Tháng';
      if (subscriptionEndsAt) {
        const diffDays = Math.ceil((new Date(subscriptionEndsAt).getTime() - now) / (1000 * 60 * 60 * 24));
        daysRemaining = Math.max(0, diffDays);
        statusText = `Gói Tháng (${daysRemaining} ngày còn lại)`;
      } else {
        statusText = 'Gói Tháng (Đang hoạt động)';
      }
    } else if (subscriptionPlan === 'trial') {
      label = 'Dùng Thử';
      if (trialEndsAt) {
        const diffDays = Math.ceil((new Date(trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24));
        daysRemaining = Math.max(0, diffDays);
        statusText = `Dùng thử Pro (${daysRemaining} ngày còn lại)`;
      } else {
        statusText = 'Dùng thử 7 ngày';
      }
    }

    return {
      isPro,
      plan: subscriptionPlan,
      label,
      daysRemaining,
      statusText,
    };
  };

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
        upgradePlan,
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
