import { MONTHLY_JOURNEY_PLANS, WEEKLY_JOURNEY_PLANS } from '@/lib/constants';
import { generateAgeAdaptedHabits } from '@/lib/wit-framework';
import type { AgeStage, Language } from '@/types';
import { getJourneyHabitText } from './journey-content';
import { getOnboardingCopy } from './onboarding-copy';

type ActivityLike = { title: string; description?: string; targetAgeStage?: AgeStage | 'all' };
type JourneyReference = [planId: string, habitIndex: number];

const REFERENCES: Record<AgeStage, JourneyReference[]> = {
  '0-3': [['week-1',0],['month-2',4],['month-2',3],['month-2',2],['week-4',0],['month-1',5]],
  '3-6': [['week-1',0],['month-1',0],['week-1',2],['week-3',1],['month-3',1],['month-1',5]],
  '6-12': [['week-3',0],['week-2',3],['week-4',0],['week-3',3],['month-2',3],['month-1',5]],
  '12-18': [['month-4',4],['month-3',3],['month-4',4],['month-4',2],['month-2',2],['month-2',1]],
};

const JOURNEYS = [...WEEKLY_JOURNEY_PLANS, ...MONTHLY_JOURNEY_PLANS];

export function localizeAgeAdaptedHabit<T extends ActivityLike>(activity: T, language: Language): T {
  const stage = activity.targetAgeStage;
  if (language === 'vi' || !stage || stage === 'all') return activity;
  const originals = generateAgeAdaptedHabits(null, stage);
  const index = originals.findIndex((candidate) =>
    candidate.title === activity.title && candidate.description === activity.description
  );
  if (index < 0) return activity;
  const reference = REFERENCES[stage][index];
  const plan = reference && JOURNEYS.find((candidate) => candidate.id === reference[0]);
  if (!reference || !plan) return activity;
  const description = getJourneyHabitText(plan, reference[1], language).description;
  const title = getOnboardingCopy(language).stages[stage].habitTitles[index];
  return { ...activity, title, description };
}
