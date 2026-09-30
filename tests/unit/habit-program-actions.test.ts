import { describe, expect, it, vi } from 'vitest';
import { emptyExperienceState } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';
import type { CuePlanInput } from '@/lib/habit-programs/cue-plan-input';
import { createHabitProgramActions } from '@/lib/store/habit-program-actions';
import type { HabitProgramActionDependencies } from '@/lib/store/habit-program-actions';
import type { ActivityLog, HabitActivity } from '@/types';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const otherChildId = '33333333-3333-4333-8333-333333333333';
const activityId = '44444444-4444-4444-8444-444444444444';
const logId = '55555555-5555-4555-8555-555555555555';
const now = new Date('2026-09-30T05:00:00.000Z');

const activity: HabitActivity = {
  id: activityId, childId: null, title: 'Read', icon: '📚', category: 'study', points: 10,
  recurrenceType: 'daily', recurrenceDays: [0, 1, 2, 3, 4, 5, 6], timeOfDay: 'anytime',
  requiresApproval: false, isActive: true, createdAt: '2026-01-01T00:00:00.000Z',
};
const doneLog: ActivityLog = {
  id: logId, activityId, childId, date: '2026-09-30', status: 'completed', pointsAwarded: 10, completedAt: '2026-09-30T01:00:00.000Z',
};
const cueInput: CuePlanInput = { cueKind: 'event', cueText: 'After dinner', cueTime: null, placeText: null, weekendVariantText: null };

function harness(overrides: Partial<HabitProgramActionDependencies> = {}, respond?: () => Response | Promise<Response>) {
  let experience: ExperienceState = emptyExperienceState;
  const request = vi.fn(async () => (respond ? respond() : new Response('{}', { status: 500 })));
  const actions = createHabitProgramActions({
    activeChildId: childId,
    familyId,
    isDemoSession: false,
    isSignedInParent: true,
    isPairedChild: false,
    logs: [doneLog],
    activities: [activity],
    setExperience: (update) => { experience = typeof update === 'function' ? update(experience) : update; },
    request,
    now: () => now,
    ...overrides,
  });
  return { actions, request, experience: () => experience };
}

const observationRow = (level: 'alone' | 'prompted' | 'together', by: 'parent' | 'child' = 'parent') => ({
  log_id: logId, family_id: familyId, child_id: childId, activity_id: activityId,
  support_level: level, recorded_by: by, recorded_at: '2026-09-30T05:00:00.000Z',
});
const cueRow = (overrides: Record<string, unknown> = {}) => ({
  family_id: familyId, child_id: childId, activity_id: activityId, cue_kind: 'event', cue_text: 'After dinner',
  cue_time: null, place_text: null, weekend_variant_text: null,
  created_at: '2026-09-01T05:00:00.000Z', updated_at: '2026-09-30T05:00:00.000Z', ...overrides,
});

