'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles, X } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { getThinkingGameParentState, getThinkingGameState } from '@/lib/store/thinking-games-client';
import { DailyWisdom } from './DailyWisdom';

const ThinkingGameCard = dynamic(
  () => import('./ThinkingGameCard').then((module) => module.ThinkingGameCard),
  { ssr: false },
);

type Props = { childId: string; localDay: string; mode: 'paired' | 'parent' | 'local' };

function autoOpenKey(childId: string, localDay: string) {
  return `kidhabit.game-popup.${childId}.${localDay}`;
}

function alreadyOpenedToday(childId: string, localDay: string) {
  try { return window.localStorage.getItem(autoOpenKey(childId, localDay)) === '1'; } catch { return false; }
}

function rememberOpenedToday(childId: string, localDay: string) {
  try { window.localStorage.setItem(autoOpenKey(childId, localDay), '1'); } catch { /* storage unavailable */ }
}

/**
 * The practice game lives in a popup instead of a dashboard section: a small button opens it, and it opens once a day
 * by itself. It only shows when the family has switched the game on (or in local practice mode).
 */
export function DailyGameLauncher({ childId, localDay, mode }: Props) {
  const enabled = defaultExperienceFlags.thinkingGames;
  const [familyOn, setFamilyOn] = useState(mode === 'local');
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!enabled || mode === 'local') return;
    let active = true;
    const refresh = () => {
      const request = mode === 'parent'
        ? getThinkingGameParentState({ childId, expectedLocalDay: localDay })
        : getThinkingGameState(localDay);
      void request.then((result) => {
        if (!active) return;
        const on = result.ok && (result.data as { featureEnabled?: boolean } | undefined)?.featureEnabled === true;
        setFamilyOn(on);
        if (on && !alreadyOpenedToday(childId, localDay)) {
          rememberOpenedToday(childId, localDay);
          setOpen(true);
        }
      }).catch(() => { if (active) setFamilyOn(false); });
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [childId, localDay, mode, enabled]);

  useEffect(() => {
    if (mode !== 'local' || !enabled || alreadyOpenedToday(childId, localDay)) return;
    // Remember only when the popup really opens: a strict-mode remount cancels the timer and must be able to retry.
    const timer = window.setTimeout(() => { rememberOpenedToday(childId, localDay); setOpen(true); }, 0);
    return () => window.clearTimeout(timer);
  }, [childId, localDay, mode, enabled]);

  const close = useCallback(() => setOpen(false), []);
  const onPlayingChange = useCallback((value: boolean) => setPlaying(value), []);

  if (!enabled || !familyOn) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="daily-game-button"
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/90 px-4 text-sm font-black text-indigo-800 shadow-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white dark:bg-zinc-900/90 dark:text-indigo-200"
      >
        <Sparkles aria-hidden="true" className="h-4 w-4" /> Trò chơi hôm nay
      </button>
      <ModalShell isOpen={open} onClose={close} label="Trò chơi hôm nay" titleId="daily-game-title" maxWidth={playing ? '2xl' : 'lg'} mobileSheet>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-zinc-800">
          <h2 id="daily-game-title" className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100">
            <Sparkles aria-hidden="true" className="h-5 w-5 text-amber-500" /> Trò chơi hôm nay
          </h2>
          <button type="button" onClick={close} aria-label="Đóng" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-zinc-800">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 overflow-y-auto px-5 py-4">
          {/* While a puzzle is open it gets the whole popup; the saying and the history fact come back afterwards. */}
          <div hidden={playing}><DailyWisdom localDay={localDay} /></div>
          <ThinkingGameCard childId={childId} localDay={localDay} mode={mode} onPlayingChange={onPlayingChange} />
        </div>
      </ModalShell>
    </>
  );
}
