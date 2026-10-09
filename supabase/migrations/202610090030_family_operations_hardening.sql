begin;

-- O1: browser table writes cannot bypass the parent-unlock route.
revoke insert, update, delete on public.habit_activities from public, anon, authenticated;

-- O1: starter activities and profile edits use the same parent-unlock boundary.
create or replace function public.mutate_child_profile_command(mutation_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  actor_id uuid := auth.uid();
  mutation_type text := mutation_input->>'type';
  profile_input jsonb := mutation_input->'profile';
  updates_input jsonb := mutation_input->'updates';
  target_profile_id uuid;
  existing_family_id uuid;
  affected_rows integer;
begin
  if actor_id is null or actor_family_id is null
    or not public.can_manage_family(actor_family_id) then
    raise exception 'profile_access_denied';
  end if;

  if mutation_type = 'create' then
    target_profile_id := (profile_input->>'id')::uuid;

    select child.family_id
      into existing_family_id
    from public.child_profiles child
    where child.id = target_profile_id;

    if found then
      if existing_family_id <> actor_family_id then
        raise exception 'profile_conflict';
      end if;
      return jsonb_build_object('profileId', target_profile_id);
    end if;

    if nullif(trim(profile_input->>'name'), '') is null then
      raise exception 'profile_name_required';
    end if;
    if coalesce(jsonb_typeof(profile_input->'points') <> 'number'
      or (profile_input->>'points')::numeric not in (0, 20)
      or jsonb_typeof(profile_input->'totalEarned') <> 'number'
      or (profile_input->>'totalEarned')::numeric <> (profile_input->>'points')::numeric
      or jsonb_typeof(profile_input->'level') <> 'number'
      or (profile_input->>'level')::numeric <> 1
      or jsonb_typeof(profile_input->'streak') <> 'number'
      or (profile_input->>'streak')::numeric not in (0, 1), true) then
      raise exception 'invalid_initial_progress';
    end if;
    if jsonb_typeof(coalesce(mutation_input->'starterActivities', '[]'::jsonb)) <> 'array'
      or jsonb_array_length(coalesce(mutation_input->'starterActivities', '[]'::jsonb)) > 50 then
      raise exception 'invalid_starter_activities';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(coalesce(mutation_input->'starterActivities', '[]'::jsonb)) activity
      where (activity->>'childId')::uuid is distinct from target_profile_id
    ) then
      raise exception 'starter_activity_child_mismatch';
    end if;

    -- Match the route's Zod limits even for internal calls: no null, fractional or oversized awards.
    if exists (
      select 1 from jsonb_array_elements(coalesce(mutation_input->'starterActivities', '[]'::jsonb)) activity
      where coalesce(jsonb_typeof(activity->'points') <> 'number'
        or (activity->>'points')::numeric not between 0 and 10000
        or (activity->>'points')::numeric <> trunc((activity->>'points')::numeric), true)
        or jsonb_typeof(activity->'requiresApproval') is distinct from 'boolean'
    ) then
      raise exception 'invalid_starter_activities';
    end if;

    insert into public.child_profiles (
      id, family_id, user_id, name, nickname, show_real_name_on_leaderboard,
      is_public_on_leaderboard, avatar, theme_color, points, total_earned,
      level, streak, birth_year, age_stage, league_tier, created_at
    ) values (
      target_profile_id, actor_family_id, actor_id, trim(profile_input->>'name'),
      nullif(trim(profile_input->>'nickname'), ''),
      coalesce((profile_input->>'showRealNameOnLeaderboard')::boolean, false),
      coalesce((profile_input->>'isPublicOnLeaderboard')::boolean, false),
      profile_input->>'avatar', profile_input->>'themeColor',
      (profile_input->>'points')::integer, (profile_input->>'totalEarned')::integer,
      (profile_input->>'level')::integer, (profile_input->>'streak')::integer,
      (profile_input->>'birthYear')::integer, profile_input->>'ageStage',
      coalesce(profile_input->>'leagueTier', 'bronze'),
      (profile_input->>'createdAt')::timestamptz
    );

    insert into public.habit_activities (
      id, family_id, user_id, child_id, title, description, icon, category, points,
      recurrence_type, recurrence_days, time_of_day, duration_minutes,
      requires_approval, is_active, target_age_stage, is_parent_role,
      portrait16_key, bo_thi7_key, created_at
    )
    select
      activity."id", actor_family_id, actor_id, activity."childId", activity."title",
      activity."description", activity."icon", activity."category", activity."points",
      activity."recurrenceType", to_jsonb(activity."recurrenceDays"), activity."timeOfDay",
      activity."durationMinutes", activity."requiresApproval", activity."isActive",
      coalesce(activity."targetAgeStage", 'all'), coalesce(activity."isParentRole", false),
      activity."portrait16Key", activity."boThi7Key", activity."createdAt"
    from jsonb_to_recordset(coalesce(mutation_input->'starterActivities', '[]'::jsonb)) as activity(
      "id" uuid, "childId" uuid, "title" text, "description" text, "icon" text,
      "category" text, "points" integer, "recurrenceType" text,
      "recurrenceDays" integer[], "timeOfDay" text, "durationMinutes" integer,
      "requiresApproval" boolean, "isActive" boolean, "targetAgeStage" text,
      "isParentRole" boolean, "portrait16Key" text, "boThi7Key" text,
      "createdAt" timestamptz
    );
  elsif mutation_type = 'update' then
    target_profile_id := (mutation_input->>'profileId')::uuid;
    if updates_input ? 'name' and nullif(trim(updates_input->>'name'), '') is null then
      raise exception 'profile_name_required';
    end if;
    update public.child_profiles
    set
      name = case when updates_input ? 'name' then trim(updates_input->>'name') else name end,
      nickname = case when updates_input ? 'nickname' then nullif(trim(updates_input->>'nickname'), '') else nickname end,
      show_real_name_on_leaderboard = case when updates_input ? 'showRealNameOnLeaderboard' then (updates_input->>'showRealNameOnLeaderboard')::boolean else show_real_name_on_leaderboard end,
      is_public_on_leaderboard = case when updates_input ? 'isPublicOnLeaderboard' then (updates_input->>'isPublicOnLeaderboard')::boolean else is_public_on_leaderboard end,
      avatar = case when updates_input ? 'avatar' then updates_input->>'avatar' else avatar end,
      theme_color = case when updates_input ? 'themeColor' then updates_input->>'themeColor' else theme_color end,
      birth_year = case when updates_input ? 'birthYear' then (updates_input->>'birthYear')::integer else birth_year end,
      age_stage = case when updates_input ? 'ageStage' then updates_input->>'ageStage' else age_stage end,
      league_tier = case when updates_input ? 'leagueTier' then updates_input->>'leagueTier' else league_tier end,
      age_band_override = case when updates_input ? 'ageBandOverride' then updates_input->>'ageBandOverride' else age_band_override end
    where id = target_profile_id and family_id = actor_family_id;
    get diagnostics affected_rows = row_count;
    if affected_rows <> 1 then raise exception 'profile_not_found'; end if;
  elsif mutation_type = 'delete' then
    target_profile_id := (mutation_input->>'profileId')::uuid;
    delete from public.child_profiles
    where id = target_profile_id and family_id = actor_family_id;
    get diagnostics affected_rows = row_count;
    if affected_rows <> 1 then raise exception 'profile_not_found'; end if;
  else
    raise exception 'invalid_profile_mutation';
  end if;

  return jsonb_build_object('profileId', target_profile_id);
