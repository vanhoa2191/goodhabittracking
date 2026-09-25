'use client';

import { BarChart3 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { analyticsConsentCopy } from '@/lib/i18n/analytics-consent-copy';
import { useAnalyticsConsent } from '@/lib/analytics-consent-context';

export function AnalyticsConsentCard() {
  const { language } = useTranslation();
  const copy = analyticsConsentCopy[language];
  const { enabled, isLoading, isSaving, hasError, save } = useAnalyticsConsent();

  const status = hasError ? copy.error : isLoading ? copy.loading : isSaving ? copy.saving : enabled ? copy.enabled : copy.disabled;

  return (
    <section className="rounded-3xl border border-sand-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900" aria-labelledby="analytics-consent-title">
      <h4 id="analytics-consent-title" className="flex items-center gap-2 text-base font-extrabold text-sand-900 dark:text-slate-100">
        <BarChart3 aria-hidden="true" className="h-5 w-5 text-indigo-600" />
        {copy.title}
      </h4>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.description}</p>
      <label className="mt-4 flex min-h-11 items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm font-bold text-sand-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100">
        <input type="checkbox" checked={enabled} onChange={(event) => void save(event.target.checked)} disabled={isLoading || isSaving} className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-600" />
        <span>{copy.enable}</span>
      </label>
      <p className={`mt-3 text-sm font-semibold ${hasError ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-300'}`} role={hasError ? 'alert' : 'status'}>{status}</p>
    </section>
  );
}
