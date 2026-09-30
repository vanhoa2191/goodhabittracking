import { describe, expect, it } from 'vitest';
import { HABIT_FRAMEWORK_CATALOG } from '@/lib/habit-framework/catalog';
import { HABIT_PROGRAMS, defaultStartHabitIds, programsForAge, startCueDefaults } from '@/lib/habit-programs/programs';

const catalogById = new Map(HABIT_FRAMEWORK_CATALOG.map((habit) => [habit.id, habit]));

describe('the habit programs', () => {
  it('are the twenty reviewed sets, each of three habits from one age stage', () => {
    expect(HABIT_PROGRAMS).toHaveLength(20);
    expect(new Set(HABIT_PROGRAMS.map((program) => program.id)).size).toBe(20);
    for (const program of HABIT_PROGRAMS) {
      expect(program.habitIds, program.id).toHaveLength(3);
      expect(new Set(program.habitIds).size, program.id).toBe(3);
      for (const habitId of program.habitIds) expect(catalogById.get(habitId)?.stageId, `${program.id} ${habitId}`).toBe(program.stageId);
    }
  });

  it('do not promise results in their names', () => {
    for (const program of HABIT_PROGRAMS) expect(program.name, program.id).not.toMatch(/đảm bảo|chắc chắn|cam kết|100%|thần tốc/i);
  });
});

describe('which programs a child is offered', () => {
  it('follows the child\'s age stage', () => {
    expect(programsForAge(2).map((program) => program.id)).toEqual(['P1-A', 'P1-B']);
    expect(programsForAge(4).map((program) => program.id)).toEqual(['P2-A', 'P2-B', 'P2-C']);
    expect(programsForAge(9)).toHaveLength(5);
    expect(programsForAge(13).every((program) => program.stageId === 'GD4')).toBe(true);
    expect(programsForAge(16).every((program) => program.stageId === 'GD5')).toBe(true);
  });
});

describe('where to start', () => {
  const program = HABIT_PROGRAMS.find((candidate) => candidate.id === 'P3-B')!;

  it('starts with the first one or two habits of the set, never more than the child\'s limit of new habits', () => {
    expect(defaultStartHabitIds(program, 9)).toEqual(program.habitIds.slice(0, 2));
    const infant = HABIT_PROGRAMS.find((candidate) => candidate.id === 'P1-A')!;
    expect(defaultStartHabitIds(infant, 2)).toEqual(infant.habitIds.slice(0, 1));
  });

  it('leaves out habits the child already has in use', () => {
    expect(defaultStartHabitIds(program, 9, new Set([program.habitIds[0]]))).toEqual(program.habitIds.slice(1, 3));
    expect(defaultStartHabitIds(program, 9, new Set(program.habitIds))).toEqual([]);
  });
});

describe('the plan a parent confirms', () => {
  it('turns a filled-in cue into the input the store saves, for an event or a fixed time', () => {
    expect(startCueDefaults('After brushing teeth, I do it')).toEqual({
      cueKind: 'event', cueText: 'After brushing teeth, I do it', cueTime: null, placeText: null, weekendVariantText: null,
    });
  });
});
