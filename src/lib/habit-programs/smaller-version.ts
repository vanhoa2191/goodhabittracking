import { z } from 'zod';
import smallerData from '@/data/habit-smaller-versions.json';
import type { HabitActivity, Language } from '@/types';

const text = z.object({ title: z.string().min(1).max(60), description: z.string().min(1).max(140) }).strict();
const dataSchema = z.object({
  contentVersion: z.string(),
  habits: z.record(z.string().regex(/^GD[1-5]-(NT|SK|MQH|HT|TC)-\d{2}$/), z.object({
    vi: text,
    en: text,
    minutes: z.number().int().min(1).max(5),
  }).strict()),
}).strict();

const SMALLER = dataSchema.parse(smallerData);

export type SmallerVersion = { readonly title: string; readonly description: string; readonly minutes: number };

/** The two-minute version of a framework habit, in Vietnamese or English (other languages read English). */
export function smallerVersionFor(frameworkHabitId: string | undefined, language: Language): SmallerVersion | null {
  const entry = frameworkHabitId ? SMALLER.habits[frameworkHabitId] : undefined;
  if (!entry) return null;
  const chosen = language === 'vi' ? entry.vi : entry.en;
  return { title: chosen.title, description: chosen.description, minutes: entry.minutes };
}

/** The changes that make an activity its small version. The adult note goes in the instructions, the child sees the short title. */
export function toSmallerChanges(version: SmallerVersion): Partial<HabitActivity> {
  return { title: version.title, instructions: version.description, durationMinutes: version.minutes };
}

type RevertInput = {
  readonly kind: string;
  readonly previous_values?: Readonly<Record<string, unknown>> | null;
};

/**
 * The changes that put a task back to what it was before a try, limited to the fields that still hold what the try
 * set: anything the family edited after that is left alone. Null when there is nothing to put back.
 */
export function revertChanges(activity: HabitActivity, entry: RevertInput, smaller: SmallerVersion | null): Partial<HabitActivity> | null {
  const previous = entry.previous_values;
  if (!previous) return null;
  const changes: Partial<HabitActivity> = {};
  if (entry.kind === 'smaller' && smaller) {
    if (activity.title === smaller.title && typeof previous.title === 'string') changes.title = previous.title;
    if ((activity.instructions ?? '') === smaller.description && (typeof previous.instructions === 'string' || previous.instructions === null)) {
      changes.instructions = (previous.instructions as string | null) ?? '';
    }
    if ((activity.durationMinutes ?? 0) === smaller.minutes && typeof previous.durationMinutes === 'number') changes.durationMinutes = previous.durationMinutes;
  }
  if (entry.kind === 'retime' && typeof previous.timeOfDay === 'string' && ['morning', 'afternoon', 'evening', 'anytime'].includes(previous.timeOfDay)) {
    changes.timeOfDay = previous.timeOfDay as HabitActivity['timeOfDay'];
  }
  return Object.keys(changes).length > 0 ? changes : null;
}

export const SMALLER_HABIT_IDS: readonly string[] = Object.keys(SMALLER.habits);
