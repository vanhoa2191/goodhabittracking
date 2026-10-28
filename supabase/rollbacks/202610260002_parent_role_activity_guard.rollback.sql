begin;

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

commit;
