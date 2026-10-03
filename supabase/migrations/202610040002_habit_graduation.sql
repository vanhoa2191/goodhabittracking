begin;

-- A habit a child now does alone is "graduated": the parent sets it aside (is_active = false) and the app keeps the
-- day it happened and a day to ask again. base_points remembers the stars a task was worth before a parent stepped
-- them down, so the step can be undone. Parents already write their own family's activities; these columns add no
-- new way in for a child device.
alter table public.habit_activities
  add column if not exists graduated_at timestamptz,
  add column if not exists graduation_check_due date,
  add column if not exists base_points integer;

alter table public.habit_activities
  drop constraint if exists habit_activities_base_points_range,
  add constraint habit_activities_base_points_range check (base_points is null or (base_points >= 1 and base_points <= 10000)),
  drop constraint if exists habit_activities_graduation_check_needs_graduation,
  add constraint habit_activities_graduation_check_needs_graduation check (graduation_check_due is null or graduated_at is not null);

-- The family snapshot returns the new columns by name, like every other column the app reads.
create or replace function public.family_snapshot(
  include_experience boolean default true,
  include_journal boolean default true,
  include_city boolean default true
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  membership record;
  fid uuid;
begin
  select m.family_id, m.role into membership
  from public.family_memberships m
  where m.user_id = auth.uid()
  order by m.created_at asc
  limit 1;
  if not found then return null; end if;
  fid := membership.family_id;

  return jsonb_build_object(
    'familyId', fid,
    'familyRole', membership.role,
    'profiles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'user_id', t.user_id, 'family_id', t.family_id, 'name', t.name, 'nickname', t.nickname,
        'show_real_name_on_leaderboard', t.show_real_name_on_leaderboard,
        'is_public_on_leaderboard', t.is_public_on_leaderboard, 'avatar', t.avatar, 'theme_color', t.theme_color,
        'points', t.points, 'total_earned', t.total_earned, 'level', t.level, 'streak', t.streak,
        'birth_year', t.birth_year, 'age_stage', t.age_stage, 'age_band_override', t.age_band_override,
        'last_active_date', t.last_active_date, 'league_tier', t.league_tier, 'created_at', t.created_at
      ))
      from public.child_profiles t where t.family_id = fid
    ), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'user_id', t.user_id, 'family_id', t.family_id, 'child_id', t.child_id, 'title', t.title,
        'description', t.description, 'instructions', t.instructions, 'icon', t.icon, 'category', t.category,
        'points', t.points, 'recurrence_type', t.recurrence_type, 'recurrence_days', t.recurrence_days,
        'time_of_day', t.time_of_day, 'duration_minutes', t.duration_minutes,
        'requires_approval', t.requires_approval, 'is_active', t.is_active,
        'target_age_stage', t.target_age_stage, 'is_parent_role', t.is_parent_role,
        'portrait16_key', t.portrait16_key, 'bo_thi7_key', t.bo_thi7_key,
        'framework_habit_id', t.framework_habit_id, 'framework_content_version', t.framework_content_version,
        'legacy_template_id', t.legacy_template_id, 'journey_habit_key', t.journey_habit_key,
        'graduated_at', t.graduated_at, 'graduation_check_due', t.graduation_check_due, 'base_points', t.base_points,
        'created_at', t.created_at
      ))
      from public.habit_activities t where t.family_id = fid
    ), '[]'::jsonb),
    'logs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'user_id', t.user_id, 'family_id', t.family_id, 'activity_id', t.activity_id,
        'child_id', t.child_id, 'log_date', t.log_date, 'status', t.status, 'points_awarded', t.points_awarded,
        'completed_at', t.completed_at, 'proof_note', t.proof_note
      ))
      from public.activity_logs t where t.family_id = fid
    ), '[]'::jsonb),
    'rewards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'user_id', t.user_id, 'family_id', t.family_id, 'title', t.title,
        'description', t.description, 'icon', t.icon, 'cost_points', t.cost_points, 'stock', t.stock,
        'is_active', t.is_active, 'created_at', t.created_at
      ))
      from public.rewards t where t.family_id = fid
    ), '[]'::jsonb),
    'redemptions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'user_id', t.user_id, 'family_id', t.family_id, 'reward_id', t.reward_id,
        'child_id', t.child_id, 'points_spent', t.points_spent, 'status', t.status,
        'requested_at', t.requested_at, 'resolved_at', t.resolved_at
      ))
      from public.redemptions t where t.family_id = fid
    ), '[]'::jsonb),
    'childBadges', coalesce((
      select jsonb_agg(jsonb_build_object(
        'family_id', t.family_id, 'child_id', t.child_id, 'badge_id', t.badge_id, 'unlocked_at', t.unlocked_at
      ))
      from public.child_badges t where t.family_id = fid
    ), '[]'::jsonb),
    'kudos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'family_id', t.family_id, 'from_child_id', t.from_child_id, 'to_child_id', t.to_child_id,
        'emoji', t.emoji, 'sent_at', t.sent_at
      ))
      from (select * from public.kudos where kudos.family_id = fid order by sent_at desc limit 50) t
    ), '[]'::jsonb),
    'groups', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'family_id', t.family_id, 'name', t.name, 'invite_code', t.invite_code, 'icon', t.icon,
        'created_by_child_id', t.created_by_child_id, 'weekly_target_points', t.weekly_target_points,
        'reward_type', t.reward_type, 'custom_reward_text', t.custom_reward_text, 'created_at', t.created_at
      ))
      from public.group_teams t where t.family_id = fid
    ), '[]'::jsonb),
    'groupMembers', coalesce((
      select jsonb_agg(jsonb_build_object('group_id', t.group_id, 'child_id', t.child_id))
      from public.group_members t where t.family_id = fid
    ), '[]'::jsonb),
    'subscription', (
      select jsonb_build_object(
        'plan', s.plan,
        'status', s.status,
        'trial_ends_at', s.trial_ends_at,
        'subscription_ends_at', s.subscription_ends_at
      )
      from public.user_subscriptions s where s.family_id = fid limit 1
    ),
    'experience', jsonb_build_object(
      'children', case when include_experience then coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'mascot_selected_at', t.mascot_selected_at
        ))
        from public.child_engagement_profiles t where t.family_id = fid
      ), '[]'::jsonb) else '[]'::jsonb end,
      'settings', case when include_experience then (
        select jsonb_build_object(
          'family_id', t.family_id, 'paused_at', t.paused_at, 'pause_reason', t.pause_reason,
          'pause_periods', t.pause_periods
        )
        from public.family_engagement_settings t where t.family_id = fid limit 1
      ) else null end,
      'letters', case when include_experience then coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'local_date', t.local_date,
          'template_key', t.template_key, 'read_at', t.read_at
        ))
        from public.daily_mascot_letters t where t.family_id = fid
      ), '[]'::jsonb) else '[]'::jsonb end,
      'quests', case when include_experience then coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'local_date', t.local_date, 'quest_key', t.quest_key,
          'unlocked_at', t.unlocked_at, 'expires_at', t.expires_at, 'completed_at', t.completed_at
        ))
        from public.secret_quests t where t.family_id = fid
      ), '[]'::jsonb) else '[]'::jsonb end,
      'wishlists', coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'reward_id', t.reward_id, 'chosen_at', t.chosen_at
        ))
        from public.child_wishlists t where t.family_id = fid
      ), '[]'::jsonb),
      'deferredTasks', coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'activity_id', t.activity_id,
          'local_date', t.local_date, 'deferred_at', t.deferred_at
        ))
        from public.child_task_deferrals t where t.family_id = fid
      ), '[]'::jsonb),
      'supportObservations', coalesce((
        select jsonb_agg(jsonb_build_object(
          'log_id', t.log_id, 'family_id', t.family_id, 'child_id', t.child_id, 'activity_id', t.activity_id,
          'support_level', t.support_level, 'recorded_by', t.recorded_by, 'recorded_at', t.recorded_at
        ))
        from public.habit_support_observations t where t.family_id = fid
      ), '[]'::jsonb),
      'cuePlans', coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'activity_id', t.activity_id, 'cue_kind', t.cue_kind,
          'cue_text', t.cue_text, 'cue_time', t.cue_time, 'place_text', t.place_text,
          'weekend_variant_text', t.weekend_variant_text, 'created_at', t.created_at, 'updated_at', t.updated_at
        ))
        from public.habit_cue_plans t where t.family_id = fid
      ), '[]'::jsonb),
      'journalEntries', case when include_journal then coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'local_date', t.local_date,
          'entry_text', t.entry_text, 'created_at', t.created_at, 'updated_at', t.updated_at
        ))
        from public.child_journal_entries t where t.family_id = fid
      ), '[]'::jsonb) else '[]'::jsonb end,
      'cityPurchases', case when include_city then coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'item_id', t.item_id,
          'points_spent', t.points_spent, 'purchased_at', t.purchased_at
        ))
        from public.child_city_purchases t where t.family_id = fid
      ), '[]'::jsonb) else '[]'::jsonb end
    )
  );
