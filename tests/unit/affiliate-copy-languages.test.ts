import { describe, expect, it } from 'vitest';
import { getAffiliateCopy, type AffiliateCopy } from '@/lib/i18n/affiliate-copy';
import type { Language } from '@/types';

const languages: readonly Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const settings = { percent: 30, holdDays: 40, windowDays: 365, minPayout: '200.000 ₫' };
const vietnameseCharacters = /[ăơưđ\u1EA0-\u1EF9]/i;

function leafStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (typeof value === 'function') return [];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(leafStrings);
}

function translatedLeafStrings(copy: AffiliateCopy): string[] {
  return leafStrings(copy).filter((text) => text.length > 0);
}

describe('affiliate copy language coverage', () => {

  it('does not leak Vietnamese characters into non-Vietnamese copy', () => {
    for (const language of languages.filter((item) => item !== 'vi')) {
      const copy = getAffiliateCopy(language);
      expect(translatedLeafStrings(copy).some((text) => vietnameseCharacters.test(text))).toBe(false);
      expect(vietnameseCharacters.test(copy.intro(30))).toBe(false);
      expect(copy.rules(settings).some((text) => vietnameseCharacters.test(text))).toBe(false);
    }
  });

  it('does not leave non-Vietnamese leaf copy identical to English', () => {
    const englishLeaves = translatedLeafStrings(getAffiliateCopy('en'));
    for (const language of languages.filter((item) => !['vi', 'en'].includes(item))) {
      const translated = translatedLeafStrings(getAffiliateCopy(language));
      expect(translated).not.toEqual(englishLeaves);
      const sameIndices = translated.flatMap((text, index) => text === englishLeaves[index] ? [index] : []);
      expect(sameIndices, language).toEqual([]);
    }
  });
});
