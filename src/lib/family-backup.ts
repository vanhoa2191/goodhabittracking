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
  SubscriptionPlan,
} from '@/types';
import { parseExperienceState } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';

export type FamilyBackup = {
  version: 1 | 2;
  exportedAt?: string;
  pin?: string;
  storageMode?: 'local' | 'cloud';
  activeChildId?: string | null;
  parentProfile?: ParentProfile | null;
  subscriptionPlan?: SubscriptionPlan;
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
  profiles: ChildProfile[];
  activities: HabitActivity[];
  logs: ActivityLog[];
  rewards: Reward[];
  redemptions: Redemption[];
  childBadges: ChildBadge[];
  groups: GroupTeam[];
  kudos: Kudo[];
  /** Child journal, wishlists, deferrals and habit-program rows. Absent in older backups. */
  experience?: ExperienceState;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isRecordArray = (value: unknown, requiredStringKeys: string[]): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.every((item) => (
    isRecord(item) && requiredStringKeys.every((key) => typeof item[key] === 'string')
  ));

/** The family id the backed-up rows were written under, so the rows can be checked as one family. */
const backedUpFamilyId = (experience: Record<string, unknown>): string => {
  for (const value of Object.values(experience)) {
    const rows = Array.isArray(value) ? value : [value];
    for (const row of rows) {
      if (isRecord(row) && typeof row.family_id === 'string') return row.family_id;
    }
  }
  return '';
};

/** An unusable experience section is left out rather than blocking the rest of the restore. */
const parseBackedUpExperience = (value: unknown): ExperienceState | undefined => {
  if (!isRecord(value)) return undefined;
  try {
    return parseExperienceState(value, backedUpFamilyId(value));
  } catch {
    return undefined;
  }
};

export const parseFamilyBackup = (jsonData: string): FamilyBackup | null => {
  try {
    const parsed: unknown = JSON.parse(jsonData);
    if (!isRecord(parsed) || (parsed.version !== 1 && parsed.version !== 2)) return null;

    const collectionRequirements: Array<[keyof FamilyBackup, string[]]> = [
      ['profiles', ['id', 'name', 'avatar', 'themeColor', 'createdAt']],
      ['activities', ['id', 'title', 'icon', 'category', 'timeOfDay', 'createdAt']],
      ['logs', ['id', 'activityId', 'childId', 'date', 'status', 'completedAt']],
      ['rewards', ['id', 'title', 'icon', 'createdAt']],
      ['redemptions', ['id', 'rewardId', 'childId', 'status', 'requestedAt']],
      ['childBadges', ['childId', 'badgeId', 'unlockedAt']],
      ['groups', ['id', 'name', 'inviteCode', 'icon', 'createdAt']],
      ['kudos', ['id', 'fromChildName', 'toChildId', 'emoji', 'sentAt']],
    ];

    if (!collectionRequirements.every(([key, requiredKeys]) => isRecordArray(parsed[key], requiredKeys))) {
      return null;
    }
    if (parsed.pin !== undefined && (typeof parsed.pin !== 'string' || !/^\d{4}$/.test(parsed.pin))) return null;
    if (parsed.storageMode !== undefined && parsed.storageMode !== 'local' && parsed.storageMode !== 'cloud') return null;
    if (parsed.parentProfile !== undefined && parsed.parentProfile !== null && !isRecord(parsed.parentProfile)) return null;

    const { experience, ...family } = parsed;
    const backedUpExperience = parseBackedUpExperience(experience);
    return (backedUpExperience ? { ...family, experience: backedUpExperience } : family) as FamilyBackup;
  } catch {
    return null;
  }
};

export const serializeFamilyBackup = (backup: Omit<FamilyBackup, 'version' | 'exportedAt'>): string =>
  JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), ...backup }, null, 2);