describe('recording how a habit was done', () => {
  it('refuses without a request when there is nothing valid to record', async () => {
    for (const overrides of [
      { activeChildId: null },
      { logs: [] },
      { logs: [{ ...doneLog, status: 'pending_approval' as const }] },
      { logs: [{ ...doneLog, status: 'rejected' as const }] },
      { logs: [{ ...doneLog, childId: otherChildId }] },
      { isSignedInParent: false, isPairedChild: false },
    ]) {
      const { actions, request } = harness(overrides);
      await expect(actions.recordSupport(logId, 'alone')).resolves.toBe(false);
      expect(request).not.toHaveBeenCalled();
    }
  });

  it('keeps a demo record on the device, attributed to the parent', async () => {
    const { actions, request, experience } = harness({ isDemoSession: true, isSignedInParent: false });
    await expect(actions.recordSupport(logId, 'prompted')).resolves.toBe(true);
    expect(request).not.toHaveBeenCalled();
    expect(experience().supportObservations).toEqual([expect.objectContaining({
      log_id: logId, child_id: childId, activity_id: activityId, support_level: 'prompted', recorded_by: 'parent',
    })]);
  });

  it('keeps demo records under the demo family even when a real family id is known', async () => {
    const { actions, experience } = harness({ isDemoSession: true, isSignedInParent: false, familyId: '99999999-9999-4999-8999-999999999999' });
    await actions.recordSupport(logId, 'alone');
    await actions.saveCuePlan(activityId, cueInput);
    expect(experience().supportObservations[0].family_id).toBe('00000000-0000-4000-8000-000000000000');
    expect(experience().cuePlans[0].family_id).toBe('00000000-0000-4000-8000-000000000000');
  });

  it('keeps the newer answer when two answers arrive out of order', async () => {
    const resolvers: ((response: Response) => void)[] = [];
    const request = vi.fn(() => new Promise<Response>((resolve) => { resolvers.push(resolve); }));
    const { actions, experience } = harness({ request });
    const first = actions.recordSupport(logId, 'alone');
    const second = actions.recordSupport(logId, 'prompted');
    const answer = (level: 'alone' | 'prompted', at: string) => Response.json({
      success: true, changed: true, observation: { ...observationRow(level), recorded_at: at },
    });
    // The server handled "alone" first and "prompted" second, but the answers reach the browser reversed.
    resolvers[1](answer('prompted', '2026-09-30T05:00:02.000Z'));
    await second;
    resolvers[0](answer('alone', '2026-09-30T05:00:01.000Z'));
    await first;
    expect(experience().supportObservations).toHaveLength(1);
    expect(experience().supportObservations[0].support_level).toBe('prompted');
  });

  it('drops an answer that arrives after the family was switched or signed out', async () => {
    const scope = { current: 1 };
    let resolve: (response: Response) => void = () => undefined;
    const request = vi.fn(() => new Promise<Response>((done) => { resolve = done; }));
    const { actions, experience } = harness({ request, getScope: () => scope.current });
    const pending = actions.recordSupport(logId, 'alone');
    scope.current += 1;
    resolve(Response.json({ success: true, changed: true, observation: observationRow('alone') }));
    await expect(pending).resolves.toBe(false);
    expect(experience().supportObservations).toEqual([]);
  });

  it('lets a signed-in parent record it and stores the row the server returns', async () => {
    const { actions, request, experience } = harness({}, () => Response.json({ success: true, changed: true, observation: observationRow('alone') }));
    await expect(actions.recordSupport(logId, 'alone')).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith('/api/domain/experience', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ type: 'recordSupport', logId, level: 'alone' }),
    }));
    expect(experience().supportObservations).toEqual([observationRow('alone')]);
  });

  it('lets a paired child device record it through its own route', async () => {
    const { actions, request, experience } = harness(
      { isSignedInParent: false, isPairedChild: true },
      () => Response.json({ changed: true, observation: observationRow('together', 'child') }),
    );
    await expect(actions.recordSupport(logId, 'together')).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith('/api/child/habit-programs', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ logId, level: 'together' }),
    }));
    expect(experience().supportObservations[0].recorded_by).toBe('child');
  });

  it('does not claim success when the request fails or the saved row is not the one asked for', async () => {
    const failed = harness({}, () => new Response('{}', { status: 503 }));
    await expect(failed.actions.recordSupport(logId, 'alone')).resolves.toBe(false);
    const mismatch = harness({}, () => Response.json({ success: true, changed: true, observation: observationRow('prompted') }));
    await expect(mismatch.actions.recordSupport(logId, 'alone')).resolves.toBe(false);
    const garbage = harness({}, () => Response.json({ success: true }));
    await expect(garbage.actions.recordSupport(logId, 'alone')).resolves.toBe(false);
    const offline = harness({}, () => { throw new Error('offline'); });
    await expect(offline.actions.recordSupport(logId, 'alone')).resolves.toBe(false);
    for (const attempt of [failed, mismatch, garbage, offline]) expect(attempt.experience().supportObservations).toEqual([]);
  });
});

