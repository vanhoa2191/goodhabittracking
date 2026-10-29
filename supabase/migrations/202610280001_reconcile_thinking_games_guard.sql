-- Reconcile the parent-role guard with the thinking-game lock and bonus sync.
-- This migration must sort after both the backfilled guard and all game migrations.
begin;

create or replace function public.complete_habit_command(
  target_activity_id uuid, target_child_id uuid, target_log_date date, command_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare fid uuid := public.current_family_id(); activity public.habit_activities%rowtype;
  awarded integer; next_status text; inserted boolean;
begin
  if fid is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(fid) then raise exception 'family_manage_required'; end if;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(target_child_id));
  if target_log_date is null or target_log_date not between current_date - 2 and current_date + 1 then raise exception 'log_date_out_of_range'; end if;
  select * into activity from public.habit_activities where id=target_activity_id and family_id=fid and is_active for share;
  if not found then raise exception 'activity_not_found'; end if;
  if coalesce(activity.is_parent_role,false) then return jsonb_build_object('status','parent_role_activity'); end if;
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
  perform public.sync_thinking_game_bonus_for_child(target_child_id,target_log_date);
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
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(s.child_id));
  if target_log_date is null or target_log_date not between current_date - 2 and current_date + 1 then raise exception 'log_date_out_of_range'; end if;
  select * into activity from public.habit_activities where id=target_activity_id and family_id=s.family_id
    and (child_id is null or child_id=s.child_id) and is_active for share;
  if not found then raise exception 'activity_not_found'; end if;
  if coalesce(activity.is_parent_role,false) then return jsonb_build_object('status','parent_role_activity'); end if;
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
  perform public.sync_thinking_game_bonus_for_child(s.child_id,target_log_date);
  update public.device_sessions set last_seen_at=now() where id=s.id;
  return jsonb_build_object('status',next_status,'logId',command_id,'pointsAwarded',awarded);
end $$;


