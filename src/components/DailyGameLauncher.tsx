'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Gamepad2, Sparkles, X } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { getThinkingGameParentState, getThinkingGameState } from '@/lib/store/thinking-games-client';

const ThinkingGameCard = dynamic(
  () => import('./ThinkingGameCard').then((module) => module.ThinkingGameCard),
  { ssr: false },
);

type Props = { childId: string; localDay: string; mode: 'paired' | 'parent' | 'local' };

/**
 * The practice game lives behind a floating button in the bottom-right corner and opens in its own popup, apart from the
 * saying of the day. It only shows when the family has switched the game on (or in local practice mode).
 */
export function DailyGameLauncher({ childId, localDay, mode }: Props) {
  const enabled = defaultExperienceFlags.thinkingGames;
  const [familyOn, setFamilyOn] = useState(mode === 'local');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled || mode === 'local') return;
    let active = true;
    const refresh = () => {
      const request = mode === 'parent'
        ? getThinkingGameParentState({ childId, expectedLocalDay: localDay })
        : getThinkingGameState(localDay);
      void request.then((result) => {
        if (!active) return;
        setFamilyOn(result.ok && (result.data as { featureEnabled?: boolean } | undefined)?.featureEnabled === true);
      }).catch(() => { if (active) setFamilyOn(false); });
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [childId, localDay, mode, enabled]);

  const close = useCallback(() => setOpen(false), []);

  if (!enabled || !familyOn) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="daily-game-button"
        aria-label="Trò chơi hôm nay"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40 inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-5 text-base font-black text-white shadow-xl ring-2 ring-white/70 hover:from-indigo-700 hover:to-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 active:scale-95"
      >
        <Gamepad2 aria-hidden="true" className="h-6 w-6" /> <span className="hidden min-[380px]:inline">Trò chơi</span>
      </button>
      <ModalShell isOpen={open} onClose={close} label="Trò chơi hôm nay" titleId="daily-game-title" maxWidth="lg" mobileSheet>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-zinc-800">
          <h2 id="daily-game-title" className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100">
            <Sparkles aria-hidden="true" className="h-5 w-5 text-amber-500" /> Trò chơi hôm nay
          </h2>
          <button type="button" onClick={close} aria-label="Đóng" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-zinc-800">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <ThinkingGameCard childId={childId} localDay={localDay} mode={mode} />
        </div>
      </ModalShell>
    </>
  );
}
