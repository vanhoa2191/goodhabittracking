import { describe, expect, it } from 'vitest';
import {
  emptyExperienceState,
  parseExperienceState,
  setCuePlan,
  setDeferredTask,
  setJournalEntry,
  setSupportObservation,
  supportLevelsByLogId,
} from '@/lib/experience-state';

const familyA = '11111111-1111-4111-8111-111111111111';
const familyB = '22222222-2222-4222-8222-222222222222';
const childId = '33333333-3333-4333-8333-333333333333';

describe('experience state boundary', () => {
  it('accepts absent child records for an existing family', () => {
    expect(parseExperienceState(emptyExperienceState, familyA)).toEqual(emptyExperienceState);
  });

  it('rejects a row from another family before hydration', () => {
    expect(() => parseExperienceState({
      ...emptyExperienceState,
      children: [{ family_id: familyB, child_id: childId, mascot_selected_at: null }],
    }, familyA)).toThrow();
  });

  it('starts with no deferred tasks when older experience data is loaded', () => {
    const olderState = { children: [], settings: null, letters: [], quests: [], wishlists: [] };
    expect(parseExperienceState(olderState, familyA).deferredTasks).toEqual([]);
    expect(parseExperienceState(olderState, familyA).journalEntries).toEqual([]);
  });

  it('rejects a deferred task from another family before hydration', () => {
    expect(() => parseExperienceState({
      ...emptyExperienceState,
      deferredTasks: [{
        family_id: familyB,
        child_id: childId,
        activity_id: '44444444-4444-4444-8444-444444444444',
        local_date: '2026-09-25',
        deferred_at: '2026-09-25T09:00:00+07:00',
      }],
    }, familyA)).toThrow();
  });

  it('keeps a deferral idempotent and can restore the task', () => {
    const deferral = {
      family_id: familyA,
      child_id: childId,
      activity_id: '44444444-4444-4444-8444-444444444444',
      local_date: '2026-09-25',
      deferred_at: '2026-09-25T09:00:00+07:00',
    };
    const deferred = setDeferredTask(emptyExperienceState, deferral, true);
    expect(deferred.deferredTasks).toEqual([deferral]);
    expect(setDeferredTask(deferred, deferral, true)).toBe(deferred);
    expect(setDeferredTask(deferred, deferral, false).deferredTasks).toEqual([]);
  });

  it('replaces the same child and date journal entry without duplicating it', () => {
    const first = {
      family_id: familyA,
      child_id: childId,
      local_date: '2026-09-26',
      entry_text: 'Con đã cố gắng.',
      created_at: '2026-09-26T12:00:00.000Z',
      updated_at: '2026-09-26T12:00:00.000Z',
    };
    const updated = { ...first, entry_text: 'Con đã cố gắng và hoàn thành.', updated_at: '2026-09-26T13:00:00.000Z' };

    const once = setJournalEntry(emptyExperienceState, first);
    const twice = setJournalEntry(once, updated);

    expect(twice.journalEntries).toEqual([updated]);
  });

  it('accepts demo child identifiers in local journal state', () => {
    const demoEntry = {
      family_id: familyA,
      child_id: 'demo-child',
      local_date: '2026-09-26',
      entry_text: 'Con đã thử một điều mới.',
      created_at: '2026-09-26T12:00:00.000Z',
      updated_at: '2026-09-26T12:00:00.000Z',
    };

    expect(parseExperienceState({
      ...emptyExperienceState,
      journalEntries: [demoEntry],
    }, familyA, true).journalEntries).toEqual([demoEntry]);
  });
});

const logId = '55555555-5555-4555-8555-555555555555';
const activityId = '44444444-4444-4444-8444-444444444444';
const observation = {
  log_id: logId,
  family_id: familyA,
  child_id: childId,
  activity_id: activityId,
  support_level: 'prompted' as const,
  recorded_by: 'parent' as const,
  recorded_at: '2026-09-30T09:00:00+07:00',
};
const cuePlan = {
  family_id: familyA,
  child_id: childId,
  activity_id: activityId,
  cue_kind: 'event' as const,
  cue_text: 'Sau khi đánh răng, con đọc một trang sách',
  cue_time: null,
  place_text: 'Giường của con',
  weekend_variant_text: null,
  created_at: '2026-09-29T09:00:00+07:00',
  updated_at: '2026-09-30T09:00:00+07:00',
};

