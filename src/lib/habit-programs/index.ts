export { HABIT_PROGRAM_CONFIG, newHabitLimit, requiredCount } from './config';
export { addDays, buildOpportunities, isActivityDueOn, weekStart } from './opportunities';
export type { DeferralRow, OpportunityInput } from './opportunities';
export { evaluateHabitPhase } from './phase';
export type { PhaseEvaluation, PhaseInput } from './phase';
export { overloadSuggestion, stuckThresholdWeeks, suggestAdjustments } from './suggestions';
export type { Suggestion, SuggestionCode, SuggestionInput } from './suggestions';
export type { Cadence, ComplexityClass, HabitPhase, Opportunity, OpportunityOutcome, SupportLevel } from './types';
