import { describe, expect, it } from 'vitest';
import { emptyExperienceState, parseExperienceState, setDeferredTask } from '@/lib/experience-state';

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
});
