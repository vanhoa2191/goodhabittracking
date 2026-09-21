import { MONTHLY_JOURNEY_PLANS, WEEKLY_JOURNEY_PLANS, type HabitTemplate } from '@/lib/constants';
import type { Language } from '@/types';
import { getJourneyHabitText } from './journey-content';

type JourneyReference = [planId: string, habitIndex: number];

const REFERENCES: Record<HabitTemplate['pack'], JourneyReference[]> = {
  nutrition: [['week-2',0],['week-1',2],['week-2',1],['week-2',2],['month-1',3],['month-1',2],['week-2',3],['week-3',2],['month-1',5]],
  giving: [['week-1',0],['month-2',1],['month-2',1],['month-2',4],['month-2',2],['month-2',3],['month-3',1]],
  virtue: [['month-3',1],['month-3',0],['month-3',3],['month-3',2],['month-3',4]],
  mindset: [['month-2',4],['month-2',2],['month-2',0]],
  personality: [['week-1',0],['month-2',1],['month-4',3],['month-4',4]],
  wisdom: [['week-4',0],['week-4',1],['week-4',2]],
  capacity: [['week-3',0],['week-3',1],['week-3',2]],
  physical: [['month-1',0],['month-1',5]],
};

const JOURNEYS = [...WEEKLY_JOURNEY_PLANS, ...MONTHLY_JOURNEY_PLANS];

export function localizeWitTemplate(
  template: HabitTemplate,
  templateIndex: number,
  language: Language
): HabitTemplate {
  if (language === 'vi') return template;
  const reference = REFERENCES[template.pack]?.[templateIndex];
  if (!reference) return template;
  const plan = JOURNEYS.find((candidate) => candidate.id === reference[0]);
  if (!plan) return template;
  const text = getJourneyHabitText(plan, reference[1], language);
  return { ...template, title: text.title, description: text.description };
}
