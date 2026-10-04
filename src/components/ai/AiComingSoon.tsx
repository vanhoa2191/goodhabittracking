'use client';

import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getAiCopy } from '@/lib/i18n/ai-copy';

/** Shown while the AI suggestions are not switched on: tells parents what is coming, and does nothing. */
export function AiComingSoonCard() {
  const { language } = useTranslation();
  const copy = getAiCopy(language);
  return (
    <section data-testid="ai-coming-soon-card" aria-labelledby="ai-soon-title" className="space-y-2 rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/50 p-6 dark:border-indigo-900/60 dark:bg-indigo-950/20">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles aria-hidden="true" className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
        <h4 id="ai-soon-title" className="text-sm font-black text-slate-800 dark:text-slate-100">{copy.soonTitle}</h4>
        <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white">{copy.soonBadge}</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">{copy.soonBody}</p>
    </section>
  );
}

/** A greyed-out button where the AI suggestion will be, so parents see it is coming. It cannot be pressed. */
export function AiComingSoonButton({ kind }: { readonly kind: 'breakdown' | 'summary' }) {
  const { language } = useTranslation();
  const copy = getAiCopy(language);
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      data-testid={`ai-coming-soon-${kind}`}
      className="flex min-h-11 items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-bold text-slate-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-slate-300"
    >
      <Sparkles aria-hidden="true" className="h-4 w-4" />
      {kind === 'breakdown' ? copy.soonBreakdown : copy.soonSummary}
      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200">{copy.soonBadge}</span>
    </button>
  );
}
