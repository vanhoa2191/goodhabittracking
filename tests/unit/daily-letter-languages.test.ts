import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { letterFromTemplateKey } from '@/lib/daily-mascot-letter';

const LANGUAGES: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const MASCOTS = ['leo', 'bunny', 'panda', 'fox', 'turtle', 'bee'];
const VIETNAMESE_LETTERS = /[ăơưđ\u1ea0-\u1ef9]/i;

describe('daily mascot letter translations', () => {
  it('covers every mascot and prompt variant in all nine languages', () => {
    for (const language of LANGUAGES) {
      for (const mascot of MASCOTS) {
        for (const variant of [0, 1, 2]) {
          const letter = letterFromTemplateKey(`${mascot}_${variant}`, language, 'An', new Date(2026, 8, 23));
          expect(letter?.text, `${language} ${mascot}_${variant}`).toBeTruthy();
          expect(letter?.text.trim(), `${language} ${mascot}_${variant}`).not.toBe('');
        }
      }
    }
  });

  it('keeps the child name in every localized greeting', () => {
    for (const language of LANGUAGES) {
      const letter = letterFromTemplateKey('fox_1', language, 'Mia', new Date(2026, 8, 23));
      expect(letter?.text, language).toContain('Mia');
    }
  });

  it('does not leak Vietnamese letters or duplicate English copy in other languages', () => {
    const date = new Date(2026, 8, 23);
    for (const mascot of MASCOTS) {
      for (const variant of [0, 1, 2]) {
        const english = letterFromTemplateKey(`${mascot}_${variant}`, 'en', 'An', date)?.text;
        expect(english).toBeTruthy();
        for (const language of LANGUAGES.filter((item) => item !== 'vi' && item !== 'en')) {
          const text = letterFromTemplateKey(`${mascot}_${variant}`, language, 'An', date)?.text;
          expect(text, `${language} ${mascot}_${variant}`).not.toMatch(VIETNAMESE_LETTERS);
          expect(text, `${language} ${mascot}_${variant}`).not.toBe(english);
        }
      }
    }
  });

  it('falls back to English for an unsupported runtime language', () => {
    const date = new Date(2026, 8, 23);
    const unsupported = letterFromTemplateKey('bee_2', 'pt' as Language, 'An', date);
    const english = letterFromTemplateKey('bee_2', 'en', 'An', date);
    expect(unsupported).toEqual(english);
  });
});
