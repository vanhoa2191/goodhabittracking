import { describe, expect, it } from 'vitest';
import { currentStarStep, nextLowerStarStep, restoreStarStep } from '@/lib/habit-programs/star-step';

describe('star steps', () => {
  it('offers half, then a fifth, of the first stars, and keeps the first value', () => {
    expect(nextLowerStarStep(20, null)).toEqual({ step: 50, points: 10, basePoints: 20 });
    expect(nextLowerStarStep(10, 20)).toEqual({ step: 20, points: 4, basePoints: 20 });
    expect(nextLowerStarStep(4, 20)).toBeNull();
  });

  it('never goes under one star and skips a step that would change nothing', () => {
    expect(nextLowerStarStep(1, null)).toBeNull();
    expect(nextLowerStarStep(2, null)).toEqual({ step: 50, points: 1, basePoints: 2 });
    expect(nextLowerStarStep(3, null)).toEqual({ step: 50, points: 2, basePoints: 3 });
    expect(nextLowerStarStep(2, 3)).toEqual({ step: 20, points: 1, basePoints: 3 });
  });

  it('reads the step from the stars now and the first stars', () => {
    expect(currentStarStep(20, null)).toBe(100);
    expect(currentStarStep(10, 20)).toBe(50);
    expect(currentStarStep(4, 20)).toBe(20);
    expect(currentStarStep(15, 20)).toBe(100);
  });

  it('restores the first stars only after a step down', () => {
    expect(restoreStarStep(10, 20)).toEqual({ step: 100, points: 20, basePoints: null });
    expect(restoreStarStep(20, null)).toBeNull();
    expect(restoreStarStep(20, 20)).toBeNull();
  });
});
