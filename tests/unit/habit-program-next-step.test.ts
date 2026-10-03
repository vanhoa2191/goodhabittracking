import { describe, expect, it } from 'vitest';
import { nextProgramStep } from '@/lib/habit-programs/next-step';
import type { HabitProgram } from '@/lib/habit-programs/programs';
import type { HabitPhase } from '@/lib/habit-programs/types';

const programA: HabitProgram = { id: 'P3-A', stageId: 'GD3', name: 'A', habitIds: ['h1', 'h2', 'h3'] };
const programB: HabitProgram = { id: 'P3-B', stageId: 'GD3', name: 'B', habitIds: ['h4', 'h5'] };

const input = (overrides: Partial<Parameters<typeof nextProgramStep>[0]> = {}) => ({
  programs: [programA, programB],
  inUse: new Set(['h1']),
  phaseByHabitId: new Map<string, HabitPhase>([['h1', 'fade']]),
  buildingCount: 1,
  limit: 3,
  ...overrides,
});

describe('nextProgramStep', () => {
  it('offers the next habit of a begun program once the habit begun is easing off', () => {
    expect(nextProgramStep(input())).toEqual({ program: programA, nextHabitId: 'h2' });
  });

  it('also offers it when the habit begun has settled', () => {
    expect(nextProgramStep(input({ phaseByHabitId: new Map<string, HabitPhase>([['h1', 'maintain']]) }))?.nextHabitId).toBe('h2');
  });

  it('waits while any habit begun is still being anchored or built', () => {
    expect(nextProgramStep(input({ phaseByHabitId: new Map<string, HabitPhase>([['h1', 'build']]) }))).toBeNull();
    expect(nextProgramStep(input({
      inUse: new Set(['h1', 'h2']),
      phaseByHabitId: new Map<string, HabitPhase>([['h1', 'maintain'], ['h2', 'anchor']]),
    }))).toBeNull();
  });

  it('waits for a habit that has no cue plan, so no phase', () => {
    expect(nextProgramStep(input({ phaseByHabitId: new Map() }))).toBeNull();
  });

  it('never goes over the limit of new habits', () => {
    expect(nextProgramStep(input({ buildingCount: 3, limit: 3 }))).toBeNull();
  });

  it('skips programs the child has not begun and programs already fully in use', () => {
    expect(nextProgramStep(input({ inUse: new Set(), phaseByHabitId: new Map() }))).toBeNull();
    expect(nextProgramStep(input({
      programs: [programB, programA],
      inUse: new Set(['h4', 'h5']),
      phaseByHabitId: new Map<string, HabitPhase>([['h4', 'maintain'], ['h5', 'maintain']]),
    }))).toBeNull();
  });

  it('takes the first remaining habit in program order', () => {
    const result = nextProgramStep(input({ inUse: new Set(['h1', 'h3']), phaseByHabitId: new Map<string, HabitPhase>([['h1', 'fade'], ['h3', 'fade']]) }));
    expect(result?.nextHabitId).toBe('h2');
  });
});
