import type { Language } from '@/types';
import { journeyContentFr } from './journey-content-fr';
import { journeyContentDe } from './journey-content-de';
import { journeyContentIt } from './journey-content-it';
import { journeyContentEs } from './journey-content-es';
import { journeyContentZh } from './journey-content-zh';
import { journeyContentJa } from './journey-content-ja';
import { journeyContentKo } from './journey-content-ko';

type HabitText = { title: string; description: string };

export const translatedJourneyHabits: Partial<Record<Language, Record<string, HabitText[]>>> = {
  fr: journeyContentFr,
  de: journeyContentDe,
  it: journeyContentIt,
  es: journeyContentEs,
  zh: journeyContentZh,
  ja: journeyContentJa,
  ko: journeyContentKo,
};

