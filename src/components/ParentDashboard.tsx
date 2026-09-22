'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Lock,
  CheckCircle2,
  Gift,
  Users,
  Calendar,
  BarChart3,
  Settings,
  ShieldCheck,
  Compass,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import {
  HabitActivity,
  ChildProfile,
  ActivityCategory,
  RecurrenceType,
  TimeOfDay,
} from '@/types';
import { getStageFromAge } from '@/lib/wit-framework';
import { AgeStage } from '@/types';
import { ParentAnalyticsTab } from './ParentAnalyticsTab';
import { ParentApprovalsTab } from './ParentApprovalsTab';
import { ParentSettingsTab } from './ParentSettingsTab';
import { ParentRewardsTab } from './ParentRewardsTab';
import { ParentJourneysTab } from './ParentJourneysTab';
import { ParentHabitsTab } from './ParentHabitsTab';
import { ParentChildrenTab } from './ParentChildrenTab';
import { getParentPrimaryCopy } from '@/lib/i18n/parent-primary-copy';
import { getKidDashboardCopy } from '@/lib/i18n/kid-dashboard-copy';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { getProfileMutationCopy } from '@/lib/i18n/profile-mutation-copy';
import { getActivityMutationError } from '@/lib/i18n/activity-mutation-copy';
import { useModalFocus } from '@/lib/use-modal-focus';
import { MASCOTS, getMascotLabel } from '@/lib/mascots';
import { MascotAvatar } from './MascotAvatar';

