import { z } from 'zod';
import { normalizeJournalText, parseJournalEntry } from '@/lib/child-journal';
import { setJournalEntry } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';

type Requester = (url: string, init?: RequestInit) => Promise<Response>;
type StorageMode = 'local' | 'cloud';

type JournalActionDependencies = {
  readonly activeChildId: string | null;
  readonly familyId: string | null;
  readonly hasParentSession: boolean;
  readonly isFamilyConnected: boolean;
  readonly now: () => Date;
  readonly getScopeVersion: () => number;
  readonly request: Requester;
  readonly setExperience: (updater: (previous: ExperienceState) => ExperienceState) => void;
  readonly storageMode: StorageMode;
};

const journalResponse = z.object({ entry: z.unknown() });
const localFamilyId = '00000000-0000-4000-8000-000000000000';

export function createJournalActions(dependencies: JournalActionDependencies) {
  const saveJournalEntry = async (date: string, input: string): Promise<boolean> => {
    const scopeVersion = dependencies.getScopeVersion();
    const isCurrentScope = () => dependencies.getScopeVersion() === scopeVersion;
    const childId = dependencies.activeChildId;
    const text = normalizeJournalText(input);
    if (!childId || !text || !isCurrentScope()) return false;

    if (dependencies.storageMode === 'local') {
      const timestamp = dependencies.now().toISOString();
      dependencies.setExperience((previous) => {
        if (!isCurrentScope()) return previous;
        const existing = previous.journalEntries.find((entry) => (
          entry.child_id === childId && entry.local_date === date
        ));
        return setJournalEntry(previous, {
          family_id: dependencies.familyId ?? localFamilyId,
          child_id: childId,
          local_date: date,
          entry_text: text,
          created_at: existing?.created_at ?? timestamp,
          updated_at: timestamp,
        });
      });
      return true;
    }

    const paired = !dependencies.hasParentSession && dependencies.isFamilyConnected;
    if (!paired && !dependencies.hasParentSession) return false;
    try {
      const response = await dependencies.request(paired ? '/api/child/journal' : '/api/domain/journal', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(paired ? { date, text } : { childId, date, text }),
      });
      const parsed = journalResponse.safeParse(await response.json());
      if (!response.ok || !parsed.success) return false;
      const entry = parseJournalEntry(parsed.data.entry);
      if (entry.child_id !== childId
        || (dependencies.familyId !== null && entry.family_id !== dependencies.familyId)
        || !isCurrentScope()) return false;
      dependencies.setExperience((previous) => (
        isCurrentScope() ? setJournalEntry(previous, entry) : previous
      ));
      return true;
    } catch (error: unknown) {
      if (!(error instanceof Error)) throw error;
      return false;
    }
  };

  return { saveJournalEntry };
}
