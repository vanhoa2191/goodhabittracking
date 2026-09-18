'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Gift,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Clock,
  Database,
  Check,
  Flame,
  Star,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Copy,
  Download,
  Upload,
  Heart,
  Smile,
  Layers,
  Compass,
  CheckCheck,
  X,
  ChevronDown,
  Smartphone,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import {
  HabitActivity,
  Reward,
  ChildProfile,
  ActivityCategory,
  RecurrenceType,
  TimeOfDay,
  JourneyPlan,
} from '@/types';
import {
  WIT_HABIT_PACKS,
  HabitTemplate,
  WEEKLY_JOURNEY_PLANS,
  MONTHLY_JOURNEY_PLANS,
} from '@/lib/constants';
import { testSupabaseConnection, getSupabaseConfig, isSupabaseConfigured } from '@/lib/supabase';
import { getStageFromAge, getStageInfo } from '@/lib/wit-framework';
import { AgeStage } from '@/types';

export function ParentDashboard() {
  const {
    lockParent,
    profiles,
    createProfile,
    updateProfile,
    deleteProfile,
    adjustPoints,
    activities,
    createActivity,
    updateActivity,
    deleteActivity,
    logs,
    approveLog,
    rejectLog,
    rewards,
    createReward,
    updateReward,
    deleteReward,
    redemptions,
    approveRedemption,
    deliverRedemption,
    rejectRedemption,
    parentPin,
    updateParentPin,
    storageMode,
    setStorageMode,
    currentUser,
    loginWithGoogle,
    logout,
    cloudSyncActive,
    syncNow,
    exportData,
    importData,
    setIsPortraitModalOpen,
    openOnboarding,
    applyAgeHabitsBundle,
    parentProfile,
    familyCode,
    generateFamilyCode,
  } = useAppStore();

  const { t, language } = useTranslation();

  const [activeTab, setActiveTab] = useState<
    'approvals' | 'habits' | 'journeys' | 'rewards' | 'children' | 'analytics' | 'settings'
  >('approvals');

  // Family Pairing Code state
  const [codeCopied, setCodeCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);

  const handleCopyCode = (codeToCopy: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(codeToCopy);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2500);
    }
  };

  const handleRegenerateCode = async () => {
    if (confirm('Bạn có chắc muốn đổi mã kết nối mới không? (Mã cũ sẽ không còn hiệu lực trên thiết bị mới)')) {
      setIsRegeneratingCode(true);
      await generateFamilyCode(true);
      setIsRegeneratingCode(false);
    }
  };

  // Selected pack tab in WIT library
  const [selectedWitPackKey, setSelectedWitPackKey] = useState<string>('nutrition');

  // Journey sub-tab (weekly vs monthly)
  const [journeyType, setJourneyType] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedApplyPlan, setSelectedApplyPlan] = useState<JourneyPlan | null>(null);
  const [targetChildIdForPlan, setTargetChildIdForPlan] = useState<string>('');
  const [planAppliedNotice, setPlanAppliedNotice] = useState<string>('');

  // Modal states
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitActivity | null>(null);

  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);

  const [isAdjustPointsModalOpen, setIsAdjustPointsModalOpen] = useState(false);
  const [adjustingChildId, setAdjustingChildId] = useState<string>('');
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Pin change
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeNotice, setPinChangeNotice] = useState('');

  // Cloud settings
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => {
    if (typeof window !== 'undefined') {
      const cfg = getSupabaseConfig();
      return cfg.url || '';
    }
    return '';
  });
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => {
    if (typeof window !== 'undefined') {
      const cfg = getSupabaseConfig();
      return cfg.anonKey || '';
    }
    return '';
  });
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form states for Habit
  const [habitForm, setHabitForm] = useState<{
    title: string;
    description: string;
    icon: string;
    category: ActivityCategory;
    points: number;
    recurrenceType: RecurrenceType;
    recurrenceDays: number[];
    timeOfDay: TimeOfDay;
    durationMinutes: number;
    requiresApproval: boolean;
    childId: string | null;
  }>({
    title: '',
    description: '',
    icon: '✨',
    category: 'nutrition',
    points: 15,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    timeOfDay: 'morning',
    durationMinutes: 0,
    requiresApproval: false,
    childId: null,
  });

  // Form state for Reward
  const [rewardForm, setRewardForm] = useState<{
    title: string;
    description: string;
    icon: string;
    costPoints: number;
    stock: number;
  }>({
    title: '',
    description: '',
    icon: '🎁',
    costPoints: 50,
    stock: -1,
  });

  // Form state for Child
  const [childForm, setChildForm] = useState<{
    name: string;
    nickname: string;
    age: number;
    birthYear: number;
    ageStage: AgeStage;
    autoLoadAgeHabits: boolean;
    showRealNameOnLeaderboard: boolean;
    isPublicOnLeaderboard: boolean;
    avatar: string;
    themeColor: string;
  }>({
    name: '',
    nickname: '',
    age: 5,
    birthYear: new Date().getFullYear() - 5,
    ageStage: '3-6',
    autoLoadAgeHabits: true,
    showRealNameOnLeaderboard: false,
    isPublicOnLeaderboard: true,
    avatar: '🌟',
    themeColor: '#6366f1',
  });

  // Open Habit Create / Edit
  const handleOpenHabitModal = (habit?: HabitActivity) => {
    if (habit) {
      setEditingHabit(habit);
      setHabitForm({
        title: habit.title,
        description: habit.description || '',
        icon: habit.icon,
        category: habit.category,
        points: habit.points,
        recurrenceType: habit.recurrenceType,
        recurrenceDays: habit.recurrenceDays || [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: habit.timeOfDay,
        durationMinutes: habit.durationMinutes || 0,
        requiresApproval: habit.requiresApproval,
        childId: habit.childId,
      });
    } else {
      setEditingHabit(null);
      setHabitForm({
        title: '',
        description: '',
        icon: '✨',
        category: 'nutrition',
        points: 15,
        recurrenceType: 'daily',
        recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: 'morning',
        durationMinutes: 0,
        requiresApproval: false,
        childId: null,
      });
    }
    setIsHabitModalOpen(true);
  };

  const handleSaveHabit = () => {
    if (!habitForm.title.trim()) return;
    if (editingHabit) {
      updateActivity(editingHabit.id, habitForm);
    } else {
      createActivity({
        ...habitForm,
        isActive: true,
      });
    }
    setIsHabitModalOpen(false);
  };

  const handleAddWitTemplate = (template: HabitTemplate) => {
    createActivity({
      title: template.title,
      description: template.description || '',
      icon: template.icon,
      category: template.category,
      points: template.points,
      recurrenceType: 'daily',
      recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
      timeOfDay: template.timeOfDay,
      durationMinutes: template.durationMinutes || 0,
      requiresApproval: Boolean(template.requiresApproval),
      childId: null,
      isActive: true,
    });
  };

  // Apply Journey Plan to Child
  const handleApplyJourneyPlan = () => {
    if (!selectedApplyPlan) return;

    selectedApplyPlan.habits.forEach((h) => {
      createActivity({
        title: h.title,
        description: h.description,
        icon: h.icon,
        category: h.category,
        points: h.points,
        recurrenceType: 'daily',
        recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
        timeOfDay: h.timeOfDay,
        durationMinutes: h.durationMinutes || 0,
        requiresApproval: Boolean(h.requiresApproval),
        childId: targetChildIdForPlan ? targetChildIdForPlan : null,
        isActive: true,
      });
    });

    const notice = t.appliedSuccess;
    setPlanAppliedNotice(notice);
    setTimeout(() => {
      setPlanAppliedNotice('');
      setSelectedApplyPlan(null);
      setActiveTab('habits');
    }, 1500);
  };

  // Open Reward Create / Edit
  const handleOpenRewardModal = (rew?: Reward) => {
    if (rew) {
      setEditingReward(rew);
      setRewardForm({
        title: rew.title,
        description: rew.description || '',
        icon: rew.icon,
        costPoints: rew.costPoints,
        stock: rew.stock,
      });
    } else {
      setEditingReward(null);
      setRewardForm({
        title: '',
        description: '',
        icon: '🎁',
        costPoints: 50,
        stock: -1,
      });
    }
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = () => {
    if (!rewardForm.title.trim()) return;
    if (editingReward) {
      updateReward(editingReward.id, rewardForm);
    } else {
      createReward({
        ...rewardForm,
        isActive: true,
      });
    }
    setIsRewardModalOpen(false);
  };

  // Open Child Profile Modal
  const handleOpenChildModal = (child?: ChildProfile) => {
    if (child) {
      setEditingChild(child);
      const childAge = child.age ?? 5;
      setChildForm({
        name: child.name,
        nickname: child.nickname || '',
        age: childAge,
        birthYear: child.birthYear ?? (new Date().getFullYear() - childAge),
        ageStage: child.ageStage ?? getStageFromAge(childAge),
        autoLoadAgeHabits: false,
        showRealNameOnLeaderboard: child.showRealNameOnLeaderboard ?? false,
        isPublicOnLeaderboard: child.isPublicOnLeaderboard ?? true,
        avatar: child.avatar,
        themeColor: child.themeColor,
      });
    } else {
      setEditingChild(null);
      setChildForm({
        name: '',
        nickname: '',
        age: 5,
        birthYear: new Date().getFullYear() - 5,
        ageStage: '3-6',
        autoLoadAgeHabits: true,
        showRealNameOnLeaderboard: false,
        isPublicOnLeaderboard: true,
        avatar: '🦁',
        themeColor: '#3b82f6',
      });
    }
    setIsChildModalOpen(true);
  };

  const handleSaveChild = () => {
    if (!childForm.name.trim()) return;
    if (editingChild) {
      updateProfile(editingChild.id, {
        name: childForm.name,
        nickname: childForm.nickname.trim() || undefined,
        age: childForm.age,
        birthYear: childForm.birthYear,
        ageStage: childForm.ageStage,
        showRealNameOnLeaderboard: childForm.showRealNameOnLeaderboard,
        isPublicOnLeaderboard: childForm.isPublicOnLeaderboard,
        avatar: childForm.avatar,
        themeColor: childForm.themeColor,
      });
    } else {
      createProfile({
        name: childForm.name,
        nickname: childForm.nickname.trim() || undefined,
        age: childForm.age,
        birthYear: childForm.birthYear,
        ageStage: childForm.autoLoadAgeHabits ? childForm.ageStage : undefined,
        showRealNameOnLeaderboard: childForm.showRealNameOnLeaderboard,
        isPublicOnLeaderboard: childForm.isPublicOnLeaderboard,
        avatar: childForm.avatar,
        themeColor: childForm.themeColor,
        points: 0,
        totalEarned: 0,
        level: 1,
        streak: 0,
      });
    }
    setIsChildModalOpen(false);
  };

  // Approvals items
  const pendingLogs = logs.filter((l) => l.status === 'pending_approval');
  const pendingRedemptions = redemptions.filter((r) => r.status === 'pending');

  // Supabase test connection
  const handleTestSupabase = async () => {
    if (!supabaseUrlInput || !supabaseKeyInput) {
      setConnectionTestResult({
        success: false,
        message: 'Vui lòng nhập Supabase URL và Anon Key.',
      });
      return;
    }
    const result = await testSupabaseConnection(supabaseUrlInput, supabaseKeyInput);
    setConnectionTestResult(result);
    if (result.success) {
      localStorage.setItem('kidhabit_supabase_url', supabaseUrlInput.trim());
      localStorage.setItem('kidhabit_supabase_anon_key', supabaseKeyInput.trim());
      syncNow();
    }
  };

  // PIN update
  const handleSavePin = () => {
    if (/^\d{4}$/.test(newPinInput)) {
      updateParentPin(newPinInput);
      setPinChangeNotice('Đã đổi mã PIN thành công!');
      setTimeout(() => setPinChangeNotice(''), 3000);
      setNewPinInput('');
    } else {
      setPinChangeNotice('Mã PIN phải gồm đúng 4 chữ số.');
    }
  };

  const currentWitPack =
    WIT_HABIT_PACKS.find((p) => p.key === selectedWitPackKey) || WIT_HABIT_PACKS[0];

  const currentJourneyList =
    journeyType === 'weekly' ? WEEKLY_JOURNEY_PLANS : MONTHLY_JOURNEY_PLANS;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Top Banner: Parent Mode Title & Lock Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg tracking-tight">{t.parentMode}</h2>
              <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400">{t.appSlogan}</p>
          </div>
        </div>

        <button
          onClick={lockParent}
          className="self-start sm:self-auto py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 active:scale-95 border border-white/15"
        >
          <Lock className="w-4 h-4 text-amber-400" />
          {t.kidMode}
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-2xl overflow-x-auto scrollbar-none">
        {[
          { key: 'approvals', label: t.approvals, icon: <CheckCircle2 className="w-4 h-4" />, badge: pendingLogs.length + pendingRedemptions.length },
          { key: 'habits', label: t.manageHabits, icon: <Calendar className="w-4 h-4" /> },
          { key: 'journeys', label: t.journeys, icon: <Compass className="w-4 h-4" /> },
          { key: 'rewards', label: t.rewards, icon: <Gift className="w-4 h-4" /> },
          { key: 'children', label: t.manageProfiles, icon: <Users className="w-4 h-4" /> },
          { key: 'analytics', label: t.analytics, icon: <BarChart3 className="w-4 h-4" /> },
          { key: 'settings', label: t.settings, icon: <Settings className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. TAB: APPROVALS & TODAY OVERVIEW */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profiles.map((p) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const childTodayLogs = logs.filter((l) => l.childId === p.id && l.date === todayStr);
              const doneCount = childTodayLogs.filter(
                (l) => l.status === 'completed' || l.status === 'approved'
              ).length;

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800 shadow-xs"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{p.avatar}</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>⭐ {p.points} sao</span>
                        <span>•</span>
                        <span className="text-amber-500 font-bold">🔥 {p.streak} ngày</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Hôm nay: <strong className="text-slate-800 dark:text-slate-200">{doneCount} việc đã xong</strong>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending Task Logs */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              Nhiệm vụ chờ bố mẹ duyệt ({pendingLogs.length})
            </h3>

            {pendingLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Hiện không có nhiệm vụ nào cần phê duyệt.</p>
            ) : (
              <div className="space-y-3">
                {pendingLogs.map((log) => {
                  const act = activities.find((a) => a.id === log.activityId);
                  const child = profiles.find((p) => p.id === log.childId);

                  return (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{act?.icon || '✨'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                              {act?.title}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                              {child?.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Thưởng: +{act?.points} ⭐ • Hoàn thành ngày {log.date}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => rejectLog(log.id)}
                          className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors"
                        >
                          {t.reject}
                        </button>
                        <button
                          onClick={() => approveLog(log.id)}
                          className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {t.approve}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Reward Redemptions */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-600" />
              Yêu cầu đổi quà từ các con ({pendingRedemptions.length})
            </h3>

            {pendingRedemptions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Không có yêu cầu đổi quà nào đang chờ.</p>
            ) : (
              <div className="space-y-3">
                {pendingRedemptions.map((red) => {
                  const rew = rewards.find((r) => r.id === red.rewardId);
                  const child = profiles.find((p) => p.id === red.childId);

                  return (
                    <div
                      key={red.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{rew?.icon || '🎁'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                              {rew?.title}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                              {child?.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Đã trừ {red.pointsSpent} ⭐ • Yêu cầu lúc {new Date(red.requestedAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => rejectRedemption(red.id)}
                          className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors"
                        >
                          {t.reject}
                        </button>
                        <button
                          onClick={() => deliverRedemption(red.id)}
                          className="py-1.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          {t.delivered}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TAB: HABIT ACTIVITIES MANAGEMENT WITH WIT & NUTRITION PACKS */}
      {activeTab === 'habits' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">
                {t.manageHabits} ({activities.length})
              </h3>
              <p className="text-xs text-slate-400">
                Thực hành bồi dưỡng Tâm thái, Phẩm chất, 7 Bố thí &amp; Ăn uống lành mạnh.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPortraitModalOpen(true)}
                className="py-2.5 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all border border-amber-200 dark:border-amber-800 flex items-center gap-2 active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span>Cẩm nang 16 Chân Dung &amp; 7 Bố Thí</span>
              </button>

              <button
                onClick={() => handleOpenHabitModal()}
                className="py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                {t.createHabitTitle}
              </button>
            </div>
          </div>

          {/* WIT & NUTRITION HABIT LIBRARY */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    {t.witSectionTitle}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Thư viện các thói quen mẫu: Ăn uống, Bàn ăn, Việc tốt, Tự lập &amp; Phẩm chất
                  </p>
                </div>
              </div>
            </div>

            {/* Pack Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {WIT_HABIT_PACKS.map((pack) => {
                const isSelected = selectedWitPackKey === pack.key;
                const packTitle = t[pack.titleKey as keyof typeof t] || pack.key;

                return (
                  <button
                    key={pack.key}
                    onClick={() => setSelectedWitPackKey(pack.key)}
                    className={`shrink-0 py-2 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{pack.icon}</span>
                    <span>{packTitle}</span>
                  </button>
                );
              })}
            </div>

            {/* Pack Items Shelf */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {currentWitPack.items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-zinc-800/60 rounded-2xl p-4 border border-slate-200/60 dark:border-zinc-700/60 flex flex-col justify-between gap-3 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0 p-1.5 rounded-xl bg-white dark:bg-zinc-700 shadow-xs">
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {item.title}
                        </h5>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-400">
                        <span className="text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                          +{item.points} ⭐
                        </span>
                        {item.durationMinutes ? (
                          <span className="bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                            {item.durationMinutes} phút
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddWitTemplate(item)}
                    className="w-full py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/40 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm vào danh sách bé
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Current Activities List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activities.map((act) => {
              const assignedChild = profiles.find((p) => p.id === act.childId);
              const categoryLabel = t[act.category as keyof typeof t] || act.category;

              return (
                <div
                  key={act.id}
                  className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/80">
                      {act.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate">
                          {act.title}
                        </h4>
                      </div>
                      {act.description && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{act.description}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2.5 flex-wrap text-[11px] font-semibold text-slate-500">
                        <span className="text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                          +{act.points} ⭐
                        </span>
                        <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                          {categoryLabel}
                        </span>
                        <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                          {act.recurrenceType === 'daily'
                            ? t.daily
                            : act.recurrenceType === 'weekdays'
                            ? t.weekdays
                            : act.recurrenceType === 'weekends'
                            ? t.weekends
                            : t.custom}
                        </span>
                        <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                          {act.timeOfDay === 'morning'
                            ? t.morning
                            : act.timeOfDay === 'afternoon'
                            ? t.afternoon
                            : act.timeOfDay === 'evening'
                            ? t.evening
                            : t.anytime}
                        </span>
                        {assignedChild && (
                          <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                            {assignedChild.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50 dark:border-zinc-800/80">
                    <button
                      onClick={() => handleOpenHabitModal(act)}
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                      title={t.edit}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteActivity(act.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. TAB: JOURNEYS (LỘ TRÌNH THEO TUẦN & THEO THÁNG) */}
      {activeTab === 'journeys' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                {t.journeys}
              </h3>
              <p className="text-xs text-slate-400">
                Các bộ lộ trình được thiết kế bài bản theo tuần và tháng, sau khi áp dụng bạn hoàn toàn có thể tùy biến.
              </p>
            </div>

            {/* Weekly vs Monthly Toggle */}
            <div className="flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-2xl">
              <button
                onClick={() => setJourneyType('weekly')}
                className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  journeyType === 'weekly'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t.weeklyRoadmap}
              </button>
              <button
                onClick={() => setJourneyType('monthly')}
                className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  journeyType === 'monthly'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t.monthlyRoadmap}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 font-medium">
            💡 {t.customNotice}
          </div>

          {/* Journey Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {currentJourneyList.map((plan) => {
              const planTitle = plan.title[language] || plan.title.vi;
              const planDesc = plan.description[language] || plan.description.vi;

              return (
                <div
                  key={plan.id}
                  className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-5 hover:border-indigo-200 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 shadow-xs">
                          {plan.icon}
                        </span>
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                            {plan.periodLabel}
                          </span>
                          <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mt-1">
                            {planTitle}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">{planDesc}</p>

                    {/* Preview Habit List in Plan */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Bao gồm {plan.habits.length} thói quen:
                      </span>
                      {plan.habits.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 text-xs"
                        >
                          <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200 truncate">
                            <span>{h.icon}</span>
                            <span className="truncate">{h.title}</span>
                          </span>
                          <span className="text-amber-500 font-extrabold shrink-0 ml-2">
                            +{h.points} ⭐
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedApplyPlan(plan);
                      setTargetChildIdForPlan(profiles[0]?.id || '');
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCheck className="w-4 h-4" />
                    {t.applyJourney}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB: REWARD STORE MANAGEMENT */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">
                {t.yourRewards} ({rewards.length})
              </h3>
              <p className="text-xs text-slate-400">
                Tạo các phần thưởng khuyến khích con tích sao đổi lấy niềm vui.
              </p>
            </div>

            <button
              onClick={() => handleOpenRewardModal()}
              className="py-2.5 px-5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {t.createRewardTitle}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {rewards.map((rew) => (
              <div
                key={rew.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-4xl p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/80">
                    {rew.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate">
                      {rew.title}
                    </h4>
                    {rew.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{rew.description}</p>
                    )}
                    <div className="mt-2 text-xs font-black text-amber-500">
                      {rew.costPoints} ⭐
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50 dark:border-zinc-800/80">
                  <button
                    onClick={() => handleOpenRewardModal(rew)}
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteReward(rew.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB: CHILDREN PROFILES MANAGEMENT */}
      {activeTab === 'children' && (
        <div className="space-y-6">
          {/* Family Device Connection Code Card */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/90 dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/30 rounded-3xl p-5 sm:p-6 border-2 border-indigo-200/80 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                      Mã kết nối thiết bị cho bé
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Tự động sinh • Không trùng lặp
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bé mở KidHabit trên điện thoại/iPad khác, chỉ cần nhập mã này là tự động đồng bộ ngay mà không cần tài khoản phụ huynh.
                  </p>
                </div>
              </div>

              {/* Monospace Code & Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-indigo-300 dark:border-indigo-700 shadow-inner">
                  <span className="font-mono font-black text-xl sm:text-2xl text-indigo-600 dark:text-indigo-400 tracking-widest">
                    {familyCode || 'Đang tạo mã...'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => familyCode && handleCopyCode(familyCode)}
                  disabled={!familyCode}
                  className="py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  {codeCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className="py-2.5 px-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Hiện mã QR để bé quét nhanh"
                >
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>Mã QR</span>
                </button>

                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  disabled={isRegeneratingCode}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                  title="Đổi mã mới"
                >
                  <RefreshCw className={`w-4 h-4 ${isRegeneratingCode ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* QR Code expansion */}
            {showQrCode && familyCode && (
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(familyCode)}`}
                  alt="QR Code liên kết"
                  className="w-28 h-28 rounded-xl border border-slate-200 dark:border-zinc-600 p-1.5 bg-white shadow-xs"
                />
                <div className="text-xs space-y-1 text-center sm:text-left">
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    Quét camera trên máy của bé
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Hoặc trên thiết bị của bé, bấm nút &quot;Bé nhập mã&quot; và gõ mã <strong>{familyCode}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* 3 Step Guidance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-zinc-800 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">1. Mở máy của bé</span>
                <span className="text-slate-500 dark:text-slate-400">Truy cập KidHabit Hero trên điện thoại hoặc máy tính bảng của con.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">2. Bấm &quot;Bé nhập mã&quot;</span>
                <span className="text-slate-500 dark:text-slate-400">Ở góc trên trang hoặc ở màn hình chính có nút nhập mã liên kết.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">3. Nhập mã {familyCode || 'HERO-8492'}</span>
                <span className="text-slate-500 dark:text-slate-400">Thiết bị bé sẽ nạp đúng hồ sơ, nhiệm vụ &amp; sao thưởng ngay lập tức.</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">
                {t.manageProfiles} ({profiles.length})
              </h3>
              <p className="text-xs text-slate-400">
                Tùy biến hồ sơ, linh vật đại diện, và điều chỉnh điểm số thủ công cho từng bé.
              </p>
            </div>

            <button
              onClick={() => handleOpenChildModal()}
              className="py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              {t.addChildTitle}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profiles.map((child) => (
              <div
                key={child.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-4xl shadow-inner">
                    {child.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100 truncate">
                        {child.name}
                      </h4>
                      {child.ageStage && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                          {getStageInfo(child.ageStage).name} ({child.age !== undefined ? `${child.age}t` : getStageInfo(child.ageStage).range})
                        </span>
                      )}
                      {child.nickname && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          🛡️ {child.nickname}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="font-bold text-amber-500">⭐ {child.points} sao</span>
                      <span>•</span>
                      <span>{t.levelPrefix} {child.level}</span>
                      <span>•</span>
                      <span>🔥 {child.streak} ngày</span>
                    </div>
                    {/* Leaderboard status badge */}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="text-slate-400 font-medium">{t.currentDisplayMode}</span>
                      <span className={`font-bold px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider ${
                        child.showRealNameOnLeaderboard
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                      }`}>
                        {child.showRealNameOnLeaderboard ? `👤 ${t.modeRealName}` : `🛡️ ${t.modeNickname}`}
                      </span>
                      {!child.isPublicOnLeaderboard && (
                        <span className="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 font-semibold px-2 py-0.5 rounded-lg text-[10px]">
                          🔒 Ẩn khỏi BXH
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAdjustingChildId(child.id);
                        setAdjustAmount(10);
                        setAdjustReason('');
                        setIsAdjustPointsModalOpen(true);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors"
                    >
                      ⭐ Thưởng / Phạt sao
                    </button>

                    {child.ageStage && (
                      <button
                        onClick={() => {
                          applyAgeHabitsBundle(child.id, child.ageStage!);
                          alert(`Đã nạp gói thói quen thích ứng lứa tuổi ${getStageInfo(child.ageStage!).range} cho bé ${child.name}!`);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors"
                        title="Tự động thêm bộ thói quen theo lứa tuổi"
                      >
                        ⚡ Nạp gói tuổi
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenChildModal(child)}
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => deleteProfile(child.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB: ANALYTICS & TRACKING */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">
            {t.analytics} (Báo cáo thói quen)
          </h3>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              {t.weeklyTrend}
            </h4>

            <div className="grid grid-cols-7 gap-2 pt-8 pb-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                const dStr = date.toISOString().split('T')[0];
                const count = logs.filter(
                  (l) => l.date === dStr && (l.status === 'completed' || l.status === 'approved')
                ).length;

                const heightPercent = Math.min(100, Math.max(12, count * 20));

                return (
                  <div key={dStr} className="flex flex-col items-center gap-2">
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {count > 0 ? count : ''}
                    </span>
                    <div className="w-full h-32 bg-slate-50 dark:bg-zinc-800 rounded-2xl flex items-end p-1">
                      <div
                        className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all duration-500"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB: SETTINGS & SUPABASE CLOUD (OPTION B) */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">
            {t.parentSettings}
          </h3>

          {/* Family Device Connection Code Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  Mã kết nối thiết bị cho bé (Không trùng lặp)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Mã duy nhất dùng để liên kết điện thoại/iPad của bé vào tài khoản gia đình bạn.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-800">
                  <span className="font-mono font-black text-lg text-indigo-600 dark:text-indigo-400 tracking-widest">
                    {familyCode || 'Đang tạo...'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => familyCode && handleCopyCode(familyCode)}
                  disabled={!familyCode}
                  className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{codeCopied ? 'Đã copy' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  disabled={isRegeneratingCode}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                  title="Đổi mã mới"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingCode ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Change PIN */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              {t.changePin}
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Mã PIN hiện tại: <strong className="text-slate-700 dark:text-slate-200">{parentPin}</strong>.
            </p>
            <div className="flex items-center gap-3 max-w-xs">
              <input
                type="password"
                maxLength={4}
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="4 số mới..."
                className="w-32 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-center font-bold tracking-widest text-sm"
              />
              <button
                onClick={handleSavePin}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all"
              >
                {t.save}
              </button>
            </div>
            {pinChangeNotice && (
              <p className="text-xs text-emerald-600 font-bold mt-2">{pinChangeNotice}</p>
            )}
          </div>

          {/* Storage Mode: Local-only vs Cloud Sync (User Choice) */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 space-y-4">
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                {t.storageModeLabel}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {t.storageModeTip}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStorageMode('local')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  storageMode === 'local'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    📱 {t.localStorageMode}
                  </span>
                  {storageMode === 'local' && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Dữ liệu lưu 100% trên trình duyệt máy này. Phù hợp phụ huynh muốn riêng tư tuyệt đối, không đồng bộ ra ngoài.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStorageMode('cloud')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  storageMode === 'cloud'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    ☁️ {t.cloudStorageMode}
                  </span>
                  {storageMode === 'cloud' && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  Đồng bộ tức thì lên Supabase PostgreSQL. Dùng chung cho nhiều máy, điện thoại, máy tính bảng của cả nhà.
                </p>
              </button>
            </div>
          </div>

          {/* Google OAuth & Account Authorization Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Tài khoản &amp; Phân quyền dữ liệu khách hàng (Google OAuth)
              </h4>
              {currentUser && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Đã xác thực
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              {t.customerIsolationNotice}
            </p>

            {currentUser ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                <div className="flex items-center gap-3">
                  {currentUser.user_metadata?.avatar_url ? (
                    <img
                      src={currentUser.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full border border-white shadow-xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-200">
                      {currentUser.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {currentUser.user_metadata?.full_name || 'Khách hàng'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {currentUser.email} (ID: {currentUser.id.slice(0, 8)}...)
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="py-2 px-4 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 dark:border-zinc-700 text-slate-600 transition-colors shadow-xs"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Chưa đăng nhập tài khoản
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {t.loginRequiredForCloud}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="py-2.5 px-5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 border border-slate-200 dark:border-zinc-700 text-xs font-extrabold text-slate-800 dark:text-slate-100 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  {t.googleLogin}
                </button>
              </div>
            )}
          </div>

          {/* Supabase Cloud Sync Configuration */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                {t.cloudBackend}
              </h4>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  cloudSyncActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {cloudSyncActive ? '⚡ Cloud Sẵn Sàng' : '⚡ Máy Chủ KidHabit'}
              </span>
            </div>
            
            {/* System preconfigured notice */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 mb-4">
              <div className="flex items-start gap-2.5">
                <span className="text-base leading-none">✅</span>
                <div className="text-xs text-emerald-900 dark:text-emerald-200">
                  <p className="font-bold mb-0.5">Hệ thống Cloud đã được thiết lập sẵn tự động!</p>
                  <p className="text-emerald-700 dark:text-emerald-300">
                    Dữ liệu của ba mẹ và bé được tự động đồng bộ thời gian thực an toàn qua máy chủ Supabase chính thức. Ba mẹ không cần phải tạo tài khoản hay nhập URL/Key thủ công.
                  </p>
                </div>
              </div>
            </div>

            {/* Collapsible custom setup for advanced developers only */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowSqlSchema(!showSqlSchema)}
                className="text-xs text-slate-500 hover:text-indigo-600 font-semibold flex items-center gap-1.5 cursor-pointer py-1"
              >
                <span>⚙️ Cấu hình Supabase riêng (Dành cho nhà phát triển / Tự host)</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSqlSchema ? 'rotate-180' : ''}`} />
              </button>

              {showSqlSchema && (
                <div className="mt-3 space-y-3 max-w-lg p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700 animate-fade-in">
                  <p className="text-[11px] text-slate-500">
                    Nếu bạn muốn dùng cơ sở dữ liệu Supabase của riêng mình thay cho hệ thống mặc định:
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      {t.supabaseUrl}
                    </label>
                    <input
                      type="text"
                      placeholder="https://your-project.supabase.co"
                      value={supabaseUrlInput}
                      onChange={(e) => setSupabaseUrlInput(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      {t.supabaseKey}
                    </label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                      value={supabaseKeyInput}
                      onChange={(e) => setSupabaseKeyInput(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleTestSupabase}
                      className="py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {t.testConnect} &amp; Lưu riêng
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem('kidhabit_supabase_url');
                        localStorage.removeItem('kidhabit_supabase_anon_key');
                        const cfg = getSupabaseConfig();
                        setSupabaseUrlInput(cfg.url);
                        setSupabaseKeyInput(cfg.anonKey);
                        syncNow();
                        setConnectionTestResult({
                          success: true,
                          message: 'Đã khôi phục về máy chủ Cloud mặc định của KidHabit Hero!',
                        });
                      }}
                      className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Khôi phục mặc định
                    </button>
                  </div>

                  {connectionTestResult && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold ${
                        connectionTestResult.success
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {connectionTestResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              Sao lưu &amp; Phục hồi dữ liệu
            </h4>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const data = exportData();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `kidhabit_backup_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }}
                className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                {t.exportData}
              </button>

              <label className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {t.importData}
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content && importData(content)) {
                          alert('Nhập dữ liệu sao lưu thành công!');
                        } else {
                          alert('File sao lưu không hợp lệ.');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* MODAL APPLY JOURNEY PLAN */}
      {selectedApplyPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 my-auto overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                <span className="text-2xl sm:text-3xl p-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 shrink-0">
                  {selectedApplyPlan.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full inline-block">
                    {selectedApplyPlan.periodLabel}
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 mt-0.5 truncate leading-tight">
                    {selectedApplyPlan.title[language] || selectedApplyPlan.title.vi}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplyPlan(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn có muốn áp dụng {selectedApplyPlan.habits.length} thói quen này vào lịch hàng ngày? Sau khi thêm, bạn có thể chỉnh sửa tự do trong tab &quot;Quản lý việc&quot;.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Áp dụng cho bé nào?
                </label>
                <select
                  value={targetChildIdForPlan}
                  onChange={(e) => setTargetChildIdForPlan(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                >
                  <option value="">{t.allChildren}</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.avatar})
                    </option>
                  ))}
                </select>
              </div>

              {planAppliedNotice && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold animate-bounce text-center">
                  ✓ {planAppliedNotice}
                </div>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 flex items-center justify-end gap-2.5 pb-safe">
              <button
                type="button"
                onClick={() => setSelectedApplyPlan(null)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleApplyJourneyPlan}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                Xác nhận áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT HABIT MODAL */}
      {isHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 my-auto overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{editingHabit ? '✏️' : '✨'}</span>
                <span>{editingHabit ? t.editHabitTitle : t.createHabitTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsHabitModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {t.titleLabel} *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={habitForm.icon}
                    onChange={(e) => setHabitForm({ ...habitForm, icon: e.target.value })}
                    className="w-12 text-center text-xl py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  />
                  <input
                    type="text"
                    placeholder="Ví dụ: Rửa tay trước khi ăn, Mời cơm..."
                    value={habitForm.title}
                    onChange={(e) => setHabitForm({ ...habitForm, title: e.target.value })}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Mô tả &amp; Ý nghĩa bồi dưỡng bé
                </label>
                <input
                  type="text"
                  placeholder="Ý nghĩa phẩm chất, nếp sống lành mạnh..."
                  value={habitForm.description}
                  onChange={(e) => setHabitForm({ ...habitForm, description: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {t.categoryLabel}
                  </label>
                  <select
                    value={habitForm.category}
                    onChange={(e) =>
                      setHabitForm({ ...habitForm, category: e.target.value as ActivityCategory })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                  >
                    <option value="nutrition">🍱 Ăn uống &amp; Bàn ăn</option>
                    <option value="giving">🎁 7 Bố thí</option>
                    <option value="virtue">💎 Phẩm chất (Nhân Lễ Nghĩa Trí Tín)</option>
                    <option value="mindset">☀️ Tâm thái (An vui, Biết ơn)</option>
                    <option value="personality">👑 Kiện toàn Nhân cách</option>
                    <option value="wisdom">📖 Trí tuệ &amp; Sức học tập</option>
                    <option value="capacity">⚡ Năng lực &amp; Gánh vác</option>
                    <option value="physical">🏃 Thể chất &amp; Sức khỏe</option>
                    <option value="study">📚 Học tập</option>
                    <option value="chores">🧹 Việc nhà</option>
                    <option value="health">🪥 Sức khỏe</option>
                    <option value="selfcare">🛏️ Tự lập</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {t.pointsLabel}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={habitForm.points}
                    onChange={(e) => setHabitForm({ ...habitForm, points: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-bold text-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {t.timeOfDayLabel}
                  </label>
                  <select
                    value={habitForm.timeOfDay}
                    onChange={(e) =>
                      setHabitForm({ ...habitForm, timeOfDay: e.target.value as TimeOfDay })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                  >
                    <option value="morning">{t.morning}</option>
                    <option value="afternoon">{t.afternoon}</option>
                    <option value="evening">{t.evening}</option>
                    <option value="anytime">{t.anytime}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {t.recurrenceLabel}
                  </label>
                  <select
                    value={habitForm.recurrenceType}
                    onChange={(e) =>
                      setHabitForm({ ...habitForm, recurrenceType: e.target.value as RecurrenceType })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                  >
                    <option value="daily">{t.daily}</option>
                    <option value="weekdays">{t.weekdays}</option>
                    <option value="weekends">{t.weekends}</option>
                    <option value="custom">{t.custom}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Đếm giờ (phút)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={habitForm.durationMinutes}
                    onChange={(e) =>
                      setHabitForm({ ...habitForm, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {t.assignLabel}
                  </label>
                  <select
                    value={habitForm.childId || ''}
                    onChange={(e) =>
                      setHabitForm({ ...habitForm, childId: e.target.value || null })
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                  >
                    <option value="">{t.allChildren}</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="requiresApprovalCheck"
                  checked={habitForm.requiresApproval}
                  onChange={(e) => setHabitForm({ ...habitForm, requiresApproval: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="requiresApprovalCheck" className="text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                  {t.requiresApprovalLabel}
                </label>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 flex items-center justify-end gap-2.5 pb-safe">
              <button
                type="button"
                onClick={() => setIsHabitModalOpen(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveHabit}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT REWARD MODAL */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-sm max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 my-auto overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>🎁</span>
                <span>{editingReward ? t.editRewardTitle : t.createRewardTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRewardModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Tên quà *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rewardForm.icon}
                    onChange={(e) => setRewardForm({ ...rewardForm, icon: e.target.value })}
                    className="w-12 text-center text-xl py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                  />
                  <input
                    type="text"
                    placeholder="Ví dụ: Xem phim 30p, Mua đồ chơi..."
                    value={rewardForm.title}
                    onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {t.rewardCost} (sao ⭐)
                </label>
                <input
                  type="number"
                  min={5}
                  value={rewardForm.costPoints}
                  onChange={(e) => setRewardForm({ ...rewardForm, costPoints: Number(e.target.value) })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Mô tả chi tiết</label>
                <input
                  type="text"
                  placeholder="Điều kiện hoặc chi tiết quà..."
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                />
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 flex items-center justify-end gap-2.5 pb-safe">
              <button
                type="button"
                onClick={() => setIsRewardModalOpen(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveReward}
                className="py-2.5 px-6 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CHILD MODAL */}
      {isChildModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 my-auto overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="text-xl">{childForm.avatar}</span>
                <span>{editingChild ? t.editChildTitle : t.addChildTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsChildModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
              {/* Real Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {t.realName} *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Minh An..."
                  value={childForm.name}
                  onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Age & Age Stage Configuration */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <span>🎂</span>
                    <span>Độ tuổi của bé ({childForm.age} tuổi)</span>
                  </label>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    {getStageInfo(childForm.ageStage).name} ({getStageInfo(childForm.ageStage).range})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="18"
                    value={childForm.age}
                    onChange={(e) => {
                      const newAge = Number(e.target.value);
                      const stage = getStageFromAge(newAge);
                      setChildForm({
                        ...childForm,
                        age: newAge,
                        birthYear: new Date().getFullYear() - newAge,
                        ageStage: stage,
                      });
                    }}
                    className="flex-1 accent-amber-500"
                  />
                  <div className="w-14 text-center font-black text-sm bg-white dark:bg-zinc-800 py-1 px-2 rounded-xl border border-amber-200 dark:border-amber-800">
                    {childForm.age} t
                  </div>
                </div>

                <div className="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  {childForm.ageStage === '0-3' ? (
                    <span>
                      🍼 <strong>0-3 tuổi (Thấm nhuần môi trường)</strong>: Giai đoạn thân giáo. Ba mẹ là người thực hành chính 16 đức tính để làm gương &amp; rõ hình cho con.
                    </span>
                  ) : childForm.ageStage === '3-6' ? (
                    <span>
                      🌱 <strong>3-6 tuổi (Định hình thói quen)</strong>: Bé bắt đầu tự làm với sự đồng hành của cha mẹ và thực hành 7 Bố thí nhỏ.
                    </span>
                  ) : childForm.ageStage === '6-12' ? (
                    <span>
                      📚 <strong>6-12 tuổi (5 Phẩm chất &amp; Gánh vác)</strong>: Rèn Nhân - Lễ - Nghĩa - Trí - Tín và gánh vác việc gia đình.
                    </span>
                  ) : (
                    <span>
                      🚀 <strong>12-18 tuổi (Luật sắt &amp; Khát vọng)</strong>: Tự lập 100%, kỷ luật tự thân và hoạch định tương lai 5-10 năm.
                    </span>
                  )}
                </div>

                {!editingChild && (
                  <label className="flex items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={childForm.autoLoadAgeHabits}
                      onChange={(e) => setChildForm({ ...childForm, autoLoadAgeHabits: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Tự động nạp gói 6 thói quen chuẩn lứa tuổi {getStageInfo(childForm.ageStage).range} cho bé</span>
                  </label>
                )}
              </div>

              {/* Leaderboard Nickname */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {t.leaderboardNickname}
                </label>
                <input
                  type="text"
                  placeholder={t.nicknamePlaceholder}
                  value={childForm.nickname}
                  onChange={(e) => setChildForm({ ...childForm, nickname: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Biệt danh thi đua công khai giúp bảo vệ họ tên đầy đủ của bé.
                </p>
              </div>

              {/* Privacy Option Selection */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2.5">
                <span className="block text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  🛡️ {t.leaderboardPrivacyTitle}
                </span>
                
                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="leaderboard_privacy"
                    checked={!childForm.showRealNameOnLeaderboard}
                    onChange={() => setChildForm({ ...childForm, showRealNameOnLeaderboard: false })}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {t.showNicknameOnly}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Bảng xếp hạng chỉ hiện: <strong>{childForm.nickname.trim() || (childForm.name ? `Bé ${childForm.name.trim().split(/\s+/).pop()}` : 'Biệt danh')}</strong>
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="leaderboard_privacy"
                    checked={childForm.showRealNameOnLeaderboard}
                    onChange={() => setChildForm({ ...childForm, showRealNameOnLeaderboard: true })}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {t.showRealNameOption}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Bảng xếp hạng sẽ hiện tên: <strong>{childForm.name || 'Tên thật của bé'}</strong>
                    </span>
                  </div>
                </label>

                <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={childForm.isPublicOnLeaderboard}
                      onChange={(e) => setChildForm({ ...childForm, isPublicOnLeaderboard: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {t.participateInPublicLeaderboard}
                    </span>
                  </label>
                </div>
              </div>

              {/* Live Preview of Leaderboard Card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{childForm.avatar}</span>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Xem trước trên Bảng xếp hạng
                    </div>
                    <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      {childForm.showRealNameOnLeaderboard
                        ? (childForm.name || 'Tên thật bé')
                        : (childForm.nickname.trim() || (childForm.name ? `Bé ${childForm.name.trim().split(/\s+/).pop()}` : 'Biệt danh bé'))}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                  ⭐ 120 sao
                </span>
              </div>

              {/* Mascot Avatar Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Linh vật / Avatar ({childForm.avatar})
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {['🦁', '🐰', '🐼', '🦊', '🐱', '🐶', '🦄', '🚀', '🌟', '👑'].map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setChildForm({ ...childForm, avatar: emoji })}
                      className={`w-10 h-10 rounded-2xl text-2xl flex items-center justify-center transition-all shrink-0 ${
                        childForm.avatar === emoji
                          ? 'bg-indigo-100 border-2 border-indigo-600 scale-110'
                          : 'bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 flex items-center justify-end gap-2.5 pb-safe">
              <button
                type="button"
                onClick={() => setIsChildModalOpen(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveChild}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADJUST POINTS MODAL */}
      {isAdjustPointsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-sm max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 my-auto overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>⭐</span>
                <span>{t.adjustPoints}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjustPointsModalOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Số sao thay đổi (+ cộng thưởng / - trừ phạt)
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-bold text-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {t.adjustPointsReason}
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khen ngợi biết nhường em, ăn ngoan..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                />
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 flex items-center justify-end gap-2.5 pb-safe">
              <button
                type="button"
                onClick={() => setIsAdjustPointsModalOpen(false)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  adjustPoints(adjustingChildId, adjustAmount, adjustReason);
                  setIsAdjustPointsModalOpen(false);
                }}
                className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
