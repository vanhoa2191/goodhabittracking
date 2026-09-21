'use client';

import { useTranslation } from '@/lib/i18n/context';
import type { LeagueTier } from '@/types';

type Props = {
  readonly tier: LeagueTier;
};

export function LeagueTierBadge({ tier }: Props) {
  const { t } = useTranslation();

  switch (tier) {
    case 'diamond':
      return <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-2.5 py-0.5 text-xs font-black uppercase text-white shadow-xs">💎 {t.tierDiamond}</span>;
    case 'gold':
      return <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2.5 py-0.5 text-xs font-black uppercase text-slate-900 shadow-xs">👑 {t.tierGold}</span>;
    case 'silver':
      return <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-slate-200 to-slate-400 px-2.5 py-0.5 text-xs font-black uppercase text-slate-800 shadow-xs">🥈 {t.tierSilver}</span>;
    case 'bronze':
      return <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-700 to-amber-800 px-2.5 py-0.5 text-xs font-black uppercase text-amber-100 shadow-xs">🥉 {t.tierBronze}</span>;
  }
}
