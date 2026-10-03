import { HABIT_PROGRAM_CONFIG, requiredCount } from './config';
import { addDays } from './opportunities';
import type { PhaseEvaluation } from './phase';
import type { Opportunity } from './types';

type ReadyInput = {
  readonly evaluation: PhaseEvaluation;
  readonly opportunities: readonly Opportunity[];
  readonly today: string;
  readonly alreadyGraduated: boolean;
};

/**
 * A habit is ready to be suggested for graduation when it has stayed settled for several weeks and the child did
 * it alone on nearly all of the recent chances. The app only suggests; the parent decides.
 */
export function isReadyToGraduate(input: ReadyInput): boolean {
  const config = HABIT_PROGRAM_CONFIG;
  const { evaluation } = input;
  if (input.alreadyGraduated || evaluation.phase !== 'maintain' || !evaluation.enteredOn) return false;
  if (input.today < addDays(evaluation.enteredOn, config.graduation.minWeeksSettled * 7)) return false;
  const recent = input.opportunities.slice(-evaluation.windowSize);
  if (recent.length < evaluation.windowSize) return false;
  const alone = recent.filter((entry) => entry.outcome === 'alone').length;
  return alone >= requiredCount(config.graduation.aloneRatio, evaluation.windowSize);
}

/** The day to ask again whether the child still does the habit alone after graduating. */
export function nextGraduationCheck(from: string): string {
  return addDays(from, HABIT_PROGRAM_CONFIG.graduation.recheckDays);
}

export function isGraduationCheckDue(checkDue: string | null | undefined, today: string): boolean {
  return Boolean(checkDue) && (checkDue as string) <= today;
}
