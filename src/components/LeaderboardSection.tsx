'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getSocialMutationCopy } from '@/lib/i18n/social-mutation-copy';
import { getLeaderboardCopy } from '@/lib/i18n/leaderboard-copy';
import { localDayKey } from '@/lib/habit-fire';
import { getLeagueTier } from '@/lib/store/leaderboard';
import { fetchPublicLeaderboard } from '@/lib/store/public-leaderboard-client';
import type { PublicLeaderboardResult } from '@/lib/store/public-leaderboard-client';
import type { LeaderboardPeriod, LeaderboardScope } from '@/types';
import { CreateGroupModal } from './CreateGroupModal';
import { JoinGroupModal } from './JoinGroupModal';
import { LeaderboardGroups } from './LeaderboardGroups';
import { LeaderboardHeader } from './LeaderboardHeader';
import { LeaderboardPodium } from './LeaderboardPodium';
import { LeaderboardPrivacyBar } from './LeaderboardPrivacyBar';
import { LeaderboardTable } from './LeaderboardTable';

export function LeaderboardSection() {
  const {
    activeChild,
    getLeaderboard,
    groups,
    createGroup,
    joinGroup,
    sendKudo,
    updateProfile,
    isDemoSession,
  } = useAppStore();

  const { language } = useTranslation();
  const socialCopy = getSocialMutationCopy(language);
  const copy = getLeaderboardCopy(language);

  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [highFiveSuccessId, setHighFiveSuccessId] = useState<string | null>(null);
  const [sendingKudoId, setSendingKudoId] = useState<string | null>(null);
  const [socialError, setSocialError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; result: PublicLeaderboardResult } | null>(null);
  const activeChildId = activeChild?.id ?? null;
  const globalKey = `${period}|${activeChildId}|${reloadKey}`;

  useEffect(() => {
    if (scope !== 'global' || isDemoSession) return;
    let cancelled = false;
    void fetchPublicLeaderboard(period, activeChildId, localDayKey(new Date())).then((result) => {
      if (!cancelled) setLoaded({ key: globalKey, result });
    });
    return () => { cancelled = true; };
  }, [scope, period, activeChildId, isDemoSession, globalKey]);

  const global = scope === 'global'
    ? isDemoSession ? { status: 'unavailable' as const } : loaded?.key === globalKey ? loaded.result : { status: 'loading' as const }
    : null;
  const leaderboardEntries = global ? (global.status === 'ready' ? global.entries : []) : getLeaderboard(scope, period);
  const myGroups = groups.filter((group) =>
    activeChild ? group.memberChildIds.includes(activeChild.id) : false
  );

  const handleSendHighFive = async (toChildId: string) => {
    setSendingKudoId(toChildId);
    setSocialError('');
    const sent = await sendKudo(toChildId, '👏');
    setSendingKudoId(null);
    if (!sent) {
      setSocialError(socialCopy.kudoError);
      return;
    }
    setHighFiveSuccessId(toChildId);
    setTimeout(() => setHighFiveSuccessId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <LeaderboardHeader activeTier={activeChild ? getLeagueTier(activeChild.totalEarned) : undefined} onCreateGroup={() => setIsCreateGroupOpen(true)} onJoinGroup={() => setIsJoinGroupOpen(true)} onPeriodChange={setPeriod} onScopeChange={setScope} period={period} scope={scope} />
      {activeChild && <LeaderboardPrivacyBar child={activeChild} onUpdate={updateProfile} />}
      {global?.status === 'loading' && <p role="status" data-testid="leaderboard-loading" className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600 dark:bg-zinc-900 dark:text-slate-300">{copy.globalLoading}</p>}
      {global?.status === 'unavailable' && <p role="status" data-testid="leaderboard-needs-account" className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600 dark:bg-zinc-900 dark:text-slate-300">{copy.globalNeedsAccount}</p>}
      {global?.status === 'error' && (
        <div role="alert" data-testid="leaderboard-error" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          <span>{copy.globalError}</span>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="min-h-11 rounded-xl border border-rose-300 px-4 font-bold">{copy.globalRetry}</button>
        </div>
      )}
      {global?.status === 'ready' && leaderboardEntries.length === 0 && (
        <div data-testid="leaderboard-empty" className="rounded-3xl border border-slate-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{copy.globalEmptyTitle}</h4>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{copy.globalEmptyBody}</p>
        </div>
      )}
      {scope === 'group' && myGroups.length === 0 && <p role="status" data-testid="leaderboard-group-empty" className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600 dark:bg-zinc-900 dark:text-slate-300">{copy.groupEmpty}</p>}
      {leaderboardEntries.length > 0 && <LeaderboardPodium entries={leaderboardEntries} period={period} />}
      {leaderboardEntries.length > 0 && <LeaderboardTable entries={leaderboardEntries} error={socialError} highFiveSuccessId={highFiveSuccessId} onSendHighFive={(childId) => void handleSendHighFive(childId)} sendingKudoId={sendingKudoId} />}
      <p data-testid="leaderboard-note" className="px-2 text-xs text-slate-500 dark:text-slate-400">{copy.periodNote}{scope === 'global' ? ` ${copy.publicNote}` : ''}</p>
      <LeaderboardGroups groups={myGroups} onCreate={() => setIsCreateGroupOpen(true)} onJoin={() => setIsJoinGroupOpen(true)} />

      <CreateGroupModal
        activeChildId={activeChild?.id}
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreate={createGroup}
      />
      <JoinGroupModal
        isOpen={isJoinGroupOpen}
        onClose={() => setIsJoinGroupOpen(false)}
        onJoin={joinGroup}
      />
    </div>
  );
}
