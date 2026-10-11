'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { canBuyAiAddon, getAiCopy } from '@/lib/i18n/ai-copy';
import { useAppStore } from '@/lib/store';
import { aiLanguageOf } from '@/lib/ai/config';
import type { WeeklySummary } from '@/lib/ai/output-check';
import type { SummaryInput } from '@/lib/ai/prompts';
import { requestWeeklySummary, useAiConsent, type AiFailure } from '@/lib/store/ai-client';

const button = 'min-h-11 rounded-xl border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';

/** A few sentences about the week, from counts only; shown for reading and never saved or applied. */
export function WeeklySummaryButton({ counts }: { readonly counts: Omit<SummaryInput, 'language'> }) {
  const { language } = useTranslation();
  const copy = getAiCopy(language);
  const { enabled } = useAiConsent();
  const { subscriptionPlan, subscriptionEndsAt } = useAppStore();
  const addonSellable = canBuyAiAddon(subscriptionPlan, subscriptionEndsAt);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<WeeklySummary | null>(null);
  const [failure, setFailure] = useState<AiFailure | null>(null);
  const aiLanguage = aiLanguageOf(language);
  const dailyTier = failure?.code === 'ai_quota' && failure.reason === 'family_day' ? failure.tier : undefined;

  if (enabled === null || counts.weeks.length === 0) return null;
  if (!enabled) return <p className="text-xs text-slate-500 dark:text-slate-300">{copy.needConsent}</p>;

  const ask = async () => {
    setBusy(true);
    setFailure(null);
    setResult(null);
    const answer = await requestWeeklySummary({ ...counts, language: aiLanguage });
    setBusy(false);
    if (answer.ok) setResult(answer.result);
    else setFailure(answer);
  };

  return (
    <div data-testid="ai-weekly-summary" className="space-y-2">
      <button type="button" disabled={busy} onClick={() => void ask()} className={`${button} border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-300`}>
        {busy ? copy.summaryWorking : copy.summaryButton}
      </button>
      {failure && (
        <div role={dailyTier ? 'status' : 'alert'} className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <p>{dailyTier === 'basic' ? (addonSellable ? copy.quota.basic : copy.quota.basicUpgradeOnly).split(/(\{addon\}|\{upgrade\})/).map((part, index) =>
            part === '{addon}' ? <a key={index} href="/checkout?plan=ai_addon_monthly" className="text-indigo-700 underline dark:text-indigo-300">{copy.quota.addon}</a> :
            part === '{upgrade}' ? <a key={index} href="/checkout?plan=pro_plus_monthly" className="text-indigo-700 underline dark:text-indigo-300">{copy.quota.upgrade}</a> :
            part,
          ) : dailyTier === 'plus' ? copy.quota.plus : copy.errors[failure.code]}</p>
        </div>
      )}
      {result && (
        <div role="status" className="space-y-1 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 text-sm text-slate-800 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-slate-100">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{copy.summaryTitle} · <span className="font-medium">{copy.aiLabel}</span></p>
          <ul className="list-disc space-y-1 pl-5">
            <li>{result.praise}</li>
            <li>{result.notice}</li>
            <li>{result.tryNext}</li>
          </ul>
          <button type="button" onClick={() => setResult(null)} className={`${button} border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200`}>{copy.dismiss}</button>
        </div>
      )}
    </div>
  );
}
