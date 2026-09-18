'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Users,
  Flame,
  Star,
  Award,
  Shield,
  Sparkles,
  Plus,
  ArrowRight,
  HandMetal,
  Check,
  Crown,
  Gift,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import {
  LeaderboardScope,
  LeaderboardPeriod,
  LeagueTier,
  LeaderboardEntry,
  GroupTeam,
} from '@/types';

export function LeaderboardSection() {
  const {
    activeChild,
    getLeaderboard,
    groups,
    createGroup,
    joinGroup,
    updateGroupReward,
    sendKudo,
    kudos,
    updateProfile,
  } = useAppStore();

  const { t } = useTranslation();

  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');

  // Modal / Form state for Groups
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupIconInput, setGroupIconInput] = useState('🚀');
  const [groupTargetPointsInput, setGroupTargetPointsInput] = useState(300);
  const [groupRewardTypeInput, setGroupRewardTypeInput] = useState<GroupTeam['rewardType']>('badge');
  const [customRewardInput, setCustomRewardInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [highFiveSuccessId, setHighFiveSuccessId] = useState<string | null>(null);

  const leaderboardEntries: LeaderboardEntry[] = getLeaderboard(scope, period);

  // Filter groups where activeChild is a member
  const myGroups = groups.filter((g) =>
    activeChild ? g.memberChildIds.includes(activeChild.id) : false
  );

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameInput.trim()) return;

    createGroup({
      name: groupNameInput.trim(),
      icon: groupIconInput,
      createdByChildId: activeChild?.id,
      memberChildIds: activeChild ? [activeChild.id] : [],
      weeklyTargetPoints: groupTargetPointsInput || 300,
      rewardType: groupRewardTypeInput,
      customRewardText: customRewardInput.trim() || undefined,
    });

    setGroupNameInput('');
    setCustomRewardInput('');
    setIsCreateGroupOpen(false);
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCodeInput.trim()) return;

    const success = joinGroup(joinCodeInput.trim());
    if (success) {
      setJoinCodeInput('');
      setIsJoinGroupOpen(false);
    } else {
      setJoinError(t.invalidCode);
    }
  };

  const handleSendHighFive = (toChildId: string) => {
    sendKudo(toChildId, '👏');
    setHighFiveSuccessId(toChildId);
    setTimeout(() => setHighFiveSuccessId(null), 2500);
  };

  // Helper for league badges
  const renderTierBadge = (tier: LeagueTier) => {
    switch (tier) {
      case 'diamond':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-xs">
            💎 {t.tierDiamond}
          </span>
        );
      case 'gold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 shadow-xs">
            👑 {t.tierGold}
          </span>
        );
      case 'silver':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-slate-200 to-slate-400 text-slate-800 shadow-xs">
            🥈 {t.tierSilver}
          </span>
        );
      case 'bronze':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 shadow-xs">
            🥉 {t.tierBronze}
          </span>
        );
    }
  };

  const top3 = leaderboardEntries.slice(0, 3);
  const remaining = leaderboardEntries.slice(3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner: League Info & Slogan */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-white/20 backdrop-blur-md">
                🏆 {t.leaderboard}
              </span>
              {activeChild && renderTierBadge(activeChild.leagueTier || 'silver')}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {t.leaderboardDesc}
            </h2>
            <p className="text-xs text-white/80 mt-1 max-w-lg">
              {t.leagueDescription}
            </p>
          </div>

          {/* Group Quick Action */}
          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <button
              onClick={() => setIsJoinGroupOpen(true)}
              className="flex-1 md:flex-none py-2 px-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 backdrop-blur-md"
            >
              <Users className="w-4 h-4" />
              {t.joinGroup}
            </button>
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="flex-1 md:flex-none py-2 px-3.5 rounded-2xl bg-white text-indigo-700 hover:bg-amber-300 hover:text-slate-900 text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {t.createGroup}
            </button>
          </div>
        </div>
      </div>

      {/* Scope Filter Tabs (Global vs Group vs Family) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs">
        {/* Scope: Global / Group / Family */}
        <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
          <button
            onClick={() => setScope('global')}
            className={`flex-1 sm:flex-none py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
              scope === 'global'
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🌍 {t.scopeGlobal}
          </button>
          <button
            onClick={() => setScope('group')}
            className={`flex-1 sm:flex-none py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
              scope === 'group'
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🛡️ {t.scopeGroup}
          </button>
          <button
            onClick={() => setScope('family')}
            className={`flex-1 sm:flex-none py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all ${
              scope === 'family'
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🏡 {t.scopeFamily}
          </button>
        </div>

        {/* Period: Daily / Weekly / Monthly */}
        <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl">
          <button
            onClick={() => setPeriod('daily')}
            className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              period === 'daily'
                ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.periodDaily}
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              period === 'weekly'
                ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.periodWeekly}
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`flex-1 sm:flex-none py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              period === 'monthly'
                ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.periodMonthly}
          </button>
        </div>
      </div>

      {/* Child Privacy & Nickname Control Bar for Leaderboard */}
      {activeChild && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-zinc-900/80 border border-indigo-100 dark:border-zinc-800 text-xs shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeChild.avatar}</span>
            <div>
              <div className="text-slate-600 dark:text-slate-300 font-medium">
                {t.currentDisplayMode}{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold text-sm">
                  {activeChild.showRealNameOnLeaderboard
                    ? activeChild.name
                    : (activeChild.nickname || activeChild.name)}
                </strong>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {activeChild.showRealNameOnLeaderboard
                  ? `👤 ${t.showRealNameOption} (${t.realName}: ${activeChild.name})`
                  : `🛡️ ${t.showNicknameOnly}`}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              updateProfile(activeChild.id, {
                showRealNameOnLeaderboard: !activeChild.showRealNameOnLeaderboard,
              });
            }}
            className={`py-2 px-3.5 rounded-xl font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 shadow-2xs text-xs ${
              activeChild.showRealNameOnLeaderboard
                ? 'bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-zinc-700 hover:bg-indigo-50'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {activeChild.showRealNameOnLeaderboard
              ? `🛡️ ${t.showNicknameOnly.split('(')[0].trim()}`
              : `👤 ${t.showRealNameOption}`}
          </button>
        </div>
      )}

      {/* Podium for Top 3 */}
      {top3.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-xs">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              {t.topRankings} (Top 3)
            </span>
            <span className="text-xs font-normal text-slate-400">
              {period === 'daily' ? t.periodDaily : period === 'weekly' ? t.periodWeekly : t.periodMonthly}
            </span>
          </h3>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-6 pb-2">
            {/* Rank 2 (Left) */}
            {top3[1] ? (
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-2">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md border-2 border-slate-300"
                    style={{ backgroundColor: top3[1].themeColor + '20' }}
                  >
                    {top3[1].avatar}
                  </div>
                  <span className="absolute -bottom-2 -right-1 bg-slate-300 text-slate-800 text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    2
                  </span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate w-full">
                  {top3[1].nickname}
                </div>
                <div className="text-[11px] font-black text-amber-500 mt-0.5">
                  ⭐ {top3[1].points}
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-20 rounded-t-2xl mt-3 flex items-center justify-center text-slate-400 font-black text-lg">
                  🥈
                </div>
              </div>
            ) : <div />}

            {/* Rank 1 (Center, Elevated) */}
            {top3[0] ? (
              <div className="flex flex-col items-center text-center -mt-6">
                <Crown className="w-6 h-6 text-amber-400 animate-bounce mb-1" />
                <div className="relative mb-2">
                  <div
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl border-4 border-amber-400"
                    style={{ backgroundColor: top3[0].themeColor + '30' }}
                  >
                    {top3[0].avatar}
                  </div>
                  <span className="absolute -bottom-2 -right-1 bg-amber-400 text-slate-900 text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                    1
                  </span>
                </div>
                <div className="font-black text-xs sm:text-base text-slate-800 dark:text-slate-100 truncate w-full">
                  {top3[0].nickname}
                </div>
                <div className="text-xs sm:text-sm font-black text-amber-600 mt-0.5">
                  ⭐ {top3[0].points} {t.points}
                </div>
                <div className="w-full bg-gradient-to-t from-amber-100 to-amber-200/60 dark:from-amber-950/40 dark:to-amber-900/20 h-28 rounded-t-2xl mt-3 flex items-center justify-center text-amber-500 font-black text-2xl border-t-2 border-amber-400">
                  🥇
                </div>
              </div>
            ) : <div />}

            {/* Rank 3 (Right) */}
            {top3[2] ? (
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-2">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md border-2 border-amber-600"
                    style={{ backgroundColor: top3[2].themeColor + '20' }}
                  >
                    {top3[2].avatar}
                  </div>
                  <span className="absolute -bottom-2 -right-1 bg-amber-600 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    3
                  </span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate w-full">
                  {top3[2].nickname}
                </div>
                <div className="text-[11px] font-black text-amber-500 mt-0.5">
                  ⭐ {top3[2].points}
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-16 rounded-t-2xl mt-3 flex items-center justify-center text-slate-400 font-black text-lg">
                  🥉
                </div>
              </div>
            ) : <div />}
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-zinc-800 shadow-xs space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 px-2">
          {t.rank} &amp; {t.topRankings}
        </h4>

        <div className="space-y-2">
          {leaderboardEntries.map((entry) => {
            const isHighFived = highFiveSuccessId === entry.childId;
            return (
              <div
                key={entry.childId}
                className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  entry.isCurrentChild
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-zinc-800/40 border-slate-100 dark:border-zinc-800/80 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  {/* Rank Number */}
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      entry.rank === 1
                        ? 'bg-amber-400 text-slate-900 shadow-xs'
                        : entry.rank === 2
                        ? 'bg-slate-300 text-slate-800'
                        : entry.rank === 3
                        ? 'bg-amber-600 text-white'
                        : 'bg-white dark:bg-zinc-800 text-slate-500'
                    }`}
                  >
                    {entry.rank}
                  </span>

                  {/* Avatar Mascot */}
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/80 shrink-0"
                    style={{ backgroundColor: entry.themeColor + '25' }}
                  >
                    {entry.avatar}
                  </div>

                  {/* Name, Group, Streak */}
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">
                        {entry.nickname}
                      </span>
                      {entry.isCurrentChild && (
                        <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.2 rounded-full shrink-0">
                          Bé
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-orange-500">
                        <Flame className="w-3 h-3 fill-current" />
                        {entry.streak} {t.streakDays}
                      </span>
                      <span>•</span>
                      {renderTierBadge(entry.tier)}
                    </div>
                  </div>
                </div>

                {/* Points & High-Five Action */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-black text-amber-500 flex items-center justify-end gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      {entry.points}
                    </div>
                    <div className="text-[10px] font-medium text-slate-400">
                      {t.pointsCount}
                    </div>
                  </div>

                  {/* High-Five Encouragement (only to others) */}
                  {!entry.isCurrentChild && (
                    <button
                      onClick={() => handleSendHighFive(entry.childId)}
                      disabled={isHighFived}
                      className={`p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-bold ${
                        isHighFived
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-600 border border-slate-200 dark:border-zinc-700 shadow-xs'
                      }`}
                      title={t.sendHighFive}
                    >
                      <HandMetal className="w-4 h-4 text-amber-500" />
                      <span className="hidden sm:inline">
                        {isHighFived ? '👏 Đã gửi!' : t.sendHighFive}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Squad / Group Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
              {t.myGroup} ({myGroups.length})
            </h3>
          </div>
          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.createGroup}
          </button>
        </div>

        {myGroups.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-slate-500 space-y-3">
            <p className="text-xs">{t.noGroupNotice}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsJoinGroupOpen(true)}
                className="py-2 px-4 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-xs"
              >
                {t.joinGroup}
              </button>
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md"
              >
                {t.createGroup}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myGroups.map((grp) => (
              <div
                key={grp.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-zinc-800 dark:to-indigo-950/20 border border-slate-200 dark:border-zinc-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{grp.icon}</span>
                    <div>
                      <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">
                        {grp.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {grp.memberChildIds.length} {t.membersCount}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-700 text-indigo-600">
                    {grp.inviteCode}
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-zinc-900/80 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-300">
                    <span>Mục tiêu tuần:</span>
                    <span className="font-bold text-amber-500">⭐ {grp.weeklyTargetPoints} sao</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-300">
                    <span>Phần thưởng:</span>
                    <span className="font-bold text-pink-600">
                      🎁 {grp.customRewardText || (grp.rewardType === 'badge' ? t.rewardBadge : t.rewardStars)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 my-auto overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Plus className="w-4 h-4" />
                </div>
                <span>{t.createGroup}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col min-h-0">
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {t.groupNameLabel} *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={groupIconInput}
                      onChange={(e) => setGroupIconInput(e.target.value)}
                      className="w-12 text-center text-xl py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
                    />
                    <input
                      type="text"
                      placeholder="Ví dụ: Biệt Đội Răng Xinh, Siêu Nhân Học Tập..."
                      value={groupNameInput}
                      onChange={(e) => setGroupNameInput(e.target.value)}
                      required
                      className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {t.groupTargetPoints}
                  </label>
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={groupTargetPointsInput}
                    onChange={(e) => setGroupTargetPointsInput(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-bold text-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {t.groupRewardLabel}
                  </label>
                  <select
                    value={groupRewardTypeInput}
                    onChange={(e) =>
                      setGroupRewardTypeInput(e.target.value as GroupTeam['rewardType'])
                    }
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                  >
                    <option value="badge">🛡️ {t.rewardBadge}</option>
                    <option value="stars">⭐ {t.rewardStars}</option>
                    <option value="mystery_box">🎁 {t.rewardMystery}</option>
                    <option value="custom">✨ {t.rewardCustom}</option>
                  </select>
                </div>

                {groupRewardTypeInput === 'custom' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Chi tiết phần thưởng tùy chọn
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Chuyến đi thảo cầm viên, buổi picnic..."
                      value={customRewardInput}
                      onChange={(e) => setCustomRewardInput(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Fixed Footer */}
              <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 flex items-center justify-end gap-2.5 pb-safe">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  {t.create}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOIN GROUP MODAL */}
      {isJoinGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-sm max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 my-auto overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Users className="w-4 h-4" />
                </div>
                <span>{t.joinGroup}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsJoinGroupOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinGroup} className="flex-1 flex flex-col min-h-0">
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    {t.enterInviteCode} (6 ký tự)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Ví dụ: HERO01"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    className="w-full py-3 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-center font-mono font-black tracking-widest text-lg text-indigo-600 uppercase"
                  />
                  {joinError && (
                    <p className="text-xs text-rose-500 font-bold mt-1.5 text-center">{joinError}</p>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 flex items-center justify-end gap-2.5 pb-safe">
                <button
                  type="button"
                  onClick={() => setIsJoinGroupOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  {t.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
