import type { ExperienceState, FamilyPausePeriod } from '@/lib/experience-state';
import { supportLevelsByLogId } from '@/lib/experience-state';
import { localDayKey } from '@/lib/habit-fire';
import type { ActivityLog, ChildProfile, HabitActivity } from '@/types';
import { habitTraits } from './habit-traits';
import { buildOpportunities, weekStart } from './opportunities';
import { evaluateHabitPhase } from './phase';
import type { PhaseEvaluation } from './phase';
import { overloadSuggestion, rankChildSuggestions, suggestAdjustments } from './suggestions';
import type { HabitSuggestion, Suggestion } from './suggestions';
import type { Cadence, ComplexityClass } from './types';

export type HabitSummary = {
  readonly activityId: string;
  readonly title: string;
  readonly complexity: ComplexityClass;
  readonly cadence: Cadence;
  /** First day that counts for this habit: the day its cue plan was made. */
  readonly since: string;
  readonly evaluation: PhaseEvaluation;
  readonly suggestions: readonly Suggestion[];
};

export type ChildHabitSummary = {
  readonly ageYears: number;
  readonly habits: readonly HabitSummary[];
  /** The few suggestions worth showing for this child, most urgent first. */
  readonly suggestions: readonly HabitSuggestion[];
};

export type SummaryInput = {
  readonly child: Pick<ChildProfile, 'id' | 'age' | 'birthYear' | 'ageStage'>;
  readonly activities: readonly HabitActivity[];
  readonly logs: readonly ActivityLog[];
  readonly experience: ExperienceState;
  /** Family pauses: the cloud settings on a parent device, the paired copy on a child device. */
  readonly pausePeriods: readonly FamilyPausePeriod[];
  /** Today's local day, YYYY-MM-DD. */
  readonly today: string;
};

const STAGE_AGE_YEARS: Readonly<Record<NonNullable<ChildProfile['ageStage']>, number>> = {
  '0-3': 2,
  '3-6': 4,
  '6-12': 9,
  '12-18': 15,
};
const UNKNOWN_AGE_YEARS = 9;

export function childAgeYears(
  child: Pick<ChildProfile, 'age' | 'birthYear' | 'ageStage'>,
  today: string,
): number {
  if (child.age !== undefined) return child.age;
  if (child.birthYear !== undefined) return Math.max(0, Number(today.slice(0, 4)) - child.birthYear);
  return child.ageStage ? STAGE_AGE_YEARS[child.ageStage] : UNKNOWN_AGE_YEARS;
}

/**
 * Where each of a child's planned habits stands and what to suggest.
 * Only habits with a cue plan take part: making the plan is what starts the habit's journey.
 */
export function summarizeChildHabits(input: SummaryInput): ChildHabitSummary {
  const { child, experience, pausePeriods, today } = input;
  const ageYears = childAgeYears(child, today);
  const supportByLogId = supportLevelsByLogId(experience, child.id);

  const plans = experience.cuePlans
    .filter((plan) => plan.child_id === child.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const habits: HabitSummary[] = [];
  for (const plan of plans) {
    const activity = input.activities.find((candidate) => candidate.id === plan.activity_id);
    if (!activity?.isActive || (activity.childId !== null && activity.childId !== child.id)) continue;

    const traits = habitTraits(activity.frameworkHabitId);
    const since = localDayKey(new Date(plan.created_at));
    const opportunities = buildOpportunities({
      activityId: activity.id,
      childId: child.id,
      recurrence: activity,
      cadence: traits.cadence,
      since,
      today,
      logs: input.logs,
      supportByLogId,
      deferrals: experience.deferredTasks,
      pausePeriods,
    }).filter((entry, index) => {
      // The day (or week, for weekly habits) a plan was made is never held against the child.
      const graceDate = traits.cadence === 'weekly' ? weekStart(since) : since;
      return !(index === 0 && entry.date === graceDate && entry.outcome === 'missed');
    });

    const evaluation = evaluateHabitPhase({ opportunities, hasCuePlan: true, cadence: traits.cadence });
    habits.push({
      activityId: activity.id,
      title: activity.title,
      complexity: traits.complexity,
      cadence: traits.cadence,
      since,
      evaluation,
      suggestions: suggestAdjustments({ evaluation, complexity: traits.complexity, ageYears, today }),
    });
  }

  const overload = overloadSuggestion(habits.map((habit) => habit.evaluation.phase), ageYears);
  const suggestions = rankChildSuggestions([
    ...habits.flatMap((habit) => habit.suggestions.map((suggestion) => ({ habitId: habit.activityId, suggestion }))),
    ...(overload ? [{ habitId: null, suggestion: overload }] : []),
  ]);
  return { ageYears, habits, suggestions };
}
