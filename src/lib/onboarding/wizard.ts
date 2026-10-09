import { newHabitLimit } from '@/lib/habit-programs/config';
import { MEANINGFUL_REWARD_TEMPLATES } from '@/lib/reward-templates';
import { generateAgeAdaptedHabits, getStageFromAge } from '@/lib/wit-framework';

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

export type RewardChoice = {
  readonly id: OnboardingRewardId;
  readonly selected: boolean;
  readonly costPoints: number;
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

export function createInitialDraft(): WizardDraft {
  return {
    childName: '',
    childNickname: '',
    childAge: 5,
    childAvatar: 'mascot:leo',
    childThemeColor: '#F59E0B',
    habits: initialHabitSelection(5),
    rewards: initialRewardSelection(),
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

export function initialRewardSelection(): RewardChoice[] {
  return ONBOARDING_REWARD_IDS.map((id, index) => {
    const template = MEANINGFUL_REWARD_TEMPLATES.find((reward) => reward.id === id);
    if (!template) throw new Error(`Missing onboarding reward template: ${id}`);

    return { id, selected: index === 0, costPoints: template.costPoints };
  });
}

export function withAge(draft: WizardDraft, age: number): WizardDraft {
  return { ...draft, childAge: age, habits: initialHabitSelection(age) };
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
      return draft.rewards.every((reward) =>
        !reward.selected || (Number.isInteger(reward.costPoints) && reward.costPoints > 0),
      );
    case 4:
      return draft.hasConsent;
  }
}
