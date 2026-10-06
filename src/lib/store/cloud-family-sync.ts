import { z } from 'zod';
import { PAID_PLAN_IDS } from '@/lib/billing/plan-catalog';
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
import { emptyWhenTableMissing } from '@/lib/supabase/missing-table';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { emptyExperienceState, experienceColumns, parseExperienceState } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';
import {
  familyCoreColumns,
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
  readonly familyRole: FamilyRole;
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

export type FamilyRole = 'owner' | 'parent' | 'guardian' | 'caregiver';

export interface CloudFamilySnapshot {
  readonly familyId: string;
  readonly familyRole: FamilyRole;
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
const familyRoleSchema = z.enum(['owner', 'parent', 'guardian', 'caregiver']);

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

const groupColumns = Object.keys(groupRowSchema.shape).join(',');

const groupMemberRowSchema = z.object({
  group_id: z.string().uuid(),
  child_id: z.string().uuid(),
});

const subscriptionRowSchema = z.object({
  plan: z.enum(['free', 'trial', ...PAID_PLAN_IDS, 'lifetime']),
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

  const profiles = rows.profiles.map(mapChildProfileRow);
  const profileNames = new Map(profiles.map((profile) => [profile.id, profile.name]));

  return {
    familyId,
    familyRole: familyRoleSchema.parse(rows.familyRole),
    profiles,
    activities: rows.activities.map(mapHabitActivityRow),
    logs: rows.logs.map(mapActivityLogRow),
    rewards: rows.rewards.map(mapRewardRow),
    redemptions: rows.redemptions.map(mapRedemptionRow),
    childBadges: rows.childBadges.map(mapChildBadgeRow),
    kudos: rows.kudos.map(mapKudoRow).map((kudo) => ({
      ...kudo,
      fromChildName: (kudo.fromChildId && profileNames.get(kudo.fromChildId)) || kudo.fromChildName,
    })),
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
    // A cancelled or inactive subscription grants nothing, whatever plan it still names.
    subscriptionPlan: subscription?.status === 'active' ? subscription.plan : 'free',
    trialEndsAt: subscription?.status === 'active' ? subscription.trial_ends_at ?? null : null,
    subscriptionEndsAt: subscription?.status === 'active' ? subscription.subscription_ends_at ?? null : null,
    experience: rows.experience === undefined
      ? emptyExperienceState
      : parseExperienceState(rows.experience, familyId),
  };
}

function isFamilyRows(value: unknown): value is CloudFamilyRows {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && typeof (value as { familyId?: unknown }).familyId === 'string';
}

/** PostgREST says PGRST202, Postgres itself says 42883, when the function is not in the database. */
function isMissingFunction(error: { code?: string }): boolean {
  return error.code === 'PGRST202' || error.code === '42883';
}

export async function readCloudFamilyRows(
  userId: string,
  supabase: ReturnType<typeof getSupabase> = getSupabase(),
): Promise<CloudFamilyRows> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // One round trip for the whole family. A database that does not have the function yet answers with
  // 'function not found', and the separate queries below still work.
  const snapshot = await supabase.rpc('family_snapshot', {
    include_experience: defaultExperienceFlags.dailyMascotLetter || defaultExperienceFlags.secretQuest,
    include_journal: defaultExperienceFlags.dailyJournal,
    include_city: defaultExperienceFlags.dreamCity,
  });
  if (!snapshot.error) {
    if (snapshot.data === null) throw new Error('Authenticated account has no family membership.');
    // An answer that is not a family (a proxy or an older database answering something else) is not trusted.
    if (isFamilyRows(snapshot.data)) return snapshot.data;
  } else if (!isMissingFunction(snapshot.error)) {
    throw snapshot.error;
  }

  const membershipResult = await supabase
    .from('family_memberships')
    .select('family_id, role')
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
    deferredTasksResult,
    supportObservationsResult,
    cuePlansResult,
    journalEntriesResult,
    cityPurchasesResult,
  ] = await Promise.all([
    supabase.from('child_profiles').select(familyCoreColumns.child_profiles.join(',')).eq('family_id', familyId),
    supabase.from('habit_activities').select(familyCoreColumns.habit_activities.join(',')).eq('family_id', familyId),
    supabase.from('activity_logs').select(familyCoreColumns.activity_logs.join(',')).eq('family_id', familyId),
    supabase.from('rewards').select(familyCoreColumns.rewards.join(',')).eq('family_id', familyId),
    supabase.from('redemptions').select(familyCoreColumns.redemptions.join(',')).eq('family_id', familyId),
    supabase.from('child_badges').select(familyCoreColumns.child_badges.join(',')).eq('family_id', familyId),
    supabase.from('kudos').select(familyCoreColumns.kudos.join(',')).eq('family_id', familyId).order('sent_at', { ascending: false }).limit(50),
    supabase.from('group_teams').select(groupColumns).eq('family_id', familyId),
    supabase.from('group_members').select('group_id, child_id').eq('family_id', familyId),
    supabase
      .from('user_subscriptions')
      .select('plan, status, trial_ends_at, subscription_ends_at')
      .eq('family_id', familyId)
      .maybeSingle(),
    experienceEnabled ? supabase.from('child_engagement_profiles').select(experienceColumns.child_engagement_profiles.join(',')).eq('family_id', familyId) : Promise.resolve({ data: [], error: null }),
    experienceEnabled ? supabase.from('family_engagement_settings').select(experienceColumns.family_engagement_settings.join(',')).eq('family_id', familyId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    experienceEnabled ? supabase.from('daily_mascot_letters').select(experienceColumns.daily_mascot_letters.join(',')).eq('family_id', familyId) : Promise.resolve({ data: [], error: null }),
    experienceEnabled ? supabase.from('secret_quests').select(experienceColumns.secret_quests.join(',')).eq('family_id', familyId) : Promise.resolve({ data: [], error: null }),
    supabase.from('child_wishlists').select(experienceColumns.child_wishlists.join(',')).eq('family_id', familyId),
    supabase.from('child_task_deferrals').select(experienceColumns.child_task_deferrals.join(',')).eq('family_id', familyId),
    supabase.from('habit_support_observations').select(experienceColumns.habit_support_observations.join(',')).eq('family_id', familyId).then(emptyWhenTableMissing),
    supabase.from('habit_cue_plans').select(experienceColumns.habit_cue_plans.join(',')).eq('family_id', familyId).then(emptyWhenTableMissing),
    defaultExperienceFlags.dailyJournal
      ? supabase.from('child_journal_entries').select(experienceColumns.child_journal_entries.join(',')).eq('family_id', familyId)
      : Promise.resolve({ data: [], error: null }),
    defaultExperienceFlags.dreamCity
      ? supabase.from('child_city_purchases').select(experienceColumns.child_city_purchases.join(',')).eq('family_id', familyId)
      : Promise.resolve({ data: [], error: null }),
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
    deferredTasksResult,
    supportObservationsResult,
    cuePlansResult,
    journalEntriesResult,
    cityPurchasesResult,
  ].find((result) => result.error);
  if (failedResult?.error) throw failedResult.error;

  return {
    familyId,
    familyRole: familyRoleSchema.parse(membershipResult.data.role),
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
      deferredTasks: deferredTasksResult.data ?? [],
      supportObservations: supportObservationsResult.data ?? [],
      cuePlans: cuePlansResult.data ?? [],
      journalEntries: journalEntriesResult.data ?? [],
      cityPurchases: cityPurchasesResult.data ?? [],
    },
  };
}

export async function loadCloudFamilySnapshot(
  userId: string,
  reader: CloudFamilyReader = readCloudFamilyRows,
): Promise<CloudFamilySnapshot> {
  return parseCloudFamilyRows(await reader(userId));
}
