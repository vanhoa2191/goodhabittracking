import { weekStart } from '@/lib/habit-programs/opportunities';
import type {
  ActivityLog,
  ChildProfile,
  GroupTeam,
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

/** First day of a calendar period, for a viewer whose local day is `today` (YYYY-MM-DD). */
export function periodStart(period: LeaderboardPeriod, today: string): string {
  if (period === 'daily') return today;
  if (period === 'weekly') return weekStart(today);
  return `${today.slice(0, 7)}-01`;
}

interface BuildLeaderboardInput {
  profiles: readonly ChildProfile[];
  logs: readonly ActivityLog[];
  groups: readonly GroupTeam[];
  activeChildId: string | null;
  /** 'global' is not built from local data: it comes from the public leaderboard of the server. */
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  /** The viewer's local day, YYYY-MM-DD. */
  today: string;
}

const collator = new Intl.Collator('vi');

/**
 * The family and group boards. Points are exactly what each child earned in the period from verified logs, by the
 * child's own local day; nothing is added to make a quiet day or week look busier, and spending points changes nothing.
 */
export function buildLeaderboard({
  profiles,
  logs,
  groups,
  activeChildId,
  scope,
  period,
  today,
}: BuildLeaderboardInput): LeaderboardEntry[] {
  if (scope === 'global') return [];

  const groupmates = new Set<string>();
  if (scope === 'group' && activeChildId) {
    groupmates.add(activeChildId);
    for (const group of groups) {
      if (!group.memberChildIds.includes(activeChildId)) continue;
      for (const childId of group.memberChildIds) groupmates.add(childId);
    }
  }
  const start = periodStart(period, today);
  const earnedBy = new Map<string, number>();
  for (const log of logs) {
    if ((log.status !== 'completed' && log.status !== 'approved') || log.date < start || log.date > today) continue;
    earnedBy.set(log.childId, (earnedBy.get(log.childId) ?? 0) + log.pointsAwarded);
  }

  return profiles
    .filter((profile) => scope === 'family' || groupmates.has(profile.id))
    .map((profile) => ({
      childId: profile.id as string | null,
      nickname: profile.showRealNameOnLeaderboard ? profile.name : profile.nickname?.trim() || profile.name,
      avatar: profile.avatar,
      themeColor: profile.themeColor,
      points: earnedBy.get(profile.id) ?? 0,
      streak: profile.streak,
      tier: getLeagueTier(profile.totalEarned),
      isCurrentChild: profile.id === activeChildId,
    }))
    .sort((first, second) => second.points - first.points || collator.compare(first.nickname, second.nickname))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

