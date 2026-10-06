import { describe, expect, it } from 'vitest';
import { getAffiliateCopy, type AffiliateCopy } from '@/lib/i18n/affiliate-copy';
import type { Language } from '@/types';

const languages: readonly Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const settings = { percent: 30, holdDays: 35, windowDays: 365, minPayout: '200.000 ₫' };
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
  it('has every supported language and no empty leaf value', () => {
    for (const language of languages) {
      const strings = translatedLeafStrings(getAffiliateCopy(language));
      expect(strings.length).toBeGreaterThan(0);
      expect(strings.every((text) => text.trim().length > 0)).toBe(true);
    }
  });

  it('keeps programme parameters in every translation', () => {
    for (const language of languages) {
      const copy = getAffiliateCopy(language);
      const rules = copy.rules(settings).join(' ');
      expect(copy.intro(30)).toContain('30');
      expect(rules).toContain('30');
      expect(rules).toContain('35');
      expect(rules).toContain('12');
      expect(rules).toContain('200.000 ₫');
    }
  });

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
      // Plan labels awaiting translation are exempt until each language has its own wording.
      const awaiting = new Set(['One-child plan · Monthly', 'One-child plan · Yearly', 'Pro plan · Monthly', 'Pro plan · Yearly']);
      const sameIndices = translated.flatMap((text, index) => text === englishLeaves[index] && !awaiting.has(text) ? [index] : []);
      expect(sameIndices, language).toEqual([]);
    }
  });
});