describe('saving a cue plan', () => {
  it('refuses without a request for invalid text, an unknown or inactive habit, or another child\'s habit', async () => {
    const cases: [Partial<HabitProgramActionDependencies>, CuePlanInput][] = [
      [{}, { ...cueInput, cueText: '   ' }],
      [{}, { ...cueInput, cueKind: 'time' }],
      [{}, { ...cueInput, cueKind: 'event', cueTime: '19:00' }],
      [{ activities: [] }, cueInput],
      [{ activities: [{ ...activity, isActive: false }] }, cueInput],
      [{ activities: [{ ...activity, childId: otherChildId }] }, cueInput],
      [{ activeChildId: null }, cueInput],
    ];
    for (const [overrides, input] of cases) {
      const { actions, request } = harness(overrides);
      await expect(actions.saveCuePlan(activityId, input)).resolves.toBe(false);
      expect(request).not.toHaveBeenCalled();
    }
  });

  it('keeps a demo plan on the device and keeps its first-saved time when it is edited', async () => {
    let clock = now;
    const { actions, experience } = harness({ isDemoSession: true, isSignedInParent: false, now: () => clock });
    await expect(actions.saveCuePlan(activityId, cueInput)).resolves.toBe(true);
    const first = experience().cuePlans[0];
    expect(first).toMatchObject({ child_id: childId, activity_id: activityId, cue_text: 'After dinner', created_at: now.toISOString() });
    clock = new Date('2026-10-05T05:00:00.000Z');
    await expect(actions.saveCuePlan(activityId, { ...cueInput, cueText: 'After brushing teeth' })).resolves.toBe(true);
    expect(experience().cuePlans).toHaveLength(1);
    expect(experience().cuePlans[0]).toMatchObject({
      cue_text: 'After brushing teeth', created_at: now.toISOString(), updated_at: '2026-10-05T05:00:00.000Z',
    });
  });

  it('lets a signed-in parent save it and stores the row the server returns', async () => {
    const row = cueRow({ cue_kind: 'time', cue_time: '19:00:00', cue_text: 'At seven' });
    const { actions, request, experience } = harness({}, () => Response.json({ success: true, cuePlan: row }));
    await expect(actions.saveCuePlan(activityId, { ...cueInput, cueKind: 'time', cueTime: '19:00', cueText: 'At seven' })).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith('/api/domain/experience', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        type: 'saveCuePlan', childId, activityId, cueKind: 'time', cueText: 'At seven', cueTime: '19:00', placeText: null, weekendVariantText: null,
      }),
    }));
    expect(experience().cuePlans).toEqual([row]);
  });

  it('drops a saved plan that arrives after the family was switched or signed out', async () => {
    const scope = { current: 1 };
    let resolve: (response: Response) => void = () => undefined;
    const request = vi.fn(() => new Promise<Response>((done) => { resolve = done; }));
    const { actions, experience } = harness({ request, getScope: () => scope.current });
    const pending = actions.saveCuePlan(activityId, cueInput);
    scope.current += 1;
    resolve(Response.json({ success: true, cuePlan: cueRow() }));
    await expect(pending).resolves.toBe(false);
    expect(experience().cuePlans).toEqual([]);
  });

  it('never lets a paired child device save a plan', async () => {
    const { actions, request } = harness({ isSignedInParent: false, isPairedChild: true });
    await expect(actions.saveCuePlan(activityId, cueInput)).resolves.toBe(false);
    expect(request).not.toHaveBeenCalled();
  });

  it('does not claim success when the request fails or the saved plan is for something else', async () => {
    const failed = harness({}, () => new Response('{}', { status: 409 }));
    await expect(failed.actions.saveCuePlan(activityId, cueInput)).resolves.toBe(false);
    const wrong = harness({}, () => Response.json({ success: true, cuePlan: cueRow({ activity_id: otherChildId }) }));
    await expect(wrong.actions.saveCuePlan(activityId, cueInput)).resolves.toBe(false);
    expect(failed.experience().cuePlans).toEqual([]);
    expect(wrong.experience().cuePlans).toEqual([]);
  });
});
