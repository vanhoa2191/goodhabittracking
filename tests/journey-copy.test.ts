import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { getJourneyPeriodLabel, journeyCopy } from '@/lib/i18n/journey-copy';
import { getJourneyHabitText } from '@/lib/i18n/journey-content';
import { LEGACY_MONTHLY_JOURNEY_PLANS, LEGACY_WEEKLY_JOURNEY_PLANS } from '@/lib/constants';
import { getLegacyJourneyHabitText } from '@/lib/i18n/legacy-journey-content';
import { translatedJourneyHabits } from '@/lib/i18n/journey-content-translations';
import { AGE_JOURNEY_PLANS } from '@/lib/journeys/age-journeys';
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
      expect(getJourneyPeriodLabel(language, [5, 8])).toMatch(/5.*8/);
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
        getJourneyPeriodLabel(language, [5, 8]),
      ].join(' ');
      expect(renderedCopy).not.toMatch(/lộ trình|thói quen|Áp dụng|Xác nhận|Tuần|Tháng|bé nào/i);
    }
  });

  it('gives every age roadmap habit Vietnamese and English text, with no Vietnamese in the English', () => {
    for (const plan of AGE_JOURNEY_PLANS) {
      plan.habits.forEach((_, habitIndex) => {
        const vietnamese = getJourneyHabitText(plan, habitIndex, 'vi');
        const english = getJourneyHabitText(plan, habitIndex, 'en');
        expect(vietnamese.title).toBeTruthy();
        expect(english.title).not.toMatch(/[À-ỹ]/);
        expect(english.description).not.toMatch(/[À-ỹ]/);
        expect(english).not.toEqual(vietnamese);
        for (const language of languages.filter((item) => item !== 'vi')) {
          expect(getJourneyHabitText(plan, habitIndex, language)).toEqual(english);
        }
      });
    }
  });

  it('keeps native text for the earlier weekly and monthly habits, which age-adapted habits and templates borrow', () => {
    for (const plan of [...LEGACY_WEEKLY_JOURNEY_PLANS, ...LEGACY_MONTHLY_JOURNEY_PLANS]) {
      plan.habits.forEach((_, habitIndex) => {
        const englishText = getLegacyJourneyHabitText(plan, habitIndex, 'en');
        expect(englishText.title).not.toMatch(/[À-ỹ]/);
        for (const language of languages.filter((item) => item !== 'vi')) {
          const text = getLegacyJourneyHabitText(plan, habitIndex, language);
          expect(text.title).toBeTruthy();
          if (language !== 'en') expect(text).not.toEqual(englishText);
        }
      });
    }
    for (const language of languages.filter((item) => item !== 'vi' && item !== 'en')) {
      expect(translatedJourneyHabits[language]).toBeTruthy();
    }
  });
});
