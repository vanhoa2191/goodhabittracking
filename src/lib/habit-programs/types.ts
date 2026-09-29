export type SupportLevel = 'alone' | 'prompted' | 'together';

export type HabitPhase = 'anchor' | 'build' | 'fade' | 'maintain';

export type ComplexityClass = 'simple' | 'medium' | 'complex';

/** `due-day` habits get one opportunity on every day they are due; `weekly` habits get one per calendar week. */
export type Cadence = 'due-day' | 'weekly';

export type OpportunityOutcome = SupportLevel | 'unknown' | 'missed';

export type Opportunity = {
  readonly date: string;
  readonly outcome: OpportunityOutcome;
};
