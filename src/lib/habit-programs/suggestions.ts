import { HABIT_PROGRAM_CONFIG, newHabitLimit, requiredCount } from './config';
import { addDays } from './opportunities';
import type { PhaseEvaluation } from './phase';
import type { ComplexityClass, HabitPhase } from './types';

export type SuggestionCode =
  | 'stuck-building' // stuck while building: make it smaller, change the cue or add a weekend plan
  | 'prompt-reliance' // relies on prompts while fading support: use a visual cue or let the child set the reminder
  | 'too-many-new' // too many new habits at once
  | 'routine-formed' // just became a routine: switch to verbal recognition
  | 'step-back' // slipping while fading: step back one level of support
  | 'check-in' // three misses in a row while building: check how it is being done
  | 'record-support'; // support level often not recorded: ask gently

export type Suggestion = {
  readonly code: SuggestionCode;
  /** Numbers the interface can quote in the reason, e.g. how many of the last opportunities. */
  readonly facts: Readonly<Record<string, number>>;
};

export type SuggestionInput = {
  readonly evaluation: PhaseEvaluation;
  readonly complexity: ComplexityClass;
  readonly ageYears: number;
  /** Today's local day, used to measure how long the habit has been in its phase. */
  readonly today: string;
};

/** Weeks in the build phase after which "stuck" is suggested; longer for children under 6. */
export function stuckThresholdWeeks(complexity: ComplexityClass, ageYears: number): number {
  const base = HABIT_PROGRAM_CONFIG.stuckWeeks[complexity];
  return ageYears < HABIT_PROGRAM_CONFIG.youngAgeYears ? Math.ceil(base * HABIT_PROGRAM_CONFIG.youngStuckMultiplier) : base;
}

function weeksBetween(from: string, to: string): number {
  let weeks = 0;
  while (addDays(from, (weeks + 1) * 7) <= to) weeks += 1;
  return weeks;
}

// Too many new habits comes first: it is the cause behind the individual worries the other suggestions raise.
const PRIORITY: readonly SuggestionCode[] = ['too-many-new', 'check-in', 'step-back', 'stuck-building', 'prompt-reliance', 'routine-formed', 'record-support'];

/** Per-habit suggestions, most useful first, capped at the display limit. */
export function suggestAdjustments(input: SuggestionInput): Suggestion[] {
  const config = HABIT_PROGRAM_CONFIG;
  const { evaluation, today } = input;
  const { phase, windowSize } = evaluation;
  const found: Suggestion[] = [];

  if (phase === 'build' && evaluation.consecutiveMissed >= config.consecutiveMissesForCheckIn) {
    found.push({ code: 'check-in', facts: { missedInARow: evaluation.consecutiveMissed } });
  }
  if (phase === 'fade' && evaluation.missedInLastFive >= config.stepBackMisses) {
    found.push({ code: 'step-back', facts: { missed: evaluation.missedInLastFive, of: config.recentWindowForStepBack } });
  }
  if (phase === 'build' && evaluation.enteredOn) {
    const weeks = weeksBetween(evaluation.enteredOn, today);
    const limit = stuckThresholdWeeks(input.complexity, input.ageYears);
    if (weeks >= limit) found.push({ code: 'stuck-building', facts: { weeks, limit } });
  }
  if (phase === 'fade' && evaluation.promptedInWindow >= requiredCount(config.promptedDependenceRatio, windowSize)) {
    found.push({ code: 'prompt-reliance', facts: { prompted: evaluation.promptedInWindow, of: windowSize } });
  }
  if (phase === 'maintain' && evaluation.opportunitiesInPhase < windowSize) {
    found.push({ code: 'routine-formed', facts: { alone: evaluation.aloneInWindow, of: windowSize } });
  }
  if (needsSupportRecords(evaluation)) {
    found.push({ code: 'record-support', facts: { unrecorded: evaluation.unknownInWindow, of: evaluation.completedInWindow } });
  }
  return found.sort((a, b) => PRIORITY.indexOf(a.code) - PRIORITY.indexOf(b.code)).slice(0, config.suggestionLimit);
}

/**
 * The support level is unrecorded for over half of the completed opportunities while the habit
 * is close to a phase change that would use it.
 */
function needsSupportRecords(evaluation: PhaseEvaluation): boolean {
  const config = HABIT_PROGRAM_CONFIG;
  const { phase, windowSize, completedInWindow, unknownInWindow, aloneInWindow } = evaluation;
  if (completedInWindow === 0 || unknownInWindow <= completedInWindow * config.missingSupportShare) return false;
  if (phase === 'build') return completedInWindow >= requiredCount(config.buildToFadeRatio, windowSize) - 1;
  if (phase === 'fade') return aloneInWindow + unknownInWindow >= requiredCount(config.fadeToMaintainAloneRatio, windowSize);
  return false;
}

/** too-many-new: more habits are still being set up or built than the child's age allows. */
export function overloadSuggestion(phases: readonly HabitPhase[], ageYears: number): Suggestion | null {
  const active = phases.filter((phase) => phase === 'anchor' || phase === 'build').length;
  const limit = newHabitLimit(ageYears);
  return active > limit ? { code: 'too-many-new', facts: { active, limit } } : null;
}

export type HabitSuggestion = {
  /** The habit the suggestion is about, or null when it concerns the child as a whole. */
  readonly habitId: string | null;
  readonly suggestion: Suggestion;
};

/** The suggestions to show for one child across all their habits: most urgent first, at most the display limit. */
export function rankChildSuggestions(entries: readonly HabitSuggestion[]): HabitSuggestion[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => PRIORITY.indexOf(a.entry.suggestion.code) - PRIORITY.indexOf(b.entry.suggestion.code) || a.index - b.index)
    .map(({ entry }) => entry)
    .slice(0, HABIT_PROGRAM_CONFIG.suggestionLimit);
}
