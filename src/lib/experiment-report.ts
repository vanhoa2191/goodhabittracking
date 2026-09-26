import { z } from 'zod';

export const SAFE_EVOLVE_PREREGISTRATION = {
  experimentId: 'safe-vs-evolve-v1',
  arms: ['safe', 'evolve'],
  northStar: 'completed_tasks_per_child_session',
  guardrail: 'evolve_average_session_seconds',
  guardrailThresholdSeconds: 8 * 60,
  decisionPolicy: 'descriptive_only_until_powered_sample_is_approved',
} as const;

const experimentSessionSchema = z.strictObject({
  durationSeconds: z.number().int().min(1).max(30 * 60),
  completedTasks: z.number().int().min(0).max(100),
});

const experimentObservationSchema = z.strictObject({
  participantKey: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/),
  arm: z.enum(SAFE_EVOLVE_PREREGISTRATION.arms),
  exposed: z.boolean(),
  sessions: z.array(experimentSessionSchema).max(100),
});

const experimentObservationsSchema = z.array(experimentObservationSchema).superRefine((observations, context) => {
  const participantKeys = new Set<string>();
  observations.forEach((observation, index) => {
    if (participantKeys.has(observation.participantKey)) {
      context.addIssue({ code: 'custom', path: [index, 'participantKey'], message: 'Duplicate participant key.' });
    }
    participantKeys.add(observation.participantKey);
    if (!observation.exposed && observation.sessions.length > 0) {
      context.addIssue({ code: 'custom', path: [index, 'sessions'], message: 'Unexposed participants cannot have experiment sessions.' });
    }
  });
});

export type ExperimentObservation = z.infer<typeof experimentObservationSchema>;
type ExperimentArm = ExperimentObservation['arm'];

type ArmMetrics = {
  readonly assigned: number;
  readonly exposed: number;
  readonly sessions: number;
  readonly completedTasks: number;
  readonly durationSeconds: number;
};

export type SafeEvolveReport = {
  readonly experimentId: typeof SAFE_EVOLVE_PREREGISTRATION.experimentId;
  readonly status: 'not_started' | 'insufficient_exposure' | 'insufficient_outcomes' | 'continue_observation' | 'pause_evolve';
  readonly sample: { readonly total: number; readonly safe: number; readonly evolve: number };
  readonly exposure: {
    readonly total: number;
    readonly safe: number;
    readonly evolve: number;
    readonly safeRate: number | null;
    readonly evolveRate: number | null;
  };
  readonly northStar: {
    readonly metric: typeof SAFE_EVOLVE_PREREGISTRATION.northStar;
    readonly tasksPerSession: { readonly safe: number | null; readonly evolve: number | null };
  };
  readonly guardrail: {
    readonly metric: typeof SAFE_EVOLVE_PREREGISTRATION.guardrail;
    readonly thresholdSeconds: number;
    readonly evolveAverageSessionSeconds: number | null;
    readonly exceedsEightMinutes: boolean;
  };
  readonly inference: typeof SAFE_EVOLVE_PREREGISTRATION.decisionPolicy;
};

export function parseExperimentObservations(input: unknown): readonly ExperimentObservation[] {
  return experimentObservationsSchema.parse(input);
}

function roundMetric(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function collectArmMetrics(observations: readonly ExperimentObservation[], arm: ExperimentArm): ArmMetrics {
  const assigned = observations.filter((observation) => observation.arm === arm);
  const exposed = assigned.filter((observation) => observation.exposed);
  const sessions = exposed.flatMap((observation) => observation.sessions);
  return {
    assigned: assigned.length,
    exposed: exposed.length,
    sessions: sessions.length,
    completedTasks: sessions.reduce((total, session) => total + session.completedTasks, 0),
    durationSeconds: sessions.reduce((total, session) => total + session.durationSeconds, 0),
  };
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : roundMetric(numerator / denominator);
}

export function buildSafeEvolveReport(observations: readonly ExperimentObservation[]): SafeEvolveReport {
  const safe = collectArmMetrics(observations, 'safe');
  const evolve = collectArmMetrics(observations, 'evolve');
  const evolveAverageSessionSeconds = ratio(evolve.durationSeconds, evolve.sessions);
  const exceedsEightMinutes = evolveAverageSessionSeconds !== null
    && evolveAverageSessionSeconds > SAFE_EVOLVE_PREREGISTRATION.guardrailThresholdSeconds;
  const status = observations.length === 0
    ? 'not_started'
    : safe.exposed === 0 || evolve.exposed === 0
      ? 'insufficient_exposure'
      : safe.sessions === 0 || evolve.sessions === 0
        ? 'insufficient_outcomes'
        : exceedsEightMinutes
          ? 'pause_evolve'
          : 'continue_observation';

  return {
    experimentId: SAFE_EVOLVE_PREREGISTRATION.experimentId,
    status,
    sample: { total: observations.length, safe: safe.assigned, evolve: evolve.assigned },
    exposure: {
      total: safe.exposed + evolve.exposed,
      safe: safe.exposed,
      evolve: evolve.exposed,
      safeRate: ratio(safe.exposed, safe.assigned),
      evolveRate: ratio(evolve.exposed, evolve.assigned),
    },
    northStar: {
      metric: SAFE_EVOLVE_PREREGISTRATION.northStar,
      tasksPerSession: {
        safe: ratio(safe.completedTasks, safe.sessions),
        evolve: ratio(evolve.completedTasks, evolve.sessions),
      },
    },
    guardrail: {
      metric: SAFE_EVOLVE_PREREGISTRATION.guardrail,
      thresholdSeconds: SAFE_EVOLVE_PREREGISTRATION.guardrailThresholdSeconds,
      evolveAverageSessionSeconds,
      exceedsEightMinutes,
    },
    inference: SAFE_EVOLVE_PREREGISTRATION.decisionPolicy,
  };
}
