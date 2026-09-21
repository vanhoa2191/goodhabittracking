'use client';

import { Plus, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import type { LeaderboardPeriod, LeaderboardScope, LeagueTier } from '@/types';
import { LeagueTierBadge } from './LeagueTierBadge';

type Props = {
  readonly activeTier?: LeagueTier;
  readonly onCreateGroup: () => void;
  readonly onJoinGroup: () => void;
  readonly onPeriodChange: (period: LeaderboardPeriod) => void;
  readonly onScopeChange: (scope: LeaderboardScope) => void;
  readonly period: LeaderboardPeriod;
  readonly scope: LeaderboardScope;
};

const inactiveTab = 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200';

export function LeaderboardHeader({ activeTier, onCreateGroup, onJoinGroup, onPeriodChange, onScopeChange, period, scope }: Props) {
  const { t } = useTranslation();

  return <>
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-lg">
      <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black uppercase backdrop-blur-md">🏆 {t.leaderboard}</span>
            {activeTier && <LeagueTierBadge tier={activeTier} />}
          </div>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">{t.leaderboardDesc}</h2>
          <p className="mt-1 max-w-lg text-xs text-white/80">{t.leagueDescription}</p>
        </div>
        <div className="flex self-stretch items-center gap-2 md:self-auto">
          <button onClick={onJoinGroup} className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-white/30 bg-white/15 px-3.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/25 md:flex-none"><Users className="h-4 w-4" />{t.joinGroup}</button>
          <button onClick={onCreateGroup} className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white px-3.5 text-xs font-extrabold text-indigo-700 shadow-md transition-all hover:bg-amber-300 hover:text-slate-900 md:flex-none"><Plus className="h-4 w-4 stroke-[3]" />{t.createGroup}</button>
        </div>
      </div>
    </div>
    <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
      <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-zinc-800">
        {([
          ['global', `🌍 ${t.scopeGlobal}`],
          ['group', `🛡️ ${t.scopeGroup}`],
          ['family', `🏡 ${t.scopeFamily}`],
        ] as const).map(([value, label]) => <button key={value} onClick={() => onScopeChange(value)} className={`flex-1 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all sm:flex-none ${scope === value ? 'bg-white text-indigo-600 shadow-xs dark:bg-zinc-700 dark:text-indigo-400' : inactiveTab}`}>{label}</button>)}
      </div>
      <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-zinc-800">
        {([
          ['daily', t.periodDaily],
          ['weekly', t.periodWeekly],
          ['monthly', t.periodMonthly],
        ] as const).map(([value, label]) => <button key={value} onClick={() => onPeriodChange(value)} className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all sm:flex-none ${period === value ? 'bg-white text-amber-600 shadow-xs dark:bg-zinc-700 dark:text-amber-400' : inactiveTab}`}>{label}</button>)}
      </div>
    </div>
  </>;
}
