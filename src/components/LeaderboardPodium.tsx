'use client';

import { Crown, Trophy } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import type { LeaderboardEntry, LeaderboardPeriod } from '@/types';

type Props = {
  readonly entries: readonly LeaderboardEntry[];
  readonly period: LeaderboardPeriod;
};

type PodiumPlaceProps = {
  readonly entry?: LeaderboardEntry;
  readonly place: 1 | 2 | 3;
  readonly pointsLabel: string;
};

function PodiumPlace({ entry, place, pointsLabel }: PodiumPlaceProps) {
  if (!entry) return <div />;
  const isWinner = place === 1;
  const rankStyle = place === 1 ? 'bg-amber-400 text-slate-900' : place === 2 ? 'bg-slate-300 text-slate-800' : 'bg-amber-600 text-white';
  const borderStyle = place === 1 ? 'border-amber-400' : place === 2 ? 'border-slate-300' : 'border-amber-600';
  const columnStyle = place === 1 ? 'h-28 bg-gradient-to-t from-amber-100 to-amber-200/60 text-amber-500 border-t-2 border-amber-400 dark:from-amber-950/40 dark:to-amber-900/20' : place === 2 ? 'h-20 bg-slate-100 text-slate-400 dark:bg-zinc-800' : 'h-16 bg-slate-100 text-slate-400 dark:bg-zinc-800';
  const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';

  const avatarStyle = isWinner
    ? `h-18 w-18 rounded-3xl border-4 ${borderStyle} text-4xl shadow-xl sm:h-20 sm:w-20`
    : `h-14 w-14 rounded-2xl border-2 ${borderStyle} text-3xl shadow-md sm:h-16 sm:w-16`;
  const rankSize = isWinner ? 'h-7 w-7 text-xs shadow-md' : 'h-6 w-6 text-xs shadow-xs';

  return <div className={`flex flex-col items-center text-center ${isWinner ? '-mt-6' : ''}`}>
    {isWinner && <Crown className="mb-1 h-6 w-6 text-amber-400" />}
    <div className="relative mb-2">
      <div className={`${avatarStyle} flex items-center justify-center`} style={{ backgroundColor: `${entry.themeColor}${isWinner ? '30' : '20'}` }}>{entry.avatar}</div>
      <span className={`absolute -bottom-2 -right-1 flex items-center justify-center rounded-full border-2 border-white font-black ${rankSize} ${rankStyle}`}>{place}</span>
    </div>
    <div className={`${isWinner ? 'font-black sm:text-base' : 'font-bold sm:text-sm'} w-full truncate text-xs text-slate-800 dark:text-slate-100`}>{entry.nickname}</div>
    <div className={`${isWinner ? 'text-xs sm:text-sm' : 'text-xs'} mt-0.5 font-black text-amber-600`}>⭐ {entry.points}{isWinner ? ` ${pointsLabel}` : ''}</div>
    <div className={`${columnStyle} mt-3 flex w-full items-center justify-center rounded-t-2xl ${isWinner ? 'text-2xl' : 'text-lg'} font-black`}>{medal}</div>
  </div>;
}

export function LeaderboardPodium({ entries, period }: Props) {
  const { t } = useTranslation();
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;
  const periodLabel = period === 'daily' ? t.periodDaily : period === 'weekly' ? t.periodWeekly : t.periodMonthly;

  return <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
    <h3 className="mb-6 flex items-center justify-between text-sm font-extrabold text-slate-800 dark:text-slate-100"><span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" />{t.topRankings} (Top 3)</span><span className="text-xs font-normal text-slate-400">{periodLabel}</span></h3>
    <div className="grid grid-cols-3 items-end gap-2 pb-2 pt-6 sm:gap-4">
      <PodiumPlace entry={top3[1]} place={2} pointsLabel={t.points} />
      <PodiumPlace entry={top3[0]} place={1} pointsLabel={t.points} />
      <PodiumPlace entry={top3[2]} place={3} pointsLabel={t.points} />
    </div>
  </div>;
}
