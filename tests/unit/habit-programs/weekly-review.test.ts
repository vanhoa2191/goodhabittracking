import { describe, expect, it } from 'vitest';
import { buildWeeklyReview } from '@/lib/habit-programs/weekly-review';
import type { HabitSummary } from '@/lib/habit-programs/summary';
import type { DayDot } from '@/lib/habit-programs/week-dots';

const dots = (pattern: string): DayDot[] => [...pattern].map((symbol, index) => ({
  date: `2026-10-0${index + 1}`,
  state: symbol === 'x' ? 'done' : symbol === 'o' ? 'missed' : 'none',
  support: symbol === 'x' ? 'alone' : null,
}));

const habit = (id: string, pattern: string): HabitSummary => ({
  activityId: id, title: `Habit ${id}`, complexity: 'simple', cadence: 'due-day', since: '2026-09-01',
  evaluation: { phase: 'build' } as HabitSummary['evaluation'], suggestions: [], recent: dots(pattern), lean: null,
  status: 'forming', trend: [], trendVerdict: 'not-enough-data', readyToGraduate: false, milestone: null,
});

describe('buildWeeklyReview', () => {
  it('has no opinion until enough days were counted', () => {
    expect(buildWeeklyReview([], 3)).toEqual({ praise: null, adjust: null, next: 'unknown' });
    expect(buildWeeklyReview([habit('a', 'xx----')], 3).next).toBe('unknown');
  });
  it('praises the steadiest habit and suggests adding one when everything is steady and there is room', () => {
    const review = buildWeeklyReview([habit('a', 'xxxxxxx'), habit('b', 'xxxxoxx')], 3);
    expect(review.praise?.activityId).toBe('a');
    expect(review.adjust).toBeNull();
    expect(review.next).toBe('add');
  });
  it('points to the shakiest habit and holds off on anything new', () => {
    const review = buildWeeklyReview([habit('a', 'xxxxxxx'), habit('b', 'oooxoox')], 3);
    expect(review.praise?.activityId).toBe('a');
    expect(review.adjust?.activityId).toBe('b');
    expect(review.next).toBe('hold');
  });
  it('does not suggest a new habit at the limit even when all are steady', () => {
    const review = buildWeeklyReview([habit('a', 'xxxxxxx'), habit('b', 'xxxxxxx')], 2);
    expect(review.next).toBe('hold');
  });
  it('does not call a habit both the best and the worst', () => {
    const review = buildWeeklyReview([habit('only', 'oooxooo')], 3);
    expect(review.praise).toBeNull();
    expect(review.adjust?.activityId).toBe('only');
    expect(review.next).toBe('hold');
  });
  it('ignores days that did not count when judging a week', () => {
    const review = buildWeeklyReview([habit('a', 'xx-xx--')], 3);
    expect(review.praise?.activityId).toBe('a');
    expect(review.next).toBe('add');
  });
});
