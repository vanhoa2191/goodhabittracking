import { describe, expect, it } from 'vitest';
import { emptyExperienceState, parseExperienceState, setDeferredTask, setJournalEntry } from '@/lib/experience-state';

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
