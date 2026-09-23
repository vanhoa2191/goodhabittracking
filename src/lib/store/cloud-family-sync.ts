import { z } from 'zod';
import type {
  ActivityLog,
  ChildBadge,
  ChildProfile,
  GroupTeam,
  HabitActivity,
  Kudo,
  Redemption,
  Reward,
  SubscriptionPlan,
} from '@/types';
import { getSupabase } from '@/lib/supabase';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { emptyExperienceState, parseExperienceState } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';
import {
  mapActivityLogRow,
  mapChildBadgeRow,
  mapChildProfileRow,
  mapHabitActivityRow,
  mapKudoRow,
  mapRedemptionRow,
  mapRewardRow,
} from '@/lib/supabase/mappers';

interface CloudFamilyRows {
  readonly familyId: string;
  readonly profiles: readonly unknown[];
  readonly activities: readonly unknown[];
  readonly logs: readonly unknown[];
  readonly rewards: readonly unknown[];
  readonly redemptions: readonly unknown[];
  readonly childBadges: readonly unknown[];
  readonly kudos: readonly unknown[];
  readonly groups: readonly unknown[];
  readonly groupMembers: readonly unknown[];
  readonly subscription: unknown | null;
  readonly experience?: unknown;
}

export type CloudFamilyReader = (userId: string) => Promise<CloudFamilyRows>;

export interface CloudFamilySnapshot {
  readonly familyId: string;
  readonly profiles: ChildProfile[];
  readonly activities: HabitActivity[];
  readonly logs: ActivityLog[];
  readonly rewards: Reward[];
  readonly redemptions: Redemption[];
  readonly childBadges: ChildBadge[];
  readonly kudos: Kudo[];
  readonly groups: GroupTeam[];
  readonly subscriptionPlan: SubscriptionPlan;
  readonly trialEndsAt: string | null;
  readonly subscriptionEndsAt: string | null;
  readonly experience: ExperienceState;
}

const familyIdSchema = z.string().uuid();

const groupRowSchema = z.object({
  id: z.string().uuid(),
  family_id: z.string().uuid(),
  name: z.string().min(1),
  invite_code: z.string().min(1),
  icon: z.string().min(1),
  created_by_child_id: z.string().uuid().nullable().optional(),
  weekly_target_points: z.number().int(),
  reward_type: z.enum(['badge', 'stars', 'mystery_box', 'custom']),
  custom_reward_text: z.string().nullable().optional(),
  created_at: z.string(),
});

const groupMemberRowSchema = z.object({
  group_id: z.string().uuid(),
  child_id: z.string().uuid(),
});

const subscriptionRowSchema = z.object({
  plan: z.enum(['free', 'trial', 'monthly', 'yearly', 'lifetime']),
  status: z.string(),
  trial_ends_at: z.string().nullable().optional(),
  subscription_ends_at: z.string().nullable().optional(),
});

function parseCloudFamilyRows(rows: CloudFamilyRows): CloudFamilySnapshot {
  const familyId = familyIdSchema.parse(rows.familyId);
  const membersByGroup = new Map<string, string[]>();

  for (const input of rows.groupMembers) {
    const member = groupMemberRowSchema.parse(input);
    const members = membersByGroup.get(member.group_id) ?? [];
    members.push(member.child_id);
    membersByGroup.set(member.group_id, members);
  }

  const subscription = rows.subscription === null
    ? null
    : subscriptionRowSchema.parse(rows.subscription);

  return {
    familyId,
    profiles: rows.profiles.map(mapChildProfileRow),
    activities: rows.activities.map(mapHabitActivityRow),
    logs: rows.logs.map(mapActivityLogRow),
    rewards: rows.rewards.map(mapRewardRow),
    redemptions: rows.redemptions.map(mapRedemptionRow),
    childBadges: rows.childBadges.map(mapChildBadgeRow),
    kudos: rows.kudos.map(mapKudoRow),
    groups: rows.groups.map((input) => {
      const group = groupRowSchema.parse(input);
      return {
        id: group.id,
        familyId: group.family_id,
        name: group.name,
        inviteCode: group.invite_code,
        icon: group.icon,
        createdByChildId: group.created_by_child_id ?? undefined,
        memberChildIds: membersByGroup.get(group.id) ?? [],
        weeklyTargetPoints: group.weekly_target_points,
        rewardType: group.reward_type,
        customRewardText: group.custom_reward_text ?? undefined,
        createdAt: group.created_at,
      };
    }),
    subscriptionPlan: subscription?.plan ?? 'free',
    trialEndsAt: subscription?.trial_ends_at ?? null,
    subscriptionEndsAt: subscription?.subscription_ends_at ?? null,
    experience: rows.experience === undefined
      ? emptyExperienceState
      : parseExperienceState(rows.experience, familyId),
  };
}

