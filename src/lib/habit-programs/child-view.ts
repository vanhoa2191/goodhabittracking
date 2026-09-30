import type { CuePlan } from '@/lib/experience-state';
import type { ChildProfile } from '@/types';
import type { HabitPhase } from './types';
import { selectSupportPromptItems } from './parent-ui-state';

const SELF_REPORT_AGE = 15;

/** From 15 years old a child can say how they did a habit. The age stage alone is not enough to decide. */
export function childMaySelfReport(child: Pick<ChildProfile, 'age' | 'birthYear' | 'ageStage'>, today: string): boolean {
  if (child.age !== undefined) return child.age >= SELF_REPORT_AGE;
  if (child.birthYear !== undefined) return Number(today.slice(0, 4)) - child.birthYear >= SELF_REPORT_AGE;
  return false;
}

type CueLineInput = Pick<CuePlan, 'cue_kind' | 'cue_text' | 'cue_time' | 'place_text' | 'weekend_variant_text'>;

/** The cue in the family's own words, with the time and place when they were set. */
export function cueLineFor(plan: CueLineInput | undefined, isWeekend: boolean): string | null {
  if (!plan) return null;
  const text = isWeekend && plan.weekend_variant_text ? plan.weekend_variant_text : plan.cue_text;
  const parts = [text];
  if (plan.cue_kind === 'time' && plan.cue_time) parts.push(plan.cue_time.slice(0, 5));
  if (plan.place_text) parts.push(plan.place_text);
  return parts.join(' · ');
}

function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function dayNumber(day: string): number {
  const [year, month, date] = day.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, date) / 86_400_000);
}

/**
 * One kind sentence for a habit that has become steady. The sentence changes every day and never repeats
 * the one from the day before, so it stays a small surprise instead of a fixed slogan.
 */
export function pickAcknowledgement(
  childId: string,
  habitId: string,
  day: string,
  phase: HabitPhase,
  lines: readonly string[],
): string | null {
  if (phase !== 'maintain' || lines.length === 0) return null;
  if (lines.length === 1) return lines[0];
  const offset = hash(`${childId}:${habitId}`) % lines.length;
  return lines[(offset + dayNumber(day)) % lines.length];
}

/** Whether a local day (YYYY-MM-DD) is a Saturday or Sunday, independent of today's date. */
export function isWeekendDay(day: string): boolean {
  const [year, month, date] = day.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, date)).getUTCDay();
  return weekday === 0 || weekday === 6;
}

type ChildPromptLog = Parameters<typeof selectSupportPromptItems>[0][number] & { readonly completedAt: string };

/**
 * The one finished habit a child is asked about: the answer just given while it is confirmed, otherwise the
 * habit finished last. Skipped ones are set aside before the list is capped, so they never hide the rest.
 */
export function pickChildPromptLog<T extends ChildPromptLog>(
  logs: readonly T[],
  context: Parameters<typeof selectSupportPromptItems>[1],
  skipped: ReadonlySet<string>,
): T | null {
  const open = logs.filter((log) => context.saved.has(log.id) || !skipped.has(log.id));
  const items = selectSupportPromptItems(open, context);
  const confirmed = items.find((log) => context.saved.has(log.id));
  if (confirmed) return confirmed;
  return [...items].sort((left, right) => right.completedAt.localeCompare(left.completedAt))[0] ?? null;
}