create or replace function public.thinking_game_start(session_token_hash text, p_slot_type text,
  p_expected_local_day date, command_id uuid, p_content_version text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.device_sessions%rowtype; settings public.thinking_game_settings%rowtype;
  server_day date; local_now time; journey public.thinking_game_journeys%rowtype; e public.thinking_game_entitlements%rowtype;
  c public.thinking_game_content%rowtype; snap public.thinking_game_day_snapshots%rowtype; attempt public.thinking_game_attempts%rowtype;
    stale boolean := false; resume_existing boolean := false;
begin
  select * into s from public.device_sessions where token_hash=session_token_hash and revoked_at is null and expires_at > now()
    and 'child:read'=any(capabilities);
  if not found then raise exception 'session_invalid'; end if;
  perform public.thinking_game_apply_pending_settings(s.family_id);
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(s.child_id));
  select * into settings from public.thinking_game_settings where family_id=s.family_id for share;
  if settings.timezone is null then raise exception 'timezone_required'; end if;
  begin server_day := (now() at time zone settings.timezone)::date; exception when invalid_parameter_value then raise exception 'timezone_invalid'; end;
  if p_expected_local_day <> server_day then raise exception 'day_changed'; end if;
  perform public.thinking_game_rollover_child(s.child_id, s.family_id, server_day);
  if settings.settings_version = 1
    and settings.effective_from_local_day = server_day
    and settings.pending_settings is null
  then
    raise exception 'feature_off';
  end if;
  if not coalesce(settings.enabled,false) then raise exception 'feature_off'; end if;
  if exists (select 1 from public.family_engagement_settings where family_id=s.family_id and paused_at is not null) then
    raise exception 'paused';
  end if;
  if p_slot_type not in ('main','bonus') then raise exception 'invalid_slot'; end if;
  local_now := (now() at time zone settings.timezone)::time;
  if settings.bedtime_end_local <= settings.bedtime_start_local then
    if local_now >= settings.bedtime_start_local or local_now < settings.bedtime_end_local then
      raise exception 'bedtime';
    end if;
  elsif local_now >= settings.bedtime_start_local and local_now < settings.bedtime_end_local then
    raise exception 'bedtime';
  end if;
  select * into e from public.thinking_game_entitlements entitlement_row
    where entitlement_row.child_id=s.child_id and entitlement_row.local_day=server_day
      and entitlement_row.slot_type=p_slot_type;
  if found and e.state in ('revoked_unused','revoked_after_use','expired') then
    if p_slot_type='bonus' then raise exception 'bonus_locked'; end if;
    raise exception 'attempt_expired';
  end if;
  if found and e.state in ('started','finished') then
    select * into attempt from public.thinking_game_attempts where entitlement_id=e.id;
    if e.content_id is not null then
      select * into c from public.thinking_game_content where id=e.content_id;
    elsif e.content_version is not null then
      select * into c from public.thinking_game_content
        where content_version=e.content_version and slot_type=e.slot_type and day_index=e.journey_day_index
        order by id limit 1;
    end if;
    if c.id is not null and c.age_track is not null
      and c.age_track <> public.thinking_game_resolve_age_track_for_child(s.child_id, s.family_id)
    then
      update public.thinking_game_entitlements set state='revoked_unused', updated_at=now()
        where id=e.id;
      stale := true;
    end if;
    if e.id is not null and not stale and p_slot_type='main' then
      return jsonb_build_object('ok',true,'status',case when attempt.id is null then 'available' else 'started' end,
        'data',jsonb_build_object('entitlementId',e.id,'attemptId',attempt.id,'state',e.state,
          'contentVersion',e.content_version,'ageTrack',coalesce(c.age_track,public.thinking_game_resolve_age_track_for_child(s.child_id,s.family_id)),
          'puzzle',coalesce(c.public_payload,'{}'::jsonb)));
    end if;
    resume_existing := not stale;
  end if;
  select * into journey from public.thinking_game_journeys where child_id=s.child_id for update;
  if not found then insert into public.thinking_game_journeys(child_id,family_id) values(s.child_id,s.family_id) returning * into journey; end if;
  if p_slot_type='main' and journey.next_day_index > 365 then raise exception 'journey_complete'; end if;
  insert into public.thinking_game_day_snapshots(child_id,family_id,local_day,timezone,settings_version,cutoff_at,bedtime_start_at,bedtime_end_at,enabled,mandatory_tasks,journey_day_index)
    values(s.child_id,s.family_id,server_day,settings.timezone,settings.settings_version,
      (server_day::timestamp + settings.cutoff_local) at time zone settings.timezone,
      (server_day::timestamp + settings.bedtime_start_local) at time zone settings.timezone,
      ((server_day::timestamp + settings.bedtime_end_local
        + case when settings.bedtime_end_local <= settings.bedtime_start_local then interval '1 day' else interval '0 day' end)
        at time zone settings.timezone),
      settings.enabled,
      coalesce((select jsonb_agg(jsonb_build_object(
        'activityId', activity.id, 'requiresApproval', activity.requires_approval, 'title', activity.title
      ) order by activity.id) from public.habit_activities activity
        where activity.family_id=s.family_id and activity.child_id=s.child_id and activity.is_active), '[]'::jsonb),
      journey.next_day_index) on conflict do nothing returning * into snap;
  if snap.child_id is null then
    select * into snap from public.thinking_game_day_snapshots snapshot_row
      where snapshot_row.child_id=s.child_id and snapshot_row.local_day=server_day;
  end if;
  if p_slot_type='bonus' then
    if not settings.bonus_enabled then raise exception 'bonus_locked'; end if;
    if not exists (
      select 1 from public.thinking_game_entitlements main_entitlement
      where main_entitlement.child_id=s.child_id and main_entitlement.local_day=server_day
        and main_entitlement.slot_type='main'
        and main_entitlement.state in ('started','finished')
        and coalesce((select (result->>'won')::boolean from public.thinking_game_attempts main_attempt
          where main_attempt.entitlement_id=main_entitlement.id), false) = false
    ) then raise exception 'bonus_locked'; end if;
    if snap.mandatory_tasks = '[]'::jsonb then raise exception 'bonus_not_eligible'; end if;
    if exists (
      select 1 from jsonb_array_elements(snap.mandatory_tasks) task
      where not exists (
        select 1 from public.activity_logs log
        join public.thinking_game_habit_receipts receipt on receipt.log_id=log.id
        where log.child_id=s.child_id and log.activity_id=(task->>'activityId')::uuid
          and log.log_date=server_day and log.status in ('completed','approved')
          and receipt.received_at <= snap.cutoff_at
          and (coalesce((task->>'requiresApproval')::boolean,false) = false or log.status='approved')
      )
    ) then raise exception 'bonus_locked'; end if;
  end if;
  if resume_existing then
    return jsonb_build_object('ok',true,'status',case when attempt.id is null then 'available' else 'started' end,
      'data',jsonb_build_object('entitlementId',e.id,'attemptId',attempt.id,'state',e.state,
        'contentVersion',e.content_version,'ageTrack',coalesce(c.age_track,public.thinking_game_resolve_age_track_for_child(s.child_id,s.family_id)),
        'puzzle',coalesce(c.public_payload,'{}'::jsonb)));
  end if;
  if public.thinking_game_resolve_age_track_for_child(s.child_id, s.family_id) = 'age_track_unavailable' then
    raise exception 'age_track_unavailable';
  end if;
  select * into c from public.thinking_game_content
    where content_version=p_content_version
      and day_index=(case when p_slot_type='bonus' then snap.journey_day_index else journey.next_day_index end)
      and thinking_game_content.slot_type=p_slot_type
      and (status='approved' or (status='design_only'
        and (current_user='service_role'
          or current_setting('request.jwt.claim.role', true)='service_role')))
    and age_track = public.thinking_game_resolve_age_track_for_child(s.child_id, s.family_id)
    and locale='vi' limit 1;
  if not found then raise exception 'content_unavailable'; end if;
  if e.id is not null then
    update public.thinking_game_entitlements
      set state='started', content_id=c.id, content_version=c.content_version,
        command_id=thinking_game_start.command_id, updated_at=now()
      where id=e.id
      returning * into e;
  else
    insert into public.thinking_game_entitlements(child_id,family_id,local_day,slot_type,journey_day_index,content_id,content_version,state,command_id)
      values(s.child_id,s.family_id,server_day,p_slot_type,journey.next_day_index,c.id,c.content_version,'started',thinking_game_start.command_id) returning * into e;
  end if;
  if attempt.id is null then
    insert into public.thinking_game_attempts(entitlement_id,child_id,family_id,state,command_id) values(e.id,s.child_id,s.family_id,'started',thinking_game_start.command_id) returning * into attempt;
  else
    update public.thinking_game_attempts set state='started', command_id=thinking_game_start.command_id
      where id=attempt.id returning * into attempt;
  end if;
  if p_slot_type='main' then
    update public.thinking_game_journeys
      set next_day_index=next_day_index+1,last_main_started_local_day=server_day,updated_at=now()
      where child_id=s.child_id;
  end if;
  return jsonb_build_object('ok',true,'status','started','data',jsonb_build_object('entitlementId',e.id,'attemptId',attempt.id,'puzzle',c.public_payload));
end $$;


-- Health must attest the required backfilled migrations, not only the highest ledger row.
create or replace function public.schema_version()
returns text language plpgsql stable security definer set search_path = '' as $$
declare latest text;
begin
  if (select count(distinct version) from supabase_migrations.schema_migrations
      where version in ('202610260001','202610260002','202610210001',
                        '202610240001','202610250001','202610270001','202610280001')) <> 7 then
    return null;
  end if;
  select max(version)::text into latest from supabase_migrations.schema_migrations;
  return latest;
end $$;

commit;
