import type {
  ActivityLog,
  ChildProfile,
  HabitActivity,
  Redemption,
  Reward,
} from '@/types';

interface ProfileRemoval {
  profiles: ChildProfile[];
  activeChildId: string | null;
}

interface HabitApproval {
  logs: ActivityLog[];
  profiles: ChildProfile[];
}

interface RedemptionState {
  redemptions: Redemption[];
  profiles: ChildProfile[];
}

export function addProfile(profiles: readonly ChildProfile[], profile: ChildProfile): ChildProfile[] {
  return [...profiles, profile];
}

export function updateProfileList(
  profiles: readonly ChildProfile[],
  id: string,
  updates: Partial<ChildProfile>,
): ChildProfile[] {
  return profiles.map((profile) => profile.id === id ? { ...profile, ...updates } : profile);
}

export function removeProfile(
  profiles: readonly ChildProfile[],
  id: string,
  activeChildId: string | null,
): ProfileRemoval {
  const remaining = profiles.filter((profile) => profile.id !== id);
  return {
    profiles: remaining,
    activeChildId: activeChildId === id ? remaining[0]?.id ?? null : activeChildId,
  };
}

export function adjustProfilePoints(
  profiles: readonly ChildProfile[],
  childId: string,
  amount: number,
): ChildProfile[] {
  return profiles.map((profile) => {
    if (profile.id !== childId) return profile;
    const totalEarned = amount > 0 ? profile.totalEarned + amount : profile.totalEarned;
    return {
      ...profile,
      points: Math.max(0, profile.points + amount),
      totalEarned,
      level: Math.max(1, Math.floor(totalEarned / 100) + 1),
    };
  });
}

export function addActivity(
  activities: readonly HabitActivity[],
  activity: HabitActivity,
): HabitActivity[] {
  return [activity, ...activities];
}

export function updateActivityList(
  activities: readonly HabitActivity[],
  id: string,
  updates: Partial<HabitActivity>,
): HabitActivity[] {
  return activities.map((activity) => activity.id === id ? { ...activity, ...updates } : activity);
}

export function removeActivity(
  activities: readonly HabitActivity[],
  id: string,
): HabitActivity[] {
  return activities.filter((activity) => activity.id !== id);
}

export function approvePendingLog(
  logs: readonly ActivityLog[],
  profiles: readonly ChildProfile[],
  activities: readonly HabitActivity[],
  logId: string,
): HabitApproval {
  const log = logs.find((candidate) => candidate.id === logId);
  if (!log || log.status !== 'pending_approval') {
    return { logs: [...logs], profiles: [...profiles] };
  }

  const points = activities.find((activity) => activity.id === log.activityId)?.points ?? 10;
  return {
    logs: logs.map((candidate) => candidate.id === logId
      ? { ...candidate, status: 'approved', pointsAwarded: points }
      : candidate),
    profiles: adjustProfilePoints(profiles, log.childId, points),
  };
}

export function rejectPendingLog(logs: readonly ActivityLog[], logId: string): ActivityLog[] {
  return logs.map((log) => log.id === logId && log.status === 'pending_approval'
    ? { ...log, status: 'rejected', pointsAwarded: 0 }
    : log);
}

export function addReward(rewards: readonly Reward[], reward: Reward): Reward[] {
  return [reward, ...rewards];
}

export function updateRewardList(
  rewards: readonly Reward[],
  id: string,
  updates: Partial<Reward>,
): Reward[] {
  return rewards.map((reward) => reward.id === id ? { ...reward, ...updates } : reward);
}

export function removeReward(rewards: readonly Reward[], id: string): Reward[] {
  return rewards.filter((reward) => reward.id !== id);
}

export function claimLocalReward(
  profiles: readonly ChildProfile[],
  redemptions: readonly Redemption[],
  childId: string,
  reward: Reward,
  redemptionId: string,
  requestedAt: string,
): RedemptionState | null {
  const child = profiles.find((profile) => profile.id === childId);
  if (!child || child.points < reward.costPoints) return null;

  const redemption: Redemption = {
    id: redemptionId,
    rewardId: reward.id,
    childId,
    pointsSpent: reward.costPoints,
    status: 'pending',
    requestedAt,
  };
  return {
    profiles: profiles.map((profile) => profile.id === childId
      ? { ...profile, points: profile.points - reward.costPoints }
      : profile),
    redemptions: [redemption, ...redemptions],
  };
}

export function transitionLocalRedemption(
  redemptions: readonly Redemption[],
  profiles: readonly ChildProfile[],
  redemptionId: string,
  decision: 'approve' | 'deliver' | 'reject',
  resolvedAt: string,
): RedemptionState {
  const redemption = redemptions.find((candidate) => candidate.id === redemptionId);
  const canTransition = redemption
    && ((decision === 'approve' && redemption.status === 'pending')
      || (decision === 'deliver' && (redemption.status === 'pending' || redemption.status === 'approved'))
      || (decision === 'reject' && (redemption.status === 'pending' || redemption.status === 'approved')));
  if (!redemption || !canTransition) {
    return { redemptions: [...redemptions], profiles: [...profiles] };
  }

  const status = decision === 'deliver' ? 'delivered' : decision === 'approve' ? 'approved' : 'rejected';
  const nextProfiles = decision === 'reject'
    ? profiles.map((profile) => profile.id === redemption.childId
      ? { ...profile, points: profile.points + redemption.pointsSpent }
      : profile)
    : [...profiles];

  return {
    profiles: nextProfiles,
    redemptions: redemptions.map((candidate) => candidate.id === redemptionId
      ? { ...candidate, status, resolvedAt }
      : candidate),
  };
}
