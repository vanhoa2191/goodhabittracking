import type { Cadence, ComplexityClass } from './types';

/** Design parameters; see docs/habit-science-and-adaptive-logic.md, section 5. All are tunable hypotheses. */
export const HABIT_PROGRAM_CONFIG = {
  windowSize: { 'due-day': 10, weekly: 6 } satisfies Record<Cadence, number>,
  minAttemptsToBuild: 3,
  buildToFadeRatio: 0.7,
  fadeToMaintainAloneRatio: 0.8,
  maintainRegressBelowRatio: 0.6,
  promptedDependenceRatio: 0.6,
  stuckWeeks: { simple: 8, medium: 14, complex: 26 } satisfies Record<ComplexityClass, number>,
  youngStuckMultiplier: 1.5,
  youngAgeYears: 6,
  recentWindowForStepBack: 5,
  stepBackMisses: 3,
  consecutiveMissesForCheckIn: 3,
  missingSupportShare: 0.5,
  suggestionLimit: 3,
} as const;

/** Smallest count that reaches `ratio` of `windowSize`, e.g. 0.7 of 10 is 7 and 0.7 of 6 is 5. */
export function requiredCount(ratio: number, windowSize: number): number {
  return Math.ceil(ratio * windowSize - 1e-9);
}

/** Soft cap on habits that are still being set up or built at the same time. A design convention, not a finding. */
export function newHabitLimit(ageYears: number): number {
  if (ageYears < 3) return 1;
  if (ageYears < 6) return 2;
  if (ageYears < 15) return 3;
  return 4;
}
