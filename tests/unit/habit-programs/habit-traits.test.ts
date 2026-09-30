import { describe, expect, it } from 'vitest';
import { HABIT_FRAMEWORK_CATALOG } from '@/lib/habit-framework/catalog';
import { DEFAULT_HABIT_TRAITS, FRAMEWORK_HABIT_TRAITS, habitTraits } from '@/lib/habit-programs/habit-traits';

describe('habit traits', () => {
  it('classifies every framework habit and nothing else', () => {
    expect(Object.keys(FRAMEWORK_HABIT_TRAITS).sort()).toEqual(HABIT_FRAMEWORK_CATALOG.map((habit) => habit.id).sort());
  });

  it('follows the reviewed draft for a few known habits', () => {
    expect(habitTraits('GD1-SK-02')).toEqual({ complexity: 'simple', cadence: 'due-day' });
    expect(habitTraits('GD3-TC-01')).toEqual({ complexity: 'medium', cadence: 'weekly' });
    expect(habitTraits('GD5-NT-02')).toEqual({ complexity: 'complex', cadence: 'weekly' });
  });

  it('treats the family\'s own habits as medium and unknown ids the same way', () => {
    expect(habitTraits(undefined)).toBe(DEFAULT_HABIT_TRAITS);
    expect(habitTraits('not-a-framework-id')).toBe(DEFAULT_HABIT_TRAITS);
    expect(DEFAULT_HABIT_TRAITS).toEqual({ complexity: 'medium', cadence: 'due-day' });
  });
});
