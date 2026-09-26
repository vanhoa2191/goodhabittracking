import { describe, expect, it, vi } from 'vitest';
import { createJournalActions } from '@/lib/store/journal-actions';
import { emptyExperienceState } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';

describe('journal actions', () => {
  it('saves a normalized local reflection without an analytics or network call', async () => {
    let state: ExperienceState = emptyExperienceState;
    const request = vi.fn();
    const { saveJournalEntry } = createJournalActions({
      activeChildId: childId,
      familyId,
      hasParentSession: false,
      getScopeVersion: () => 0,
      isFamilyConnected: false,
      request,
      setExperience: (updater) => { state = updater(state); },
      storageMode: 'local',
      now: () => new Date('2026-09-26T12:00:00.000Z'),
    });

    await expect(saveJournalEntry('2026-09-26', '  Con đã giúp\nmẹ. ')).resolves.toBe(true);
    expect(state.journalEntries).toHaveLength(1);
    expect(state.journalEntries[0]?.entry_text).toBe('Con đã giúp mẹ.');
    expect(request).not.toHaveBeenCalled();
  });

  it('uses the child-scoped endpoint for a paired device', async () => {
    let state: ExperienceState = emptyExperienceState;
    const entry = {
      family_id: familyId,
      child_id: childId,
      local_date: '2026-09-26',
      entry_text: 'Con đã giúp mẹ.',
      created_at: '2026-09-26T12:00:00.000Z',
      updated_at: '2026-09-26T12:00:00.000Z',
    };
    const request = vi.fn(async () => new Response(JSON.stringify({ entry }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    const { saveJournalEntry } = createJournalActions({
      activeChildId: childId,
      familyId,
      hasParentSession: false,
      getScopeVersion: () => 0,
      isFamilyConnected: true,
      request,
      setExperience: (updater) => { state = updater(state); },
      storageMode: 'cloud',
      now: () => new Date('2026-09-26T12:00:00.000Z'),
    });

    await expect(saveJournalEntry('2026-09-26', entry.entry_text)).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith('/api/child/journal', expect.objectContaining({ method: 'PUT' }));
    expect(state.journalEntries).toEqual([entry]);
  });

  it('fails closed when cloud mode has no parent or paired-child session', async () => {
    const { saveJournalEntry } = createJournalActions({
      activeChildId: childId,
      familyId,
      hasParentSession: false,
      getScopeVersion: () => 0,
      isFamilyConnected: false,
      request: vi.fn(),
      setExperience: vi.fn(),
      storageMode: 'cloud',
      now: () => new Date('2026-09-26T12:00:00.000Z'),
    });

    await expect(saveJournalEntry('2026-09-26', 'Nội dung.')).resolves.toBe(false);
  });

  it('discards a save response after the device changes family', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    let scopeVersion = 0;
    let state: ExperienceState = emptyExperienceState;
    const { saveJournalEntry } = createJournalActions({
      activeChildId: childId,
      familyId: null,
      hasParentSession: false,
      isFamilyConnected: true,
      getScopeVersion: () => scopeVersion,
      request: () => new Promise<Response>((resolve) => { resolveRequest = resolve; }),
      setExperience: (updater) => { state = updater(state); },
      storageMode: 'cloud',
      now: () => new Date('2026-09-26T12:00:00.000Z'),
    });

    const pending = saveJournalEntry('2026-09-26', 'Bản ghi gia đình cũ.');
    scopeVersion += 1;
    resolveRequest?.(new Response(JSON.stringify({ entry: {
      family_id: familyId, child_id: childId, local_date: '2026-09-26',
      entry_text: 'Bản ghi gia đình cũ.',
      created_at: '2026-09-26T12:00:00.000Z', updated_at: '2026-09-26T12:00:00.000Z',
    } }), { status: 200 }));

    await expect(pending).resolves.toBe(false);
    expect(state.journalEntries).toEqual([]);
  });
});
