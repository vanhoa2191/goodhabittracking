import type { HabitSummary } from './summary';

export type WeeklyReview = {
  /** The planned habit with the steadiest week, when it was done on most counted days. */
  readonly praise: HabitSummary | null;
  /** The planned habit with the shakiest week, when most counted days were missed. */
  readonly adjust: HabitSummary | null;
  /** `add` only when every habit is steady and the child is below the limit on habits being built. */
  readonly next: 'add' | 'hold' | 'unknown';
};

const MIN_COUNTED_DAYS = 3;
const STEADY_RATIO = 0.7;
const SHAKY_RATIO = 0.5;

function weekOf(habit: HabitSummary): { done: number; counted: number; ratio: number } {
  const done = habit.recent.filter((dot) => dot.state === 'done').length;
  const counted = done + habit.recent.filter((dot) => dot.state === 'missed').length;
  return { done, counted, ratio: counted === 0 ? 0 : done / counted };
}

/** A plain reading of the last seven days: one thing to praise, one to adjust, and whether to wait before adding a habit. */
export function buildWeeklyReview(habits: readonly HabitSummary[], limit: number): WeeklyReview {
  const measured = habits.map((habit) => ({ habit, ...weekOf(habit) })).filter((entry) => entry.counted >= MIN_COUNTED_DAYS);
  if (measured.length === 0) return { praise: null, adjust: null, next: 'unknown' };
  const ordered = [...measured].sort((a, b) => b.ratio - a.ratio || b.done - a.done);
  const best = ordered[0]!;
  const worst = ordered.at(-1)!;
  const praise = best.ratio >= STEADY_RATIO ? best.habit : null;
  const adjust = worst.ratio < SHAKY_RATIO && worst.habit !== praise ? worst.habit : null;
  const allSteady = measured.length === habits.length && measured.every((entry) => entry.ratio >= STEADY_RATIO);
  return { praise, adjust, next: allSteady && habits.length < limit ? 'add' : 'hold' };
}
