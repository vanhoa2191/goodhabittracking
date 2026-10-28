import { describe, expect, it } from 'vitest';
import { getOnboardingWizardCopy } from '@/lib/i18n/onboarding-wizard-copy';
import { generateAgeAdaptedHabits, getStageFromAge } from '@/lib/wit-framework';
import { getTemplatesForSet } from '@/lib/daily-living-habits';
import {
  MAX_REWARD_COST,
  ONBOARDING_REWARD_IDS,
  canAdvance,
  createInitialDraft,
  daysToReward,
  estimateDailyStars,
  firstInvalidRewardId,
  initialDailyHabitSelection,
  initialHabitSelection,
  initialRewardSelection,
  isParentRoleStage,
  isValidRewardCost,
  selectedDailyStarterHabits,
  selectedStarterHabits,
  withAge,
} from '@/lib/onboarding/wizard';
import type { StarterHabitChoice, AgeStarterHabitChoice, DailyStarterHabitChoice } from '@/lib/onboarding/wizard';

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
      expect(habits.filter((habit) => habit.selected).map((habit) => (habit as StarterHabitChoice & { source: 'age' }).templateIndex))
        .toEqual(Array.from({ length: recommended }, (_, index) => index));
      expect(habits.map((habit) => (habit as StarterHabitChoice & { source: 'age' }).templateIndex)).toEqual([0, 1, 2, 3, 4, 5]);
      expect(habits.map((habit) => habit.requiresApproval))
        .toEqual(templates.map((template) => template.requiresApproval));
      expect(habits.every((h) => h.source === 'age')).toBe(true);
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

  it('keeps the habit choices when the age stays in the same stage and limit (7 -> 8)', () => {
    const at7 = withAge(createInitialDraft(), 7);
    const draft = {
      ...at7,
      habits: at7.habits.map((habit) => ({ ...habit, selected: (habit as StarterHabitChoice & { source: 'age' }).templateIndex === 5, requiresApproval: !habit.requiresApproval })),
    };

    expect(withAge(draft, 8)).toEqual({ ...draft, childAge: 8 });
  });

  it.each([
    [5, 6, 'the recommended limit changes'],
    [6, 7, 'the age stage changes'],
  ])('resets the habit choices from age %i to %i because %s', (from, to) => {
    const atFrom = withAge(createInitialDraft(), from);
    const draft = { ...atFrom, habits: atFrom.habits.map((habit) => ({ ...habit, selected: false })) };

    expect(withAge(draft, to).habits).toEqual(initialHabitSelection(to));
  });

  it('offers rewards in the onboarding order with only the first selected', () => {
    const rewards = initialRewardSelection();

    expect(ONBOARDING_REWARD_IDS).toEqual([
      'experience-bedtime-story', 'experience-meal-choice', 'experience-parent-time',
    ]);
    expect(rewards.map((reward) => reward.id)).toEqual(ONBOARDING_REWARD_IDS);
    expect(rewards.map((reward) => reward.costPoints)).toEqual([25, 35, 40]);
    expect(rewards.map((reward) => reward.selected)).toEqual([true, false, false]);
    expect(rewards.map((reward) => reward.alreadyAdded)).toEqual([false, false, false]);
  });

  it('preselects no reward when the family already has children', () => {
    const draft = createInitialDraft({ language: 'en', hasChildren: true, existingRewardTitles: [] });

    expect(draft.rewards.map((reward) => reward.selected)).toEqual([false, false, false]);
    expect(draft.rewards.map((reward) => reward.alreadyAdded)).toEqual([false, false, false]);
  });

  it('marks rewards whose localized title already exists as added and unselected', () => {
    const titles = getOnboardingWizardCopy('en').rewardTitles;
    const draft = createInitialDraft({
      language: 'en',
      hasChildren: false,
      existingRewardTitles: [
        `  ${titles['experience-bedtime-story'].title.toUpperCase()} `,
        titles['experience-parent-time'].title,
        getOnboardingWizardCopy('vi').rewardTitles['experience-meal-choice'].title,
      ],
    });

    expect(draft.rewards.map((reward) => reward.alreadyAdded)).toEqual([true, false, true]);
    expect(draft.rewards.map((reward) => reward.selected)).toEqual([false, false, false]);
  });

  it('keeps the first reward preselected for a new family without matching rewards', () => {
    const draft = createInitialDraft({ language: 'vi', hasChildren: false, existingRewardTitles: ['Đi công viên'] });

    expect(draft.rewards).toEqual(initialRewardSelection());
  });

  it('returns only chosen habit indexes with their approval overrides', () => {
    const draft = createInitialDraft();
    expect(selectedStarterHabits({
      ...draft,
      habits: [
        { source: 'age' as const, templateIndex: 3, selected: true, requiresApproval: false },
        { source: 'age' as const, templateIndex: 2, selected: false, requiresApproval: true },
        { source: 'age' as const, templateIndex: 0, selected: true, requiresApproval: true },
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
      selected: (habit as StarterHabitChoice & { source: 'age' }).templateIndex === 1 || (habit as StarterHabitChoice & { source: 'age' }).templateIndex === 4,
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

  it.each([[1, true], [MAX_REWARD_COST, true], [MAX_REWARD_COST + 1, false], [0, false], [2.5, false]])(
    'validates reward cost %s',
    (cost, expected) => expect(isValidRewardCost(cost)).toBe(expected),
  );

  it.each([[1_000_000, true], [1_000_001, false]])('allows selected reward cost %i on step 3: %s', (costPoints, expected) => {
    const draft = createInitialDraft();
    expect(MAX_REWARD_COST).toBe(1_000_000);
    expect(canAdvance(3, {
      ...draft,
      rewards: draft.rewards.map((reward) => (reward.selected ? { ...reward, costPoints } : reward)),
    })).toBe(expected);
  });

  it('finds the first selected reward with an invalid cost', () => {
    const draft = createInitialDraft();
    expect(firstInvalidRewardId(draft)).toBeNull();
    expect(firstInvalidRewardId({
      ...draft,
      rewards: draft.rewards.map((reward, index) => ({
        ...reward,
        selected: index > 0,
        costPoints: index === 0 ? 0 : MAX_REWARD_COST + 1,
      })),
    })).toBe('experience-meal-choice');
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

describe('daily living habits integration', () => {
  it('initialDailyHabitSelection creates DLS-01 habits with correct defaults', () => {
    const habits = initialDailyHabitSelection(5);
    const templates = getTemplatesForSet('DLS-01');
    const recommended = 2; // newHabitLimit(5) = 2

    expect(habits).toHaveLength(templates.length);
    expect(habits.every((h) => h.source === 'daily')).toBe(true);
    expect(habits.map((h) => (h as DailyStarterHabitChoice).templateId)).toEqual(templates.map((t) => t.id));
    expect(habits.map((h) => h.requiresApproval)).toEqual(templates.map(() => false));
    expect(habits.filter((h) => h.selected).length).toBe(recommended);
    expect(habits.filter((h) => h.selected).map((h) => (h as DailyStarterHabitChoice).templateId))
      .toEqual(templates.slice(0, recommended).map((t) => t.id));
  });

  it('initialDailyHabitSelection respects newHabitLimit for different ages', () => {
    const habitsAge2 = initialDailyHabitSelection(2); // limit 1
    const habitsAge4 = initialDailyHabitSelection(4); // limit 2
    const habitsAge8 = initialDailyHabitSelection(8); // limit 3 (but DLS-01 only has 2 items)

    expect(habitsAge2.filter((h) => h.selected).length).toBe(1);
    expect(habitsAge4.filter((h) => h.selected).length).toBe(2);
    expect(habitsAge8.filter((h) => h.selected).length).toBe(2); // capped by DLS-01 size
  });

  it('selectedDailyStarterHabits returns only selected daily habits with templateId', () => {
    const draft = createInitialDraft();
    const dailyHabits = initialDailyHabitSelection(5);
    const mixedHabits = [...draft.habits, ...dailyHabits.map((h, _i) => ({ ...h, selected: _i === 0 }))];

    const result = selectedDailyStarterHabits({ ...draft, habits: mixedHabits });

    expect(result).toHaveLength(1);
    expect(result[0].templateId).toBe('WIT-DLY-01');
    expect(result[0].requiresApproval).toBe(false);
  });

  it('selectedStarterHabits ignores daily habits and returns only age habits', () => {
    const draft = createInitialDraft();
    const dailyHabits = initialDailyHabitSelection(5).map((h) => ({ ...h, selected: true }));
    const mixedHabits = [...draft.habits, ...dailyHabits];

    const result = selectedStarterHabits({ ...draft, habits: mixedHabits });

    // Should only return selected age habits (first 2 by default for age 5)
    expect(result.length).toBe(2);
    expect(result.every((r) => 'templateIndex' in r)).toBe(true);
    expect(result.every((r) => !('templateId' in r))).toBe(true);
  });

  it('estimateDailyStars works with both age and daily habits', () => {
    const draft = createInitialDraft();
    const dailyHabits = initialDailyHabitSelection(5).map((h, i) => ({ ...h, selected: i < 2 }));
    const mixedHabits = [...draft.habits.slice(0, 2).map((h) => ({ ...h, selected: true })), ...dailyHabits];

    const stars = estimateDailyStars({ ...draft, habits: mixedHabits });

    // Age habits: first 2 selected, Daily habits: first 2 selected
    // All daily habits have 5 points, age habits vary
    expect(stars).toBeGreaterThan(0);
  });

  it('withAge preserves daily habits when switching age within same stage/limit', () => {
    const draft = createInitialDraft();
    const dailyHabits = initialDailyHabitSelection(5);
    const mixedHabits = [...draft.habits, ...dailyHabits];

    const result = withAge({ ...draft, habits: mixedHabits }, 4); // same stage (3-6), same limit (2)

    expect(result.habits).toEqual(mixedHabits);
  });

  it('withAge resets age habits but preserves daily habits when stage/limit changes', () => {
    const draft = createInitialDraft();
    const dailyHabits = initialDailyHabitSelection(5).map((h) => ({ ...h, selected: true }));
    const mixedHabits = [...draft.habits, ...dailyHabits];

    const result = withAge({ ...draft, habits: mixedHabits }, 8); // different stage (3-6 -> 6-12), different limit (2 -> 3)

    // Age habits should be reset, daily habits preserved
    const ageHabits = result.habits.filter((h): h is AgeStarterHabitChoice => h.source === 'age');
    const preservedDailyHabits = result.habits.filter((h): h is DailyStarterHabitChoice => h.source === 'daily');

    expect(ageHabits).toEqual(initialHabitSelection(8));
    expect(preservedDailyHabits).toEqual(dailyHabits);
  });
});
