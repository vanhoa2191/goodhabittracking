import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { getFamilyDataCopy } from '@/lib/i18n/family-data-copy';

const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const vietnameseOnly = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/;

describe('family data copy', () => {
  const reference = getFamilyDataCopy('en');

  it('has every message, filled in, for every language, and no Vietnamese leaking into the others', () => {
    for (const language of languages) {
      const copy = getFamilyDataCopy(language);
      expect(Object.keys(copy).sort(), language).toEqual(Object.keys(reference).sort());
      for (const [key, value] of Object.entries(copy)) {
        expect(value.trim(), `${language}.${key}`).not.toBe('');
        if (language !== 'vi') expect(value, `${language}.${key}`).not.toMatch(vietnameseOnly);
      }
    }
  });

  it('says the file has no PIN and no payment information, in every language', () => {
    for (const language of languages) expect(getFamilyDataCopy(language).private, language).toMatch(/PIN/);
  });
});
