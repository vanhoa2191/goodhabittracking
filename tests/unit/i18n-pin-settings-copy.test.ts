import { describe, expect, it } from 'vitest';
import { getPinCopy } from '@/lib/i18n/pin-copy';
import { getSettingsLayoutCopy } from '@/lib/i18n/settings-layout-copy';
import { getSmallModalsCopy } from '@/lib/i18n/small-modals-copy';
import type { Language } from '@/types';

const LANGUAGES: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
// Letters that exist in Vietnamese but not in the other eight languages: a hit means a Vietnamese string leaked.
const VIETNAMESE_ONLY = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

function strings(copy: object): string[] {
  return Object.values(copy).flatMap((value) => {
    if (typeof value === 'string') return [value];
    if (typeof value === 'function') return [String((value as (n: number) => string)(7))];
    return [];
  });
}

describe.each([
  ['PIN', getPinCopy],
  ['settings layout', getSettingsLayoutCopy],
  ['small modals', getSmallModalsCopy],
])('%s copy', (_name, getCopy) => {
  it.each(LANGUAGES)('is complete in %s', (language) => {
    const values = strings(getCopy(language));
    expect(values.length).toBeGreaterThan(5);
    for (const value of values) expect(value.trim()).not.toBe('');
  });

  it.each(LANGUAGES.filter((language) => language !== 'vi'))('has no Vietnamese text in %s', (language) => {
    for (const value of strings(getCopy(language))) expect(value).not.toMatch(VIETNAMESE_ONLY);
  });

  it('fills the placeholders of counted messages', () => {
    for (const language of LANGUAGES) {
      for (const value of strings(getCopy(language))) expect(value).not.toMatch(/\{\w+\}|\$\{/);
    }
  });
});