export function ParentDashboard() {
  const {
    lockParent,
    profiles,
    createProfile,
    updateProfile,
    adjustPoints,
    createActivity,
    updateActivity,
    logs,
    redemptions,
    setIsPortraitModalOpen,
  } = useAppStore();

  const { t, language } = useTranslation();
  const copy = getParentPrimaryCopy(language);
  const kidCopy = getKidDashboardCopy(language);
  const onboardingCopy = getOnboardingCopy(language);
  const profileCopy = getProfileMutationCopy(language);

  const [activeTab, setActiveTab] = useState<
    'approvals' | 'habits' | 'journeys' | 'rewards' | 'children' | 'analytics' | 'settings'
  >('approvals');

  // Modal states
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitActivity | null>(null);
  const [isSavingHabit, setIsSavingHabit] = useState(false);
  const [habitSaveError, setHabitSaveError] = useState('');

  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [childSaveError, setChildSaveError] = useState('');

  const closeChildModal = useCallback(() => {
    if (!isSavingChild) setIsChildModalOpen(false);
  }, [isSavingChild]);

  useModalFocus(isChildModalOpen, closeChildModal);

  useEffect(() => {
    if (!isChildModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isChildModalOpen]);

  const [isAdjustPointsModalOpen, setIsAdjustPointsModalOpen] = useState(false);
  const [adjustingChildId, setAdjustingChildId] = useState<string>('');
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('');


  // Form states for Habit
  const [habitForm, setHabitForm] = useState<{
    title: string;
    description: string;
    instructions: string;
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
    instructions: '',
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
    isPublicOnLeaderboard: false,
    avatar: 'mascot:leo',
    themeColor: '#F59E0B',
  });

  // Open Habit Create / Edit
  const handleOpenHabitModal = (habit?: HabitActivity) => {
    setHabitSaveError('');
    if (habit) {
      setEditingHabit(habit);
      setHabitForm({
        title: habit.title,
        description: habit.description || '',
        instructions: habit.instructions || '',
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
        instructions: '',
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

  const handleSaveHabit = async () => {
    if (!habitForm.title.trim()) return;
    setHabitSaveError('');
    setIsSavingHabit(true);
    const saved = editingHabit
      ? await updateActivity(editingHabit.id, habitForm)
      : await createActivity({
        ...habitForm,
        isActive: true,
      });
    setIsSavingHabit(false);
    if (!saved) {
      setHabitSaveError(getActivityMutationError(language));
      return;
    }
    setIsHabitModalOpen(false);
  };

  // Open Child Profile Modal
  const handleOpenChildModal = (child?: ChildProfile) => {
    setChildSaveError('');
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
        isPublicOnLeaderboard: false,
        avatar: 'mascot:leo',
        themeColor: '#F59E0B',
      });
    }
    setIsChildModalOpen(true);
  };

  const handleSaveChild = async () => {
    if (!childForm.name.trim()) return;
    setIsSavingChild(true);
    setChildSaveError('');
    let saved: boolean;
    if (editingChild) {
      saved = await updateProfile(editingChild.id, {
        name: childForm.name,
        nickname: childForm.nickname.trim(),
        age: childForm.age,
        birthYear: childForm.birthYear,
        ageStage: childForm.ageStage,
        showRealNameOnLeaderboard: childForm.showRealNameOnLeaderboard,
        isPublicOnLeaderboard: childForm.isPublicOnLeaderboard,
        avatar: childForm.avatar,
        themeColor: childForm.themeColor,
      });
    } else {
      saved = await createProfile({
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
    setIsSavingChild(false);
    if (saved) {
      setIsChildModalOpen(false);
      return;
    }
    setChildSaveError(profileCopy.saveError);
  };

  // Approvals items
  const pendingLogs = logs.filter((l) => l.status === 'pending_approval');
  const pendingRedemptions = redemptions.filter((r) => r.status === 'pending');

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
            </div>
            <p className="text-xs text-slate-300">{t.appSlogan}</p>
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
      <div role="tablist" aria-label={copy.tablistLabel} className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1.5 sm:grid-cols-4 lg:grid-cols-7 dark:bg-zinc-900">
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
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 py-2 text-center text-xs font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-black">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'approvals' && <ParentApprovalsTab />}

      {activeTab === 'habits' && <ParentHabitsTab onOpenHabit={handleOpenHabitModal} onOpenHandbook={() => setIsPortraitModalOpen(true)} />}

      {activeTab === 'journeys' && <ParentJourneysTab onApplied={() => setActiveTab('habits')} />}

      {activeTab === 'rewards' && <ParentRewardsTab />}

      {activeTab === 'children' && (
        <ParentChildrenTab
          onOpenChild={handleOpenChildModal}
          onAdjustPoints={(childId) => {
            setAdjustingChildId(childId);
            setAdjustAmount(10);
            setAdjustReason('');
            setIsAdjustPointsModalOpen(true);
          }}
        />
      )}

      {/* 6. TAB: ANALYTICS & TRACKING */}
      {activeTab === 'analytics' && <ParentAnalyticsTab />}

      {activeTab === 'settings' && <ParentSettingsTab />}

      {/* CREATE / EDIT HABIT MODAL */}
      {isHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div role="dialog" aria-modal="true" aria-label={editingHabit ? t.editHabitTitle : t.createHabitTitle} className="relative w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 my-auto overflow-hidden">
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
                    placeholder={copy.habitTitlePlaceholder}
                    value={habitForm.title}
                    onChange={(e) => setHabitForm({ ...habitForm, title: e.target.value })}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {copy.habitDescription}
                </label>
                <input
                  type="text"
                  placeholder={copy.habitDescriptionPlaceholder}
                  value={habitForm.description}
                  onChange={(e) => setHabitForm({ ...habitForm, description: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {language === 'vi' ? 'Cách làm / hướng dẫn cho con' : 'How to do it'}
                </label>
                <textarea
                  value={habitForm.instructions}
                  onChange={(e) => setHabitForm({ ...habitForm, instructions: e.target.value })}
                  rows={3}
                  placeholder={language === 'vi' ? 'Viết từng bước ngắn, dễ hiểu…' : 'Add short, clear steps…'}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
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
                    <option value="nutrition">🍱 {t.nutrition}</option>
                    <option value="giving">🎁 {t.giving}</option>
                    <option value="virtue">💎 {t.virtue}</option>
                    <option value="mindset">☀️ {t.mindset}</option>
                    <option value="personality">👑 {t.personality}</option>
                    <option value="wisdom">📖 {t.wisdom}</option>
                    <option value="capacity">⚡ {t.capacity}</option>
                    <option value="physical">🏃 {t.physical}</option>
                    <option value="study">📚 {t.study}</option>
                    <option value="chores">🧹 {t.chores}</option>
                    <option value="health">🪥 {t.health}</option>
                    <option value="selfcare">🛏️ {t.selfcare}</option>
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
                    {copy.durationMinutes}
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

            {habitSaveError && (
              <div role="alert" className="mx-4 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                {habitSaveError}
              </div>
            )}

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
                onClick={() => void handleSaveHabit()}
                disabled={isSavingHabit}
                aria-busy={isSavingHabit}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:cursor-wait disabled:opacity-60"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CHILD MODAL */}
      {isChildModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div role="dialog" aria-modal="true" aria-label={editingChild ? t.editChildTitle : t.addChildTitle} className="relative w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 my-auto overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <MascotAvatar avatar={childForm.avatar} alt="" className="h-10 w-10 text-xl" />
                <span>{editingChild ? t.editChildTitle : t.addChildTitle}</span>
              </h3>
              <button
                type="button"
                onClick={closeChildModal}
                disabled={isSavingChild}
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
                <label htmlFor="child-real-name" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {t.realName} *
                </label>
                <input
                  id="child-real-name"
                  type="text"
                  placeholder={copy.childNamePlaceholder}
                  value={childForm.name}
                  onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Age & Age Stage Configuration */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="child-age" className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <span>🎂</span>
                    <span>{onboardingCopy.ageLabel} {childForm.age} {onboardingCopy.ageUnit}</span>
                  </label>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    {kidCopy.stageLabels[childForm.ageStage]}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="child-age"
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
                    {childForm.age} {onboardingCopy.ageUnit}
                  </div>
                </div>

                <div className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  <span>
                    <strong>{kidCopy.stageLabels[childForm.ageStage]}</strong>: {onboardingCopy.stages[childForm.ageStage].summary}
                  </span>
                </div>

                {!editingChild && (
                  <label className="flex items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={childForm.autoLoadAgeHabits}
                      onChange={(e) => setChildForm({ ...childForm, autoLoadAgeHabits: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>{copy.autoLoadAgeBundle(onboardingCopy.stageLabels[childForm.ageStage])}</span>
                  </label>
                )}
              </div>

              {/* Leaderboard Nickname */}
              <div>
                <label htmlFor="child-leaderboard-nickname" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {t.leaderboardNickname}
                </label>
                <input
                  id="child-leaderboard-nickname"
                  type="text"
                  placeholder={t.nicknamePlaceholder}
                  value={childForm.nickname}
                  onChange={(e) => setChildForm({ ...childForm, nickname: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {copy.nicknameHelp}
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
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {copy.rankingNickname(childForm.nickname.trim() || (childForm.name ? `${onboardingCopy.nicknamePrefix} ${childForm.name.trim().split(/\s+/).pop()}` : copy.nicknameFallback))}
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
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {copy.rankingName(childForm.name || copy.realNameFallback)}
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
                  <MascotAvatar avatar={childForm.avatar} alt="" className="h-11 w-11 text-2xl" />
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      {copy.rankingPreview}
                    </div>
                    <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      {childForm.showRealNameOnLeaderboard
                        ? (childForm.name || copy.realNameFallback)
                        : (childForm.nickname.trim() || (childForm.name ? `${onboardingCopy.nicknamePrefix} ${childForm.name.trim().split(/\s+/).pop()}` : copy.nicknameFallback))}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                  ⭐ 120 {copy.stars}
                </span>
              </div>

              {/* Mascot Avatar Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {copy.mascot(getMascotLabel(childForm.avatar))}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MASCOTS.map((mascot) => (
                    <button
                      type="button"
                      key={mascot.id}
                      onClick={() => setChildForm({ ...childForm, avatar: mascot.id, themeColor: mascot.themeColor })}
                      aria-pressed={childForm.avatar === mascot.id}
                      className={`relative flex min-h-24 flex-col items-center justify-center rounded-2xl border p-1 transition-all ${
                        childForm.avatar === mascot.id
                          ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20 dark:bg-indigo-950/30'
                          : 'border-sand-200 bg-sand-50 dark:border-zinc-700 dark:bg-zinc-800'
                      }`}
                    >
                      <MascotAvatar avatar={mascot.id} alt="" priority className="h-16 w-16" />
                      <span className="text-xs font-extrabold text-sand-900 dark:text-slate-100">{mascot.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 space-y-3 pb-safe">
              {childSaveError && <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">{childSaveError}</p>}
              <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeChildModal}
                disabled={isSavingChild}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:cursor-wait disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => void handleSaveChild()}
                disabled={isSavingChild}
                aria-busy={isSavingChild}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:cursor-wait disabled:opacity-60"
              >
                {isSavingChild ? profileCopy.saving : t.save}
              </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
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
                  {copy.adjustAmount}
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
                  placeholder={copy.adjustReasonPlaceholder}
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
