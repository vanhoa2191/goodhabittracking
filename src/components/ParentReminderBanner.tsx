'use client';

import { useEffect } from 'react';
import { BellRing } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { parentReminderCopy } from '@/lib/i18n/parent-reminder-copy';
import { useParentReminderConsent } from '@/lib/parent-reminder-context';
import { shouldShowParentReminder } from '@/lib/parent-reminders';

type ParentReminderBannerProps = {
  readonly pendingCount: number;
  readonly familyPaused: boolean;
};

export function ParentReminderBanner({ pendingCount, familyPaused }: ParentReminderBannerProps) {
  const { language } = useTranslation();
  const copy = parentReminderCopy[language];
  const { enabled, load } = useParentReminderConsent();
  useEffect(() => load(), [load]);

  if (!shouldShowParentReminder({ consented: enabled, familyPaused, pendingCount })) return null;
  return (
    <section role="status" aria-label={copy.title} className="flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-slate-800 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-slate-100">
      <BellRing aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
      <div><p className="text-sm font-extrabold">{copy.title}</p><p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{copy.pending(pendingCount)}</p></div>
    </section>
  );
}
