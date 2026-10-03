import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Language } from '@/types';
import { getDocsCopy } from '@/lib/i18n/docs-copy';
import { referralDiscountLine } from '@/lib/i18n/referral-discount-copy';
import { buildSafeAchievementShare } from '@/lib/safe-achievement-share';

const LANGUAGES: readonly Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const NON_VIETNAMESE_MARKS = /[ăơưđĂƠƯĐ\u1EA0-\u1EF9]/u;

function docsStrings(language: Language): string[] {
  const copy = getDocsCopy(language);
  return [copy.title, copy.intro, copy.back, ...copy.sections.flatMap(([, title, body]) => [title, body])];
}

describe('small copy language coverage', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', 'https://www.example'));

  it('provides non-empty copy for all nine languages', () => {
    for (const language of LANGUAGES) {
      expect(docsStrings(language).every((value) => value.trim().length > 0)).toBe(true);
      expect(referralDiscountLine(language, 12, '399.000 ₫').trim()).not.toBe('');
      const share = buildSafeAchievementShare(language);
      expect(share.title.trim()).not.toBe('');
      expect(share.text.trim()).not.toBe('');
      expect(share.url).toBe('https://www.example/');
    }
  });

  it('keeps translated docs sections aligned with English', () => {
    const english = getDocsCopy('en');
    const englishStrings = docsStrings('en');
    for (const language of LANGUAGES.filter((value) => value !== 'en')) {
      const copy = getDocsCopy(language);
      expect(copy.sections).toHaveLength(english.sections.length);
      expect(copy.sections.map(([, title]) => title)).not.toEqual(english.sections.map(([, title]) => title));
      expect(copy.sections.map(([, , body]) => body)).not.toEqual(english.sections.map(([, , body]) => body));
      docsStrings(language).forEach((value, index) => expect(value).not.toBe(englishStrings[index]));
    }
  });

  it('does not leak Vietnamese-only characters into non-Vietnamese copy', () => {
    for (const language of LANGUAGES.filter((value) => value !== 'vi')) {
      expect(docsStrings(language).some((value) => NON_VIETNAMESE_MARKS.test(value))).toBe(false);
      expect(NON_VIETNAMESE_MARKS.test(referralDiscountLine(language, 12, '399.000 ₫'))).toBe(false);
      const share = buildSafeAchievementShare(language);
      expect(NON_VIETNAMESE_MARKS.test(share.title)).toBe(false);
      expect(NON_VIETNAMESE_MARKS.test(share.text)).toBe(false);
    }
  });

  it('keeps referral parameters in each localized line', () => {
    for (const language of LANGUAGES) {
      const line = referralDiscountLine(language, 37, '1,234.56');
      expect(line).toContain('37');
      expect(line).toContain('1,234.56');
    }
  });

  it('does not copy English text verbatim into translated share or referral copy', () => {
    const englishShare = buildSafeAchievementShare('en');
    const englishReferral = referralDiscountLine('en', 37, '1,234.56');
    for (const language of LANGUAGES.filter((value) => !['vi', 'en'].includes(value))) {
      const share = buildSafeAchievementShare(language);
      expect(share.title).not.toBe(englishShare.title);
      expect(share.text).not.toBe(englishShare.text);
      expect(referralDiscountLine(language, 37, '1,234.56')).not.toBe(englishReferral);
    }
  });
});
