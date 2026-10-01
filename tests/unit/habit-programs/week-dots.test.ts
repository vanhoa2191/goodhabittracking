import { describe, expect, it } from 'vitest';
import { lastSevenDays, supportLean } from '@/lib/habit-programs/week-dots';
import type { Opportunity } from '@/lib/habit-programs/types';

const today = '2026-10-07';
const done = (date: string, outcome: Opportunity['outcome'] = 'alone'): Opportunity => ({ date, outcome });

describe('lastSevenDays', () => {
  it('lists the seven days ending today, oldest first', () => {
    const dots = lastSevenDays([], today);
    expect(dots.map((dot) => dot.date)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07']);
    expect(dots.every((dot) => dot.state === 'none')).toBe(true);
  });
  it('marks done and missed days and leaves days that did not count neutral', () => {
    const dots = lastSevenDays([done('2026-10-07'), done('2026-10-06', 'prompted'), { date: '2026-10-05', outcome: 'missed' }, done('2026-10-03', 'unknown')], today);
    expect(dots.map((dot) => dot.state)).toEqual(['none', 'none', 'done', 'none', 'missed', 'done', 'done']);
    expect(dots[5]!.support).toBe('prompted');
    expect(dots[4]!.support).toBeNull();
  });
  it('ignores opportunities older than the window', () => {
    expect(lastSevenDays([done('2026-09-20')], today).every((dot) => dot.state === 'none')).toBe(true);
  });
});

describe('supportLean', () => {
  it('names the most common recorded level among the days it was done', () => {
    const dots = lastSevenDays([done('2026-10-07', 'prompted'), done('2026-10-06', 'prompted'), done('2026-10-05', 'alone')], today);
    expect(supportLean(dots)).toBe('prompted');
  });
  it('says nothing when no day was recorded', () => {
    expect(supportLean(lastSevenDays([done('2026-10-07', 'unknown')], today))).toBeNull();
    expect(supportLean(lastSevenDays([], today))).toBeNull();
  });
  it('does not count missed days', () => {
    expect(supportLean(lastSevenDays([{ date: '2026-10-07', outcome: 'missed' }], today))).toBeNull();
  });
});