end
$$;

revoke all on function public.mutate_child_profile_command(jsonb) from public, anon, authenticated, service_role;

-- Use the existing transaction-local parent identity bridge; original ACL remains closed.
create or replace function public.mutate_child_profile_command_as(actor_user_id uuid, mutation_input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform public.act_as_user(actor_user_id);
  return public.mutate_child_profile_command(mutation_input);
end
$$;
revoke all on function public.mutate_child_profile_command_as(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.mutate_child_profile_command_as(uuid,jsonb) to service_role;

-- O3/O5: record which requests actually reserved finite stock.
alter table public.redemptions add column stock_reserved boolean not null default false;
update public.redemptions redemption set stock_reserved = true
from public.rewards reward
where reward.id = redemption.reward_id and reward.stock >= 0
  and redemption.status in ('pending', 'approved');

-- Refund history survives the reward/redemption cascade and does not count as earned stars.
create table public.reward_refund_events (
  redemption_id uuid primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  reward_id uuid not null,
  points_refunded integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.reward_refund_events enable row level security;
alter table public.reward_refund_events force row level security;
revoke all on public.reward_refund_events from public, anon, authenticated;

-- O6: verified distinct calendar days, anchored at the latest verified day.
create or replace function public.recompute_child_streak(target_child_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  latest_day date;
  streak_days integer;
begin
  perform 1 from public.child_profiles where id = target_child_id for update;
  with days as (
    select distinct log_date from public.activity_logs
    where child_id = target_child_id and status in ('completed', 'approved')
  ), numbered as (
    select log_date, row_number() over (order by log_date desc)::integer as position,
      max(log_date) over () as last_day from days
  )
  select max(last_day), count(*) filter (where log_date = last_day - (position - 1))::integer
  into latest_day, streak_days from numbered;
  update public.child_profiles set streak = coalesce(streak_days, 0), last_active_date = latest_day
  where id = target_child_id;
end
$$;
revoke all on function public.recompute_child_streak(uuid) from public, anon, authenticated, service_role;


create or replace function public.complete_habit_command(
  target_activity_id uuid,
  target_child_id uuid,
  target_log_date date,
  command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  activity public.habit_activities%rowtype;
  child public.child_profiles%rowtype;
  awarded integer;
  next_status text;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  if target_log_date is null or target_log_date not between current_date - 2 and current_date + 1 then
    raise exception 'log_date_out_of_range';
  end if;

  select * into activity from public.habit_activities
  where id = target_activity_id and family_id = actor_family_id and is_active for share;
  if not found then raise exception 'activity_not_found'; end if;

  select * into child from public.child_profiles
  where id = target_child_id and family_id = actor_family_id for update;
  if not found then raise exception 'child_not_found'; end if;
  if activity.child_id is not null and activity.child_id <> target_child_id then
    raise exception 'activity_child_mismatch';
  end if;

  next_status := case when activity.requires_approval then 'pending_approval' else 'completed' end;
  awarded := case when activity.requires_approval then 0 else activity.points end;

  insert into public.activity_logs (
    id, family_id, user_id, activity_id, child_id, log_date, status, points_awarded
  ) values (
    command_id, actor_family_id, auth.uid(), target_activity_id, target_child_id,
    target_log_date, next_status, awarded
  ) on conflict (activity_id, child_id, log_date) do nothing;

  if not found then
    return jsonb_build_object('status', 'duplicate');
  end if;

  if awarded > 0 then
    update public.child_profiles
      set points = points + awarded,
          total_earned = total_earned + awarded,
          level = greatest(1, floor((total_earned + awarded) / 100.0)::integer + 1)
    where id = target_child_id;
  end if;

  perform public.recompute_child_streak(target_child_id);
  return jsonb_build_object('status', next_status, 'logId', command_id, 'pointsAwarded', awarded);
end
$$;

create or replace function public.complete_child_habit_command(
  session_token_hash text,
  target_activity_id uuid,
  target_log_date date,
  command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
  activity public.habit_activities%rowtype;
  child public.child_profiles%rowtype;
  awarded integer;
  next_status text;
begin
  select * into child_session
  from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  if target_log_date is null or target_log_date not between current_date - 2 and current_date + 1 then
    raise exception 'log_date_out_of_range';
  end if;

  select * into activity from public.habit_activities
  where id = target_activity_id
    and family_id = child_session.family_id
    and (child_id is null or child_id = child_session.child_id)
    and is_active
  for share;
  if not found then raise exception 'activity_not_found'; end if;
  -- No family/device timezone is stored. A local day may be the UTC date minus one
  -- anywhere in UTC-12..+14; reject only dates earlier than that earliest local day.
  if target_log_date < (activity.created_at at time zone 'UTC')::date - 1 then
    raise exception 'activity_not_started';
  end if;
  if not coalesce((case activity.recurrence_type
    when 'daily' then true
    when 'weekdays' then extract(dow from target_log_date)::integer between 1 and 5
    when 'weekends' then extract(dow from target_log_date)::integer in (0, 6)
    when 'custom' then coalesce(activity.recurrence_days, '[]'::jsonb)
      @> jsonb_build_array(extract(dow from target_log_date)::integer)
    else false end), false) then
    raise exception 'activity_not_scheduled';
  end if;

  select * into child from public.child_profiles
  where id = child_session.child_id and family_id = child_session.family_id
  for update;
  if not found then raise exception 'child_not_found'; end if;

  next_status := case when activity.requires_approval then 'pending_approval' else 'completed' end;
  awarded := case when activity.requires_approval then 0 else activity.points end;

  insert into public.activity_logs (
    id, family_id, user_id, activity_id, child_id, log_date, status, points_awarded
  ) values (
    command_id, child_session.family_id, null, activity.id, child_session.child_id,
    target_log_date, next_status, awarded
  ) on conflict (activity_id, child_id, log_date) do nothing;

  if not found then return jsonb_build_object('status', 'duplicate'); end if;

  if awarded > 0 then
    update public.child_profiles
    set points = points + awarded,
        total_earned = total_earned + awarded,
        level = greatest(1, floor((total_earned + awarded) / 100.0)::integer + 1)
    where id = child_session.child_id and family_id = child_session.family_id;
  end if;

  perform public.recompute_child_streak(child_session.child_id);
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object(
    'status', next_status,
    'logId', command_id,
    'pointsAwarded', awarded
  );
end
$$;

create or replace function public.undo_habit_command(target_log_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  log_row public.activity_logs%rowtype;
  child public.child_profiles%rowtype;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;

  select * into log_row from public.activity_logs
  where id = target_log_id and family_id = actor_family_id for update;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  if log_row.status not in ('completed', 'pending_approval') then
    return jsonb_build_object('status', 'not_reversible');
  end if;

  perform 1 from public.child_profiles where id = log_row.child_id for update;
  if log_row.points_awarded > 0 then
    select * into child from public.child_profiles
    where id = log_row.child_id and family_id = actor_family_id for update;
    if found and child.points < log_row.points_awarded then
      return jsonb_build_object('status', 'points_already_spent');
    end if;
    update public.child_profiles
      set points = points - log_row.points_awarded,
          total_earned = greatest(0, total_earned - log_row.points_awarded),
          level = greatest(1, floor(greatest(0, total_earned - log_row.points_awarded) / 100.0)::integer + 1)
    where id = log_row.child_id and family_id = actor_family_id;
  end if;
  delete from public.activity_logs where id = log_row.id;
  perform public.recompute_child_streak(log_row.child_id);
  return jsonb_build_object('status', 'undone');
end
$$;

create or replace function public.undo_child_habit_command(
  session_token_hash text,
  target_log_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
  log_row public.activity_logs%rowtype;
  child public.child_profiles%rowtype;
begin
  select * into child_session
  from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  select * into log_row from public.activity_logs
  where id = target_log_id
    and family_id = child_session.family_id
    and child_id = child_session.child_id
  for update;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  if log_row.status not in ('completed', 'pending_approval') then
    return jsonb_build_object('status', 'not_reversible');
  end if;

  perform 1 from public.child_profiles where id = log_row.child_id for update;
  if log_row.points_awarded > 0 then
    select * into child from public.child_profiles
    where id = child_session.child_id and family_id = child_session.family_id
    for update;
    if found and child.points < log_row.points_awarded then
      return jsonb_build_object('status', 'points_already_spent');
    end if;
    update public.child_profiles
    set points = points - log_row.points_awarded,
        total_earned = greatest(0, total_earned - log_row.points_awarded),
        level = greatest(
          1,
          floor(greatest(0, total_earned - log_row.points_awarded) / 100.0)::integer + 1
        )
    where id = child_session.child_id and family_id = child_session.family_id;
  end if;

  delete from public.activity_logs where id = log_row.id;
  perform public.recompute_child_streak(log_row.child_id);
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'undone');
end
$$;

create or replace function public.review_habit_command(target_log_id uuid, decision text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  log_row public.activity_logs%rowtype;
  award integer;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  if decision not in ('approve', 'reject') then raise exception 'invalid_decision'; end if;
  select * into log_row from public.activity_logs
  where id = target_log_id and family_id = actor_family_id for update;
  if not found then raise exception 'log_not_found'; end if;
  if log_row.status <> 'pending_approval' then return jsonb_build_object('status', 'already_reviewed'); end if;

  perform 1 from public.child_profiles where id = log_row.child_id for update;
  if decision = 'reject' then
    update public.activity_logs set status = 'rejected', points_awarded = 0 where id = log_row.id;
    return jsonb_build_object('status', 'rejected');
  end if;

  select points into award from public.habit_activities
  where id = log_row.activity_id and family_id = actor_family_id;
  update public.activity_logs set status = 'approved', points_awarded = award where id = log_row.id;
  update public.child_profiles
    set points = points + award,
        total_earned = total_earned + award,
        level = greatest(1, floor((total_earned + award) / 100.0)::integer + 1)
  where id = log_row.child_id and family_id = actor_family_id;
  perform public.recompute_child_streak(log_row.child_id);
  return jsonb_build_object('status', 'approved', 'pointsAwarded', award);
end
$$;

create or replace function public.redeem_reward_command(
  target_reward_id uuid,
  target_child_id uuid,
  command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  reward public.rewards%rowtype;
  child public.child_profiles%rowtype;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  select * into reward from public.rewards
  where id = target_reward_id and family_id = actor_family_id and is_active for update;
  if not found then raise exception 'reward_not_found'; end if;
  select * into child from public.child_profiles
  where id = target_child_id and family_id = actor_family_id for update;
  if not found then raise exception 'child_not_found'; end if;
  if exists (select 1 from public.redemptions where id = command_id) then
    return jsonb_build_object('status', 'duplicate');
  end if;
  if child.points < reward.cost_points then return jsonb_build_object('status', 'insufficient_points'); end if;
  if reward.stock = 0 then return jsonb_build_object('status', 'out_of_stock'); end if;

  update public.child_profiles set points = points - reward.cost_points where id = child.id;
  if reward.stock > 0 then update public.rewards set stock = stock - 1 where id = reward.id; end if;
  insert into public.redemptions (
    id, family_id, user_id, reward_id, child_id, points_spent, status, stock_reserved
  ) values (
    command_id, actor_family_id, auth.uid(), reward.id, child.id, reward.cost_points, 'pending', reward.stock > 0
  );
  return jsonb_build_object('status', 'pending', 'redemptionId', command_id);
end
$$;

create or replace function public.redeem_child_reward_command(
  session_token_hash text,
  target_reward_id uuid,
  command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
  reward public.rewards%rowtype;
  child public.child_profiles%rowtype;
begin
  select * into child_session
  from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  select * into reward from public.rewards
  where id = target_reward_id and family_id = child_session.family_id and is_active
  for update;
  if not found then raise exception 'reward_not_found'; end if;

  select * into child from public.child_profiles
  where id = child_session.child_id and family_id = child_session.family_id
  for update;
  if not found then raise exception 'child_not_found'; end if;

  if exists (select 1 from public.redemptions where id = command_id) then
    return jsonb_build_object('status', 'duplicate');
  end if;
  if child.points < reward.cost_points then
    return jsonb_build_object('status', 'insufficient_points');
  end if;
  if reward.stock = 0 then return jsonb_build_object('status', 'out_of_stock'); end if;

  update public.child_profiles
  set points = points - reward.cost_points
  where id = child_session.child_id and family_id = child_session.family_id;
  if reward.stock > 0 then
    update public.rewards set stock = stock - 1 where id = reward.id;
  end if;
  insert into public.redemptions (
    id, family_id, user_id, reward_id, child_id, points_spent, status, stock_reserved
  ) values (
    command_id, child_session.family_id, null, reward.id,
    child_session.child_id, reward.cost_points, 'pending', reward.stock > 0
  );

  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'pending', 'redemptionId', command_id);
end
$$;

create or replace function public.transition_redemption_command(target_redemption_id uuid, decision text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  redemption public.redemptions%rowtype;
  reward_id_to_lock uuid;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  if decision not in ('approve', 'deliver', 'reject') then raise exception 'invalid_decision'; end if;
  -- Match redeem/delete lock order: reward, redemption, child.
  select reward_id into reward_id_to_lock from public.redemptions
  where id = target_redemption_id and family_id = actor_family_id;
  perform 1 from public.rewards where id = reward_id_to_lock and family_id = actor_family_id for update;
  select * into redemption from public.redemptions
  where id = target_redemption_id and family_id = actor_family_id for update;
  if not found then raise exception 'redemption_not_found'; end if;

  if decision = 'approve' and redemption.status = 'pending' then
    update public.redemptions set status = 'approved', resolved_at = now() where id = redemption.id;
    return jsonb_build_object('status', 'approved');
  end if;
  if decision = 'deliver' and redemption.status = 'approved' then
    update public.redemptions set status = 'delivered', resolved_at = now() where id = redemption.id;
    return jsonb_build_object('status', 'delivered');
  end if;
  if decision = 'reject' and redemption.status in ('pending', 'approved') then
    update public.child_profiles set points = points + redemption.points_spent where id = redemption.child_id;
    if redemption.stock_reserved then
      update public.rewards set stock = stock + 1
      where id = redemption.reward_id and family_id = actor_family_id and stock >= 0;
    end if;
    insert into public.reward_refund_events (redemption_id, family_id, child_id, reward_id, points_refunded, reason)
    values (redemption.id, actor_family_id, redemption.child_id, redemption.reward_id, redemption.points_spent, 'rejected');
    update public.redemptions set status = 'rejected', stock_reserved = false, resolved_at = now() where id = redemption.id;
    return jsonb_build_object('status', 'rejected');
  end if;
  return jsonb_build_object('status', 'invalid_transition');
end
$$;

-- O3: the reward row is already locked by DELETE; refund under the same transaction.
create or replace function public.refund_deleted_reward()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  request public.redemptions%rowtype;
begin
  -- During a family cascade the parent row is already gone. There is nobody to refund
  -- and inserting an audit row would reference the deleted family (or child).
  if not exists (select 1 from public.families where id = old.family_id) then return old; end if;
  perform 1 from public.redemptions
  where reward_id = old.id and family_id = old.family_id and status in ('pending', 'approved')
  order by id for update;
  perform 1 from public.child_profiles
  where id in (select child_id from public.redemptions
    where reward_id = old.id and family_id = old.family_id and status in ('pending', 'approved'))
  order by id for update;
  for request in select * from public.redemptions
    where reward_id = old.id and family_id = old.family_id and status in ('pending', 'approved')
    order by id
  loop
    update public.child_profiles set points = points + request.points_spent
    where id = request.child_id and family_id = old.family_id;
    insert into public.reward_refund_events (redemption_id, family_id, child_id, reward_id, points_refunded, reason)
    values (request.id, old.family_id, request.child_id, old.id, request.points_spent, 'reward_deleted');
    update public.redemptions set status = 'rejected', stock_reserved = false, resolved_at = now() where id = request.id;
  end loop;
  return old;
end
$$;
revoke all on function public.refund_deleted_reward() from public, anon, authenticated, service_role;
create trigger refund_deleted_reward before delete on public.rewards
for each row execute function public.refund_deleted_reward();

create or replace function public.get_parent_pin_status(target_family_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.parent_settings%rowtype;
begin
  if not public.can_manage_family(target_family_id) then
    raise exception 'Family management is required' using errcode = '42501';
  end if;


  select * into settings
  from public.parent_settings
  where family_id = target_family_id;

  return jsonb_build_object(
    'configured', settings.parent_pin_hash is not null,
    'version', case
      when settings.parent_pin_hash is null then null
      else (extract(epoch from settings.parent_pin_configured_at) * 1000000)::bigint::text
    end,
    'lockedUntil', case
      when settings.parent_pin_locked_until > clock_timestamp() then settings.parent_pin_locked_until
      else null
    end
  );
end;
$$;

create or replace function public.verify_parent_pin(target_family_id uuid, candidate_pin text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.parent_settings%rowtype;
  next_failed_attempts integer;
  lock_until timestamptz;
begin
  if not public.can_manage_family(target_family_id) then
    raise exception 'Family management is required' using errcode = '42501';
  end if;
  if candidate_pin !~ '^[0-9]{4}$' then
    return jsonb_build_object('status', 'invalid');
  end if;

  insert into public.parent_settings (family_id)
  values (target_family_id)
  on conflict (family_id) do nothing;

  select * into settings
  from public.parent_settings
  where family_id = target_family_id
  for update;

  if settings.parent_pin_hash is null then
    return jsonb_build_object('status', 'setup_required');
  end if;
  if settings.parent_pin_locked_until > clock_timestamp() then
    return jsonb_build_object(
      'status', 'locked',
      'retryAfterSeconds', greatest(1, ceil(extract(epoch from settings.parent_pin_locked_until - clock_timestamp())))::integer
    );
  end if;

  if extensions.crypt(candidate_pin, settings.parent_pin_hash) = settings.parent_pin_hash then
    update public.parent_settings
    set parent_pin_failed_attempts = 0,
        parent_pin_locked_until = null,
        updated_at = clock_timestamp()
    where family_id = target_family_id;
    return jsonb_build_object('status', 'verified', 'version', (extract(epoch from settings.parent_pin_configured_at) * 1000000)::bigint::text);
  end if;

  next_failed_attempts := settings.parent_pin_failed_attempts + 1;
  if settings.parent_pin_failed_attempts >= 4 then
    lock_until := clock_timestamp() + interval '15 minutes';
    update public.parent_settings
    set parent_pin_failed_attempts = 0,
        parent_pin_locked_until = lock_until,
        updated_at = clock_timestamp()
    where family_id = target_family_id;
    return jsonb_build_object('status', 'locked', 'retryAfterSeconds', 900);
  end if;

  update public.parent_settings
  set parent_pin_failed_attempts = next_failed_attempts,
      parent_pin_locked_until = null,
      updated_at = clock_timestamp()
  where family_id = target_family_id;
  return jsonb_build_object('status', 'invalid', 'attemptsRemaining', 5 - next_failed_attempts);
end;
$$;

create or replace function public.set_parent_pin(target_family_id uuid, current_pin text, new_pin text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.parent_settings%rowtype;
  next_failed_attempts integer;
  lock_until timestamptz;
begin
  if not public.can_manage_family(target_family_id) then
    raise exception 'Family management is required' using errcode = '42501';
  end if;
  if new_pin !~ '^[0-9]{4}$' then
    return jsonb_build_object('status', 'invalid_format');
  end if;

  insert into public.parent_settings (family_id)
  values (target_family_id)
  on conflict (family_id) do nothing;

  select * into settings
  from public.parent_settings
  where family_id = target_family_id
  for update;

  if settings.parent_pin_hash is not null then
    if settings.parent_pin_locked_until > clock_timestamp() then
      return jsonb_build_object(
        'status', 'locked',
        'retryAfterSeconds', greatest(1, ceil(extract(epoch from settings.parent_pin_locked_until - clock_timestamp())))::integer
      );
    end if;
    if current_pin is null or extensions.crypt(current_pin, settings.parent_pin_hash) <> settings.parent_pin_hash then
      next_failed_attempts := settings.parent_pin_failed_attempts + 1;
      if settings.parent_pin_failed_attempts >= 4 then
        lock_until := clock_timestamp() + interval '15 minutes';
        update public.parent_settings
        set parent_pin_failed_attempts = 0,
            parent_pin_locked_until = lock_until,
            updated_at = clock_timestamp()
        where family_id = target_family_id;
        return jsonb_build_object('status', 'locked', 'retryAfterSeconds', 900);
      end if;
      update public.parent_settings
      set parent_pin_failed_attempts = next_failed_attempts,
          updated_at = clock_timestamp()
      where family_id = target_family_id;
      return jsonb_build_object('status', 'invalid_current', 'attemptsRemaining', 5 - next_failed_attempts);
    end if;
  end if;

  update public.parent_settings
  set parent_pin_hash = extensions.crypt(new_pin, extensions.gen_salt('bf', 10)),
      parent_pin_configured_at = clock_timestamp(),
      parent_pin_failed_attempts = 0,
      parent_pin_locked_until = null,
      updated_at = clock_timestamp()
  where family_id = target_family_id
  returning * into settings;

  return jsonb_build_object('status', 'updated', 'version', (extract(epoch from settings.parent_pin_configured_at) * 1000000)::bigint::text);
end;
$$;

create or replace function public.claim_lifecycle_messages(batch_size integer default 25)
returns table (
  id uuid,
  user_id uuid,
  template_key text,
  locale text,
  payload jsonb,
  dedupe_key text,
  recipient_email text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.lifecycle_outbox message
  set status = 'dead_letter', locked_at = null, updated_at = now(), last_error_code = 'worker_lost'
  where message.status = 'processing'
    and message.locked_at < now() - interval '10 minutes'
    and message.attempts >= 5;

  update public.lifecycle_outbox message
  set status = 'suppressed', locked_at = null, updated_at = now(), last_error_code = 'suppressed'
  where (message.status in ('pending', 'failed')
    or (message.status = 'processing' and message.locked_at < now() - interval '10 minutes'))
    and (
      exists (
        select 1 from public.email_suppressions suppression
        where suppression.user_id = message.user_id
          and (suppression.scope = 'all' or message.category = 'marketing')
      )
      or (
        message.category = 'marketing'
        and not exists (
          select 1 from public.parent_profiles profile
          where profile.user_id = message.user_id and profile.marketing_consent = true
        )
      )
    );

  return query
  with candidates as (
    select message.id
    from public.lifecycle_outbox message
    where (
        message.status in ('pending', 'failed')
        or (message.status = 'processing' and message.locked_at < now() - interval '10 minutes')
      )
      and message.available_at <= now()
      and message.attempts < 5
      and (message.locked_at is null or message.locked_at < now() - interval '10 minutes')
    order by message.created_at
    for update skip locked
    limit greatest(1, least(coalesce(batch_size, 25), 100))
  ), claimed as (
    update public.lifecycle_outbox message
    set status = 'processing', attempts = message.attempts + 1,
        locked_at = now(), updated_at = now()
    from candidates
    where message.id = candidates.id
    returning message.*
  )
  select claimed.id, claimed.user_id, claimed.template_key, claimed.locale,
         claimed.payload, claimed.dedupe_key, auth_user.email::text
  from claimed
  join auth.users auth_user on auth_user.id = claimed.user_id
  where auth_user.email is not null;
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
  ;

  if not found then return null; end if;

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

create or replace function public.touch_child_session(session_token_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.device_sessions device set last_seen_at = now()
  where device.token_hash = session_token_hash and device.revoked_at is null
    and device.expires_at > now() and 'child:read' = any(device.capabilities);
  return found;
end
$$;
revoke all on function public.touch_child_session(text) from public, anon, authenticated, service_role;
grant execute on function public.touch_child_session(text) to anon, authenticated;

create or replace function public.open_daily_mascot_letter(
  target_child_id uuid,
  target_local_date date,
  mark_read boolean,
  session_token_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_row public.child_profiles%rowtype;
  child_session public.device_sessions%rowtype;
  mascot_name text;
  letter_key text;
  letter_read_at timestamptz;
  affected_rows integer;
  newly_read boolean := false;
begin
  if target_child_id is null or target_local_date is null or mark_read is null
    or target_local_date < (now() at time zone 'UTC')::date - 1
    or target_local_date > (now() at time zone 'UTC')::date + 1 then
    raise exception 'invalid_letter_date';
  end if;

  select * into child_row from public.child_profiles
  where id = target_child_id;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  if session_token_hash is not null then
    select * into child_session from public.device_sessions session_row
    where session_row.token_hash = session_token_hash
      and session_row.child_id = target_child_id
      and session_row.family_id = child_row.family_id
      and session_row.revoked_at is null
      and session_row.expires_at > now()
      and 'child:read' = any(session_row.capabilities)
      and (not mark_read or 'child:complete' = any(session_row.capabilities));
    if not found then return jsonb_build_object('status', 'session_invalid'); end if;
  elsif auth.uid() is null or not public.can_manage_family(child_row.family_id) then
    return jsonb_build_object('status', 'session_invalid');
  end if;

  mascot_name := case child_row.avatar
    when 'mascot:bunny' then 'bunny' when '🐰' then 'bunny'
    when 'mascot:panda' then 'panda' when '🐼' then 'panda'
    when 'mascot:fox' then 'fox' when '🦊' then 'fox'
    when 'mascot:turtle' then 'turtle' when '🐢' then 'turtle'
    when 'mascot:bee' then 'bee' when '🐝' then 'bee'
    else 'leo'
  end;
  letter_key := mascot_name || '_' || ((target_local_date - date '1970-01-01') % 3)::text;

  if not mark_read then
    select template_key, read_at into letter_key, letter_read_at
    from public.daily_mascot_letters
    where child_id = target_child_id and local_date = target_local_date;
    if not found then
      letter_key := mascot_name || '_' || ((target_local_date - date '1970-01-01') % 3)::text;
    end if;
    return jsonb_build_object('status', 'ready', 'template_key', letter_key,
      'read_at', letter_read_at, 'newly_read', false);
  end if;

  insert into public.daily_mascot_letters (
    family_id, child_id, local_date, template_key, read_at
  ) values (
    child_row.family_id, child_row.id, target_local_date, letter_key,
    case when mark_read then now() else null end
  )
  on conflict (child_id, local_date) do nothing;
  get diagnostics affected_rows = row_count;
  newly_read := mark_read and affected_rows = 1;

  if mark_read and not newly_read then
    update public.daily_mascot_letters
    set read_at = now()
    where child_id = target_child_id
      and local_date = target_local_date
      and read_at is null;
    get diagnostics affected_rows = row_count;
    newly_read := affected_rows = 1;
  end if;

  select template_key, read_at into letter_key, letter_read_at
  from public.daily_mascot_letters
  where child_id = target_child_id and local_date = target_local_date;

  return jsonb_build_object(
    'status', 'ready',
    'template_key', letter_key,
    'read_at', letter_read_at,
    'newly_read', newly_read
  );
end
$$;

-- Repair existing caches under the same verified-day rule.
do $$ declare child record; begin
  for child in select id from public.child_profiles order by id loop
    perform public.recompute_child_streak(child.id);
  end loop;
end $$;
commit;
