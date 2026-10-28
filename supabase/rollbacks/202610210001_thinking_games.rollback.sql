begin;
drop trigger if exists thinking_game_activity_lock_before on public.activity_logs;
drop trigger if exists thinking_game_activity_receipt_after on public.activity_logs;
drop trigger if exists thinking_game_activity_z_bonus_sync_after on public.activity_logs;
drop function if exists public.thinking_game_activity_lock();
drop function if exists public.thinking_game_activity_receipt();
drop function if exists public.thinking_game_activity_bonus_sync();
drop function if exists public.thinking_game_apply_pending_settings(uuid);
drop function if exists public.sync_thinking_game_bonus_for_child(uuid,date);
drop function if exists public.thinking_game_resolve_content_version();
drop function if exists public.thinking_game_resolve_trusted_release_version();
drop function if exists public.thinking_game_child_settings(text);
drop function if exists public.thinking_game_bonus_for_child(uuid,date);
drop function if exists public.thinking_game_preview_day(uuid,uuid,date);
drop function if exists public.thinking_game_update_settings_as(uuid,uuid,boolean,boolean,text,time,time,time,text,uuid);
drop function if exists public.thinking_game_excuse_task_as(uuid,uuid,date,uuid,text,uuid);
drop function if exists public.thinking_game_pause(text,uuid,uuid);
drop function if exists public.thinking_game_finish(text,uuid,jsonb,uuid);
drop function if exists public.thinking_game_finish_verified(text,uuid,boolean,jsonb,uuid);
drop function if exists public.thinking_game_parent_state_as(uuid,uuid,date);
drop function if exists public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid,text);
drop function if exists public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid);
drop function if exists public.thinking_game_parent_pause_as(uuid,uuid,uuid,uuid);
drop function if exists public.thinking_game_parent_finish_as(uuid,uuid,uuid,boolean,jsonb,uuid);
drop function if exists public.thinking_game_start(text,text,date,uuid,text);
drop function if exists public.thinking_game_start(text, text, date, uuid);
drop function if exists public.thinking_game_state(text, date);
drop function if exists public.thinking_game_rollover_child(uuid,uuid,date);
drop function if exists public.thinking_game_resolve_age_track_for_child(uuid,uuid);
drop function if exists public.thinking_game_lock_key(uuid);
drop table if exists public.thinking_game_audit_events;
drop table if exists public.thinking_game_habit_receipts;
drop table if exists public.thinking_game_attempts;
drop table if exists public.thinking_game_entitlements;
drop table if exists public.thinking_game_content;
drop table if exists public.thinking_game_day_snapshots;
drop table if exists public.thinking_game_journeys;
drop table if exists public.thinking_game_settings;

