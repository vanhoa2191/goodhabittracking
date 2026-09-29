'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ModalShell } from '@/components/ui/ModalShell';
import { getBadgeCopy } from '@/lib/badges/badge-copy';
import { sounds } from '@/lib/sound';
import type { Badge, Language } from '@/types';

type BadgeCelebrationProps = {
  readonly badge: Badge | null;
  readonly remaining: number;
  readonly childName: string;
  readonly language: Language;
  readonly onDismiss: () => void;
  readonly onViewBadges: () => void;
};

export function BadgeCelebration({ badge, remaining, childName, language, onDismiss, onViewBadges }: BadgeCelebrationProps) {
  const copy = getBadgeCopy(language);
  const badgeId = badge?.id ?? null;

  useEffect(() => {
    if (!badgeId) return;
    sounds.playLevelUp();
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 }, disableForReducedMotion: true });
  }, [badgeId]);

  const name = badge ? badge.name[language] || badge.name.en || badge.name.vi : '';
  const description = badge ? badge.description[language] || badge.description.en || badge.description.vi : '';

  return (
    <ModalShell isOpen={Boolean(badge)} onClose={onDismiss} label={copy.congratsTitle} maxWidth="sm" mobileSheet={false}>
      {badge && (
        <div data-testid="badge-celebration" className="space-y-4 overflow-y-auto p-6 text-center">
          <p className="text-sm font-black uppercase tracking-wide text-amber-600 dark:text-amber-400">{copy.congratsTitle}</p>
          <div aria-hidden="true" className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-amber-400 text-6xl shadow-lg shadow-amber-200 motion-safe:animate-bounce dark:shadow-none">
            {badge.icon}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500 dark:text-slate-300">{copy.earnedLine(childName)}</p>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{name}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          {remaining > 0 && <p className="text-xs font-bold text-amber-700 dark:text-amber-300">{copy.nextBadges(remaining)}</p>}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              autoFocus
              onClick={onDismiss}
              className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {copy.awesome}
            </button>
            <button
              type="button"
              onClick={onViewBadges}
              className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-slate-200 dark:hover:bg-zinc-800"
            >
              {copy.viewBadges}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
