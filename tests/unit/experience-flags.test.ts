import { describe, expect, it } from 'vitest';
import { defaultExperienceFlags, resolveExperienceFlags } from '@/lib/experience-flags';

describe('experience flags', () => {
  it('keeps every unreleased experience flag disabled by default', () => {
    expect(defaultExperienceFlags).toEqual({
      dailyMascotLetter: false,
      questCards: false,
      secretQuest: false,
      parentInformationArchitecture: false,
      journeyMap: false,
      landingSafe: false,
      dreamCity: false,
      dailyJournal: false,
      parentReengagement: false,
      habitPrograms: false,
    });
  });

  it('lets the habit programs flag be switched on by override', () => {
    expect(resolveExperienceFlags({ habitPrograms: true }).habitPrograms).toBe(true);
  });

  it('accepts only known boolean overrides', () => {
    expect(resolveExperienceFlags({ questCards: true, unknown: true })).toEqual({
      ...defaultExperienceFlags,
      questCards: true,
    });
  });
});
