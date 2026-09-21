'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { getProfileMutationCopy } from '@/lib/i18n/profile-mutation-copy';
import type { ChildProfile } from '@/types';

type Props = {
  readonly child: ChildProfile;
  readonly onUpdate: (id: string, updates: Partial<ChildProfile>) => Promise<boolean>;
};

export function LeaderboardPrivacyBar({ child, onUpdate }: Props) {
  const { t, language } = useTranslation();
  const copy = getProfileMutationCopy(language);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const togglePrivacy = async () => {
    setIsSaving(true);
    setError('');
    const saved = await onUpdate(child.id, { showRealNameOnLeaderboard: !child.showRealNameOnLeaderboard });
    setIsSaving(false);
    if (!saved) setError(copy.privacyError);
  };

  return <div className="flex animate-fade-in flex-col gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3.5 text-xs shadow-xs dark:border-zinc-800 dark:bg-zinc-900/80">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{child.avatar}</span>
        <div>
          <div className="font-medium text-slate-600 dark:text-slate-300">{t.currentDisplayMode}{' '}<strong className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{child.showRealNameOnLeaderboard ? child.name : (child.nickname || child.name)}</strong></div>
          <div className="mt-0.5 text-[11px] text-slate-400">{child.showRealNameOnLeaderboard ? `👤 ${t.showRealNameOption} (${t.realName}: ${child.name})` : `🛡️ ${t.showNicknameOnly}`}</div>
        </div>
      </div>
      <button type="button" onClick={() => void togglePrivacy()} disabled={isSaving} aria-busy={isSaving} className={`flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-bold shadow-2xs transition-all disabled:cursor-wait disabled:opacity-60 ${child.showRealNameOnLeaderboard ? 'border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-indigo-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{child.showRealNameOnLeaderboard ? `🛡️ ${t.showNicknameOnly.split('(')[0].trim()}` : `👤 ${t.showRealNameOption}`}</button>
    </div>
    {error && <p role="alert" className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
  </div>;
}
