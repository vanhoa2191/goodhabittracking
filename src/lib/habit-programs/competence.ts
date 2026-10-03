import type { Opportunity } from './types';

export type CompetenceMilestone = 'first-alone' | 'three-alone' | 'seven-in-a-row' | 'two-weeks-unprompted';

export type ReachedMilestone = {
  readonly milestone: CompetenceMilestone;
  /** Date of the chance on which it was reached. */
  readonly reachedOn: string;
};

const UNPROMPTED_DAYS = 14;
const UNPROMPTED_MIN_CHANCES = 5;

/**
 * The firsts a child reaches in doing a habit alone, found by replaying the chances in order. Only chances where the
 * way of doing it was recorded can count, so nothing is celebrated on a guess.
 */
export function competenceMilestones(opportunities: readonly Opportunity[]): ReachedMilestone[] {
  const reached = new Map<CompetenceMilestone, string>();
  let aloneTotal = 0;
  let aloneRun = 0;
  opportunities.forEach((entry, index) => {
    if (entry.outcome === 'alone') {
      aloneTotal += 1;
      aloneRun += 1;
      if (aloneTotal === 1) reached.set('first-alone', entry.date);
      if (aloneTotal === 3) reached.set('three-alone', entry.date);
      if (aloneRun === 7) reached.set('seven-in-a-row', entry.date);
    } else {
      // A chance whose way of doing it was not recorded cannot be counted as alone, so it ends the run too.
      aloneRun = 0;
    }
    if (!reached.has('two-weeks-unprompted')) {
      const fromDate = new Date(`${entry.date}T12:00:00Z`).getTime() - (UNPROMPTED_DAYS - 1) * 86_400_000;
      const window = opportunities.slice(0, index + 1).filter((candidate) => new Date(`${candidate.date}T12:00:00Z`).getTime() >= fromDate);
      const spansTwoWeeks = window.length > 0 && new Date(`${window[0]?.date}T12:00:00Z`).getTime() <= fromDate + 3 * 86_400_000;
      if (spansTwoWeeks && window.length >= UNPROMPTED_MIN_CHANCES && window.every((candidate) => candidate.outcome === 'alone')) {
        reached.set('two-weeks-unprompted', entry.date);
      }
    }
  });
  return [...reached.entries()].map(([milestone, reachedOn]) => ({ milestone, reachedOn }));
}

/** The one milestone worth saying out loud now: the newest reached within the last two days. */
export function freshMilestone(reached: readonly ReachedMilestone[], today: string): ReachedMilestone | null {
  const yesterday = new Date(`${today}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const cutoff = yesterday.toISOString().slice(0, 10);
  const fresh = reached.filter((entry) => entry.reachedOn >= cutoff).sort((a, b) => b.reachedOn.localeCompare(a.reachedOn));
  return fresh[0] ?? null;
}