async function readCloudFamilyRows(userId: string): Promise<CloudFamilyRows> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const membershipResult = await supabase
    .from('family_memberships')
    .select('family_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membershipResult.error) throw membershipResult.error;
  if (!membershipResult.data) {
    throw new Error('Authenticated account has no family membership.');
  }

  const familyId = familyIdSchema.parse(membershipResult.data.family_id);
  const experienceEnabled = defaultExperienceFlags.dailyMascotLetter || defaultExperienceFlags.secretQuest;
  const [
    profilesResult,
    activitiesResult,
    logsResult,
    rewardsResult,
    redemptionsResult,
    badgesResult,
    kudosResult,
    groupsResult,
    membersResult,
    subscriptionResult,
    childEngagementResult,
    familySettingsResult,
    lettersResult,
    questsResult,
    wishlistsResult,
  ] = await Promise.all([
    supabase.from('child_profiles').select('*').eq('family_id', familyId),
    supabase.from('habit_activities').select('*').eq('family_id', familyId),
    supabase.from('activity_logs').select('*').eq('family_id', familyId),
    supabase.from('rewards').select('*').eq('family_id', familyId),
    supabase.from('redemptions').select('*').eq('family_id', familyId),
    supabase.from('child_badges').select('*').eq('family_id', familyId),
    supabase.from('kudos').select('*').eq('family_id', familyId).order('sent_at', { ascending: false }).limit(50),
    supabase.from('group_teams').select('*').eq('family_id', familyId),
    supabase.from('group_members').select('group_id, child_id').eq('family_id', familyId),
    supabase
      .from('user_subscriptions')
      .select('plan, status, trial_ends_at, subscription_ends_at')
      .eq('family_id', familyId)
      .maybeSingle(),
    experienceEnabled ? supabase.from('child_engagement_profiles').select('*').eq('family_id', familyId) : Promise.resolve({ data: [], error: null }),
    experienceEnabled ? supabase.from('family_engagement_settings').select('*').eq('family_id', familyId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    experienceEnabled ? supabase.from('daily_mascot_letters').select('*').eq('family_id', familyId) : Promise.resolve({ data: [], error: null }),
    experienceEnabled ? supabase.from('secret_quests').select('*').eq('family_id', familyId) : Promise.resolve({ data: [], error: null }),
    supabase.from('child_wishlists').select('*').eq('family_id', familyId),
  ]);

  const failedResult = [
    profilesResult,
    activitiesResult,
    logsResult,
    rewardsResult,
    redemptionsResult,
    badgesResult,
    kudosResult,
    groupsResult,
    membersResult,
    subscriptionResult,
    childEngagementResult,
    familySettingsResult,
    lettersResult,
    questsResult,
    wishlistsResult,
  ].find((result) => result.error);
  if (failedResult?.error) throw failedResult.error;

  return {
    familyId,
    profiles: profilesResult.data ?? [],
    activities: activitiesResult.data ?? [],
    logs: logsResult.data ?? [],
    rewards: rewardsResult.data ?? [],
    redemptions: redemptionsResult.data ?? [],
    childBadges: badgesResult.data ?? [],
    kudos: kudosResult.data ?? [],
    groups: groupsResult.data ?? [],
    groupMembers: membersResult.data ?? [],
    subscription: subscriptionResult.data,
    experience: {
      children: childEngagementResult.data ?? [],
      settings: familySettingsResult.data,
      letters: lettersResult.data ?? [],
      quests: questsResult.data ?? [],
      wishlists: wishlistsResult.data ?? [],
    },
  };
}

export async function loadCloudFamilySnapshot(
  userId: string,
  reader: CloudFamilyReader = readCloudFamilyRows,
): Promise<CloudFamilySnapshot> {
  return parseCloudFamilyRows(await reader(userId));
}
