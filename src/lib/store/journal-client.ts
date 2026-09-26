import { z } from 'zod';
import { parseJournalEntries } from '@/lib/child-journal';
import type { JournalEntry } from '@/lib/child-journal';

type Requester = (url: string, init?: RequestInit) => Promise<Response>;

export async function loadChildJournal(request: Requester = fetch): Promise<
  { status: 'ready'; entries: JournalEntry[] } | { status: 'unauthorized' | 'unavailable' }
> {
  const response = await request('/api/child/journal', { cache: 'no-store' });
  if (response.status === 401) return { status: 'unauthorized' };
  if (!response.ok) return { status: 'unavailable' };
  const payload: unknown = await response.json();
  const parsed = z.object({ entries: z.unknown() }).safeParse(payload);
  return parsed.success
    ? { status: 'ready', entries: parseJournalEntries(parsed.data.entries) }
    : { status: 'unavailable' };
}

export function mergeChildJournalEntries(
  current: readonly JournalEntry[],
  loaded: readonly JournalEntry[],
  childId: string,
): JournalEntry[] {
  const newest = new Map(loaded.map((entry) => [entry.local_date, entry]));
  for (const entry of current) {
    if (entry.child_id !== childId) continue;
    const fromServer = newest.get(entry.local_date);
    if (!fromServer || entry.updated_at >= fromServer.updated_at) newest.set(entry.local_date, entry);
  }
  return [...current.filter((entry) => entry.child_id !== childId), ...newest.values()];
}
