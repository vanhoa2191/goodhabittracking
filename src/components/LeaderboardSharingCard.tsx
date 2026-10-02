'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getLeaderboardCopy } from '@/lib/i18n/leaderboard-copy';
import { loadLeaderboardSharing, saveLeaderboardSharing } from '@/lib/store/public-leaderboard-client';
import { HelpTip } from '@/components/help/HelpTip';

type Status = 'loading' | 'ready' | 'saving' | 'saved' | 'failed' | 'load-failed';

/** Whether this family's chosen children may appear on the public leaderboard. Off until a parent turns it on. */
export function LeaderboardSharingCard() {
  const { language } = useTranslation();
  const copy = getLeaderboardCopy(language);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    void loadLeaderboardSharing().then((value) => {
      if (cancelled) return;
      if (value === null) setStatus('load-failed');
      else { setEnabled(value); setStatus('ready'); }
    });
    return () => { cancelled = true; };
  }, []);

  const change = async (next: boolean) => {
    setStatus('saving');
    const saved = await saveLeaderboardSharing(next);
    if (saved === null) { setStatus('failed'); return; }
    setEnabled(saved);
    setStatus('saved');
  };

  const message = status === 'loading' ? copy.globalLoading
    : status === 'saving' ? copy.sharingSaving
    : status === 'saved' ? copy.sharingSaved
    : status === 'failed' ? copy.sharingFailed
    : status === 'load-failed' ? copy.sharingLoadFailed
    : enabled ? copy.sharingOn : copy.sharingOff;
  const problem = status === 'failed' || status === 'load-failed';

  return (
    <section data-testid="leaderboard-sharing" className="rounded-3xl border border-sand-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900" aria-labelledby="leaderboard-sharing-title">
      <div className="flex items-center gap-1"><h4 id="leaderboard-sharing-title" className="flex items-center gap-2 text-base font-extrabold text-sand-900 dark:text-slate-100">
        <Trophy aria-hidden="true" className="h-5 w-5 shrink-0 text-indigo-600" />
        {copy.sharingTitle}
      </h4><HelpTip topic="settings.leaderboardSharing" /></div>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.sharingIntro}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.sharingWhatShown}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.sharingChildrenHint}</p>
      <label className="mt-4 flex min-h-11 items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm font-bold text-sand-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => void change(event.target.checked)}
          disabled={status === 'loading' || status === 'saving' || status === 'load-failed'}
          className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-600"
        />
        <span>{copy.sharingEnable}</span>
      </label>
      <p role={problem ? 'alert' : 'status'} className={`mt-3 text-sm font-semibold ${problem ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-300'}`}>{message}</p>
    </section>
  );
}
