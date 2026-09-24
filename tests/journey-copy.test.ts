import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { getJourneyPeriodLabel, journeyCopy } from '@/lib/i18n/journey-copy';
import { getJourneyHabitText } from '@/lib/i18n/journey-content';
import { MONTHLY_JOURNEY_PLANS, WEEKLY_JOURNEY_PLANS } from '@/lib/constants';
import { translatedJourneyHabits } from '@/lib/i18n/journey-content-translations';
import { journeyMapCopy } from '@/lib/i18n/journey-map-copy';

const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

describe('journey interface localization', () => {
  it('provides complete controls for every supported locale', () => {
    for (const language of languages) {
      const copy = journeyCopy[language];
      expect(copy.description).toBeTruthy();
      expect(copy.includesHabits(4)).toContain('4');
      expect(copy.applyQuestion(4)).toContain('4');
      expect(copy.applyTo).toBeTruthy();
      expect(copy.confirmApply).toBeTruthy();
      expect(journeyMapCopy[language].current).toBeTruthy();
      expect(journeyMapCopy[language].next).toBeTruthy();
      expect(journeyMapCopy[language].alreadyApplied).toBeTruthy();
      expect(journeyMapCopy[language].assigned(1, 4)).toContain('4');
      expect(journeyMapCopy[language].practiced(1, 4)).toContain('4');
      expect(getJourneyPeriodLabel(language, 'weekly', 'week-2')).toBeTruthy();
      expect(getJourneyPeriodLabel(language, 'monthly', 'month-3')).toBeTruthy();
    }
  });

  it('does not leak Vietnamese controls into non-Vietnamese locales', () => {
    for (const language of languages.filter((item) => item !== 'vi')) {
      const copy = journeyCopy[language];
      const renderedCopy = [
        copy.description,
        copy.includesHabits(4),
        copy.applyQuestion(4),
        copy.applyTo,
        copy.confirmApply,
        getJourneyPeriodLabel(language, 'weekly', 'week-2'),
        getJourneyPeriodLabel(language, 'monthly', 'month-3'),
      ].join(' ');
      expect(renderedCopy).not.toMatch(/lộ trình|thói quen|Áp dụng|Xác nhận|Tuần|Tháng|bé nào/i);
    }
  });

  it('provides native content for every journey habit and locale', () => {
    for (const plan of [...WEEKLY_JOURNEY_PLANS, ...MONTHLY_JOURNEY_PLANS]) {
      plan.habits.forEach((_, habitIndex) => {
        const englishText = getJourneyHabitText(plan, habitIndex, 'en');
        expect(englishText.title).not.toMatch(/[À-ỹ]/);
        expect(englishText.description).not.toMatch(/[À-ỹ]/);
        for (const language of languages.filter((item) => item !== 'vi')) {
          const text = getJourneyHabitText(plan, habitIndex, language);
          expect(text.title).toBeTruthy();
          expect(text.description).toBeTruthy();
          if (language !== 'en') expect(text).not.toEqual(englishText);
        }
      });
    }
    for (const language of languages.filter((item) => item !== 'vi' && item !== 'en')) {
      expect(translatedJourneyHabits[language]).toBeTruthy();
    }
  });
});
