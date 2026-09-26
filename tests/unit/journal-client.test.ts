import { describe, expect, it, vi } from 'vitest';
import { loadChildJournal, mergeChildJournalEntries } from '@/lib/store/journal-client';
import type { JournalEntry } from '@/lib/child-journal';

const current: JournalEntry = {
  family_id: '11111111-1111-4111-8111-111111111111',
  child_id: '22222222-2222-4222-8222-222222222222',
  local_date: '2026-09-26',
  entry_text: 'Bản mới đã lưu.',
  created_at: '2026-09-26T09:00:00.000Z',
  updated_at: '2026-09-26T10:00:00.000Z',
};

describe('child journal loading', () => {
  it('keeps a newer save when an earlier GET completes late', () => {
    const earlier = { ...current, entry_text: 'Bản cũ.', updated_at: '2026-09-26T09:00:00.000Z' };
    expect(mergeChildJournalEntries([current], [earlier], current.child_id)).toEqual([current]);
    expect(mergeChildJournalEntries([current], [], current.child_id)).toEqual([current]);
  });

  it('reports revocation separately from a temporary load failure', async () => {
    await expect(loadChildJournal(vi.fn(async () => new Response(null, { status: 401 })))).resolves.toEqual({ status: 'unauthorized' });
    await expect(loadChildJournal(vi.fn(async () => new Response(null, { status: 503 })))).resolves.toEqual({ status: 'unavailable' });
  });
});
