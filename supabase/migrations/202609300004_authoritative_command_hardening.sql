begin;

-- 1. Completion dates. A device can only record days near the server's own date
--    (one day either side absorbs every time zone), so points cannot be farmed on
--    arbitrary past or future dates. Parent commands now require manage rights, and
--    an undo is refused once the points it would take back have been spent.

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
          level = greatest(1, floor((total_earned + awarded) / 100.0)::integer + 1),
          streak = case
            when last_active_date = target_log_date then streak
            when last_active_date = target_log_date - 1 then streak + 1
            else 1
          end,
          last_active_date = target_log_date
    where id = target_child_id;
  end if;

  return jsonb_build_object('status', next_status, 'logId', command_id, 'pointsAwarded', awarded);
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
    id, family_id, user_id, reward_id, child_id, points_spent, status
  ) values (
    command_id, actor_family_id, auth.uid(), reward.id, child.id, reward.cost_points, 'pending'
  );
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
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  if decision not in ('approve', 'deliver', 'reject') then raise exception 'invalid_decision'; end if;
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
    update public.redemptions set status = 'rejected', resolved_at = now() where id = redemption.id;
    return jsonb_build_object('status', 'rejected');
  end if;
  return jsonb_build_object('status', 'invalid_transition');
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
        level = greatest(1, floor((total_earned + awarded) / 100.0)::integer + 1),
        streak = case
          when last_active_date = target_log_date then streak
          when last_active_date = target_log_date - 1 then streak + 1
          else 1
        end,
        last_active_date = target_log_date
    where id = child_session.child_id and family_id = child_session.family_id;
  end if;

  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object(
    'status', next_status,
    'logId', command_id,
    'pointsAwarded', awarded
  );
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
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'undone');
end
$$;

-- 2. Function execution. Anonymous callers only need the functions that take a child
--    device token plus the pairing exchange and the public board; everything else
--    requires a signed-in parent. New functions start closed until granted.
do $$
declare
  target record;
begin
  for target in
    select function_row.oid::regprocedure as signature
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
    where namespace_row.nspname = 'public'
      and function_row.prokind = 'f'
      and pg_catalog.pg_get_function_arguments(function_row.oid) not like '%session_token_hash%'
      and function_row.proname not in ('exchange_pairing_credential', 'get_public_leaderboard')
  loop
    execute format('revoke execute on function %s from anon', target.signature);
  end loop;
end $$;

alter default privileges in schema public revoke execute on functions from anon;

-- 3. Table privileges. Data is reached through commands (definer functions) and
--    family-scoped reads; a browser session never needs direct writes to progress,
--    membership, PIN or credential tables, and TRUNCATE ignores row-level security.
revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

revoke insert, update, delete on
  public.child_profiles,
  public.child_badges,
  public.child_engagement_profiles,
  public.child_wishlists,
  public.family_engagement_settings,
  public.group_members,
  public.group_teams,
  public.kudos,
  public.pairing_challenges,
  public.parent_settings,
  public.families,
  public.family_memberships
from authenticated;

revoke select on public.pairing_credentials, public.pairing_challenges from authenticated;

revoke select on public.device_sessions from authenticated;
grant select (id, family_id, child_id, capabilities, expires_at, revoked_at, created_at, device_label, last_seen_at)
  on public.device_sessions to authenticated;

revoke select on public.parent_settings from authenticated;
grant select (family_id, family_title, is_public_leaderboard, locale, appearance, updated_at, parent_pin_configured_at)
  on public.parent_settings to authenticated;

-- 4. Row-level security is enforced for table owners on every table.
alter table public.admin_audit_events force row level security;
alter table public.admin_memberships force row level security;
alter table public.billing_support_case_events force row level security;
alter table public.billing_support_cases force row level security;
alter table public.caregiver_invite_events force row level security;
alter table public.caregiver_invites force row level security;
alter table public.coupon_redemptions force row level security;
alter table public.coupons force row level security;
alter table public.email_suppressions force row level security;
alter table public.lifecycle_outbox force row level security;
alter table public.migration_quarantine force row level security;
alter table public.operational_events force row level security;

-- 5. Indexes for the foreign keys that family-scoped reads and deletes walk.
create index if not exists activity_logs_child_idx on public.activity_logs (child_id);
create index if not exists activity_logs_activity_family_idx on public.activity_logs (activity_id, family_id);
create index if not exists habit_activities_child_idx on public.habit_activities (child_id) where child_id is not null;
create index if not exists redemptions_child_idx on public.redemptions (child_id);
create index if not exists redemptions_reward_idx on public.redemptions (reward_id);
create index if not exists child_badges_family_idx on public.child_badges (family_id);
create index if not exists group_members_family_idx on public.group_members (family_id);
create index if not exists device_sessions_child_idx on public.device_sessions (child_id);
create index if not exists payment_orders_user_idx on public.payment_orders (user_id);
create index if not exists payment_orders_family_idx on public.payment_orders (family_id);
create index if not exists kudos_to_child_idx on public.kudos (to_child_id);
create index if not exists kudos_from_child_idx on public.kudos (from_child_id);

commit;
