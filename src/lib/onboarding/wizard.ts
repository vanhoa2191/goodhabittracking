import { newHabitLimit } from '@/lib/habit-programs/config';
import { getOnboardingWizardCopy } from '@/lib/i18n/onboarding-wizard-copy';
import { MEANINGFUL_REWARD_TEMPLATES } from '@/lib/reward-templates';
import { generateAgeAdaptedHabits, getStageFromAge } from '@/lib/wit-framework';
import type { Language } from '@/types';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type OnboardingRewardId =
  | 'experience-bedtime-story'
  | 'experience-meal-choice'
  | 'experience-parent-time';

export const ONBOARDING_REWARD_IDS: readonly OnboardingRewardId[] = [
  'experience-bedtime-story',
  'experience-meal-choice',
  'experience-parent-time',
];

export type StarterHabitChoice = {
  readonly templateIndex: number;
  readonly selected: boolean;
  readonly requiresApproval: boolean;
};

/** Matches the server reward schema (`costPoints` max in reward-mutations). */
export const MAX_REWARD_COST = 1_000_000;

export type RewardChoice = {
  readonly id: OnboardingRewardId;
  readonly selected: boolean;
  readonly costPoints: number;
  /** The family already has a reward with this localized title; it cannot be selected again. */
  readonly alreadyAdded: boolean;
};

export type WizardDraft = {
  readonly childName: string;
  readonly childNickname: string;
  readonly childAge: number;
  readonly childAvatar: string;
  readonly childThemeColor: string;
  readonly habits: readonly StarterHabitChoice[];
  readonly rewards: readonly RewardChoice[];
  readonly hasConsent: boolean;
};

/** Store data for a wizard opened by a family that may already have children and rewards. */
export type InitialDraftOptions = {
  readonly language: Language;
  readonly hasChildren: boolean;
  readonly existingRewardTitles: readonly string[];
};

export function createInitialDraft(options?: InitialDraftOptions): WizardDraft {
  return {
    childName: '',
    childNickname: '',
    childAge: 5,
    childAvatar: 'mascot:leo',
    childThemeColor: '#F59E0B',
    habits: initialHabitSelection(5),
    rewards: initialRewardSelection(options),
    hasConsent: false,
  };
}

export function initialHabitSelection(age: number): StarterHabitChoice[] {
  const templates = generateAgeAdaptedHabits(null, getStageFromAge(age));
  const recommended = newHabitLimit(age);

  return templates.map((template, templateIndex) => ({
    templateIndex,
    selected: templateIndex < recommended,
    requiresApproval: template.requiresApproval,
  }));
}

const normalizeTitle = (title: string) => title.trim().toLocaleLowerCase();

export function initialRewardSelection(options?: InitialDraftOptions): RewardChoice[] {
  const titles = options ? getOnboardingWizardCopy(options.language).rewardTitles : null;
  const existingTitles = new Set(options?.existingRewardTitles.map(normalizeTitle));

  return ONBOARDING_REWARD_IDS.map((id, index) => {
    const template = MEANINGFUL_REWARD_TEMPLATES.find((reward) => reward.id === id);
    if (!template) throw new Error(`Missing onboarding reward template: ${id}`);

    const alreadyAdded = titles !== null && existingTitles.has(normalizeTitle(titles[id].title));
    const selected = index === 0 && !options?.hasChildren && !alreadyAdded;
    return { id, selected, costPoints: template.costPoints, alreadyAdded };
  });
}

export function withAge(draft: WizardDraft, age: number): WizardDraft {
  const sameStarterSet = getStageFromAge(age) === getStageFromAge(draft.childAge)
    && newHabitLimit(age) === newHabitLimit(draft.childAge);
  return { ...draft, childAge: age, habits: sameStarterSet ? draft.habits : initialHabitSelection(age) };
}

export function selectedStarterHabits(
  draft: WizardDraft,
): Array<{ templateIndex: number; requiresApproval: boolean }> {
  return draft.habits
    .filter((habit) => habit.selected)
    .map(({ templateIndex, requiresApproval }) => ({ templateIndex, requiresApproval }));
}

export function estimateDailyStars(draft: WizardDraft): number {
  const templates = generateAgeAdaptedHabits(null, getStageFromAge(draft.childAge));
  return selectedStarterHabits(draft).reduce(
    (total, habit) => total + (templates[habit.templateIndex]?.points ?? 0),
    0,
  );
}

export function daysToReward(costPoints: number, dailyStars: number): number | null {
  return dailyStars <= 0 ? null : Math.ceil(costPoints / dailyStars);
}

export function isValidRewardCost(cost: number): boolean {
  return Number.isInteger(cost) && cost > 0 && cost <= MAX_REWARD_COST;
}

export function firstInvalidRewardId(draft: WizardDraft): OnboardingRewardId | null {
  return draft.rewards.find((reward) => reward.selected && !isValidRewardCost(reward.costPoints))?.id ?? null;
}

export function isParentRoleStage(age: number): boolean {
  return getStageFromAge(age) === '0-3';
}

export function canAdvance(step: WizardStep, draft: WizardDraft): boolean {
  switch (step) {
    case 1:
      return draft.childName.trim().length > 0;
    case 2:
    case 5:
      return true;
    case 3:
      return firstInvalidRewardId(draft) === null;
    case 4:
      return draft.hasConsent;
  }
}
