import { HABIT_PROGRAM_CONFIG, requiredCount } from './config';
import type { Cadence, HabitPhase, Opportunity } from './types';

export type PhaseInput = {
  /** Oldest first, as produced by buildOpportunities. */
  readonly opportunities: readonly Opportunity[];
  /** A saved "if this, then that" plan means the cue has been anchored. */
  readonly hasCuePlan: boolean;
  readonly cadence: Cadence;
};

export type PhaseEvaluation = {
  readonly phase: HabitPhase;
  readonly windowSize: number;
  /** Opportunities seen since the current phase began. */
  readonly opportunitiesInPhase: number;
  /** Day the current phase began, or null while the cue is still being anchored. */
  readonly enteredOn: string | null;
  readonly completedInWindow: number;
  readonly aloneInWindow: number;
  readonly promptedInWindow: number;
  readonly unknownInWindow: number;
  readonly missedInLastFive: number;
  readonly consecutiveMissed: number;
};

const isCompleted = (entry: Opportunity) => entry.outcome !== 'missed';
const count = (entries: readonly Opportunity[], test: (entry: Opportunity) => boolean) => entries.filter(test).length;

/**
 * Replays the opportunities in order so the phase depends only on what the child did.
 * A single miss never changes the phase on its own; only the share of recent opportunities does.
 */
export function evaluateHabitPhase(input: PhaseInput): PhaseEvaluation {
  const config = HABIT_PROGRAM_CONFIG;
  const windowSize = config.windowSize[input.cadence];
  const { opportunities } = input;

  let phase: HabitPhase = 'anchor';
  let enteredOn: string | null = null;
  let inPhase = 0;

  if (input.hasCuePlan) {
    let attempts = 0;
    let index = 0;
    for (; index < opportunities.length; index += 1) {
      if (isCompleted(opportunities[index])) attempts += 1;
      if (attempts >= config.minAttemptsToBuild) break;
    }
    if (attempts >= config.minAttemptsToBuild) {
      phase = 'build';
      enteredOn = opportunities[index].date;
      for (let step = index + 1; step < opportunities.length; step += 1) {
        inPhase += 1;
        const window = opportunities.slice(Math.max(0, step + 1 - windowSize), step + 1);
        const next = nextPhase(phase, window, inPhase, windowSize);
        if (next !== phase) {
          phase = next;
          enteredOn = opportunities[step].date;
          inPhase = 0;
        }
      }
    }
  }

  const window = opportunities.slice(-windowSize);
  const lastFive = opportunities.slice(-config.recentWindowForStepBack);
  let consecutiveMissed = 0;
  for (let step = opportunities.length - 1; step >= 0 && !isCompleted(opportunities[step]); step -= 1) consecutiveMissed += 1;

  return {
    phase,
    windowSize,
    opportunitiesInPhase: inPhase,
    enteredOn,
    completedInWindow: count(window, isCompleted),
    aloneInWindow: count(window, (entry) => entry.outcome === 'alone'),
    promptedInWindow: count(window, (entry) => entry.outcome === 'prompted'),
    unknownInWindow: count(window, (entry) => entry.outcome === 'unknown'),
    missedInLastFive: count(lastFive, (entry) => entry.outcome === 'missed'),
    consecutiveMissed,
  };
}

function nextPhase(
  phase: HabitPhase,
  window: readonly Opportunity[],
  inPhase: number,
  windowSize: number,
): HabitPhase {
  const config = HABIT_PROGRAM_CONFIG;
  const completed = count(window, isCompleted);
  const alone = count(window, (entry) => entry.outcome === 'alone');
  if (phase === 'build' && inPhase >= windowSize && completed >= requiredCount(config.buildToFadeRatio, windowSize)) return 'fade';
  if (phase === 'fade' && inPhase >= windowSize && alone >= requiredCount(config.fadeToMaintainAloneRatio, windowSize)) return 'maintain';
  if (phase === 'maintain' && completed < requiredCount(config.maintainRegressBelowRatio, windowSize)) return 'fade';
  return phase;
}
