import { describe, expect, it } from 'vitest';
import { getCaregiverCopy } from '@/lib/i18n/caregiver-copy';
import { getCheckoutEntryCopy } from '@/lib/i18n/checkout-entry-copy';
import { getFrameworkLibraryCopy } from '@/lib/i18n/framework-library-copy';
import { getJourneysTabCopy } from '@/lib/i18n/journeys-tab-copy';
import { getLetterCopy } from '@/lib/i18n/letter-copy';
import { getOnboardingExtraCopy } from '@/lib/i18n/onboarding-extra-copy';
import { getRewardLibraryCopy } from '@/lib/i18n/reward-library-copy';
import type { Language } from '@/types';

const LANGUAGES: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
// Letters that exist in Vietnamese but not in the other eight languages: a hit means a Vietnamese string leaked.
const VIETNAMESE_ONLY = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

function strings(copy: object): string[] {
  return Object.values(copy).flatMap((value) => {
    if (typeof value === 'string') return [value];
    if (typeof value === 'function') return [String((value as (...args: string[]) => string)('7', '7'))];
    return [];
  });
}

const modules = [
  ['caregiver', getCaregiverCopy],
  ['checkout entry', getCheckoutEntryCopy],
  ['framework library', getFrameworkLibraryCopy],
  ['journeys tab', getJourneysTabCopy],
  ['letter', getLetterCopy],
  ['onboarding extras', getOnboardingExtraCopy],
  ['reward library', getRewardLibraryCopy],
] as const;

describe.each(modules)('%s copy', (_name, getCopy) => {
  it.each(LANGUAGES)('is complete in %s', (language) => {
    const values = strings(getCopy(language) as object);
    expect(values.length).toBeGreaterThan(2);
    for (const value of values) expect(value.trim()).not.toBe('');
  });

  it.each(LANGUAGES.filter((language) => language !== 'vi'))('has no Vietnamese text in %s', (language) => {
    for (const value of strings(getCopy(language) as object)) expect(value).not.toMatch(VIETNAMESE_ONLY);
  });

  it('fills every placeholder', () => {
    for (const language of LANGUAGES) {
      for (const value of strings(getCopy(language) as object)) expect(value).not.toMatch(/\{\w+\}|\$\{/);
    }
  });
});

describe('onboarding legal sentence', () => {
  it.each(LANGUAGES)('keeps both link slots in %s', (language) => {
    const copy = getOnboardingExtraCopy(language);
    expect(copy.legalTemplate).toContain('[privacy]');
    expect(copy.legalTemplate).toContain('[terms]');
  });
});

describe('caregiver counted messages', () => {
  it.each(LANGUAGES)('puts the count and the name in %s', (language) => {
    const copy = getCaregiverCopy(language);
    expect(copy.dashAllTime(12)).toContain('12');
    expect(copy.dashToday(3, 5)).toMatch(/3\D+5/);
    expect(copy.dashWeek(9, 21)).toMatch(/9\D+21/);
    expect(copy.dashTodayNone.length).toBeGreaterThan(0);
    expect(copy.dashWeekNone.length).toBeGreaterThan(0);
    expect(copy.dashHabitsOf('An')).toContain('An');
    expect(copy.panelExpires('1 Jan')).toContain('1 Jan');
  });
});
