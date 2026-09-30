import { describe, expect, it } from 'vitest';
import { cueLineFor, childMaySelfReport, pickAcknowledgement } from '@/lib/habit-programs/child-view';

describe('who may say how a habit was done', () => {
  it('allows a child from 15 years old, by age when known and by birth year otherwise', () => {
    expect(childMaySelfReport({ age: 15 }, '2026-09-30')).toBe(true);
    expect(childMaySelfReport({ age: 14 }, '2026-09-30')).toBe(false);
    expect(childMaySelfReport({ birthYear: 2011 }, '2026-09-30')).toBe(true);
    expect(childMaySelfReport({ birthYear: 2012 }, '2026-09-30')).toBe(false);
  });

  it('does not guess from the age stage alone or when nothing is known', () => {
    expect(childMaySelfReport({ ageStage: '12-18' }, '2026-09-30')).toBe(false);
    expect(childMaySelfReport({}, '2026-09-30')).toBe(false);
  });

  it('prefers the age over the birth year', () => {
    expect(childMaySelfReport({ age: 13, birthYear: 2000 }, '2026-09-30')).toBe(false);
  });
});

describe('the cue line on a task card', () => {
  const plan = { cue_kind: 'event' as const, cue_text: 'After brushing teeth, I do it', cue_time: null, place_text: null, weekend_variant_text: null };

  it('shows the parent and child\'s own words', () => {
    expect(cueLineFor(plan, false)).toBe('After brushing teeth, I do it');
  });

  it('adds the place and the time when they were set', () => {
    expect(cueLineFor({ ...plan, cue_kind: 'time', cue_time: '19:00:00', place_text: 'at the desk' }, false)).toBe('After brushing teeth, I do it · 19:00 · at the desk');
  });

  it('uses the weekend wording on weekends when there is one', () => {
    const withWeekend = { ...plan, weekend_variant_text: 'After breakfast, I do it' };
    expect(cueLineFor(withWeekend, true)).toBe('After breakfast, I do it');
    expect(cueLineFor(withWeekend, false)).toBe('After brushing teeth, I do it');
    expect(cueLineFor(plan, true)).toBe('After brushing teeth, I do it');
  });

  it('shows nothing when there is no plan', () => {
    expect(cueLineFor(undefined, false)).toBeNull();
  });
});

describe('the acknowledgement for a habit that has become steady', () => {
  const lines = ['a', 'b', 'c', 'd', 'e'];
  const days = Array.from({ length: 30 }, (_, index) => `2026-09-${String(index + 1).padStart(2, '0')}`);

  it('is the same for the same child, habit and day', () => {
    expect(pickAcknowledgement('c1', 'h1', '2026-09-30', 'maintain', lines)).toBe(pickAcknowledgement('c1', 'h1', '2026-09-30', 'maintain', lines));
  });

  it('only appears once a habit is being maintained', () => {
    for (const phase of ['anchor', 'build', 'fade'] as const) expect(pickAcknowledgement('c1', 'h1', '2026-09-30', phase, lines)).toBeNull();
    expect(pickAcknowledgement('c1', 'h1', '2026-09-30', 'maintain', [])).toBeNull();
  });

  it('never repeats the line of the day before, and uses every line over a month', () => {
    const picked = days.map((day) => pickAcknowledgement('c1', 'h1', day, 'maintain', lines));
    for (let index = 1; index < picked.length; index += 1) expect(picked[index]).not.toBe(picked[index - 1]);
    expect(new Set(picked).size).toBe(lines.length);
  });

  it('varies between habits on the same day', () => {
    const picks = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((habit) => pickAcknowledgement('c1', habit, '2026-09-30', 'maintain', lines)));
    expect(picks.size).toBeGreaterThan(1);
  });

  it('works with a single line', () => {
    expect(pickAcknowledgement('c1', 'h1', '2026-09-30', 'maintain', ['only'])).toBe('only');
    expect(pickAcknowledgement('c1', 'h1', '2026-10-01', 'maintain', ['only'])).toBe('only');
  });
});
