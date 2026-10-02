import { describe, expect, it } from 'vitest';
import { ageBandTraits, isAgeBandOverride, resolveAgeBand } from '@/lib/age-band';

const now = new Date('2026-10-02T09:00:00+07:00');

describe('resolveAgeBand', () => {
  it.each([
    [2024, null],
    [2022, 'young'],
    [2023, 'young'],
    [2020, 'young'],
    [2018, 'young'],
    [2017, 'tween'],
    [2014, 'tween'],
    [2013, 'teen'],
    [2008, 'teen'],
  ])('puts a child born in %s into %s', (birthYear, band) => {
    expect(resolveAgeBand({ birthYear }, now)).toBe(band);
  });

  it('keeps the screen as it was under 3, for an impossible birth year and when nothing is known', () => {
    expect(resolveAgeBand({ birthYear: 2025 }, now)).toBeNull();
    expect(resolveAgeBand({ birthYear: 2030 }, now)).toBeNull();
    expect(resolveAgeBand({ birthYear: 1950 }, now)).toBeNull();
    expect(resolveAgeBand({}, now)).toBeNull();
  });

  it('falls back to the stored age, then to a coarse stage that names one band', () => {
    expect(resolveAgeBand({ age: 10 }, now)).toBe('tween');
    expect(resolveAgeBand({ age: null, ageStage: '3-6' }, now)).toBe('young');
    expect(resolveAgeBand({ ageStage: '12-18' }, now)).toBe('teen');
    expect(resolveAgeBand({ ageStage: '6-12' }, now)).toBeNull();
    expect(resolveAgeBand({ ageStage: '0-3' }, now)).toBeNull();
  });

  it('lets the birth year win over a stale stored age', () => {
    expect(resolveAgeBand({ birthYear: 2012, age: 5 }, now)).toBe('teen');
  });

  it('honours an override: a pinned band, or off to keep the old screen', () => {
    expect(resolveAgeBand({ birthYear: 2012 }, now, 'young')).toBe('young');
    expect(resolveAgeBand({ birthYear: 2012 }, now, 'off')).toBeNull();
    expect(resolveAgeBand({ birthYear: 2012 }, now, null)).toBe('teen');
    expect(resolveAgeBand({}, now, 'tween')).toBe('tween');
  });
});

describe('ageBandTraits', () => {
  it('shrinks tap targets and corners with age but never goes under 44px', () => {
    const young = ageBandTraits('young');
    const tween = ageBandTraits('tween');
    const teen = ageBandTraits('teen');
    expect(young.tapTarget).toBeGreaterThan(tween.tapTarget);
    expect(tween.tapTarget).toBeGreaterThan(teen.tapTarget);
    expect(teen.tapTarget).toBeGreaterThanOrEqual(44);
    expect(young.radius).toBeGreaterThan(teen.radius);
  });

  it('keeps the big companion for the youngest, speaks of points and the child by name from 13', () => {
    expect(ageBandTraits('young').companion).toBe('prominent');
    expect(ageBandTraits('teen')).toMatchObject({ companion: 'optional', rewardWord: 'points', callsChildByName: true });
  });
});

describe('isAgeBandOverride', () => {
  it('accepts only the three bands and off', () => {
    for (const value of ['young', 'tween', 'teen', 'off']) expect(isAgeBandOverride(value)).toBe(true);
    for (const value of ['', 'old', null, undefined, 3]) expect(isAgeBandOverride(value)).toBe(false);
  });
});
