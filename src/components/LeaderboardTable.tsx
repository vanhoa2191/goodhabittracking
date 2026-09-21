'use client';

import { Flame, HandMetal, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getSocialMutationCopy } from '@/lib/i18n/social-mutation-copy';
import type { LeaderboardEntry } from '@/types';
import { LeagueTierBadge } from './LeagueTierBadge';

type Props = {
  readonly entries: readonly LeaderboardEntry[];
  readonly error: string;
  readonly highFiveSuccessId: string | null;
  readonly onSendHighFive: (childId: string) => void;
  readonly sendingKudoId: string | null;
};

export function LeaderboardTable({ entries, error, highFiveSuccessId, onSendHighFive, sendingKudoId }: Props) {
  const { t, language } = useTranslation();
  const copy = getSocialMutationCopy(language);

  return <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
    <h4 className="px-2 text-xs font-bold uppercase tracking-wider text-slate-400">{t.rank} &amp; {t.topRankings}</h4>
    <div className="space-y-2">{entries.map((entry) => {
      const isHighFived = highFiveSuccessId === entry.childId;
      const isSending = sendingKudoId === entry.childId;
      return <div key={entry.childId} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border p-3 transition-all sm:flex sm:justify-between sm:p-3.5 ${entry.isCurrentChild ? 'border-indigo-200 bg-indigo-50/70 shadow-xs dark:border-indigo-800 dark:bg-indigo-950/40' : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 dark:border-zinc-800/80 dark:bg-zinc-800/40'}`}>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black ${entry.rank === 1 ? 'bg-amber-400 text-slate-900 shadow-xs' : entry.rank === 2 ? 'bg-slate-300 text-slate-800' : entry.rank === 3 ? 'bg-amber-600 text-white' : 'bg-white text-slate-500 dark:bg-zinc-800'}`}>{entry.rank}</span>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/80 text-2xl shadow-inner" style={{ backgroundColor: `${entry.themeColor}25` }}>{entry.avatar}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2"><span className="truncate text-sm font-extrabold text-slate-800 dark:text-slate-100">{entry.nickname}</span>{entry.isCurrentChild && <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">{copy.currentChildBadge}</span>}</div>
            <div className="mt-0.5 flex min-w-0 flex-col items-start gap-1 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:gap-2"><span className="flex items-center gap-1 font-semibold text-orange-500"><Flame className="h-3 w-3 fill-current" />{entry.streak} {t.streakDays}</span><span className="hidden sm:inline">•</span><LeagueTierBadge tier={entry.tier} /></div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="text-right"><div className="flex items-center justify-end gap-1 text-base font-black text-amber-500 sm:text-lg"><Star className="h-4 w-4 fill-current" />{entry.points}</div><div className="text-[10px] font-medium text-slate-400">{t.pointsCount}</div></div>
          {!entry.isCurrentChild && <button onClick={() => onSendHighFive(entry.childId)} disabled={isHighFived || isSending} aria-busy={isSending} aria-label={isHighFived ? copy.kudoSent : t.sendHighFive} className={`flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all ${isHighFived ? 'bg-emerald-100 text-emerald-700' : 'border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-amber-50 hover:text-amber-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300'}`}><HandMetal className="h-4 w-4 text-amber-500" /><span className="hidden sm:inline">{isHighFived ? copy.kudoSent : t.sendHighFive}</span></button>}
        </div>
      </div>;
    })}</div>
  </div>;
}
