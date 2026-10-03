begin;

alter table public.habit_activities
  add column offered_for_focus boolean not null default false;

create table public.habit_tries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  child_id uuid not null,
  activity_id uuid not null,
  kind text not null check (kind in ('smaller', 'retime', 'together', 'cue_change', 'reduce_support')),
  started_on date not null,
  ends_on date not null check (ends_on >= started_on),
  outcome text check (outcome in ('helped', 'not_yet', 'dropped')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  -- What a change replaced (title, instructions, minutes or time of day), so a try that did not help can put it back.
  previous_values jsonb,
  constraint habit_tries_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint habit_tries_activity_family_fk foreign key (activity_id, family_id)
    references public.habit_activities(id, family_id) on delete cascade
);

create index habit_tries_family_idx on public.habit_tries (family_id);

alter table public.habit_tries enable row level security;
alter table public.habit_tries force row level security;
create policy habit_tries_read on public.habit_tries
  for select to authenticated using (public.is_family_member(family_id));
revoke all on public.habit_tries from public, anon, authenticated;
grant select on public.habit_tries to authenticated;

create table public.child_weekly_focus (
  family_id uuid not null,
  child_id uuid not null,
  week_start date not null,
  activity_ids uuid[] not null default '{}',
  chosen_by text not null check (chosen_by in ('child', 'parent')),
  updated_at timestamptz not null default now(),
  primary key (child_id, week_start),
  constraint child_weekly_focus_activity_ids_limit check (cardinality(activity_ids) <= 2),
  constraint child_weekly_focus_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade
);

alter table public.child_weekly_focus enable row level security;
alter table public.child_weekly_focus force row level security;
create policy child_weekly_focus_read on public.child_weekly_focus
  for select to authenticated using (public.is_family_member(family_id));
revoke all on public.child_weekly_focus from public, anon, authenticated;
grant select on public.child_weekly_focus to authenticated;

