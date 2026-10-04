import { describe, expect, it } from 'vitest';
import { getAiCopy } from '@/lib/i18n/ai-copy';
import { getCoachCopy } from '@/lib/i18n/coach-copy';
import { getIndependenceCopy } from '@/lib/i18n/independence-copy';
import { getParentActionsCopy } from '@/lib/i18n/parent-actions-copy';
import type { Language } from '@/types';

const LANGUAGES: readonly Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
// Letters only Vietnamese uses: a hit means a Vietnamese string was left in another language.
const VIETNAMESE_ONLY = /[ăĂơƠưƯđĐĩĨũŨẠ-ỹ]/u;

/** Every string a copy table can produce: functions are called with sample arguments. */
function strings(value: unknown, path: string): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (typeof value === 'function') return [[path, String((value as (...args: unknown[]) => unknown)(2, 'Mai', 'Read'))]];
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, inner]) => strings(inner, `${path}.${key}`));
  return [];
}

const MODULES = {
  parentActions: getParentActionsCopy,
  independence: getIndependenceCopy,
  coach: getCoachCopy,
  ai: getAiCopy,
} as const;

describe.each(Object.entries(MODULES))('%s copy', (_name, getter) => {
  const english = strings(getter('en'), 'copy');

  it.each(LANGUAGES)('%s has every text and none is empty', (language) => {
    const own = strings(getter(language), 'copy');
    expect(own.map(([path]) => path)).toEqual(english.map(([path]) => path));
    for (const [path, text] of own) expect(text.trim().length, `${language} ${path}`).toBeGreaterThan(0);
  });

  it.each(LANGUAGES.filter((language) => language !== 'vi' && language !== 'en'))('%s is translated: no Vietnamese left and not the English text', (language) => {
    const own = strings(getter(language), 'copy');
    let identical = 0;
    own.forEach(([path, text], index) => {
      expect(VIETNAMESE_ONLY.test(text.normalize('NFC')), `${language} ${path}: ${text}`).toBe(false);
      if (text === english[index]?.[1]) identical += 1;
    });
    // Short words such as "OK" may legitimately be the same; a whole table copied from English may not.
    expect(identical, `${language} has ${identical} texts identical to English`).toBeLessThan(Math.max(3, own.length * 0.1));
  });
});
