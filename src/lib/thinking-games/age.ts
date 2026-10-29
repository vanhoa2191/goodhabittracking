import type { GameAgeTrack } from './types';

export type AgeBand = 'age_3_5' | 'age_6_8' | 'age_9_12' | 'age_13_plus';

export function ageBand(ageTrack: GameAgeTrack): AgeBand {
  return ageTrack;
}

export function isYoungTrack(ageTrack: GameAgeTrack): boolean {
  return ageTrack === 'age_3_5' || ageTrack === 'age_6_8';
}

export function isOlderTrack(ageTrack: GameAgeTrack): boolean {
  return ageTrack === 'age_9_12' || ageTrack === 'age_13_plus';
}

export function targetSecondsForAge(ageTrack: GameAgeTrack): number {
  if (ageTrack === 'age_3_5') return 60;
  if (ageTrack === 'age_6_8') return 75;
  if (ageTrack === 'age_9_12') return 105;
  return 115;
}

export function ageRank(ageTrack: GameAgeTrack): 0 | 1 | 2 | 3 {
  if (ageTrack === 'age_3_5') return 0;
  if (ageTrack === 'age_6_8') return 1;
  if (ageTrack === 'age_9_12') return 2;
  return 3;
}

// Candidate seeds include the editorial slot id. Direct engine callers without a
// day keep the first-quarter settings for reproducible standalone puzzles.
export function candidateQuarter(seed: string): 0 | 1 | 2 | 3 {
  const day = Number(/\|D(\d{3})-(?:main|bonus)/.exec(seed)?.[1] ?? 1);
  return (day <= 91 ? 0 : day <= 182 ? 1 : day <= 273 ? 2 : 3);
}
