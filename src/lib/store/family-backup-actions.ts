import type { FamilyBackup } from '@/lib/family-backup';
import { parseFamilyBackup, serializeFamilyBackup } from '@/lib/family-backup';
import { emptyExperienceState, rebindExperienceFamily } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';
import {
  LOCAL_STORAGE_PREFIX,
  clearDemoFamilyState,
  saveLocalExperience,
} from './local-family-persistence';

interface WritableStorage {
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface ReadableStorage extends WritableStorage {
  getItem(key: string): string | null;
}

export type FamilyBackupInput = Omit<FamilyBackup, 'version' | 'exportedAt'>;
export type ImportedFamilyState = Omit<FamilyBackup, 'experience'> & {
  activeChildId: string | null;
  experience: ExperienceState;
};

export function exportFamilyData(input: FamilyBackupInput): string {
  return serializeFamilyBackup(input);
}

export function importFamilyData(
  jsonData: string,
  apply: (state: ImportedFamilyState) => void,
  local: ReadableStorage,
  session: WritableStorage,
): boolean {
  const parsed = parseFamilyBackup(jsonData);
  if (!parsed) return false;

  const activeChildId = parsed.activeChildId
    && parsed.profiles.some((profile) => profile.id === parsed.activeChildId)
    ? parsed.activeChildId
    : parsed.profiles[0]?.id ?? null;

  // The rows belong to the family that made the backup; on this device they join the local family.
  const familyId = local.getItem(`${LOCAL_STORAGE_PREFIX}family_id`);
  const experience = parsed.experience && familyId
    ? rebindExperienceFamily(parsed.experience, familyId)
    : emptyExperienceState;

  apply({ ...parsed, activeChildId, experience });
  saveLocalExperience(local, experience);
  clearDemoFamilyState(session);
  session.removeItem('kidhabit_demo_session');
  local.setItem('kidhabit_local_family_session', 'true');
  return true;
}
