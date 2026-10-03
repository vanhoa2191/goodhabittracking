import type { SuggestionCode } from './suggestions';
import type { TimeSuggestion } from './time-suggestion';
import { addDays } from './opportunities';

export type TryKind = 'smaller' | 'retime' | 'together' | 'cue_change' | 'reduce_support';
export type TryOutcome = 'helped' | 'not_yet' | 'dropped';

export type TryRecord = {
  readonly id: string;
  readonly child_id: string;
  readonly activity_id: string;
  readonly kind: TryKind;
  readonly started_on: string;
  readonly ends_on: string;
  readonly outcome: TryOutcome | null;
  /** What the change replaced, kept so a try that did not help can put it back. */
  readonly previous_values?: Readonly<Record<string, unknown>> | null;
};

export type WeeklyChange = {
  readonly childId: string;
  readonly activityId: string;
  readonly kind: TryKind;
  readonly reason: SuggestionCode | 'better-time';
};

export type HabitForCoach = {
  readonly childId: string;
  readonly activityId: string;
  readonly suggestions: readonly SuggestionCode[];
  readonly timeSuggestion: TimeSuggestion | null;
};

/** Days an idea that did not help stays out of the suggestions for that habit. */
export const RETRY_AFTER_DAYS = 30;

// Most urgent first; a suggestion that is about the whole child, not one habit, has no change to try here.
const KIND_FOR: ReadonlyArray<readonly [SuggestionCode | 'better-time', TryKind]> = [
  ['check-in', 'together'],
  ['step-back', 'together'],
  ['stuck-building', 'smaller'],
  ['better-time', 'retime'],
  ['prompt-reliance', 'cue_change'],
  ['routine-formed', 'reduce_support'],
];

/** The change that answers one suggestion, when there is one to try. */
export function kindForSuggestion(code: SuggestionCode): TryKind | null {
  return KIND_FOR.find(([reason]) => reason === code)?.[1] ?? null;
}

/** Tries that reached their last day and have not been answered yet: the app asks if they helped. */
export function triesToReview(tries: readonly TryRecord[], today: string): TryRecord[] {
  return tries.filter((entry) => entry.outcome === null && entry.ends_on <= today);
}

/** Tries still running (their last day not reached). */
export function openTries(tries: readonly TryRecord[], today: string): TryRecord[] {
  return tries.filter((entry) => entry.outcome === null && entry.ends_on > today);
}

/**
 * The single change worth trying this week for one child, or null. Never while a try is still running or waiting
 * for an answer, and never an idea that was tried on the same habit and did not help in the last 30 days.
 */
export function chooseWeeklyChange(childId: string, habits: readonly HabitForCoach[], tries: readonly TryRecord[], today: string): WeeklyChange | null {
  const own = tries.filter((entry) => entry.child_id === childId);
  if (own.some((entry) => entry.outcome === null)) return null;
  const recent = addDays(today, -RETRY_AFTER_DAYS);
  // Whatever the answer, the same idea for the same habit is not offered again so soon: if it helped, it was done.
  const failed = new Set(own
    .filter((entry) => entry.outcome !== null && entry.ends_on >= recent)
    .map((entry) => `${entry.activity_id}:${entry.kind}`));
  for (const [reason, kind] of KIND_FOR) {
    for (const habit of habits) {
      if (habit.childId !== childId) continue;
      const present = reason === 'better-time' ? habit.timeSuggestion !== null : habit.suggestions.includes(reason);
      if (present && !failed.has(`${habit.activityId}:${kind}`)) return { childId, activityId: habit.activityId, kind, reason };
    }
  }
  return null;
}
