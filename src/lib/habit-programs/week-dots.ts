import { addDays } from './opportunities';
import type { Opportunity, SupportLevel } from './types';

export type DayDot = {
  readonly date: string;
  /** `none` is a day the habit was not due, was before it started, or was paused: it is neither good nor bad. */
  readonly state: 'done' | 'missed' | 'none';
  readonly support: SupportLevel | 'unknown' | null;
};

/** The seven days ending today, oldest first, for a due-day habit. */
export function lastSevenDays(opportunities: readonly Opportunity[], today: string): DayDot[] {
  const byDate = new Map(opportunities.map((entry) => [entry.date, entry.outcome]));
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const outcome = byDate.get(date);
    if (outcome === undefined) return { date, state: 'none', support: null };
    if (outcome === 'missed') return { date, state: 'missed', support: null };
    return { date, state: 'done', support: outcome };
  });
}

export type SupportLean = SupportLevel | null;

/**
 * How the child mostly did the habit in the last seven days: the most common support level among the days it was
 * done and recorded. Null when nothing was recorded, so the screen says nothing instead of guessing.
 */
export function supportLean(dots: readonly DayDot[]): SupportLean {
  const counts: Record<SupportLevel, number> = { alone: 0, prompted: 0, together: 0 };
  for (const dot of dots) {
    if (dot.state === 'done' && dot.support && dot.support !== 'unknown') counts[dot.support] += 1;
  }
  const ranked = (Object.entries(counts) as Array<[SupportLevel, number]>).sort((a, b) => b[1] - a[1]);
  return ranked[0]![1] > 0 ? ranked[0]![0] : null;
}
