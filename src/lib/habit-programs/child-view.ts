import type { CuePlan } from '@/lib/experience-state';
import type { ChildProfile } from '@/types';
import type { HabitPhase } from './types';

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
