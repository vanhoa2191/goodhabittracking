import type { AgeStage } from '@/types';

/**
 * How a child's screen is tuned to age. Three bands first (3–8, 9–12, 13+): they are the cuts that research on
 * children's interfaces and the app-store kids age bands agree on. Under 3 the parent leads and the screen stays
 * as it is, and so does a child whose age cannot be worked out.
 */
export type AgeBand = 'young' | 'tween' | 'teen';

export type AgeBandInput = {
  readonly birthYear?: number | null;
  readonly age?: number | null;
  readonly ageStage?: AgeStage | null;
};

/** What a parent or the child chose for one child: a band to pin, or 'off' to keep the screen as it was. */
export type AgeBandOverride = AgeBand | 'off';

export type AgeBandTraits = {
  /** Smallest tap target in px; 2 cm for the youngest, never below 44. */
  readonly tapTarget: number;
  readonly radius: number;
  readonly fontScale: number;
  /** The big companion on the hero: always there for the youngest, a choice the child makes from 9 on. */
  readonly companion: 'prominent' | 'optional';
  readonly rewardWord: 'stars' | 'points';
  /** Wording that says "kid" ("bé") is dropped from this band on. */
  readonly callsChildByName: boolean;
};

const TRAITS: Record<AgeBand, AgeBandTraits> = {
  young: { tapTarget: 64, radius: 24, fontScale: 1.1, companion: 'prominent', rewardWord: 'stars', callsChildByName: false },
  tween: { tapTarget: 48, radius: 16, fontScale: 1, companion: 'optional', rewardWord: 'stars', callsChildByName: false },
  teen: { tapTarget: 44, radius: 10, fontScale: 1, companion: 'optional', rewardWord: 'points', callsChildByName: true },
};

export function ageBandTraits(band: AgeBand): AgeBandTraits {
  return TRAITS[band];
}

export function isAgeBandOverride(value: unknown): value is AgeBandOverride {
  return value === 'off' || value === 'young' || value === 'tween' || value === 'teen';
}

function bandForAge(age: number): AgeBand | null {
  if (!Number.isFinite(age) || age < 3) return null;
  if (age < 9) return 'young';
  if (age < 13) return 'tween';
  return 'teen';
}

/**
 * Only a birth year is stored, so the age can be a year off around a birthday; the band moves in the year the
 * child turns the age, which is the safe side for a tuning that a parent can pin.
 * A stored age or a coarse age stage is the fallback; the 6–12 stage cannot say which band, so it leaves the screen as it was.
 */
export function resolveAgeBand(
  profile: AgeBandInput,
  now: Date,
  override?: AgeBandOverride | null,
): AgeBand | null {
  if (override === 'off') return null;
  if (override) return override;
  if (typeof profile.birthYear === 'number' && profile.birthYear > 1900) {
    const age = now.getFullYear() - profile.birthYear;
    return age >= 0 && age <= 25 ? bandForAge(age) : null;
  }
  if (typeof profile.age === 'number') return bandForAge(profile.age);
  if (profile.ageStage === '3-6') return 'young';
  if (profile.ageStage === '12-18') return 'teen';
  return null;
}
