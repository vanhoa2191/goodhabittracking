import { requiredCount } from './config';
import type { PhaseEvaluation } from './phase';
import type { SuggestionCode } from './suggestions';

/** Neutral words for where a habit stands. None of them says the child is doing well or badly. */
export type HabitStatus = 'not-started' | 'forming' | 'needs-help' | 'steady';

const HELP_CODES: ReadonlySet<SuggestionCode> = new Set(['stuck-building', 'check-in', 'step-back', 'prompt-reliance']);
const STEADY_RATIO = 0.7;

type StatusInput = {
  /** False when the habit has no cue plan yet, so it has no phase to read. */
  readonly hasCuePlan: boolean;
  readonly evaluation: PhaseEvaluation | null;
  readonly suggestionCodes: readonly SuggestionCode[];
};

export function habitStatus(input: StatusInput): HabitStatus {
  if (!input.hasCuePlan || !input.evaluation) return 'not-started';
  if (input.suggestionCodes.some((code) => HELP_CODES.has(code))) return 'needs-help';
  const { phase, windowSize, completedInWindow } = input.evaluation;
  if ((phase === 'fade' || phase === 'maintain') && completedInWindow >= requiredCount(STEADY_RATIO, windowSize)) return 'steady';
  return 'forming';
}
