'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Star,
  CheckCircle,
  Circle,
  Clock,
  Gift,
  Award,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Zap,
  CheckCheck,
  Hourglass,
  Lock,
  Trophy,
  Palette,
  BookOpen,
  Heart,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { HabitActivity, TimeOfDay } from '@/types';
import { HabitTimerModal } from './HabitTimerModal';
import { AvatarPickerModal } from './AvatarPickerModal';
import { LeaderboardSection } from './LeaderboardSection';
import { getKidDashboardCopy } from '@/lib/i18n/kid-dashboard-copy';
import { localizeDemoActivity, localizeDemoReward } from '@/lib/i18n/demo-content-copy';
import { localizeAgeAdaptedHabit } from '@/lib/i18n/age-habit-copy';
import { TaskDetailsModal } from './TaskDetailsModal';
import { MascotAvatar } from './MascotAvatar';
import { getMascot } from '@/lib/mascots';

export function KidDashboard() {
  const {
    activeChild,
    activities,
    logs,
    toggleActivity,
    rewards,
    claimReward,
    redemptions,
    badges,
    childBadges,
    updateActiveAvatar,
    setIsPortraitModalOpen,
  } = useAppStore();

  const { t, language } = useTranslation();
  const copy = getKidDashboardCopy(language);

  const [activeTab, setActiveTab] = useState<'tasks' | 'leaderboard' | 'rewards' | 'badges'>('tasks');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimerActivity, setSelectedTimerActivity] = useState<HabitActivity | null>(null);
  const [wishlistRewardId, setWishlistRewardId] = useState<string | null>(null);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HabitActivity | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [pointBurstId, setPointBurstId] = useState<string | null>(null);
  const [completionStatusId, setCompletionStatusId] = useState<string | null>(null);

  const completeTask = async (activity: HabitActivity, date: string) => {
    setCompletionError(null);
    const saved = await toggleActivity(activity.id, date);
    if (!saved) {
      setCompletionError(activity.id);
      setPointBurstId(null);
      return;
    }
    setCompletionStatusId(activity.id);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPointBurstId(activity.id);
    window.setTimeout(() => setPointBurstId((id) => id === activity.id ? null : id), 1200);
  };

  if (!activeChild) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>{t.noTasksToday}</p>
      </div>
    );
  }

  const activeMascot = getMascot(activeChild.avatar);

  // Date formatting helpers
  const dateStr = selectedDate.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = dateStr === todayStr;

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, ...

  // Filter activities for active child & day
  const dueActivities = activities.filter((act) => {
    if (!act.isActive) return false;
    if (act.childId !== null && act.childId !== activeChild.id) return false;

    if (act.recurrenceType === 'daily') return true;
    if (act.recurrenceType === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (act.recurrenceType === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
    if (act.recurrenceType === 'custom') {
      return act.recurrenceDays && act.recurrenceDays.includes(dayOfWeek);
    }
    return true;
  }).map((activity) => localizeAgeAdaptedHabit(localizeDemoActivity(activity, language), language));

  // Calculate completion
  const childLogsForDate = logs.filter(
    (l) => l.childId === activeChild.id && l.date === dateStr
  );

  const completedActivityIds = new Set(
    childLogsForDate
      .filter((l) => l.status === 'completed' || l.status === 'approved')
      .map((l) => l.activityId)
  );

  const pendingApprovalIds = new Set(
    childLogsForDate
      .filter((l) => l.status === 'pending_approval')
      .map((l) => l.activityId)
  );

  const completedCount = dueActivities.filter((a) => completedActivityIds.has(a.id)).length;
  const totalDue = dueActivities.length;
  const progressPercent = totalDue > 0 ? Math.round((completedCount / totalDue) * 100) : 100;

  // Group activities by time of day
  const timeSections: { key: TimeOfDay; title: string; icon: React.ReactNode; color: string }[] = [
    { key: 'morning', title: t.morning, icon: <Sun className="w-4 h-4" />, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
    { key: 'afternoon', title: t.afternoon, icon: <Sunset className="w-4 h-4" />, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
    { key: 'evening', title: t.evening, icon: <Moon className="w-4 h-4" />, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' },
    { key: 'anytime', title: t.anytime, icon: <Zap className="w-4 h-4" />, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
  ];

  // Wishlist goal
  const localizedRewards = rewards.map((reward) => localizeDemoReward(reward, language));
  const wishlistReward = localizedRewards.find((r) => r.id === wishlistRewardId) || localizedRewards[0] || null;
  const wishlistProgress = wishlistReward
    ? Math.min(100, Math.round((activeChild.points / wishlistReward.costPoints) * 100))
    : 0;

  // Unlocked badges
  const unlockedBadgeIds = new Set(
    childBadges.filter((cb) => cb.childId === activeChild.id).map((cb) => cb.badgeId)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Kid Profile Hero Card */}
      <div
        data-testid="kid-hero"
        data-mascot={activeMascot?.id || 'legacy'}
        data-theme-color={activeChild.themeColor}
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${activeMascot?.heroClass || 'from-amber-200 via-amber-300 to-orange-300'} p-6 sm:p-8 text-sand-900 shadow-xl shadow-amber-100 dark:shadow-none`}
      >
        {/* Background decorative shapes */}
        <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-36 h-36 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="relative group">
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(true)}
                title={t.changeAvatar}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/45 hover:bg-white/60 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/60 transition-transform active:scale-95 group-hover:scale-105 cursor-pointer relative"
              >
                <MascotAvatar avatar={activeChild.avatar} alt={activeMascot?.name || ''} priority className="h-24 w-24 sm:h-28 sm:w-28 text-5xl" />
                <span className="absolute inset-0 rounded-3xl bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                  <Palette className="w-5 h-5 text-white drop-shadow" />
                </span>
              </button>
              <div className="absolute -bottom-2 -right-1 bg-amber-400 text-slate-900 font-extrabold text-xs px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 border-2 border-white pointer-events-none">
                <Flame className="w-3 h-3 fill-current text-orange-600" />
                {activeChild.streak} {t.streakDays}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  {t.levelPrefix} {activeChild.level}
                </span>
                {activeChild.ageStage && (
                  <span className="text-xs font-bold bg-amber-400 text-slate-900 px-2.5 py-0.5 rounded-full shadow-xs">
                    {copy.stageLabels[activeChild.ageStage]}
                  </span>
                )}
                {activeChild.age !== undefined && (
                  <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {activeChild.age} {copy.ageUnit}
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                {activeChild.name}
              </h1>
              <p className="text-sm text-amber-950/80 font-semibold">
                {activeChild.ageStage === '0-3'
                  ? copy.infantJournal(activeChild.name)
                  : `${t.greeting} ${activeChild.name}! ✨`}
              </p>
            </div>
          </div>

          {/* Points & Stats Wallet */}
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3.5 border border-white/25 text-center min-w-[110px]">
              <div className="flex items-center justify-center gap-1 text-amber-300 mb-0.5">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div className="text-2xl font-black">{activeChild.points}</div>
              <div className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                {t.stars}
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3.5 border border-white/25 text-center min-w-[100px]">
              <div className="flex items-center justify-center gap-1 text-emerald-300 mb-0.5">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black">{unlockedBadgeIds.size}</div>
              <div className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                {t.myBadges}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/20">
          <div className="flex justify-between items-center text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              {t.todayProgress}
            </span>
            <span>
              {completedCount}/{totalDue} {t.completedTasks} ({progressPercent}%)
            </span>
          </div>
          <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden p-0.5 backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-emerald-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {progressPercent === 100 && totalDue > 0 && (
            <div className="mt-2.5 text-xs text-amber-200 font-bold text-center animate-bounce">
              🎉 {t.congratsAllDone}
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex p-1 sm:p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-2xl max-w-xl mx-auto gap-1">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 min-h-[42px] sm:min-h-[44px] py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap ${
            activeTab === 'tasks'
              ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>{t.tasks}</span>
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 min-h-[42px] sm:min-h-[44px] py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
          <span className="hidden sm:inline">{t.leaderboard}</span>
          <span className="sm:hidden">{t.bxhShort}</span>
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 min-h-[42px] sm:min-h-[44px] py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 whitespace-nowrap ${
            activeTab === 'rewards'
              ? 'bg-white dark:bg-zinc-800 text-pink-600 dark:text-pink-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden sm:inline">{t.rewards}</span>
          <span className="sm:hidden">{t.rewardsShort}</span>
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`flex-1 min-h-[42px] sm:min-h-[44px] py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 whitespace-nowrap ${
            activeTab === 'badges'
              ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden sm:inline">{t.myBadges}</span>
          <span className="sm:hidden">{t.badgesShort}</span>
        </button>
      </div>

      {/* TAB 1: DAILY TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Day Selector */}
          <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-2xl p-2.5 shadow-xs border border-slate-100 dark:border-zinc-800">
            <button
              onClick={handlePrevDay}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={copy.previousDay}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <span className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 block">
                {isToday ? `${t.today} - ` : ''}
                {new Intl.DateTimeFormat(language, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'numeric',
                }).format(selectedDate)}
              </span>
            </div>
            <button
              onClick={handleNextDay}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={copy.nextDay}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Special Banner for Age 0-3 (Thân Giáo Ba Mẹ) */}
          {activeChild.ageStage === '0-3' ? (
            <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 dark:from-purple-950/40 dark:to-amber-950/30 rounded-2xl p-4 border border-purple-200 dark:border-purple-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="text-3xl p-2 rounded-xl bg-purple-100 dark:bg-purple-900/50 shrink-0">
                  🍼
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-purple-900 dark:text-purple-200">
                      {copy.infantStage}
                    </h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                      {copy.infantTag}
                    </span>
                  </div>
                  <p className="text-xs text-purple-700/80 dark:text-purple-300/80 mt-0.5 leading-relaxed">
                    {copy.infantDescription}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPortraitModalOpen(true)}
                className="shrink-0 py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{copy.handbook}</span>
              </button>
            </div>
          ) : (
            <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl p-3 px-4 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                <span>✨</span>
                <span className="font-medium">
                  {copy.portraitPractice}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPortraitModalOpen(true)}
                className="shrink-0 text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" />
                <span>{copy.guide}</span>
              </button>
            </div>
          )}
          {dueActivities.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
              <span className="text-4xl mb-3 block">🎈</span>
              <p className="font-semibold text-slate-600 dark:text-slate-300">{t.noTasksToday}</p>
            </div>
          ) : (
            timeSections.map((sec) => {
              const secActivities = dueActivities.filter((a) => a.timeOfDay === sec.key);
              if (secActivities.length === 0) return null;

              return (
                <div key={sec.key} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className={`p-1.5 rounded-lg ${sec.color}`}>{sec.icon}</span>
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                      {sec.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {secActivities.map((act) => {
                      const isDone = completedActivityIds.has(act.id);
                      const isPending = pendingApprovalIds.has(act.id);

                      return (
                        <div
                          key={act.id}
                          data-task-card
                          data-complete={isDone ? 'true' : 'false'}
                          className={`relative group rounded-2xl p-4 transition-all duration-200 border ${
                            isDone
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 opacity-80'
                              : isPending
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                              : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800/80 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 flex-1 flex-col">
                              <button type="button" onClick={() => setSelectedTask(act)} aria-label={`${language === 'vi' ? 'Xem chi tiết' : 'View details'}: ${act.title}`} className="flex w-full items-start gap-3 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                <span className="text-3xl shrink-0 select-none">{act.icon}</span>
                                <div className="min-w-0">
                                <h4
                                  className={`font-bold text-sm sm:text-base leading-snug ${
                                    isDone
                                      ? 'line-through text-slate-400 dark:text-slate-500'
                                      : 'text-slate-800 dark:text-slate-100'
                                  }`}
                                >
                                  {act.title}
                                </h4>
                                {act.description && (
                                  <p className="text-sm text-slate-500 mt-1 whitespace-normal">
                                    {act.description}
                                  </p>
                                )}
                                </div>
                              </button>

                              <div className="ml-12 flex items-center gap-2 mt-2 flex-wrap">
                                  {/* Parent Role (Thân Giáo) Tag */}
                                  {act.isParentRole && (
                                    <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                                      <Heart className="w-3 h-3 fill-current text-rose-500" />
                                      {copy.parentRole}
                                    </span>
                                  )}

                                  {/* 7 Bo Thi Tag */}
                                  {act.boThi7Key && (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                      🎁 {act.boThi7Key}
                                    </span>
                                  )}

                                  {/* 16 Portraits Tag */}
                                  {act.portrait16Key && (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                      ✨ {act.portrait16Key}
                                    </span>
                                  )}

                                  {/* Points tag */}
                                  <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                                    <Star className="w-3 h-3 fill-current" />
                                    +{act.points}
                                  </span>

                                  {/* Timer button if configured */}
                                  {act.durationMinutes && act.durationMinutes > 0 && (
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setSelectedTimerActivity(act);
                                      }}
                                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                    >
                                      <Clock className="w-3 h-3" />
                                      {act.durationMinutes}m {t.timerStart}
                                    </button>
                                  )}

                                  {/* Requires approval indicator */}
                                  {act.requiresApproval && (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                                      <Hourglass className="w-3 h-3" />
                                      {t.needApproval}
                                    </span>
                                  )}
                              </div>
                            </div>

                            {/* Action Checkbox Button with Claymorphic Feel & Haptic Feedback */}
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                                  try {
                                    navigator.vibrate?.(25);
                                  } catch {
                                    // ignore if unsupported
                                  }
                                }
                                void completeTask(act, dateStr);
                              }}
                              className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 hover:scale-105 border-2 shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                                isDone
                                  ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200 dark:shadow-none'
                                  : isPending
                                  ? 'bg-amber-400 border-amber-500 text-white shadow-amber-200 dark:shadow-none'
                                  : 'bg-slate-50 dark:bg-zinc-800/90 border-slate-200 dark:border-zinc-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50'
                              }`}
                              aria-label={isDone ? (language === 'vi' ? 'Đã xong' : 'Completed') : (language === 'vi' ? 'Nhiệm vụ' : 'Task')}
                              title={isDone ? t.tickDone : t.tasks}
                            >
                              {isDone ? (
                                <CheckCircle className="w-6 h-6 fill-current" />
                              ) : isPending ? (
                                <Hourglass className="w-5 h-5 animate-pulse" />
                              ) : (
                                <Circle className="w-6 h-6 stroke-[2.5]" />
                              )}
                            </button>
                            {pointBurstId === act.id && <span data-testid="point-burst" className="pointer-events-none absolute right-3 top-0 -translate-y-1/2 rounded-full bg-amber-400 px-2 py-1 text-xs font-black text-slate-900 motion-safe:animate-bounce">+{act.points} ⭐</span>}
                          </div>
                          {completionStatusId === act.id && <span role="status" className="sr-only">{language === 'vi' ? 'Hoàn thành' : 'Completed'}</span>}
                          {completionError === act.id && <p role="alert" className="mt-3 text-sm font-bold text-rose-600">{language === 'vi' ? 'Chưa lưu được. Con thử lại nhé.' : 'Could not save. Please try again.'}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: REWARDS & WISHLIST */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Wishlist Goal Tracker */}
          {wishlistReward && (
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-3xl p-5 border border-pink-100 dark:border-pink-900/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{wishlistReward.icon}</span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-pink-500">
                      {t.myWishlist}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      {wishlistReward.title}
                    </h4>
                  </div>
                </div>
                <span className="text-xs font-black text-pink-600 dark:text-pink-400">
                  {activeChild.points} / {wishlistReward.costPoints} ⭐
                </span>
              </div>
              <div className="h-3 w-full bg-pink-200/50 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${wishlistProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {localizedRewards
              .filter((r) => r.isActive)
              .map((rew) => {
                const canAfford = activeChild.points >= rew.costPoints;
                const isSelectedGoal = wishlistRewardId === rew.id;

                return (
                  <div
                    key={rew.id}
                    className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-4xl p-2 rounded-2xl bg-slate-50 dark:bg-zinc-800/80">
                        {rew.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-sm sm:text-base leading-snug text-slate-800 dark:text-slate-100 line-clamp-2">
                            {rew.title}
                          </h4>
                          <span className="font-black text-sm text-amber-500 shrink-0">
                            {rew.costPoints} ⭐
                          </span>
                        </div>
                        {rew.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {rew.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50 dark:border-zinc-800/80">
                      <button
                        onClick={() => setWishlistRewardId(rew.id)}
                        className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-base rounded-xl font-bold transition-all cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                          isSelectedGoal
                            ? 'bg-pink-100 text-pink-600 dark:bg-pink-950/50'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                        title={copy.setGoal}
                        aria-label={copy.setGoal}
                      >
                        🎯
                      </button>

                      <button
                        onClick={() => claimReward(rew.id)}
                        disabled={!canAfford}
                        className={`flex-1 min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          canAfford
                            ? 'bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white shadow-xs cursor-pointer active:scale-95'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed opacity-70'
                        }`}
                      >
                        <Gift className="w-3.5 h-3.5" />
                        {canAfford ? t.claimReward : t.notEnoughPoints}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Child's Redemptions History */}
          {redemptions.filter((r) => r.childId === activeChild.id).length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800">
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-3">
                {t.yourRewards}
              </h4>
              <div className="space-y-2">
                {redemptions
                  .filter((r) => r.childId === activeChild.id)
                  .map((red) => {
                    const rew = localizedRewards.find((r) => r.id === red.rewardId);
                    return (
                      <div
                        key={red.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{rew?.icon || '🎁'}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {rew?.title || copy.defaultReward}
                          </span>
                        </div>
                        <span
                          className={`font-bold px-2.5 py-1 rounded-full text-xs ${
                            red.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : red.status === 'approved'
                              ? 'bg-indigo-100 text-indigo-700'
                              : red.status === 'rejected'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {red.status === 'delivered'
                            ? t.delivered
                            : red.status === 'approved'
                            ? t.approved
                            : red.status === 'rejected'
                            ? t.reject
                            : t.pendingApproval}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BADGES */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {badges.map((b) => {
            const isUnlocked = unlockedBadgeIds.has(b.id);
            const badgeName = b.name[language] || b.name.en || b.name.vi;
            const badgeDesc = b.description[language] || b.description.en || b.description.vi;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-3xl border transition-all flex items-center gap-4 ${
                  isUnlocked
                    ? 'bg-gradient-to-r from-amber-50/70 to-yellow-50/70 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200/80 dark:border-amber-900/40 shadow-xs'
                    : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 opacity-60'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                    isUnlocked
                      ? 'bg-amber-400 text-white shadow-md shadow-amber-200 dark:shadow-none'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                  }`}
                >
                  {isUnlocked ? b.icon : <Lock className="w-5 h-5 text-slate-400" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {badgeName}
                    </h4>
                    {isUnlocked && (
                      <span className="text-xs font-black text-amber-600 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                        ✓ {t.approved}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{badgeDesc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: LEADERBOARD & LEAGUE COMPETITION */}
      {activeTab === 'leaderboard' && <LeaderboardSection />}

      {/* Habit Timer Modal */}
      <HabitTimerModal
        activity={selectedTimerActivity}
        isOpen={Boolean(selectedTimerActivity)}
        onClose={() => setSelectedTimerActivity(null)}
        onComplete={() => {
          if (selectedTimerActivity) {
            toggleActivity(selectedTimerActivity.id, dateStr);
          }
        }}
      />
      <TaskDetailsModal activity={selectedTask} onClose={() => setSelectedTask(null)} />

      {/* Child Mascot / Avatar Picker Modal */}
      {activeChild && (
        <AvatarPickerModal
          isOpen={isAvatarPickerOpen}
          onClose={() => setIsAvatarPickerOpen(false)}
          currentAvatar={activeChild.avatar}
          currentColor={activeChild.themeColor}
          onSave={updateActiveAvatar}
        />
      )}
    </div>
  );
}
