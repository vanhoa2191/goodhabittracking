'use client';

import type { IndependenceCopy } from '@/lib/i18n/independence-copy';
import type { SupportTrendVerdict, WeekBucket } from '@/lib/habit-programs/support-trend';

const SEGMENTS = [
  { key: 'alone', color: 'bg-emerald-500' },
  { key: 'prompted', color: 'bg-amber-400' },
  { key: 'together', color: 'bg-sky-400' },
  { key: 'unknown', color: 'bg-slate-300 dark:bg-zinc-600' },
  { key: 'missed', color: 'bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-600' },
] as const;

/** Weekly stacked bars of how a habit was done, with a plain sentence that only claims what the weeks show. */
export function HabitSupportTrend({ buckets, verdict, copy }: { readonly buckets: readonly WeekBucket[]; readonly verdict: SupportTrendVerdict; readonly copy: IndependenceCopy }) {
  if (buckets.length === 0) return null;
  const tallest = Math.max(...buckets.map((bucket) => bucket.total), 1);
  return (
    <div data-testid="support-trend" data-verdict={verdict} className="space-y-2">
      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{copy.trendTitle}</p>
      <ul className="flex items-end gap-1.5" aria-label={copy.trendTitle}>
        {buckets.map((bucket) => (
          <li key={bucket.weekStart} className="flex flex-1 flex-col-reverse overflow-hidden rounded-md" style={{ height: `${Math.max(12, (bucket.total / tallest) * 56)}px` }}>
            {SEGMENTS.map(({ key, color }) => bucket[key] > 0 && <span key={key} className={color} style={{ flexGrow: bucket[key] }} />)}
            <span className="sr-only">
              {copy.trendWeek(bucket.weekStart)}: {SEGMENTS.map(({ key }) => `${copy.legend[key]} ${bucket[key]}`).join(', ')}
            </span>
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
        {SEGMENTS.map(({ key, color }) => (
          <li key={key} className="flex items-center gap-1"><span className={`h-2.5 w-2.5 rounded-sm ${color}`} aria-hidden="true" />{copy.legend[key]}</li>
        ))}
      </ul>
      <p className="text-xs text-slate-700 dark:text-slate-200">{verdict === 'easing' ? copy.trendEasing : copy.trendNotEnough}</p>
    </div>
  );
}
