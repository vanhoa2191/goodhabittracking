import { describe, expect, it } from 'vitest';
import {
  HABIT_FRAMEWORK_CATALOG,
  HABIT_FRAMEWORK_STAGES,
  getFrameworkHabitsByStage,
} from '@/lib/habit-framework/catalog';

describe('habit framework catalog', () => {
  it('preserves the five source stages and all 47 unique habits', () => {
    // Given
    const expectedStageIds = ['GD1', 'GD2', 'GD3', 'GD4', 'GD5'];

    // When
    const habitIds = HABIT_FRAMEWORK_CATALOG.map((habit) => habit.id);

    // Then
    expect(HABIT_FRAMEWORK_STAGES.map((stage) => stage.id)).toEqual(expectedStageIds);
    expect(habitIds).toHaveLength(47);
    expect(new Set(habitIds).size).toBe(47);
  });

  it('keeps the source stage distribution intact', () => {
    // Given
    const expectedCounts = { GD1: 8, GD2: 9, GD3: 10, GD4: 10, GD5: 10 };

    // When
    const actualCounts = Object.fromEntries(
      HABIT_FRAMEWORK_STAGES.map((stage) => [stage.id, getFrameworkHabitsByStage(stage.id).length]),
    );

    // Then
    expect(actualCounts).toEqual(expectedCounts);
  });

  it('normalizes the personal-finance habit without losing its source id', () => {
    // Given
    const canonicalId = 'GD5-TC-01';

    // When
    const habit = HABIT_FRAMEWORK_CATALOG.find((candidate) => candidate.id === canonicalId);

    // Then
    expect(habit?.primaryDomain).toBe('TC');
    expect(habit?.sourceAliases).toContain('GD5-HT-02');
  });

  it('provides actionable content for every habit', () => {
    // Given / When
    const incomplete = HABIT_FRAMEWORK_CATALOG.filter((habit) =>
      habit.childMeaning.length === 0
      || habit.successSignal.length === 0
      || habit.activities.length === 0
      || habit.parentGuidance.length === 0
      || habit.measurement.length === 0,
    );

    // Then
    expect(incomplete).toEqual([]);
  });

  it('marks every published item as source-reconciled without overstating evidence', () => {
    // Given / When
    const releaseStatuses = new Set(
      HABIT_FRAMEWORK_CATALOG.map((habit) => `${habit.reviewStatus}:${habit.evidenceStatus}`),
    );

    // Then
    expect(releaseStatuses).toEqual(new Set(['source-reconciled:source-only']));
  });
});
