import type { FamilyBackup } from '@/lib/family-backup';
import { parseFamilyBackup, serializeFamilyBackup } from '@/lib/family-backup';

interface WritableStorage {
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type FamilyBackupInput = Omit<FamilyBackup, 'version' | 'exportedAt'>;
export type ImportedFamilyState = FamilyBackup & { activeChildId: string | null };

export function exportFamilyData(input: FamilyBackupInput): string {
  return serializeFamilyBackup(input);
}

export function importFamilyData(
  jsonData: string,
  apply: (state: ImportedFamilyState) => void,
  local: WritableStorage,
  session: WritableStorage,
): boolean {
  const parsed = parseFamilyBackup(jsonData);
  if (!parsed) return false;

  const activeChildId = parsed.activeChildId
    && parsed.profiles.some((profile) => profile.id === parsed.activeChildId)
    ? parsed.activeChildId
    : parsed.profiles[0]?.id ?? null;

  apply({ ...parsed, activeChildId });
  session.removeItem('kidhabit_demo_session');
  local.setItem('kidhabit_local_family_session', 'true');
  return true;
}
