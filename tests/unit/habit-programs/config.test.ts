import { describe, expect, it } from 'vitest';
import { HABIT_PROGRAM_CONFIG, newHabitLimit, requiredCount } from '@/lib/habit-programs/config';

describe('habit program config', () => {
  it('turns ratios into whole-opportunity thresholds for both cadences', () => {
    const { windowSize, buildToFadeRatio, fadeToMaintainAloneRatio, maintainRegressBelowRatio } = HABIT_PROGRAM_CONFIG;
    expect([buildToFadeRatio, fadeToMaintainAloneRatio, maintainRegressBelowRatio].map((ratio) => requiredCount(ratio, windowSize['due-day']))).toEqual([7, 8, 6]);
    expect([buildToFadeRatio, fadeToMaintainAloneRatio, maintainRegressBelowRatio].map((ratio) => requiredCount(ratio, windowSize.weekly))).toEqual([5, 5, 4]);
  });

  it('caps new habits by age', () => {
    expect([0, 2.9, 3, 5.9, 6, 14.9, 15, 18].map(newHabitLimit)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });
});
