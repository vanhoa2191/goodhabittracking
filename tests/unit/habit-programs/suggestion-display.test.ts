import { describe, expect, it } from 'vitest';
import {
  dismissSuggestion,
  fillTemplate,
  isNudgeDay,
  isSuggestionHidden,
  suggestionKey,
  visibleSuggestions,
} from '@/lib/habit-programs/suggestion-display';
import type { HabitSuggestion } from '@/lib/habit-programs/suggestions';

const now = new Date(2026, 8, 30, 12, 0, 0); // Wednesday, local time
const suggestion = (habitId: string | null, code: HabitSuggestion['suggestion']['code']): HabitSuggestion => ({ habitId, suggestion: { code, facts: {} } });

describe('filling a message template', () => {
  it('replaces named placeholders and leaves unknown ones visible', () => {
    expect(fillTemplate('{child} did "{habit}" {n} times', { child: 'An', habit: 'Read', n: 3 })).toBe('An did "Read" 3 times');
    expect(fillTemplate('{a} and {b}', { a: 1 })).toBe('1 and {b}');
    expect(fillTemplate('no placeholders', { a: 1 })).toBe('no placeholders');
  });
});

describe('hiding a suggestion for a while', () => {
  it('keys a suggestion by child, habit and kind', () => {
    expect(suggestionKey('c1', 'h1', 'check-in')).toBe('c1:h1:check-in');
    expect(suggestionKey('c1', null, 'too-many-new')).toBe('c1:child:too-many-new');
  });

  it('hides a dismissed suggestion for 14 days and shows it again after that', () => {
    const state = dismissSuggestion({}, 'k', now);
    expect(isSuggestionHidden(state, 'k', now)).toBe(true);
    expect(isSuggestionHidden(state, 'k', new Date(2026, 9, 13, 11, 0, 0))).toBe(true);
    expect(isSuggestionHidden(state, 'k', new Date(2026, 9, 14, 13, 0, 0))).toBe(false);
    expect(isSuggestionHidden(state, 'other', now)).toBe(false);
  });

  it('forgets expired dismissals when saving a new one and tolerates a damaged record', () => {
    const old = { old: new Date(2026, 7, 1).toISOString(), broken: 'not a date' };
    const state = dismissSuggestion(old, 'fresh', now);
    expect(Object.keys(state)).toEqual(['fresh']);
    expect(isSuggestionHidden({ broken: 'not a date' }, 'broken', now)).toBe(false);
  });
});

describe('which suggestions are shown', () => {
  it('asks about recording support only on Wednesdays and Saturdays', () => {
    const day = (dayOfMonth: number) => new Date(2026, 8, dayOfMonth, 12); // 28 Sep 2026 is a Monday
    expect([28, 29, 30, 31].slice(0, 3).map((d) => isNudgeDay(day(d)))).toEqual([false, false, true]);
    expect([isNudgeDay(new Date(2026, 9, 1)), isNudgeDay(new Date(2026, 9, 2)), isNudgeDay(new Date(2026, 9, 3)), isNudgeDay(new Date(2026, 9, 4))]).toEqual([false, false, true, false]);
  });

  it('drops dismissed suggestions and holds back support reminders on other days', () => {
    const list = [suggestion('h1', 'check-in'), suggestion('h2', 'record-support'), suggestion(null, 'too-many-new')];
    const dismissed = dismissSuggestion({}, suggestionKey('c1', 'h1', 'check-in'), now);
    expect(visibleSuggestions(list, 'c1', dismissed, now).map((entry) => entry.suggestion.code)).toEqual(['record-support', 'too-many-new']);
    const thursday = new Date(2026, 9, 1, 12);
    expect(visibleSuggestions(list, 'c1', {}, thursday).map((entry) => entry.suggestion.code)).toEqual(['check-in', 'too-many-new']);
  });
});
