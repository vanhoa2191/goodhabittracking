import type { Dispatch, SetStateAction } from 'react';
import { z } from 'zod';
import { cuePlanInputSchema } from '@/lib/habit-programs/cue-plan-input';
import type { CuePlanInput } from '@/lib/habit-programs/cue-plan-input';
import type { SupportLevel } from '@/lib/habit-programs/types';
import { mergeHabitPrograms, parseCuePlan, parseSupportObservation, setCuePlan, setSupportObservation } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';
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
};

export type HabitProgramActions = {
  /** How a completed habit was done. Resolves false when nothing was saved. */
  readonly recordSupport: (logId: string, level: SupportLevel) => Promise<boolean>;
  /** The "if this, then that" plan for a habit of the named child (default: the active child). Only signed-in parents and demos can save one. */
  readonly saveCuePlan: (activityId: string, input: CuePlanInput, childId?: string) => Promise<boolean>;
};

export function createHabitProgramActions(dependencies: HabitProgramActionDependencies): HabitProgramActions {
  const request: Requester = dependencies.request ?? fetch;
  const now = dependencies.now ?? (() => new Date());

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
      const saved = z.object({ observation: z.unknown() }).parse(await response.json());
      const observation = parseSupportObservation(saved.observation);
      if (observation.log_id !== logId || observation.support_level !== level || observation.child_id !== childId) return false;
      if (dependencies.getScope && dependencies.getScope() !== scopeAtStart) return false;
      // A slower, older answer must not replace a newer one that already arrived.
      dependencies.setExperience((previous) => mergeHabitPrograms(previous, { supportObservations: [observation], cuePlans: [] }));
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
      return true;
    } catch {
      return false;
    }
  };

  return { recordSupport, saveCuePlan };
}