-- Restore the 6 habit RPCs to their pre-thinking_games definitions (from 202610090030_family_operations_hardening.sql)
create or replace function public.complete_habit_command(
  target_activity_id uuid, target_child_id uuid, target_log_date date, command_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare fid uuid := public.current_family_id(); activity public.habit_activities%rowtype;
  awarded integer; next_status text; inserted boolean;
begin
  if fid is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(fid) then raise exception 'family_manage_required'; end if;
  if target_log_date is null or target_log_date not between current_date - 2 and current_date + 1 then raise exception 'log_date_out_of_range'; end if;
  select * into activity from public.habit_activities where id=target_activity_id and family_id=fid and is_active for share;
  if not found then raise exception 'activity_not_found'; end if;
  if activity.child_id is not null and activity.child_id <> target_child_id then raise exception 'activity_child_mismatch'; end if;
  perform 1 from public.child_profiles where id=target_child_id and family_id=fid for update;
  if not found then raise exception 'child_not_found'; end if;
  next_status := case when activity.requires_approval then 'pending_approval' else 'completed' end;
  awarded := case when activity.requires_approval then 0 else activity.points end;
  insert into public.activity_logs(id,family_id,user_id,activity_id,child_id,log_date,status,points_awarded)
    values(command_id,fid,auth.uid(),target_activity_id,target_child_id,target_log_date,next_status,awarded)
    on conflict (activity_id,child_id,log_date) do nothing;
  inserted := found;
  if not inserted then return jsonb_build_object('status','duplicate'); end if;
  if awarded > 0 then update public.child_profiles set points=points+awarded,total_earned=total_earned+awarded,
    level=greatest(1,floor((total_earned+awarded)/100.0)::integer+1) where id=target_child_id and family_id=fid; end if;
  perform public.recompute_child_streak(target_child_id);
  return jsonb_build_object('status',next_status,'logId',command_id,'pointsAwarded',awarded);
end $$;

create or replace function public.complete_child_habit_command(
  session_token_hash text, target_activity_id uuid, target_log_date date, command_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.device_sessions%rowtype; activity public.habit_activities%rowtype;
  awarded integer; next_status text;
begin
  select * into s from public.device_sessions where token_hash=session_token_hash and revoked_at is null
    and expires_at>now() and 'child:complete'=any(capabilities)
  for update;
  if not found then return jsonb_build_object('status','session_invalid'); end if;
  if target_log_date is null or target_log_date not between current_date - 2 and current_date + 1 then raise exception 'log_date_out_of_range'; end if;
  select * into activity from public.habit_activities where id=target_activity_id and family_id=s.family_id
    and (child_id is null or child_id=s.child_id) and is_active for share;
  if not found then raise exception 'activity_not_found'; end if;
  if target_log_date < (activity.created_at at time zone 'UTC')::date - 1 then
    raise exception 'activity_not_started';
  end if;
  if not coalesce((case activity.recurrence_type when 'daily' then true when 'weekdays' then extract(dow from target_log_date)::integer between 1 and 5
    when 'weekends' then extract(dow from target_log_date)::integer in (0,6)
    when 'custom' then coalesce(activity.recurrence_days,'[]'::jsonb) @> jsonb_build_array(extract(dow from target_log_date)::integer) else false end),false)
    then raise exception 'activity_not_scheduled'; end if;
  perform 1 from public.child_profiles where id=s.child_id and family_id=s.family_id for update;
  if not found then raise exception 'child_not_found'; end if;
  next_status:=case when activity.requires_approval then 'pending_approval' else 'completed' end;
  awarded:=case when activity.requires_approval then 0 else activity.points end;
  insert into public.activity_logs(id,family_id,user_id,activity_id,child_id,log_date,status,points_awarded)
    values(command_id,s.family_id,null,activity.id,s.child_id,target_log_date,next_status,awarded)
    on conflict (activity_id,child_id,log_date) do nothing;
  if not found then return jsonb_build_object('status','duplicate'); end if;
  if awarded>0 then update public.child_profiles set points=points+awarded,total_earned=total_earned+awarded,
    level=greatest(1,floor((total_earned+awarded)/100.0)::integer+1) where id=s.child_id and family_id=s.family_id; end if;
  perform public.recompute_child_streak(s.child_id);
  update public.device_sessions set last_seen_at=now() where id=s.id;
  return jsonb_build_object('status',next_status,'logId',command_id,'pointsAwarded',awarded);
end $$;

create or replace function public.undo_habit_command(target_log_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare fid uuid:=public.current_family_id(); l public.activity_logs%rowtype; c public.child_profiles%rowtype;
begin
  if fid is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(fid) then raise exception 'family_manage_required'; end if;
  select * into l from public.activity_logs where id=target_log_id and family_id=fid for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if l.status not in ('completed','pending_approval') then return jsonb_build_object('status','not_reversible'); end if;
  select * into c from public.child_profiles where id=l.child_id and family_id=fid for update;
  if l.points_awarded>0 and c.points<l.points_awarded then return jsonb_build_object('status','points_already_spent'); end if;
  if l.points_awarded>0 then update public.child_profiles set points=points-l.points_awarded,total_earned=greatest(0,total_earned-l.points_awarded),
    level=greatest(1,floor(greatest(0,total_earned-l.points_awarded)/100.0)::integer+1) where id=l.child_id and family_id=fid; end if;
  delete from public.activity_logs where id=l.id;
  perform public.recompute_child_streak(l.child_id);
  return jsonb_build_object('status','undone');
end $$;

create or replace function public.undo_child_habit_command(session_token_hash text,target_log_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.device_sessions%rowtype; l public.activity_logs%rowtype; c public.child_profiles%rowtype;
begin
  select * into s from public.device_sessions where token_hash=session_token_hash and revoked_at is null and expires_at>now() and 'child:complete'=any(capabilities)
  for update;
  if not found then return jsonb_build_object('status','session_invalid'); end if;
  select child_id into c.id from public.activity_logs where id=target_log_id and family_id=s.family_id and child_id=s.child_id;
  if c.id is null then return jsonb_build_object('status','not_found'); end if;
  select * into l from public.activity_logs where id=target_log_id and family_id=s.family_id and child_id=s.child_id for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if l.status not in ('completed','pending_approval') then return jsonb_build_object('status','not_reversible'); end if;
  select * into c from public.child_profiles where id=s.child_id and family_id=s.family_id for update;
  if l.points_awarded>0 and c.points<l.points_awarded then return jsonb_build_object('status','points_already_spent'); end if;
  if l.points_awarded>0 then update public.child_profiles set points=greatest(0,points-l.points_awarded),total_earned=greatest(0,total_earned-l.points_awarded),
    level=greatest(1,floor(greatest(0,total_earned-l.points_awarded)/100.0)::integer+1) where id=s.child_id and family_id=s.family_id; end if;
  delete from public.activity_logs where id=l.id;
  perform public.recompute_child_streak(l.child_id);
  update public.device_sessions set last_seen_at=now() where id=s.id;
  return jsonb_build_object('status','undone');
end $$;

create or replace function public.review_habit_command(target_log_id uuid, decision text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare fid uuid:=public.current_family_id(); l public.activity_logs%rowtype; award integer;
begin
  if fid is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(fid) then raise exception 'family_manage_required'; end if;
  if decision not in ('approve','reject') then raise exception 'invalid_decision'; end if;
  select * into l from public.activity_logs where id=target_log_id and family_id=fid for update;
  if not found then raise exception 'log_not_found'; end if;
  if l.status <> 'pending_approval' then return jsonb_build_object('status','already_reviewed'); end if;
  perform 1 from public.child_profiles where id=l.child_id and family_id=fid for update;
  if decision='reject' then
    update public.activity_logs set status='rejected',points_awarded=0 where id=l.id;
    return jsonb_build_object('status','rejected');
  else
    select points into award from public.habit_activities where id=l.activity_id and family_id=fid;
    update public.activity_logs set status='approved',points_awarded=award where id=l.id;
    update public.child_profiles set points=points+award,total_earned=total_earned+award,
      level=greatest(1,floor((total_earned+award)/100.0)::integer+1) where id=l.child_id and family_id=fid;
    perform public.recompute_child_streak(l.child_id);
    return jsonb_build_object('status','approved','pointsAwarded',award);
  end if;
end $$;

create or replace function public.review_habits_command(target_log_ids uuid[], decision text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor_family_id uuid := public.current_family_id();
  ordered_ids uuid[];
  current_id uuid;
  outcome jsonb;
  results jsonb := '[]'::jsonb;
  l_status text;
  l_points integer;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  if decision not in ('approve','reject') then raise exception 'invalid_decision'; end if;
  if target_log_ids is null or cardinality(target_log_ids) = 0 then raise exception 'no_logs'; end if;

  select coalesce(array_agg(id order by id), '{}'::uuid[]) into ordered_ids
  from (select distinct unnest(target_log_ids) as id) ids;
  if cardinality(ordered_ids) > 50 then raise exception 'too_many_logs'; end if;

  perform 1 from public.activity_logs
  where id = any(ordered_ids) and family_id = actor_family_id
  order by id for update;
  perform 1 from public.child_profiles
  where family_id = actor_family_id
    and id in (select child_id from public.activity_logs where id = any(ordered_ids) and family_id = actor_family_id)
  order by id for update;

  foreach current_id in array ordered_ids loop
    if not exists (
      select 1 from public.activity_logs where id = current_id and family_id = actor_family_id
    ) then
      results := results || jsonb_build_object('logId', current_id, 'status', 'not_found');
    else
      -- Delegate to review_habit_command for consistent level calculation and audit trail
      perform public.review_habit_command(current_id, decision);
      select status, points_awarded into l_status, l_points from public.activity_logs where id = current_id;
      results := results || jsonb_build_object('logId', current_id, 'status', l_status, 'pointsAwarded', l_points);
    end if;
  end loop;

  return jsonb_build_object('status', 'reviewed', 'results', results);
end $$;

-- NOTE: No revoke/grant block for the six legacy habit RPCs.
-- CREATE OR REPLACE preserves existing privileges. Production ACLs (set by 202610050002_close_pin_gated_originals.sql)
-- keep review_habit_command/review_habits_command callable only by postgres (owner), with access via
-- review_habit_command_as/review_habits_command_as (service_role only). The other four functions retain
-- their existing grants (complete/undo_habit_command: postgres,authenticated,service_role;
-- complete/undo_child_habit_command: postgres,anon,authenticated,service_role).

commit;
