import { z } from 'zod';
import programData from '@/data/habit-programs-v1.vi.json';
import { getFrameworkStageIdFromAge } from '@/lib/habit-framework/catalog';
import type { FrameworkStageId } from '@/lib/habit-framework/catalog';
import { newHabitLimit } from './config';
import type { CuePlanInput } from './cue-plan-input';

const programSchema = z.object({
  id: z.string().regex(/^P[1-5]-[A-E]$/),
  stageId: z.enum(['GD1', 'GD2', 'GD3', 'GD4', 'GD5']),
  name: z.string().min(1),
  habitIds: z.array(z.string().regex(/^GD[1-5]-(NT|SK|MQH|HT|TC)-\d{2}$/)).min(2).max(3),
}).strict();

const programDataSchema = z.object({
  contentVersion: z.string(),
  programs: z.array(programSchema),
}).strict();

export type HabitProgram = z.infer<typeof programSchema> & { readonly stageId: FrameworkStageId };

export const HABIT_PROGRAMS: readonly HabitProgram[] = programDataSchema.parse(programData).programs;

/** Fewest habits to begin with: one or two, and never more than the child's limit of new habits. */
const MAX_DEFAULT_START = 2;

export function programsForAge(ageYears: number): readonly HabitProgram[] {
  const stageId = getFrameworkStageIdFromAge(ageYears);
  return HABIT_PROGRAMS.filter((program) => program.stageId === stageId);
}

/** The habits ticked when a parent starts a program: the first ones of the set that the child does not already have. */
export function defaultStartHabitIds(
  program: HabitProgram,
  ageYears: number,
  alreadyInUse: ReadonlySet<string> = new Set(),
): string[] {
  const count = Math.min(MAX_DEFAULT_START, newHabitLimit(ageYears));
  return program.habitIds.filter((habitId) => !alreadyInUse.has(habitId)).slice(0, count);
}

/** A cue written in the family's own words is an event cue until the parent picks a fixed time in the editor. */
export function startCueDefaults(cueText: string): CuePlanInput {
  return { cueKind: 'event', cueText, cueTime: null, placeText: null, weekendVariantText: null };
}
