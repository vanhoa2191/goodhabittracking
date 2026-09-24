import type {
  ActivityLog,
  ChildBadge,
  ChildProfile,
  GroupTeam,
  HabitActivity,
  Kudo,
  ParentProfile,
  Redemption,
  Reward,
} from '@/types';
import { parseFamilyBackup } from '@/lib/family-backup';
import type { FamilyBackup } from '@/lib/family-backup';
import { emptyExperienceState, parseExperienceState } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';

export const LOCAL_STORAGE_PREFIX = 'kidhabit_';
const DEMO_STATE_KEY = `${LOCAL_STORAGE_PREFIX}demo_state`;

const FAMILY_SCOPED_STORAGE_KEYS = [
  'pin',
  'family_code',
  'family_id',
  'child_codes',
  'parent_profile',
  'profiles',
  'activeChildId',
  'activities',
  'logs',
  'rewards',
  'redemptions',
  'child_badges',
  'groups',
  'kudos',
  'subscription_plan',
  'trial_ends_at',
  'subscription_ends_at',
  'child_paired',
  'experience',
] as const;

interface WritableStorage {
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface ReadableStorage extends WritableStorage {
  getItem(key: string): string | null;
}

export type LocalFamilyHydration =
  | { kind: 'demo'; snapshot?: FamilyBackup }
  | {
      kind: 'family';
      pin: string | null;
      familyId: string;
      storageMode: 'local' | 'cloud';
      parentProfile: ParentProfile | null;
      profiles: ChildProfile[];
      activeChildId: string | null;
      activities: HabitActivity[];
      logs: ActivityLog[];
      rewards: Reward[];
      redemptions: Redemption[];
      childBadges: ChildBadge[];
      groups: GroupTeam[];
      kudos: Kudo[];
      experience: ExperienceState;
    };

interface LocalFamilyState {
  pin: string;
  storageMode: 'local' | 'cloud';
  activeChildId: string | null;
  profiles: ChildProfile[];
  activities: HabitActivity[];
  logs: ActivityLog[];
  rewards: Reward[];
  redemptions: Redemption[];
  childBadges: ChildBadge[];
  groups: GroupTeam[];
  kudos: Kudo[];
}

const EMPTY_BACKUP_COLLECTIONS = {
  profiles: [],
  activities: [],
  logs: [],
  rewards: [],
  redemptions: [],
  childBadges: [],
  groups: [],
  kudos: [],
};

type CollectionKey = keyof typeof EMPTY_BACKUP_COLLECTIONS;

function parseStoredFragment(raw: string | null, key: CollectionKey) {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return parseFamilyBackup(JSON.stringify({
      version: 2,
      ...EMPTY_BACKUP_COLLECTIONS,
      [key]: value,
    }));
  } catch {
    return null;
  }
}

function parseStoredParentProfile(raw: string | null): ParentProfile | null {
  if (!raw) return null;
  try {
    const parentProfile: unknown = JSON.parse(raw);
    return parseFamilyBackup(JSON.stringify({
      version: 2,
      ...EMPTY_BACKUP_COLLECTIONS,
      parentProfile,
    }))?.parentProfile ?? null;
  } catch {
    return null;
  }
}

