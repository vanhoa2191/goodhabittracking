import type {
  ActivityLog,
  ChildProfile,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardScope,
  LeagueTier,
} from '@/types';

export function getLeagueTier(points: number): LeagueTier {
  if (points >= 300) return 'diamond';
  if (points >= 150) return 'gold';
  if (points >= 70) return 'silver';
  return 'bronze';
}

interface BuildLeaderboardInput {
  profiles: ChildProfile[];
  logs: ActivityLog[];
  activeChildId: string | null;
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  now?: Date;
}

export function buildLeaderboard({
  profiles,
  logs,
  activeChildId,
  scope,
  period,
  now = new Date(),
}: BuildLeaderboardInput): LeaderboardEntry[] {
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];

  const entries = profiles
    .filter((profile) => (
      scope !== 'global'
      || profile.isPublicOnLeaderboard !== false
      || profile.id === activeChildId
    ))
    .map((profile) => {
      const childLogs = logs.filter((log) => (
        log.childId === profile.id
        && (log.status === 'completed' || log.status === 'approved')
      ));

      let periodPoints = profile.points;
      if (period === 'daily') {
        const todayEarned = childLogs
          .filter((log) => log.date === todayStr)
          .reduce((sum, log) => sum + log.pointsAwarded, 0);
        periodPoints = Math.max(todayEarned, Math.round(profile.points * 0.2) || 10);
      } else if (period === 'weekly') {
        const weekEarned = childLogs
          .filter((log) => log.date >= sevenDaysStr)
          .reduce((sum, log) => sum + log.pointsAwarded, 0);
        periodPoints = Math.max(weekEarned, Math.round(profile.points * 0.6) || 25);
      } else {
        periodPoints = profile.totalEarned || profile.points;
      }

      let nickname = profile.name;
      if (profile.showRealNameOnLeaderboard === true) {
        nickname = profile.name;
      } else if (profile.nickname && profile.nickname.trim().length > 0) {
        nickname = profile.nickname.trim();
      } else {
        const parts = profile.name.trim().split(/\s+/);
        nickname = `Bé ${parts[parts.length - 1]}`;
      }

      return {
        childId: profile.id,
        nickname,
        avatar: profile.avatar,
        themeColor: profile.themeColor,
        points: periodPoints,
        streak: profile.streak,
        isCurrentChild: profile.id === activeChildId,
      };
    })
    .sort((first, second) => second.points - first.points);

  return entries.map((entry, index) => ({
    ...entry,
    tier: getLeagueTier(entry.points),
    rank: index + 1,
  }));
}
