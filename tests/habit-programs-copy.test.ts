import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { getHabitProgramsCopy } from '@/lib/i18n/habit-programs-copy';

const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const placeholders = (text: string) => [...text.matchAll(/\{\w+\}/g)].map((match) => match[0]).sort();
const vietnameseOnly = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/;

describe('habit program copy', () => {
  const reference = getHabitProgramsCopy('en');

  it('has every message, filled in, for every supported language', () => {
    for (const language of languages) {
      const copy = getHabitProgramsCopy(language);
      expect(Object.keys(copy).sort(), language).toEqual(Object.keys(reference).sort());
      for (const [key, value] of Object.entries(copy)) expect(value.trim(), `${language}.${key}`).not.toBe('');
    }
  });

  it('keeps the same placeholders in every language so messages can be filled in', () => {
    for (const language of languages) {
      const copy = getHabitProgramsCopy(language);
      for (const key of Object.keys(reference) as (keyof typeof reference)[]) {
        expect(placeholders(copy[key]), `${language}.${key}`).toEqual(placeholders(reference[key]));
      }
    }
  });

  it('does not leak Vietnamese into other languages and actually translates the messages', () => {
    for (const language of languages.filter((item) => item !== 'vi')) {
      const copy = getHabitProgramsCopy(language);
      for (const [key, value] of Object.entries(copy)) expect(value, `${language}.${key}`).not.toMatch(vietnameseOnly);
      if (language !== 'en') expect(copy.supportTitle, language).not.toBe(reference.supportTitle);
    }
  });

  it('names the three ways a habit can be done and the four phases distinctly', () => {
    for (const language of languages) {
      const copy = getHabitProgramsCopy(language);
      expect(new Set([copy.levelAlone, copy.levelPrompted, copy.levelTogether]).size, language).toBe(3);
      expect(new Set([copy.phaseAnchor, copy.phaseBuild, copy.phaseFade, copy.phaseMaintain]).size, language).toBe(4);
    }
  });

  it('says which day a question is about and keeps today and yesterday apart', () => {
    for (const language of languages) {
      const copy = getHabitProgramsCopy(language);
      expect(copy.supportQuestion, language).toContain('{day}');
      expect(copy.supportDayToday, language).not.toBe(copy.supportDayYesterday);
    }
  });
});
