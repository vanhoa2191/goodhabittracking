import type { HabitSuggestion, SuggestionCode } from './suggestions';

/** Suggestion key -> the moment the parent chose "later". */
export type DismissalState = Readonly<Record<string, string>>;

const DISMISS_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export function fillTemplate(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) => (
    name in values ? String(values[name]) : placeholder
  ));
}

export function suggestionKey(childId: string, habitId: string | null, code: SuggestionCode): string {
  return `${childId}:${habitId ?? 'child'}:${code}`;
}

export function isSuggestionHidden(state: DismissalState, key: string, now: Date): boolean {
  const dismissedAt = Date.parse(state[key] ?? '');
  return Number.isFinite(dismissedAt) && now.getTime() - dismissedAt < DISMISS_DAYS * DAY_MS;
}

/** Records "later" for one suggestion and forgets dismissals that have already expired. */
export function dismissSuggestion(state: DismissalState, key: string, now: Date): DismissalState {
  const kept = Object.entries(state).filter(([existing]) => isSuggestionHidden(state, existing, now));
  return { ...Object.fromEntries(kept), [key]: now.toISOString() };
}

/** Wednesday and Saturday: the only days the gentle "how was it done?" reminder appears, so at most twice a week. */
export function isNudgeDay(date: Date): boolean {
  return date.getDay() === 3 || date.getDay() === 6;
}

export function visibleSuggestions(
  suggestions: readonly HabitSuggestion[],
  childId: string,
  dismissed: DismissalState,
  now: Date,
): HabitSuggestion[] {
  return suggestions.filter((entry) => {
    if (entry.suggestion.code === 'record-support' && !isNudgeDay(now)) return false;
    return !isSuggestionHidden(dismissed, suggestionKey(childId, entry.habitId, entry.suggestion.code), now);
  });
}