describe('habit program rows in the experience state', () => {
  it('defaults to no observations or cue plans for older data', () => {
    const olderState = { children: [], settings: null, letters: [], quests: [], wishlists: [] };
    const parsed = parseExperienceState(olderState, familyA);
    expect(parsed.supportObservations).toEqual([]);
    expect(parsed.cuePlans).toEqual([]);
  });

  it('accepts rows from the database and rejects rows from another family', () => {
    const state = { ...emptyExperienceState, supportObservations: [observation], cuePlans: [{ ...cuePlan, cue_kind: 'time' as const, cue_time: '19:30:00' }] };
    expect(parseExperienceState(state, familyA).supportObservations).toEqual([observation]);
    expect(() => parseExperienceState({ ...state, supportObservations: [{ ...observation, family_id: familyB }] }, familyA)).toThrow();
    expect(() => parseExperienceState({ ...state, cuePlans: [{ ...cuePlan, family_id: familyB }] }, familyA)).toThrow();
  });

  it('rejects an unknown support level and a time cue without a time of day', () => {
    expect(() => parseExperienceState({ ...emptyExperienceState, supportObservations: [{ ...observation, support_level: 'perfect' }] }, familyA)).toThrow();
    expect(() => parseExperienceState({ ...emptyExperienceState, cuePlans: [{ ...cuePlan, cue_kind: 'time', cue_time: null }] }, familyA)).toThrow();
    expect(() => parseExperienceState({ ...emptyExperienceState, cuePlans: [{ ...cuePlan, cue_kind: 'event', cue_time: '19:30:00' }] }, familyA)).toThrow();
  });

  it('requires the moment a cue plan was first saved', () => {
    const { created_at: _created, ...withoutCreatedAt } = cuePlan;
    void _created;
    expect(() => parseExperienceState({ ...emptyExperienceState, cuePlans: [withoutCreatedAt] }, familyA)).toThrow();
  });

  it('accepts local demo ids that are not UUIDs', () => {
    const demoObservation = { ...observation, log_id: 'log-1', child_id: 'child-1', activity_id: 'activity-1' };
    const demoPlan = { ...cuePlan, child_id: 'child-1', activity_id: 'activity-1' };
    const parsed = parseExperienceState({ ...emptyExperienceState, supportObservations: [demoObservation], cuePlans: [demoPlan] }, familyA, true);
    expect(parsed.supportObservations).toEqual([demoObservation]);
    expect(parsed.cuePlans).toEqual([demoPlan]);
  });

  it('replaces the observation of a log and keeps the others', () => {
    const other = { ...observation, log_id: '66666666-6666-4666-8666-666666666666' };
    const first = setSupportObservation({ ...emptyExperienceState, supportObservations: [other] }, observation);
    const changed = setSupportObservation(first, { ...observation, support_level: 'alone', recorded_at: '2026-09-30T10:00:00+07:00' });
    expect(changed.supportObservations).toHaveLength(2);
    expect(changed.supportObservations.find((row) => row.log_id === logId)?.support_level).toBe('alone');
    expect(setSupportObservation(changed, changed.supportObservations.find((row) => row.log_id === logId)!)).toBe(changed);
  });

  it('replaces the cue plan of a child and habit and keeps the others', () => {
    const otherHabit = { ...cuePlan, activity_id: '77777777-7777-4777-8777-777777777777' };
    const first = setCuePlan({ ...emptyExperienceState, cuePlans: [otherHabit] }, cuePlan);
    const changed = setCuePlan(first, { ...cuePlan, cue_text: 'Sau bữa tối, con đọc sách', updated_at: '2026-09-30T10:00:00+07:00' });
    expect(changed.cuePlans).toHaveLength(2);
    expect(changed.cuePlans.find((row) => row.activity_id === activityId)?.cue_text).toBe('Sau bữa tối, con đọc sách');
  });

  it('lists the support level of each log for one child', () => {
    const state = {
      ...emptyExperienceState,
      supportObservations: [observation, { ...observation, log_id: '88888888-8888-4888-8888-888888888888', child_id: 'someone-else' }],
    };
    expect([...supportLevelsByLogId(state, childId)]).toEqual([[logId, 'prompted']]);
  });
});

