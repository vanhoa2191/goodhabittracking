import { describe, expect, it } from 'vitest';
import { chooseWeeklyChange, openTries, triesToReview, type HabitForCoach, type TryRecord } from '@/lib/habit-programs/coach';
import { bandOfMinute, formatMinute, suggestTimeOfDay } from '@/lib/habit-programs/time-suggestion';

const habit = (activityId: string, suggestions: HabitForCoach['suggestions'] = [], timeSuggestion: HabitForCoach['timeSuggestion'] = null): HabitForCoach => ({
  childId: 'c1', activityId, suggestions, timeSuggestion,
});
const tryRecord = (overrides: Partial<TryRecord> = {}): TryRecord => ({
  id: 't1', child_id: 'c1', activity_id: 'a1', kind: 'smaller', started_on: '2026-09-20', ends_on: '2026-09-27', outcome: null, ...overrides,
});

describe('chooseWeeklyChange', () => {
  const today = '2026-10-04';

  it('picks one change for the most urgent worry', () => {
    const change = chooseWeeklyChange('c1', [habit('a1', ['prompt-reliance']), habit('a2', ['stuck-building'])], [], today);
    expect(change).toEqual({ childId: 'c1', activityId: 'a2', kind: 'smaller', reason: 'stuck-building' });
  });

  it('puts three misses in a row first and offers doing it together', () => {
    expect(chooseWeeklyChange('c1', [habit('a1', ['stuck-building', 'check-in'])], [], today)?.kind).toBe('together');
  });

  it('offers another time of day when the child clearly does it at another time', () => {
    const change = chooseWeeklyChange('c1', [habit('a1', [], { band: 'evening', medianMinute: 1170 })], [], today);
    expect(change).toMatchObject({ kind: 'retime', reason: 'better-time' });
  });

  it('offers easing the support for a habit that has become a routine', () => {
    expect(chooseWeeklyChange('c1', [habit('a1', ['routine-formed'])], [], today)?.kind).toBe('reduce_support');
  });

  it('offers nothing while a try is running or waiting for an answer', () => {
    expect(chooseWeeklyChange('c1', [habit('a1', ['stuck-building'])], [tryRecord({ ends_on: '2026-10-08' })], today)).toBeNull();
    expect(chooseWeeklyChange('c1', [habit('a1', ['stuck-building'])], [tryRecord()], today)).toBeNull();
  });

  it('does not offer again what was tried and did not help within 30 days, but may offer something else', () => {
    const failed = tryRecord({ outcome: 'not_yet', ends_on: '2026-09-27' });
    expect(chooseWeeklyChange('c1', [habit('a1', ['stuck-building'])], [failed], today)).toBeNull();
    expect(chooseWeeklyChange('c1', [habit('a1', ['stuck-building', 'prompt-reliance'])], [failed], today)?.kind).toBe('cue_change');
    const old = tryRecord({ outcome: 'not_yet', ends_on: '2026-08-20' });
    expect(chooseWeeklyChange('c1', [habit('a1', ['stuck-building'])], [old], today)?.kind).toBe('smaller');
  });

  it('does not offer again what just helped, for the same habit', () => {
    const helped = tryRecord({ outcome: 'helped', ends_on: '2026-09-27' });
    expect(chooseWeeklyChange('c1', [habit('a1', ['stuck-building'])], [helped], today)).toBeNull();
    expect(chooseWeeklyChange('c1', [habit('a2', ['stuck-building'])], [helped], today)?.activityId).toBe('a2');
  });

  it('ignores habits and tries of other children', () => {
    expect(chooseWeeklyChange('c2', [habit('a1', ['stuck-building'])], [], today)).toBeNull();
    expect(chooseWeeklyChange('c1', [habit('a1', ['stuck-building'])], [tryRecord({ child_id: 'c2' })], today)?.kind).toBe('smaller');
  });
});

describe('tries by state', () => {
  const tries = [
    tryRecord({ id: 'running', ends_on: '2026-10-08' }),
    tryRecord({ id: 'due', ends_on: '2026-10-04' }),
    tryRecord({ id: 'done', outcome: 'helped' }),
  ];
  it('splits running from waiting for an answer', () => {
    expect(openTries(tries, '2026-10-04').map((entry) => entry.id)).toEqual(['running']);
    expect(triesToReview(tries, '2026-10-04').map((entry) => entry.id)).toEqual(['due']);
  });
});

describe('suggestTimeOfDay', () => {
  const at = (date: string, hour: number, minute = 0) => ({
    activityId: 'a1', childId: 'c1', date, status: 'completed' as const, completedAt: new Date(2026, 9, Number(date.slice(8)), hour, minute).toISOString(),
  });
  const evenings = [1, 2, 3, 4, 5, 6, 7].map((day) => at(`2026-10-0${day}`, 19, 10 + day));

  it('suggests the usual part of the day when it differs from the set one', () => {
    const suggestion = suggestTimeOfDay({ id: 'a1', timeOfDay: 'morning' }, 'c1', evenings, '2026-10-08');
    expect(suggestion?.band).toBe('evening');
    expect(formatMinute(suggestion?.medianMinute ?? 0)).toBe('19:14');
  });

  it('says nothing for the part of the day it is already set for, for anytime, or with too few times', () => {
    expect(suggestTimeOfDay({ id: 'a1', timeOfDay: 'evening' }, 'c1', evenings, '2026-10-08')).toBeNull();
    expect(suggestTimeOfDay({ id: 'a1', timeOfDay: 'anytime' }, 'c1', evenings, '2026-10-08')).toBeNull();
    expect(suggestTimeOfDay({ id: 'a1', timeOfDay: 'morning' }, 'c1', evenings.slice(0, 5), '2026-10-08')).toBeNull();
  });

  it('says nothing when the times are spread over the day or are old', () => {
    const mixed = [at('2026-10-01', 8), at('2026-10-02', 19), at('2026-10-03', 19), at('2026-10-04', 8), at('2026-10-05', 15), at('2026-10-06', 19)];
    expect(suggestTimeOfDay({ id: 'a1', timeOfDay: 'morning' }, 'c1', mixed, '2026-10-08')).toBeNull();
    expect(suggestTimeOfDay({ id: 'a1', timeOfDay: 'morning' }, 'c1', evenings, '2026-12-30')).toBeNull();
  });

  it('names the parts of the day', () => {
    expect([bandOfMinute(0), bandOfMinute(719), bandOfMinute(720), bandOfMinute(1079), bandOfMinute(1080)]).toEqual(['morning', 'morning', 'afternoon', 'afternoon', 'evening']);
  });
});
