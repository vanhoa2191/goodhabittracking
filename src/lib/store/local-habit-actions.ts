import { habitFireForChild } from '@/lib/habit-fire';
import type {
  ActivityLog,
  Badge,
  ChildBadge,
  ChildProfile,
  HabitActivity,
} from '@/types';

const LOCAL_HABIT_OUTCOMES = {
  completed: 'completed',
  pendingApproval: 'pending_approval',
  undone: 'undone',
} as const;

type LocalHabitOutcome = (typeof LOCAL_HABIT_OUTCOMES)[keyof typeof LOCAL_HABIT_OUTCOMES];

type LocalHabitToggleInput = {
  readonly profiles: readonly ChildProfile[];
  readonly logs: readonly ActivityLog[];
  readonly childBadges: readonly ChildBadge[];
  readonly badges: readonly Badge[];
  readonly activity: HabitActivity;
  readonly childId: string;
  readonly date: string;
  readonly today: string;
  readonly logId: string;
  readonly completedAt: string;
};

type LocalHabitToggleResult = {
  readonly kind: LocalHabitOutcome;
  readonly profiles: ChildProfile[];
  readonly logs: ActivityLog[];
  readonly childBadges: ChildBadge[];
  readonly unlockedBadgeCount: number;
};

function levelForTotal(totalEarned: number): number {
  return Math.max(1, Math.floor(totalEarned / 100) + 1);
}

/** The most recent day with a verified completion, so the streak never depends on when a card was tapped. */
function latestVerifiedDate(logs: readonly ActivityLog[], childId: string): string | undefined {
  return logs
    .filter((log) => log.childId === childId && (log.status === 'completed' || log.status === 'approved'))
    .map((log) => log.date)
    .sort()
    .at(-1);
}

function qualifiesForBadge(
  badge: Badge,
  profile: ChildProfile,
  totalCompletedCount: number,
): boolean {
  switch (badge.criteriaType) {
    case 'firstTask':
      return totalCompletedCount >= 1;
    case 'streak':
      return profile.streak >= badge.criteriaValue;
    case 'totalTasks':
      return totalCompletedCount >= badge.criteriaValue;
    case 'totalPoints':
      return profile.totalEarned >= badge.criteriaValue;
    case 'portrait':
    case 'portraitCollection':
      // Portrait badges need each habit's framework link; useBadgeAwards resolves them.
      return false;
    default: {
      const unreachable: never = badge.criteriaType;
      return unreachable;
    }
  }
}

function unlockQualifiedBadges(
  childBadges: readonly ChildBadge[],
  badges: readonly Badge[],
  profile: ChildProfile,
  totalCompletedCount: number,
  unlockedAt: string,
): ChildBadge[] {
  const existingBadgeIds = new Set(
    childBadges
      .filter((childBadge) => childBadge.childId === profile.id)
      .map((childBadge) => childBadge.badgeId),
  );
  const unlocked = badges
    .filter((badge) => !existingBadgeIds.has(badge.id))
    .filter((badge) => qualifiesForBadge(badge, profile, totalCompletedCount))
    .map((badge): ChildBadge => ({
      childId: profile.id,
      badgeId: badge.id,
      unlockedAt,
    }));
  return [...childBadges, ...unlocked];
}

export function toggleLocalHabit(input: LocalHabitToggleInput): LocalHabitToggleResult {
  const existingLog = input.logs.find((log) =>
    log.activityId === input.activity.id
    && log.childId === input.childId
    && log.date === input.date,
  );
  if (existingLog) {
    const remainingLogs = input.logs.filter((log) => log.id !== existingLog.id);
    const profiles = input.profiles.map((profile) => {
      if (profile.id !== input.childId) return profile;
      const totalEarned = Math.max(0, profile.totalEarned - existingLog.pointsAwarded);
      return {
        ...profile,
        points: Math.max(0, profile.points - existingLog.pointsAwarded),
        totalEarned,
        level: levelForTotal(totalEarned),
        streak: habitFireForChild(remainingLogs, input.childId, input.today).days,
        lastActiveDate: latestVerifiedDate(remainingLogs, input.childId),
      };
    });
    return {
      kind: LOCAL_HABIT_OUTCOMES.undone,
      profiles,
      logs: remainingLogs,
      childBadges: [...input.childBadges],
      unlockedBadgeCount: 0,
    };
  }

  const pointsAwarded = input.activity.requiresApproval ? 0 : input.activity.points;
  const newLog: ActivityLog = {
    id: input.logId,
    activityId: input.activity.id,
    childId: input.childId,
    date: input.date,
    status: input.activity.requiresApproval ? 'pending_approval' : 'completed',
    pointsAwarded,
    completedAt: input.completedAt,
  };
  const logs = [newLog, ...input.logs];
  if (input.activity.requiresApproval) {
    return {
      kind: LOCAL_HABIT_OUTCOMES.pendingApproval,
      profiles: [...input.profiles],
      logs,
      childBadges: [...input.childBadges],
      unlockedBadgeCount: 0,
    };
  }

  const currentProfile = input.profiles.find((profile) => profile.id === input.childId);
  if (!currentProfile) {
    return {
      kind: LOCAL_HABIT_OUTCOMES.completed,
      profiles: [...input.profiles],
      logs,
      childBadges: [...input.childBadges],
      unlockedBadgeCount: 0,
    };
  }

  const totalEarned = currentProfile.totalEarned + pointsAwarded;
  const updatedProfile: ChildProfile = {
    ...currentProfile,
    points: currentProfile.points + pointsAwarded,
    totalEarned,
    level: levelForTotal(totalEarned),
    streak: habitFireForChild(logs, input.childId, input.today).days,
    lastActiveDate: latestVerifiedDate(logs, input.childId),
  };
  const profiles = input.profiles.map((profile) =>
    profile.id === input.childId ? updatedProfile : profile,
  );
  const completedCount = logs.filter((log) =>
    log.childId === input.childId && (log.status === 'completed' || log.status === 'approved'),
  ).length;
  const childBadges = unlockQualifiedBadges(
    input.childBadges,
    input.badges,
    updatedProfile,
    completedCount,
    input.completedAt,
  );
  return {
    kind: LOCAL_HABIT_OUTCOMES.completed,
    profiles,
    logs,
    childBadges,
    unlockedBadgeCount: childBadges.length - input.childBadges.length,
  };
}
