'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { getAiCopy } from '@/lib/i18n/ai-copy';
import { aiLanguageOf } from '@/lib/ai/config';
import type { Breakdown } from '@/lib/ai/output-check';
import { requestBreakdown, useAiConsent, type AiFailureCode } from '@/lib/store/ai-client';

const button = 'min-h-11 rounded-xl border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';

/** Next to the habit form: three small steps for the title the parent typed. Nothing is applied until the parent says so. */
export function BreakdownButton({ title, ageYears, onUse }: { readonly title: string; readonly ageYears: number; readonly onUse: (steps: readonly string[]) => void }) {
  const { language } = useTranslation();
  const copy = getAiCopy(language);
  const { enabled } = useAiConsent();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Breakdown | null>(null);
  const [failure, setFailure] = useState<AiFailureCode | null>(null);
  const aiLanguage = aiLanguageOf(language);

  if (enabled === null) return null;
  if (!enabled) return <p className="text-xs text-slate-500 dark:text-slate-300">{copy.needConsent}</p>;

  const ask = async () => {
    setBusy(true);
    setFailure(null);
    setResult(null);
    const answer = await requestBreakdown({ title, ageYears, language: aiLanguage });
    setBusy(false);
    if (answer.ok) setResult(answer.result);
    else setFailure(answer.code);
  };

  return (
    <div data-testid="ai-breakdown" className="space-y-2">
      <button type="button" disabled={busy || title.trim().length < 2} onClick={() => void ask()} className={`${button} border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-300`}>
        {busy ? copy.breakdownWorking : copy.breakdownButton}
      </button>
      {failure && <p role="alert" className="text-xs font-bold text-rose-600">{copy.errors[failure]}</p>}
      {result && (
        <div role="status" className="space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{copy.breakdownTitle} · <span className="font-medium">{copy.aiLabel}</span></p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-800 dark:text-slate-100">
            {result.steps.map((step) => <li key={step.text}>{step.text} ({copy.minutes(step.minutes)})</li>)}
          </ol>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { onUse(result.steps.map((step, index) => `${index + 1}. ${step.text}`)); setResult(null); }} className={`${button} border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700`}>{copy.use}</button>
            <button type="button" onClick={() => setResult(null)} className={`${button} border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200`}>{copy.dismiss}</button>
          </div>
        </div>
      )}
    </div>
  );
}
