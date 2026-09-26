'use client';

import { useEffect } from 'react';
import { BellRing } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { parentReminderCopy } from '@/lib/i18n/parent-reminder-copy';
import { useParentReminderConsent } from '@/lib/parent-reminder-context';

export function ParentReminderConsentCard() {
  const { language } = useTranslation();
  const copy = parentReminderCopy[language];
  const { enabled, delivery, permission, isLoading, isSaving, hasError, load, save, requestDevicePermission } = useParentReminderConsent();

  useEffect(() => load(), [load]);

  const status = hasError ? copy.error : isLoading ? copy.loading : isSaving ? copy.saving : enabled ? copy.enabled : copy.disabled;
  const deviceStatus = delivery === 'browser_ready' ? copy.browserReady : permission === 'denied' ? copy.browserDenied : copy.inAppOnly;

  return (
    <section className="rounded-3xl border border-sand-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900" aria-labelledby="parent-reminder-title">
      <h4 id="parent-reminder-title" className="flex items-center gap-2 text-base font-extrabold text-sand-900 dark:text-slate-100">
        <BellRing data-testid="parent-reminder-title-icon" aria-hidden="true" className="h-5 w-5 shrink-0 text-indigo-600" />
        {copy.title}
      </h4>
      <p className="mt-2 text-sm leading-6 text-slate-700 [word-break:auto-phrase] dark:text-slate-300">{copy.description}</p>
      <label className="mt-4 flex min-h-11 items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm font-bold text-sand-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100">
        <input type="checkbox" checked={enabled} onChange={(event) => void save(event.target.checked)} disabled={isLoading || isSaving} className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-600" />
        <span>{copy.enable}</span>
      </label>
      <p className={`mt-3 text-sm font-semibold [word-break:auto-phrase] ${hasError ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-300'}`} role={hasError ? 'alert' : 'status'}>{status}</p>
      {enabled && (
        <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
          <p className="text-sm text-slate-700 dark:text-slate-300">{deviceStatus}</p>
          {permission === 'default' && <button type="button" onClick={() => void requestDevicePermission()} className="mt-3 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">{copy.allowDevice}</button>}
        </div>
      )}
    </section>
  );
}
