import type { HabitProgram } from './programs';
import type { HabitPhase } from './types';

export type NextProgramStep = {
  readonly program: HabitProgram;
  /** The habit of the program the child does not have yet. */
  readonly nextHabitId: string;
};

type NextStepInput = {
  /** The programs offered for the child's age, in the order they are listed. */
  readonly programs: readonly HabitProgram[];
  /** Framework habit ids the child already has in use. */
  readonly inUse: ReadonlySet<string>;
  /** Current phase of the in-use framework habits that have a cue plan. A habit without a plan has no phase yet. */
  readonly phaseByHabitId: ReadonlyMap<string, HabitPhase>;
  /** Habits still being set up or built, and the age limit for that. */
  readonly buildingCount: number;
  readonly limit: number;
};

const EASING: ReadonlySet<HabitPhase> = new Set(['fade', 'maintain']);

/**
 * The next habit of a program a child has already begun, once every habit begun is easing off or settled and there is
 * room under the limit of new habits. A suggestion only: the parent adds it, or not.
 */
export function nextProgramStep(input: NextStepInput): NextProgramStep | null {
  if (input.buildingCount >= input.limit) return null;
  for (const program of input.programs) {
    const begun = program.habitIds.filter((habitId) => input.inUse.has(habitId));
    const remaining = program.habitIds.filter((habitId) => !input.inUse.has(habitId));
    const nextHabitId = remaining[0];
    if (begun.length === 0 || nextHabitId === undefined) continue;
    const phases = begun.map((habitId) => input.phaseByHabitId.get(habitId));
    if (phases.every((phase) => phase !== undefined && EASING.has(phase))) return { program, nextHabitId };
  }
  return null;
}