export function loadLocalFamilyState(
  local: ReadableStorage,
  session: ReadableStorage,
  createFamilyId: () => string,
): LocalFamilyHydration {
  if (session.getItem('kidhabit_demo_session') === 'true') {
    const snapshot = parseFamilyBackup(session.getItem(DEMO_STATE_KEY) ?? '');
    return snapshot ? { kind: 'demo', snapshot } : { kind: 'demo' };
  }

  local.removeItem(`${LOCAL_STORAGE_PREFIX}family_code`);
  local.removeItem(`${LOCAL_STORAGE_PREFIX}child_codes`);

  const familyId = local.getItem(`${LOCAL_STORAGE_PREFIX}family_id`) ?? createFamilyId();
  local.setItem(`${LOCAL_STORAGE_PREFIX}family_id`, familyId);

  const savedStorageMode = local.getItem(`${LOCAL_STORAGE_PREFIX}storage_mode`);
  const storageMode = savedStorageMode === 'local' || savedStorageMode === 'cloud'
    ? savedStorageMode
    : 'cloud';
  const profiles = parseStoredFragment(
    local.getItem(`${LOCAL_STORAGE_PREFIX}profiles`),
    'profiles',
  )?.profiles ?? [];
  const savedActiveChildId = local.getItem(`${LOCAL_STORAGE_PREFIX}activeChildId`);

  return {
    kind: 'family',
    pin: local.getItem(`${LOCAL_STORAGE_PREFIX}pin`),
    familyId,
    storageMode,
    parentProfile: parseStoredParentProfile(local.getItem(`${LOCAL_STORAGE_PREFIX}parent_profile`)),
    profiles,
    activeChildId: savedActiveChildId ?? profiles[0]?.id ?? null,
    activities: parseStoredFragment(
      local.getItem(`${LOCAL_STORAGE_PREFIX}activities`),
      'activities',
    )?.activities ?? [],
    logs: parseStoredFragment(local.getItem(`${LOCAL_STORAGE_PREFIX}logs`), 'logs')?.logs ?? [],
    rewards: parseStoredFragment(
      local.getItem(`${LOCAL_STORAGE_PREFIX}rewards`),
      'rewards',
    )?.rewards ?? [],
    redemptions: parseStoredFragment(
      local.getItem(`${LOCAL_STORAGE_PREFIX}redemptions`),
      'redemptions',
    )?.redemptions ?? [],
    childBadges: parseStoredFragment(
      local.getItem(`${LOCAL_STORAGE_PREFIX}child_badges`),
      'childBadges',
    )?.childBadges ?? [],
    groups: parseStoredFragment(local.getItem(`${LOCAL_STORAGE_PREFIX}groups`), 'groups')?.groups ?? [],
    kudos: parseStoredFragment(local.getItem(`${LOCAL_STORAGE_PREFIX}kudos`), 'kudos')?.kudos ?? [],
    experience: loadLocalExperience(local, familyId),
  };
}

export function persistDemoFamilyState(
  session: WritableStorage,
  state: Omit<FamilyBackup, 'version' | 'exportedAt'>,
): void {
  session.setItem(DEMO_STATE_KEY, JSON.stringify({ version: 2, ...state }));
}

export function clearDemoFamilyState(session: WritableStorage): void {
  session.removeItem(DEMO_STATE_KEY);
  session.removeItem(`${LOCAL_STORAGE_PREFIX}experience`);
}

export function loadLocalExperience(local: ReadableStorage, familyId: string, isDemo = false): ExperienceState {
  const raw = local.getItem(`${LOCAL_STORAGE_PREFIX}experience`);
  if (!raw) return emptyExperienceState;
  try {
    return parseExperienceState(JSON.parse(raw), familyId, isDemo);
  } catch {
    return emptyExperienceState;
  }
}

export function saveLocalExperience(local: WritableStorage, state: ExperienceState): void {
  local.setItem(`${LOCAL_STORAGE_PREFIX}experience`, JSON.stringify(state));
}

export function clearFamilyScopedStorage(storage: WritableStorage): void {
  for (const key of FAMILY_SCOPED_STORAGE_KEYS) {
    storage.removeItem(`${LOCAL_STORAGE_PREFIX}${key}`);
  }
}

export function persistLocalFamilyState(storage: WritableStorage, state: LocalFamilyState): void {
  storage.setItem(`${LOCAL_STORAGE_PREFIX}pin`, state.pin);
  storage.setItem(`${LOCAL_STORAGE_PREFIX}storage_mode`, state.storageMode);
  storage.setItem(`${LOCAL_STORAGE_PREFIX}profiles`, JSON.stringify(state.profiles));
  if (state.activeChildId) {
    storage.setItem(`${LOCAL_STORAGE_PREFIX}activeChildId`, state.activeChildId);
  }
  storage.setItem(`${LOCAL_STORAGE_PREFIX}activities`, JSON.stringify(state.activities));
  storage.setItem(`${LOCAL_STORAGE_PREFIX}logs`, JSON.stringify(state.logs));
  storage.setItem(`${LOCAL_STORAGE_PREFIX}rewards`, JSON.stringify(state.rewards));
  storage.setItem(`${LOCAL_STORAGE_PREFIX}redemptions`, JSON.stringify(state.redemptions));
  storage.setItem(`${LOCAL_STORAGE_PREFIX}child_badges`, JSON.stringify(state.childBadges));
  storage.setItem(`${LOCAL_STORAGE_PREFIX}groups`, JSON.stringify(state.groups));
  storage.setItem(`${LOCAL_STORAGE_PREFIX}kudos`, JSON.stringify(state.kudos));
}
