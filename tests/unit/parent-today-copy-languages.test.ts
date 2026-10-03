import { describe, expect, it } from 'vitest';

import { getParentTodayCopy, type ParentTodayCopy } from '@/lib/i18n/parent-today-copy';
import type { Language } from '@/types';

const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const vietnameseCharacters = /[ăơưđĂƠƯĐ\u1EA0-\u1EF9]/u;

function copyValues(copy: ParentTodayCopy): string[] {
  return [
    copy.chooseChild,
    copy.todayOf('Mina'),
    copy.doneOfTotal(2, 5),
    copy.noTasksToday,
    copy.streak(7),
    copy.streakNote,
    copy.actionsTitle,
    copy.nothingToDo,
    copy.suggestionsWaiting(3),
    copy.seeSuggestions,
    copy.building(2, 5),
    copy.lastSevenDays,
    copy.doneOfSeven(4),
    ...Object.values(copy.lean),
    copy.dayDone,
    copy.dayMissed,
    copy.dayNone,
    copy.emptyTitle,
    copy.emptyBody,
    copy.emptyCta,
    copy.weeklyTitle,
    copy.weeklyIntro,
    copy.weeklyPraise('Brush teeth'),
    copy.weeklyAdjust('Brush teeth'),
    copy.weeklyAdd,
    copy.weeklyHold,
    copy.weeklyNoData,
  ];
}

describe('parent today copy', () => {
  it('provides every key in all nine languages', () => {
    const englishKeys = Object.keys(getParentTodayCopy('en')).sort();
    for (const language of languages) {
      const copy = getParentTodayCopy(language);
      expect(Object.keys(copy).sort(), language).toEqual(englishKeys);
      expect(copyValues(copy).every((value) => value.trim().length > 0), language).toBe(true);
    }
  });

  it('keeps parameters in parameterized copy', () => {
    for (const language of languages) {
      const copy = getParentTodayCopy(language);
      expect(copy.todayOf('Mina'), language).toContain('Mina');
      expect(copy.doneOfTotal(2, 5), language).toContain('2');
      expect(copy.doneOfTotal(2, 5), language).toContain('5');
      expect(copy.streak(7), language).toContain('7');
      expect(copy.suggestionsWaiting(3), language).toContain('3');
      expect(copy.building(2, 5), language).toContain('2');
      expect(copy.building(2, 5), language).toContain('5');
      expect(copy.doneOfSeven(4), language).toContain('4');
      expect(copy.weeklyPraise('Brush teeth'), language).toContain('Brush teeth');
      expect(copy.weeklyAdjust('Brush teeth'), language).toContain('Brush teeth');
    }
  });

  it('does not leak Vietnamese characters into other languages', () => {
    for (const language of languages.filter((item) => item !== 'vi')) {
      expect(copyValues(getParentTodayCopy(language)).some((value) => vietnameseCharacters.test(value)), language).toBe(false);
    }
  });

  it('does not use English verbatim for translated languages', () => {
    const englishValues = copyValues(getParentTodayCopy('en'));
    for (const language of languages.filter((item) => !['vi', 'en'].includes(item))) {
      const translatedValues = copyValues(getParentTodayCopy(language));
      expect(translatedValues.every((value, index) => value !== englishValues[index]), language).toBe(true);
    }
  });
});
