'use client';

import { useTranslation } from '@/lib/i18n/context';
import { appEntryCopy } from '@/lib/i18n/app-entry-copy';

const block = 'rounded-2xl bg-slate-100 motion-safe:animate-pulse dark:bg-zinc-800';

/** Shown while the parent area downloads: the same rhythm as the screen it becomes, so nothing jumps when it arrives. */
export function ParentDashboardSkeleton() {
  const { language } = useTranslation();
  return (
    <div role="status" aria-busy="true" data-testid="parent-dashboard-skeleton" className="mx-auto min-h-[60vh] max-w-5xl space-y-4 px-4 py-6">
      <p className="sr-only">{appEntryCopy[language].loading}</p>
      <div aria-hidden="true" className="flex flex-wrap gap-2">
        <div className={`${block} h-11 w-32`} />
        <div className={`${block} h-11 w-32`} />
        <div className={`${block} h-11 w-32`} />
      </div>
      <div aria-hidden="true" className="grid gap-4 md:grid-cols-2">
        <div className={`${block} h-40`} />
        <div className={`${block} h-40`} />
        <div className={`${block} h-28 md:col-span-2`} />
      </div>
    </div>
  );
}