end
$$;

-- A paired child device also receives the habits set aside as done alone (inactive, with the day they graduated), so the
-- child screen can show them as achievements. Every list of tasks still keeps only the active ones.
create or replace function public.get_child_session(session_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
  result jsonb;
begin
  select * into child_session
  from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:read' = any(device.capabilities)
  for update;

  if not found then return null; end if;
  update public.device_sessions set last_seen_at = now() where id = child_session.id;

  select jsonb_build_object(
    'deviceSessionId', child_session.id,
    'expiresAt', child_session.expires_at,
    'child', jsonb_build_object(
      'id', child.id,
      'name', child.name,
      'nickname', child.nickname,
      'avatar', child.avatar,
      'themeColor', child.theme_color,
      'points', child.points,
      'totalEarned', child.total_earned,
      'level', child.level,
      'streak', child.streak,
      'birthYear', child.birth_year,
      'ageStage', child.age_stage,
      'ageBandOverride', child.age_band_override,
      'lastActiveDate', child.last_active_date,
      'leagueTier', child.league_tier,
      'createdAt', child.created_at
    ),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', activity.id,
        'childId', activity.child_id,
        'title', activity.title,
        'description', activity.description,
        'instructions', activity.instructions,
        'icon', activity.icon,
        'category', activity.category,
        'points', activity.points,
        'recurrenceType', activity.recurrence_type,
        'recurrenceDays', activity.recurrence_days,
        'timeOfDay', activity.time_of_day,
        'durationMinutes', activity.duration_minutes,
        'requiresApproval', activity.requires_approval,
        'isActive', activity.is_active,
        'targetAgeStage', activity.target_age_stage,
        'isParentRole', activity.is_parent_role,
        'portrait16Key', activity.portrait16_key,
        'boThi7Key', activity.bo_thi7_key,
        'frameworkHabitId', activity.framework_habit_id,
        'frameworkContentVersion', activity.framework_content_version,
        'legacyTemplateId', activity.legacy_template_id,
        'graduatedAt', activity.graduated_at,
        'createdAt', activity.created_at
      ) order by activity.created_at)
      from public.habit_activities activity
      where activity.family_id = child_session.family_id
        and (activity.child_id is null or activity.child_id = child_session.child_id)
        and (activity.is_active or activity.graduated_at is not null)
    ), '[]'::jsonb),
    'logs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', log.id,
        'activityId', log.activity_id,
        'childId', log.child_id,
        'date', log.log_date,
        'status', log.status,
        'pointsAwarded', log.points_awarded,
        'completedAt', log.completed_at,
        'proofNote', log.proof_note
      ) order by log.completed_at)
      from public.activity_logs log
      where log.family_id = child_session.family_id
        and log.child_id = child_session.child_id
    ), '[]'::jsonb),
    'rewards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', reward.id,
        'title', reward.title,
        'description', reward.description,
        'icon', reward.icon,
        'costPoints', reward.cost_points,
        'stock', reward.stock,
        'isActive', reward.is_active,
        'createdAt', reward.created_at
      ) order by reward.created_at)
      from public.rewards reward
      where reward.family_id = child_session.family_id and reward.is_active
    ), '[]'::jsonb),
    'redemptions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', redemption.id,
        'rewardId', redemption.reward_id,
        'childId', redemption.child_id,
        'pointsSpent', redemption.points_spent,
        'status', redemption.status,
        'requestedAt', redemption.requested_at,
        'resolvedAt', redemption.resolved_at
      ) order by redemption.requested_at)
      from public.redemptions redemption
      where redemption.family_id = child_session.family_id
        and redemption.child_id = child_session.child_id
    ), '[]'::jsonb)
  ) into result
  from public.child_profiles child
  where child.id = child_session.child_id
    and child.family_id = child_session.family_id;

  return result;
end
$$;

revoke all on function public.family_snapshot(boolean, boolean, boolean) from public, anon;
grant execute on function public.family_snapshot(boolean, boolean, boolean) to authenticated;

commit;