create function public.start_habit_try(
  target_activity_id uuid,
  target_child_id uuid,
  try_kind text,
  try_days integer default 7,
  try_started_on date default null,
  try_previous jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  existing_try public.habit_tries%rowtype;
  created_try public.habit_tries%rowtype;
  start_day date;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  if try_kind is null or try_kind not in ('smaller', 'retime', 'together', 'cue_change', 'reduce_support')
    or try_days is null or try_days not between 3 and 14 then
    raise exception 'invalid_habit_try';
  end if;
  -- The family's own calendar day, sent by the app, may differ from the database date by at most a day.
  start_day := coalesce(try_started_on, current_date);
  if start_day not between current_date - 1 and current_date + 1 then raise exception 'invalid_habit_try'; end if;
  if try_previous is not null and (jsonb_typeof(try_previous) <> 'object' or pg_column_size(try_previous) > 4000) then
    raise exception 'invalid_habit_try';
  end if;

  perform 1 from public.child_profiles child
  where child.id = target_child_id and child.family_id = actor_family_id
  for update;
  if not found then raise exception 'child_not_found'; end if;

  perform 1 from public.habit_activities activity
  where activity.id = target_activity_id
    and activity.family_id = actor_family_id
    and (activity.child_id is null or activity.child_id = target_child_id);
  if not found then raise exception 'activity_not_found'; end if;

  -- One change at a time for each child, whichever habit it is about.
  select * into existing_try from public.habit_tries
  where family_id = actor_family_id and child_id = target_child_id and outcome is null
  for update;
  if found then return jsonb_build_object('status', 'already_open', 'habitTry', to_jsonb(existing_try)); end if;

  insert into public.habit_tries (family_id, child_id, activity_id, kind, started_on, ends_on, previous_values)
  values (actor_family_id, target_child_id, target_activity_id, try_kind, start_day, start_day + try_days, try_previous)
  returning * into created_try;
  return jsonb_build_object('status', 'started', 'habitTry', to_jsonb(created_try));
end
$$;

create function public.resolve_habit_try(target_try_id uuid, try_outcome text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  try_row public.habit_tries%rowtype;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  if try_outcome is null or try_outcome not in ('helped', 'not_yet', 'dropped') then
    raise exception 'invalid_habit_try_outcome';
  end if;

  select * into try_row from public.habit_tries
  where id = target_try_id and family_id = actor_family_id
  for update;
  if not found then raise exception 'try_not_found'; end if;
  if try_row.outcome is not null then return jsonb_build_object('status', 'already_resolved', 'habitTry', to_jsonb(try_row)); end if;

  update public.habit_tries set outcome = try_outcome, resolved_at = now()
  where id = try_row.id
  returning * into try_row;
  return jsonb_build_object('status', 'resolved', 'habitTry', to_jsonb(try_row));
end
$$;

create function public.set_weekly_focus_for_child(
  target_child_id uuid,
  focus_week date,
  focus_activity_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  normalized_ids uuid[];
  activity_id uuid;
  focus_row public.child_weekly_focus%rowtype;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  if focus_week is null or extract(isodow from focus_week) <> 1
    or focus_week not between current_date - 7 and current_date + 7 then
    raise exception 'invalid_focus_week';
  end if;

  perform 1 from public.child_profiles child
  where child.id = target_child_id and child.family_id = actor_family_id;
  if not found then raise exception 'child_not_found'; end if;

  select coalesce(array_agg(distinct requested.id order by requested.id), '{}'::uuid[])
  into normalized_ids
  from unnest(coalesce(focus_activity_ids, '{}'::uuid[])) requested(id);
  if cardinality(normalized_ids) > 2 then raise exception 'too_many_focus_activities'; end if;

  foreach activity_id in array normalized_ids loop
    perform 1 from public.habit_activities activity
    where activity.id = activity_id and activity.family_id = actor_family_id
      and activity.is_active and activity.offered_for_focus
      and (activity.child_id is null or activity.child_id = target_child_id);
    if not found then raise exception 'focus_activity_unavailable'; end if;
  end loop;

  insert into public.child_weekly_focus (family_id, child_id, week_start, activity_ids, chosen_by)
  values (actor_family_id, target_child_id, focus_week, normalized_ids, 'parent')
  on conflict (child_id, week_start) do update set
    family_id = excluded.family_id,
    activity_ids = excluded.activity_ids,
    chosen_by = excluded.chosen_by,
    updated_at = now()
  returning * into focus_row;
  return jsonb_build_object('status', 'saved', 'weeklyFocus', to_jsonb(focus_row));
end
$$;

create function public.set_child_weekly_focus(
  session_token_hash text,
  focus_week date,
  focus_activity_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
  normalized_ids uuid[];
  activity_id uuid;
  focus_row public.child_weekly_focus%rowtype;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  if focus_week is null or extract(isodow from focus_week) <> 1
    or focus_week not between current_date - 7 and current_date + 7 then
    raise exception 'invalid_focus_week';
  end if;
  select coalesce(array_agg(distinct requested.id order by requested.id), '{}'::uuid[])
  into normalized_ids
  from unnest(coalesce(focus_activity_ids, '{}'::uuid[])) requested(id);
  if cardinality(normalized_ids) > 2 then raise exception 'too_many_focus_activities'; end if;

  foreach activity_id in array normalized_ids loop
    perform 1 from public.habit_activities activity
    where activity.id = activity_id and activity.family_id = child_session.family_id
      and activity.is_active and activity.offered_for_focus
      and (activity.child_id is null or activity.child_id = child_session.child_id);
    if not found then raise exception 'focus_activity_unavailable'; end if;
  end loop;

  insert into public.child_weekly_focus (family_id, child_id, week_start, activity_ids, chosen_by)
  values (child_session.family_id, child_session.child_id, focus_week, normalized_ids, 'child')
  on conflict (child_id, week_start) do update set
    family_id = excluded.family_id,
    activity_ids = excluded.activity_ids,
    chosen_by = excluded.chosen_by,
    updated_at = now()
  returning * into focus_row;
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'saved', 'weeklyFocus', to_jsonb(focus_row));
end
$$;

-- The family snapshot and the child session return the new columns by name, like every other column the app reads.
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
        'offered_for_focus', t.offered_for_focus, 'created_at', t.created_at
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
      'habitTries', case when include_experience then coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', t.id, 'family_id', t.family_id, 'child_id', t.child_id, 'activity_id', t.activity_id,
          'kind', t.kind, 'started_on', t.started_on, 'ends_on', t.ends_on, 'outcome', t.outcome,
          'created_at', t.created_at, 'resolved_at', t.resolved_at, 'previous_values', t.previous_values
        ))
        from public.habit_tries t where t.family_id = fid
      ), '[]'::jsonb) else '[]'::jsonb end,
      'weeklyFocus', case when include_experience then coalesce((
        select jsonb_agg(jsonb_build_object(
          'family_id', t.family_id, 'child_id', t.child_id, 'week_start', t.week_start,
          'activity_ids', t.activity_ids, 'chosen_by', t.chosen_by, 'updated_at', t.updated_at
        ))
        from public.child_weekly_focus t where t.family_id = fid
      ), '[]'::jsonb) else '[]'::jsonb end,
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
        'offeredForFocus', activity.offered_for_focus,
        'createdAt', activity.created_at
      ) order by activity.created_at)
      from public.habit_activities activity
      where activity.family_id = child_session.family_id
        and (activity.child_id is null or activity.child_id = child_session.child_id)
        and (activity.is_active or activity.graduated_at is not null)
    ), '[]'::jsonb),
    'weeklyFocus', coalesce((
      select jsonb_agg(jsonb_build_object(
        'weekStart', focus.week_start,
        'activityIds', focus.activity_ids,
        'chosenBy', focus.chosen_by
      ) order by focus.week_start)
      from public.child_weekly_focus focus
      where focus.family_id = child_session.family_id
        and focus.child_id = child_session.child_id
        and focus.week_start >= current_date - 14
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

revoke all on function public.start_habit_try(uuid, uuid, text, integer, date, jsonb) from public, anon, service_role;
revoke all on function public.resolve_habit_try(uuid, text) from public, anon, service_role;
revoke all on function public.set_weekly_focus_for_child(uuid, date, uuid[]) from public, anon, service_role;
revoke all on function public.set_child_weekly_focus(text, date, uuid[]) from public, anon, service_role;
grant execute on function public.start_habit_try(uuid, uuid, text, integer, date, jsonb) to authenticated;
grant execute on function public.resolve_habit_try(uuid, text) to authenticated;
grant execute on function public.set_weekly_focus_for_child(uuid, date, uuid[]) to authenticated;
grant execute on function public.set_child_weekly_focus(text, date, uuid[]) to anon, authenticated;
revoke all on function public.family_snapshot(boolean, boolean, boolean) from public, anon, service_role;
grant execute on function public.family_snapshot(boolean, boolean, boolean) to authenticated;
revoke all on function public.get_child_session(text) from public, anon, service_role;
grant execute on function public.get_child_session(text) to anon, authenticated;

commit;
