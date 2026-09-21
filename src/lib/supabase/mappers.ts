import { z } from 'zod';
import type { ActivityLog, ChildBadge, ChildProfile, HabitActivity, Kudo, Redemption, Reward } from '@/types';

const childProfileRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable().optional(),
  family_id: z.string().uuid(),
  name: z.string().min(1),
  nickname: z.string().nullable().optional(),
  show_real_name_on_leaderboard: z.boolean(),
  is_public_on_leaderboard: z.boolean(),
  avatar: z.string().min(1),
  theme_color: z.string().min(1),
  points: z.number().int(),
  total_earned: z.number().int(),
  level: z.number().int(),
  streak: z.number().int(),
  birth_year: z.number().int().nullable().optional(),
  age_stage: z.enum(['0-3', '3-6', '6-12', '12-18']).nullable().optional(),
  last_active_date: z.string().nullable().optional(),
  league_tier: z.enum(['bronze', 'silver', 'gold', 'diamond']).nullable().optional(),
  created_at: z.string(),
});

const habitActivityRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable().optional(),
  family_id: z.string().uuid(),
  child_id: z.string().uuid().nullable(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  icon: z.string().min(1),
  category: z.enum([
    'wisdom',
    'mindset',
    'personality',
    'virtue',
    'capacity',
    'giving',
    'nutrition',
    'physical',
    'study',
    'chores',
    'health',
    'selfcare',
    'kindness',
  ]),
  points: z.number().int(),
  recurrence_type: z.enum(['daily', 'weekdays', 'weekends', 'custom']),
  recurrence_days: z.array(z.number().int().min(0).max(6)),
  time_of_day: z.enum(['morning', 'afternoon', 'evening', 'anytime']),
  duration_minutes: z.number().int().nullable().optional(),
  requires_approval: z.boolean(),
  is_active: z.boolean(),
  target_age_stage: z.enum(['0-3', '3-6', '6-12', '12-18', 'all']).nullable().optional(),
  is_parent_role: z.boolean().optional(),
  portrait16_key: z.string().nullable().optional(),
  bo_thi7_key: z.enum(['nhan', 'nhan_mat', 'ngon', 'tam', 'phong', 'than', 'toa']).nullable().optional(),
  created_at: z.string(),
});

export function mapChildProfileRow(input: unknown): ChildProfile {
  const row = childProfileRowSchema.parse(input);
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    familyId: row.family_id,
    name: row.name,
    nickname: row.nickname ?? undefined,
    showRealNameOnLeaderboard: row.show_real_name_on_leaderboard,
    isPublicOnLeaderboard: row.is_public_on_leaderboard,
    avatar: row.avatar,
    themeColor: row.theme_color,
    points: row.points,
    totalEarned: row.total_earned,
    level: row.level,
    streak: row.streak,
    birthYear: row.birth_year ?? undefined,
    ageStage: row.age_stage ?? undefined,
    lastActiveDate: row.last_active_date ?? undefined,
    leagueTier: row.league_tier ?? 'bronze',
    createdAt: row.created_at,
  };
}

export function mapHabitActivityRow(input: unknown): HabitActivity {
  const row = habitActivityRowSchema.parse(input);
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    familyId: row.family_id,
    childId: row.child_id,
    title: row.title,
    description: row.description ?? undefined,
    icon: row.icon,
    category: row.category,
    points: row.points,
    recurrenceType: row.recurrence_type,
    recurrenceDays: row.recurrence_days,
    timeOfDay: row.time_of_day,
    durationMinutes: row.duration_minutes ?? 0,
    requiresApproval: row.requires_approval,
    isActive: row.is_active,
    targetAgeStage: row.target_age_stage ?? 'all',
    isParentRole: row.is_parent_role ?? false,
    portrait16Key: row.portrait16_key ?? undefined,
    boThi7Key: row.bo_thi7_key ?? undefined,
    createdAt: row.created_at,
  };
}

const activityLogRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable().optional(),
  family_id: z.string().uuid(),
  activity_id: z.string().uuid(),
  child_id: z.string().uuid(),
  log_date: z.string(),
  status: z.enum(['completed', 'pending_approval', 'approved', 'rejected']),
  points_awarded: z.number().int(),
  completed_at: z.string(),
  proof_note: z.string().nullable().optional(),
});

export function mapActivityLogRow(input: unknown): ActivityLog {
  const row = activityLogRowSchema.parse(input);
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    familyId: row.family_id,
    activityId: row.activity_id,
    childId: row.child_id,
    date: row.log_date,
    status: row.status,
    pointsAwarded: row.points_awarded,
    completedAt: row.completed_at,
    proofNote: row.proof_note ?? undefined,
  };
}

const rewardRowSchema = z.object({
  id: z.string().uuid(), user_id: z.string().uuid().nullable().optional(), family_id: z.string().uuid(),
  title: z.string(), description: z.string().nullable().optional(), icon: z.string(), cost_points: z.number().int(),
  stock: z.number().int(), is_active: z.boolean(), created_at: z.string(),
});

export function mapRewardRow(input: unknown): Reward {
  const row = rewardRowSchema.parse(input);
  return { id: row.id, userId: row.user_id ?? undefined, familyId: row.family_id, title: row.title,
    description: row.description ?? undefined, icon: row.icon, costPoints: row.cost_points, stock: row.stock,
    isActive: row.is_active, createdAt: row.created_at };
}

const redemptionRowSchema = z.object({
  id: z.string().uuid(), user_id: z.string().uuid().nullable().optional(), family_id: z.string().uuid(),
  reward_id: z.string().uuid(), child_id: z.string().uuid(), points_spent: z.number().int(),
  status: z.enum(['pending', 'approved', 'delivered', 'rejected']), requested_at: z.string(),
  resolved_at: z.string().nullable().optional(),
});

export function mapRedemptionRow(input: unknown): Redemption {
  const row = redemptionRowSchema.parse(input);
  return { id: row.id, userId: row.user_id ?? undefined, familyId: row.family_id, rewardId: row.reward_id,
    childId: row.child_id, pointsSpent: row.points_spent, status: row.status, requestedAt: row.requested_at,
    resolvedAt: row.resolved_at ?? undefined };
}

const childBadgeRowSchema = z.object({
  family_id: z.string().uuid(), child_id: z.string().uuid(), badge_id: z.string(), unlocked_at: z.string(),
});

export function mapChildBadgeRow(input: unknown): ChildBadge {
  const row = childBadgeRowSchema.parse(input);
  return { familyId: row.family_id, childId: row.child_id, badgeId: row.badge_id, unlockedAt: row.unlocked_at };
}

const kudoRowSchema = z.object({
  id: z.string().uuid(), family_id: z.string().uuid(), from_child_id: z.string().uuid().nullable().optional(),
  from_child_name: z.string(), to_child_id: z.string().uuid(), emoji: z.string(), sent_at: z.string(),
});

export function mapKudoRow(input: unknown): Kudo {
  const row = kudoRowSchema.parse(input);
  return { id: row.id, familyId: row.family_id, fromChildId: row.from_child_id ?? undefined,
    fromChildName: row.from_child_name, toChildId: row.to_child_id, emoji: row.emoji, sentAt: row.sent_at };
}
