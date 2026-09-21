'use client';

import { Plus, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getSocialMutationCopy } from '@/lib/i18n/social-mutation-copy';
import type { GroupTeam } from '@/types';

type Props = {
  readonly groups: readonly GroupTeam[];
  readonly onCreate: () => void;
  readonly onJoin: () => void;
};

export function LeaderboardGroups({ groups, onCreate, onJoin }: Props) {
  const { t, language } = useTranslation();
  const copy = getSocialMutationCopy(language);

  return <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2"><Users className="h-5 w-5 text-indigo-600" /><h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{t.myGroup} ({groups.length})</h3></div>
      <button onClick={onCreate} className="flex min-h-11 items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"><Plus className="h-3.5 w-3.5" />{t.createGroup}</button>
    </div>
    {groups.length === 0 ? <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500 dark:border-zinc-800 dark:bg-zinc-800/40">
      <p className="text-xs">{t.noGroupNotice}</p>
      <div className="flex items-center justify-center gap-3"><button onClick={onJoin} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold shadow-xs transition-colors hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800">{t.joinGroup}</button><button onClick={onCreate} className="min-h-11 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white shadow-md transition-all hover:bg-indigo-700">{t.createGroup}</button></div>
    </div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{groups.map((group) => <div key={group.id} className="space-y-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/40 p-5 dark:border-zinc-800 dark:from-zinc-800 dark:to-indigo-950/20">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><div className="flex min-w-0 items-center gap-3"><span className="shrink-0 text-3xl">{group.icon}</span><div className="min-w-0"><h4 className="break-words text-sm font-black text-slate-800 dark:text-slate-100">{group.name}</h4><p className="text-xs font-medium text-slate-400">{group.memberChildIds.length} {t.membersCount}</p></div></div><span className="shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs font-bold text-indigo-600 dark:border-zinc-700 dark:bg-zinc-800">{group.inviteCode}</span></div>
      <div className="space-y-1 rounded-xl border border-slate-100 bg-white/80 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="grid grid-cols-1 gap-0.5 font-semibold text-slate-600 dark:text-slate-300 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-2"><span>{copy.weeklyTargetLabel}</span><span className="break-words font-bold text-amber-600 dark:text-amber-400 sm:text-right">⭐ {group.weeklyTargetPoints} {copy.starsUnit}</span></div>
        <div className="grid grid-cols-1 gap-0.5 font-semibold text-slate-600 dark:text-slate-300 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-2"><span>{copy.rewardLabel}</span><span className="break-words font-bold text-amber-700 dark:text-amber-300 sm:text-right">🎁 {group.customRewardText || (group.rewardType === 'badge' ? t.rewardBadge : t.rewardStars)}</span></div>
      </div>
    </div>)}</div>}
  </div>;
}
