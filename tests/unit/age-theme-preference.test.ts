import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ageBandTraits } from '@/lib/age-band';
import type { AgeBand } from '@/lib/age-band';
import { EMPTY_AGE_THEME_PREFERENCE, ageThemeStorageKey, parseAgeThemePreference } from '@/lib/age-theme-preference';
import { getAgeThemeCopy } from '@/lib/i18n/age-theme-copy';
import type { Language } from '@/types';

describe('parseAgeThemePreference', () => {
  it('starts empty when nothing is stored or the value is damaged', () => {
    expect(parseAgeThemePreference(null)).toEqual(EMPTY_AGE_THEME_PREFERENCE);
    expect(parseAgeThemePreference('not json')).toEqual(EMPTY_AGE_THEME_PREFERENCE);
    expect(parseAgeThemePreference('null')).toEqual(EMPTY_AGE_THEME_PREFERENCE);
    expect(parseAgeThemePreference('42')).toEqual(EMPTY_AGE_THEME_PREFERENCE);
  });

  it('keeps a valid choice and drops anything it does not know', () => {
    expect(parseAgeThemePreference(JSON.stringify({ override: 'off', teenStyle: 'companion', noticeSeen: true })))
      .toEqual({ override: 'off', teenStyle: 'companion', noticeSeen: true });
    expect(parseAgeThemePreference(JSON.stringify({ override: 'old', teenStyle: 'loud', noticeSeen: 'yes' })))
      .toEqual(EMPTY_AGE_THEME_PREFERENCE);
  });

  it('stores each child under its own key', () => {
    expect(ageThemeStorageKey('a')).not.toBe(ageThemeStorageKey('b'));
  });
});

describe('age theme styles', () => {
  const css = readFileSync('src/app/globals.css', 'utf8');
  it.each(['young', 'tween', 'teen'] as AgeBand[])('has CSS tokens for the %s band that match its traits', (band) => {
    const traits = ageBandTraits(band);
    const rule = css.match(new RegExp(`\\[data-age-band='${band}'\\]\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    expect(rule).toContain(`--kid-tap: ${traits.tapTarget}px`);
    expect(rule).toContain(`--kid-radius: ${traits.radius}px`);
    expect(rule).toContain(`--kid-font-scale: ${traits.fontScale}`);
  });
});

describe('age theme copy', () => {
  const languages: Language[] = ['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'it', 'es'];
  it.each(languages)('is complete in %s', (language) => {
    const copy = getAgeThemeCopy(language);
    for (const value of Object.values(copy)) expect(value.length).toBeGreaterThan(1);
  });
});
