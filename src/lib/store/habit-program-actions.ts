import type { Dispatch, SetStateAction } from 'react';
import { z } from 'zod';
import { cuePlanInputSchema } from '@/lib/habit-programs/cue-plan-input';
import type { CuePlanInput } from '@/lib/habit-programs/cue-plan-input';
import type { SupportLevel } from '@/lib/habit-programs/types';
import { mergeHabitPrograms, parseCuePlan, parseHabitTry, parseSupportObservation, parseWeeklyFocus, setCuePlan, setHabitTry, setSupportObservation, setWeeklyFocus } from '@/lib/experience-state';
import type { TryKind, TryOutcome } from '@/lib/habit-programs/coach';
import type { ExperienceState } from '@/lib/experience-state';
import type { ProductEvent } from '@/lib/product-analytics';
import type { ActivityLog, HabitActivity } from '@/types';

type Requester = (url: string, init?: RequestInit) => Promise<Response>;

const DEMO_FAMILY_ID = '00000000-0000-4000-8000-000000000000';

export type HabitProgramActionDependencies = {
  readonly activeChildId: string | null;
  readonly familyId: string | null;
  readonly isDemoSession: boolean;
  /** A parent or caregiver signed in to the cloud family. */
  readonly isSignedInParent: boolean;
  /** A child's own device, paired with the family by a code. */
  readonly isPairedChild: boolean;
  readonly logs: readonly ActivityLog[];
  readonly activities: readonly HabitActivity[];
  readonly setExperience: Dispatch<SetStateAction<ExperienceState>>;
  /** Changes whenever the family scope is reset (sign-out, re-pairing), so late answers can be dropped. */
  readonly getScope?: () => number;
  readonly request?: Requester;
  readonly now?: () => Date;
  /** Content-free product measurement; only reached once the server confirmed a save. */
  readonly track?: (event: ProductEvent) => void;
};

export type HabitProgramActions = {
  /** How a completed habit was done. Resolves false when nothing was saved. */
  readonly recordSupport: (logId: string, level: SupportLevel) => Promise<boolean>;
  /** The "if this, then that" plan for a habit of the named child (default: the active child). Only signed-in parents and demos can save one. */
  readonly saveCuePlan: (activityId: string, input: CuePlanInput, childId?: string) => Promise<boolean>;
  /** A parent starts one change to try for a habit, for about a week. */
  readonly startTry: (activityId: string, childId: string, kind: TryKind, previous?: Readonly<Record<string, unknown>> | null) => Promise<boolean>;
  /** The parent's answer to "did the change help?". */
  readonly resolveTry: (tryId: string, outcome: TryOutcome) => Promise<boolean>;
  /** The habits a child puts first this week: a parent for a young child, the child itself on a paired device. */
  readonly chooseFocus: (childId: string, weekStart: string, activityIds: readonly string[]) => Promise<boolean>;
};

