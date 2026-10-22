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
