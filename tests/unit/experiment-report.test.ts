import { describe, expect, it } from 'vitest';
import { buildSafeEvolveReport, parseExperimentObservations } from '@/lib/experiment-report';

describe('Safe versus Evolve experiment reporting', () => {
  it('reports a not-started state when no consented exposure exists', () => {
    const report = buildSafeEvolveReport([]);

    expect(report.status).toBe('not_started');
    expect(report.sample.total).toBe(0);
    expect(report.northStar.tasksPerSession.evolve).toBeNull();
    expect(report.guardrail.evolveAverageSessionSeconds).toBeNull();
  });

  it('aggregates sample, exposure, North Star, and session guardrail by arm', () => {
    const observations = parseExperimentObservations([
      { participantKey: 'anon-safe-00000001', arm: 'safe', exposed: true, sessions: [{ durationSeconds: 240, completedTasks: 2 }] },
      { participantKey: 'anon-safe-00000002', arm: 'safe', exposed: false, sessions: [] },
      { participantKey: 'anon-evolve-000001', arm: 'evolve', exposed: true, sessions: [{ durationSeconds: 300, completedTasks: 4 }, { durationSeconds: 420, completedTasks: 2 }] },
    ]);

    const report = buildSafeEvolveReport(observations);

    expect(report.status).toBe('continue_observation');
    expect(report.sample).toEqual({ total: 3, safe: 2, evolve: 1 });
    expect(report.exposure).toEqual({ total: 2, safe: 1, evolve: 1, safeRate: 0.5, evolveRate: 1 });
    expect(report.northStar.tasksPerSession).toEqual({ safe: 2, evolve: 3 });
    expect(report.guardrail.evolveAverageSessionSeconds).toBe(360);
    expect(report.guardrail.exceedsEightMinutes).toBe(false);
  });

  it('stops the evolve arm when average child-session duration exceeds eight minutes', () => {
    const observations = parseExperimentObservations([
      { participantKey: 'anon-safe-00000001', arm: 'safe', exposed: true, sessions: [{ durationSeconds: 300, completedTasks: 2 }] },
      { participantKey: 'anon-evolve-000001', arm: 'evolve', exposed: true, sessions: [{ durationSeconds: 481, completedTasks: 3 }] },
    ]);

    expect(buildSafeEvolveReport(observations).status).toBe('pause_evolve');
  });

  it('does not continue an experiment before both exposed arms have outcomes', () => {
    const observations = parseExperimentObservations([
      { participantKey: 'anon-safe-00000001', arm: 'safe', exposed: true, sessions: [] },
      { participantKey: 'anon-evolve-000001', arm: 'evolve', exposed: true, sessions: [] },
    ]);

    expect(buildSafeEvolveReport(observations).status).toBe('insufficient_outcomes');
  });

  it('rejects duplicate pseudonyms, personal fields, and sessions without exposure', () => {
    expect(() => parseExperimentObservations([
      { participantKey: 'anon-safe-00000001', arm: 'safe', exposed: true, sessions: [], childName: 'An' },
    ])).toThrow();
    expect(() => parseExperimentObservations([
      { participantKey: 'anon-safe-00000001', arm: 'safe', exposed: true, sessions: [] },
      { participantKey: 'anon-safe-00000001', arm: 'evolve', exposed: true, sessions: [] },
    ])).toThrow();
    expect(() => parseExperimentObservations([
      { participantKey: 'anon-safe-00000001', arm: 'safe', exposed: false, sessions: [{ durationSeconds: 120, completedTasks: 1 }] },
    ])).toThrow();
  });
});
