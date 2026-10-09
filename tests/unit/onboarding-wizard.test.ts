import { describe, expect, it } from 'vitest';
import { generateAgeAdaptedHabits, getStageFromAge } from '@/lib/wit-framework';
import {
  ONBOARDING_REWARD_IDS,
  canAdvance,
  createInitialDraft,
  daysToReward,
  estimateDailyStars,
  initialHabitSelection,
  initialRewardSelection,
  isParentRoleStage,
  selectedStarterHabits,
  withAge,
} from '@/lib/onboarding/wizard';

describe('onboarding wizard', () => {
  it('starts with the child, habit, reward and consent defaults', () => {
    expect(createInitialDraft()).toEqual({
      childName: '',
      childNickname: '',
      childAge: 5,
      childAvatar: 'mascot:leo',
      childThemeColor: '#F59E0B',
      habits: initialHabitSelection(5),
      rewards: initialRewardSelection(),
      hasConsent: false,
    });
  });

  it.each([[2, 1], [4, 2], [8, 3], [16, 4]])(
    'selects the first recommended habits for age %i',
    (age, recommended) => {
      const habits = initialHabitSelection(age);
      const templates = generateAgeAdaptedHabits(null, getStageFromAge(age));

      expect(habits).toHaveLength(6);
      expect(habits.filter((habit) => habit.selected).map((habit) => habit.templateIndex))
        .toEqual(Array.from({ length: recommended }, (_, index) => index));
      expect(habits.map((habit) => habit.templateIndex)).toEqual([0, 1, 2, 3, 4, 5]);
      expect(habits.map((habit) => habit.requiresApproval))
        .toEqual(templates.map((template) => template.requiresApproval));
    },
  );

  it('resets unticked habits when the age changes without mutating the draft', () => {
    const initial = createInitialDraft();
    const draft = {
      ...initial,
      childName: 'An',
      habits: initial.habits.map((habit) => ({ ...habit, selected: false })),
    };

    expect(withAge(draft, 8)).toEqual({
      ...draft,
      childAge: 8,
      habits: initialHabitSelection(8),
    });
    expect(draft.childAge).toBe(5);
    expect(draft.habits.every((habit) => !habit.selected)).toBe(true);
  });

  it('offers rewards in the onboarding order with only the first selected', () => {
    const rewards = initialRewardSelection();

    expect(ONBOARDING_REWARD_IDS).toEqual([
      'experience-bedtime-story', 'experience-meal-choice', 'experience-parent-time',
    ]);
    expect(rewards.map((reward) => reward.id)).toEqual(ONBOARDING_REWARD_IDS);
    expect(rewards.map((reward) => reward.costPoints)).toEqual([25, 35, 40]);
    expect(rewards.map((reward) => reward.selected)).toEqual([true, false, false]);
  });

  it('returns only chosen habit indexes with their approval overrides', () => {
    const draft = createInitialDraft();
    expect(selectedStarterHabits({
      ...draft,
      habits: [
        { templateIndex: 3, selected: true, requiresApproval: false },
        { templateIndex: 2, selected: false, requiresApproval: true },
        { templateIndex: 0, selected: true, requiresApproval: true },
      ],
    })).toEqual([
      { templateIndex: 3, requiresApproval: false },
      { templateIndex: 0, requiresApproval: true },
    ]);
  });

  it('estimates zero stars when no habit is selected', () => {
    const draft = createInitialDraft();
    expect(estimateDailyStars({
      ...draft,
      habits: draft.habits.map((habit) => ({ ...habit, selected: false })),
    })).toBe(0);
  });

  it.each([2, 4, 8, 16])('estimates points from selected templates at age %i', (age) => {
    const draft = withAge(createInitialDraft(), age);
    const templates = generateAgeAdaptedHabits(null, getStageFromAge(age));
    const habits = draft.habits.map((habit) => ({
      ...habit,
      selected: habit.templateIndex === 1 || habit.templateIndex === 4,
    }));

    expect(estimateDailyStars({ ...draft, habits })).toBe(templates[1].points + templates[4].points);
  });

  it.each([[40, 0, null], [40, -5, null], [40, 30, 2], [30, 30, 1]])(
    'estimates days for %i points at %i stars per day',
    (cost, daily, expected) => expect(daysToReward(cost, daily)).toBe(expected),
  );

  it.each([[0, true], [2, true], [3, true], [4, false], [8, false], [16, false]])(
    'identifies the parent-role stage at age %i',
    (age, expected) => expect(isParentRoleStage(age)).toBe(expected),
  );

  it.each([['', false], ['   ', false], ['An', true]])(
    'requires a nonblank name on step 1 (%s)',
    (childName, expected) => {
      expect(canAdvance(1, { ...createInitialDraft(), childName })).toBe(expected);
    },
  );

  it('allows step 2 with no selected habits', () => {
    expect(canAdvance(2, { ...createInitialDraft(), habits: [] })).toBe(true);
  });

  it.each([0, -5, 2.5, NaN, Infinity])('rejects selected reward cost %s on step 3', (costPoints) => {
    const draft = createInitialDraft();
    expect(canAdvance(3, {
      ...draft,
      rewards: draft.rewards.map((reward, index) => ({
        ...reward,
        selected: true,
        costPoints: index === 1 ? costPoints : reward.costPoints,
      })),
    })).toBe(false);
  });

  it('ignores invalid unselected reward costs on step 3', () => {
    const draft = createInitialDraft();
    expect(canAdvance(3, {
      ...draft,
      rewards: draft.rewards.map((reward) => ({
        ...reward,
        costPoints: reward.selected ? reward.costPoints : NaN,
      })),
    })).toBe(true);
  });

  it('allows step 3 when no reward is selected', () => {
    const draft = createInitialDraft();
    expect(canAdvance(3, {
      ...draft,
      rewards: draft.rewards.map((reward) => ({ ...reward, selected: false, costPoints: 0 })),
    })).toBe(true);
  });

  it.each([false, true])('requires consent on step 4 (%s)', (hasConsent) => {
    expect(canAdvance(4, { ...createInitialDraft(), hasConsent })).toBe(hasConsent);
  });

  it('allows step 5', () => {
    expect(canAdvance(5, createInitialDraft())).toBe(true);
  });
});
