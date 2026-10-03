import { HABIT_PROGRAM_CONFIG } from './config';
import { addDays, weekStart } from './opportunities';
import type { Opportunity } from './types';

export type WeekBucket = {
  /** Monday of the week. */
  readonly weekStart: string;
  readonly alone: number;
  readonly prompted: number;
  readonly together: number;
  readonly unknown: number;
  readonly missed: number;
  readonly total: number;
};

/** How the last weeks went, oldest first. Weeks without any chance to do the habit are not in the list. */
export function supportTrend(opportunities: readonly Opportunity[], today: string, weeks: number = HABIT_PROGRAM_CONFIG.supportTrend.weeks): WeekBucket[] {
  const firstWeek = addDays(weekStart(today), -7 * (weeks - 1));
  const buckets = new Map<string, { alone: number; prompted: number; together: number; unknown: number; missed: number }>();
  for (const entry of opportunities) {
    const start = weekStart(entry.date);
    if (start < firstWeek || start > weekStart(today)) continue;
    const bucket = buckets.get(start) ?? { alone: 0, prompted: 0, together: 0, unknown: 0, missed: 0 };
    bucket[entry.outcome] += 1;
    buckets.set(start, bucket);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([start, bucket]) => ({ weekStart: start, ...bucket, total: bucket.alone + bucket.prompted + bucket.together + bucket.unknown + bucket.missed }));
}

function aloneShare(bucket: WeekBucket): number | null {
  const recorded = bucket.alone + bucket.prompted + bucket.together;
  return recorded >= HABIT_PROGRAM_CONFIG.supportTrend.minRecordedPerWeek ? bucket.alone / recorded : null;
}

export type SupportTrendVerdict = 'easing' | 'not-enough-data';

/**
 * "Easing" only when three full weeks are on record with no empty week between them, support was recorded often
 * enough in the first and the last of them, and the alone share rose by at least the set margin. Anything else says
 * there is not enough to tell, never that support is growing.
 */
export function supportTrendVerdict(buckets: readonly WeekBucket[], today: string): SupportTrendVerdict {
  const config = HABIT_PROGRAM_CONFIG.supportTrend;
  const fullWeeks = buckets.filter((bucket) => bucket.weekStart < weekStart(today));
  if (fullWeeks.length < config.minWeeksOfData) return 'not-enough-data';
  const first = fullWeeks[0];
  const last = fullWeeks[fullWeeks.length - 1];
  if (!first || !last) return 'not-enough-data';
  const span = (new Date(`${last.weekStart}T12:00:00Z`).getTime() - new Date(`${first.weekStart}T12:00:00Z`).getTime()) / (7 * 86_400_000);
  if (span + 1 !== fullWeeks.length) return 'not-enough-data';
  const start = aloneShare(first);
  const end = aloneShare(last);
  if (start === null || end === null) return 'not-enough-data';
  return end - start >= config.minRiseInAloneShare - 1e-9 ? 'easing' : 'not-enough-data';
}
