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
    const profiles = existingLog.pointsAwarded > 0
      ? input.profiles.map((profile) => profile.id === input.childId
        ? {
            ...profile,
            points: Math.max(0, profile.points - existingLog.pointsAwarded),
            totalEarned: Math.max(0, profile.totalEarned - existingLog.pointsAwarded),
          }
        : profile)
      : [...input.profiles];
    return {
      kind: LOCAL_HABIT_OUTCOMES.undone,
      profiles,
      logs: input.logs.filter((log) => log.id !== existingLog.id),
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
    level: Math.max(1, Math.floor(totalEarned / 100) + 1),
    streak: input.date === input.today && currentProfile.lastActiveDate !== input.today
      ? currentProfile.streak + 1
      : currentProfile.streak,
    lastActiveDate: input.today,
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