export function createHabitProgramActions(dependencies: HabitProgramActionDependencies): HabitProgramActions {
  const request: Requester = dependencies.request ?? fetch;
  const now = dependencies.now ?? (() => new Date());
  const track = (event: ProductEvent): void => {
    try {
      dependencies.track?.(event);
    } catch {
      // Measurement must never undo a save.
    }
  };

  const recordSupport = async (logId: string, level: SupportLevel): Promise<boolean> => {
    const log = dependencies.logs.find((candidate) => candidate.id === logId);
    if (!log || (log.status !== 'completed' && log.status !== 'approved')) return false;
    const childId = log.childId;

    if (dependencies.isDemoSession) {
      dependencies.setExperience((previous) => setSupportObservation(previous, {
        log_id: log.id,
        family_id: DEMO_FAMILY_ID,
        child_id: childId,
        activity_id: log.activityId,
        support_level: level,
        recorded_by: 'parent',
        recorded_at: now().toISOString(),
      }));
      return true;
    }
    if (!dependencies.isSignedInParent && !dependencies.isPairedChild) return false;

    const scopeAtStart = dependencies.getScope?.();
    try {
      const response = await request(
        dependencies.isSignedInParent ? '/api/domain/experience' : '/api/child/habit-programs',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dependencies.isSignedInParent ? { type: 'recordSupport', logId, level } : { logId, level }),
        },
      );
      if (!response.ok) return false;
      const saved = z.object({ changed: z.boolean().optional(), observation: z.unknown() }).parse(await response.json());
      const observation = parseSupportObservation(saved.observation);
      if (observation.log_id !== logId || observation.support_level !== level || observation.child_id !== childId) return false;
      if (dependencies.getScope && dependencies.getScope() !== scopeAtStart) return false;
      // A slower, older answer must not replace a newer one that already arrived.
      dependencies.setExperience((previous) => mergeHabitPrograms(previous, { supportObservations: [observation], cuePlans: [] }));
      // A repeated answer that changed nothing is not a new record.
      if (saved.changed !== false) track({ event: 'habit_support_recorded', level: observation.support_level, recordedBy: dependencies.isSignedInParent ? 'parent' : 'child', mode: 'cloud' });
      return true;
    } catch {
      return false;
    }
  };

  const saveCuePlan = async (activityId: string, input: CuePlanInput, forChildId?: string): Promise<boolean> => {
    const childId = forChildId ?? dependencies.activeChildId;
    if (!childId) return false;
    const parsed = cuePlanInputSchema.safeParse(input);
    if (!parsed.success) return false;
    const activity = dependencies.activities.find((candidate) => candidate.id === activityId);
    if (!activity?.isActive || (activity.childId !== null && activity.childId !== childId)) return false;
    const plan = parsed.data;

    if (dependencies.isDemoSession) {
      const savedAt = now().toISOString();
      dependencies.setExperience((previous) => {
        const existing = previous.cuePlans.find((row) => row.child_id === childId && row.activity_id === activityId);
        return setCuePlan(previous, {
          family_id: DEMO_FAMILY_ID,
          child_id: childId,
          activity_id: activityId,
          cue_kind: plan.cueKind,
          cue_text: plan.cueText,
          cue_time: plan.cueTime,
          place_text: plan.placeText,
          weekend_variant_text: plan.weekendVariantText,
          created_at: existing?.created_at ?? savedAt,
          updated_at: savedAt,
        });
      });
      return true;
    }
    if (!dependencies.isSignedInParent) return false;

    const scopeAtStart = dependencies.getScope?.();
    try {
      const response = await request('/api/domain/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'saveCuePlan', childId, activityId, ...plan }),
      });
      if (!response.ok) return false;
      const saved = z.object({ cuePlan: z.unknown() }).parse(await response.json());
      const cuePlan = parseCuePlan(saved.cuePlan);
      if (cuePlan.child_id !== childId || cuePlan.activity_id !== activityId) return false;
      if (dependencies.getScope && dependencies.getScope() !== scopeAtStart) return false;
      dependencies.setExperience((previous) => mergeHabitPrograms(previous, { supportObservations: [], cuePlans: [cuePlan] }));
      track({ event: 'habit_cue_saved', mode: 'cloud' });
      return true;
    } catch {
      return false;
    }
  };

  const postParent = async (body: Record<string, unknown>): Promise<unknown | null> => {
    try {
      const response = await request('/api/domain/experience', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  };

  const startTry = async (activityId: string, childId: string, kind: TryKind, previous: Readonly<Record<string, unknown>> | null = null): Promise<boolean> => {
    const today = now();
    const startedOn = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (dependencies.isDemoSession) {
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
      const endsOn = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      dependencies.setExperience((previous) => (
        previous.habitTries.some((row) => row.child_id === childId && row.activity_id === activityId && row.outcome === null)
          ? previous
          : setHabitTry(previous, {
              id: crypto.randomUUID(), family_id: DEMO_FAMILY_ID, child_id: childId, activity_id: activityId, kind,
              started_on: startedOn, ends_on: endsOn, outcome: null, created_at: now().toISOString(), resolved_at: null, previous_values: previous ? { ...previous } : null,
            })
      ));
      return true;
    }
    if (!dependencies.isSignedInParent) return false;
    const scopeAtStart = dependencies.getScope?.();
    const answer = await postParent({ type: 'startHabitTry', childId, activityId, kind, days: 7, startedOn, previous });
    const parsed = z.object({ habitTry: z.unknown() }).safeParse(answer);
    if (!parsed.success) return false;
    try {
      const habitTry = parseHabitTry(parsed.data.habitTry);
      if (dependencies.getScope && dependencies.getScope() !== scopeAtStart) return false;
      dependencies.setExperience((previous) => setHabitTry(previous, habitTry));
      return true;
    } catch {
      return false;
    }
  };

  const resolveTry = async (tryId: string, outcome: TryOutcome): Promise<boolean> => {
    if (dependencies.isDemoSession) {
      dependencies.setExperience((previous) => {
        const current = previous.habitTries.find((row) => row.id === tryId);
        return current && current.outcome === null ? setHabitTry(previous, { ...current, outcome, resolved_at: now().toISOString() }) : previous;
      });
      return true;
    }
    if (!dependencies.isSignedInParent) return false;
    const scopeAtStart = dependencies.getScope?.();
    const answer = await postParent({ type: 'resolveHabitTry', tryId, outcome });
    const parsed = z.object({ habitTry: z.unknown() }).safeParse(answer);
    if (!parsed.success) return false;
    try {
      const habitTry = parseHabitTry(parsed.data.habitTry);
      if (dependencies.getScope && dependencies.getScope() !== scopeAtStart) return false;
      dependencies.setExperience((previous) => setHabitTry(previous, habitTry));
      return true;
    } catch {
      return false;
    }
  };

  const chooseFocus = async (childId: string, weekStart: string, activityIds: readonly string[]): Promise<boolean> => {
    const ids = [...new Set(activityIds)].slice(0, 2);
    if (dependencies.isDemoSession) {
      dependencies.setExperience((previous) => setWeeklyFocus(previous, {
        family_id: DEMO_FAMILY_ID, child_id: childId, week_start: weekStart, activity_ids: ids, chosen_by: 'parent', updated_at: now().toISOString(),
      }));
      return true;
    }
    if (!dependencies.isSignedInParent && !dependencies.isPairedChild) return false;
    const scopeAtStart = dependencies.getScope?.();
    try {
      const response = await request(
        dependencies.isSignedInParent ? '/api/domain/experience' : '/api/child/focus',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dependencies.isSignedInParent ? { type: 'setWeeklyFocus', childId, weekStart, activityIds: ids } : { weekStart, activityIds: ids }),
        },
      );
      if (!response.ok) return false;
      const saved = z.object({ weeklyFocus: z.unknown() }).parse(await response.json());
      const weeklyFocus = parseWeeklyFocus(saved.weeklyFocus);
      if (weeklyFocus.child_id !== childId || weeklyFocus.week_start !== weekStart) return false;
      if (dependencies.getScope && dependencies.getScope() !== scopeAtStart) return false;
      dependencies.setExperience((previous) => setWeeklyFocus(previous, weeklyFocus));
      return true;
    } catch {
      return false;
    }
  };

  return { recordSupport, saveCuePlan, startTry, resolveTry, chooseFocus };
}
