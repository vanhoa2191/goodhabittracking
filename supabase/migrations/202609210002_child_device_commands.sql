begin;

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
    update public.child_profiles
    set points = greatest(0, points - log_row.points_awarded),
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
    id, family_id, user_id, reward_id, child_id, points_spent, status
  ) values (
    command_id, child_session.family_id, null, reward.id,
    child_session.child_id, reward.cost_points, 'pending'
  );

  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'pending', 'redemptionId', command_id);
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
        'createdAt', activity.created_at
      ) order by activity.created_at)
      from public.habit_activities activity
      where activity.family_id = child_session.family_id
        and (activity.child_id is null or activity.child_id = child_session.child_id)
        and activity.is_active
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

revoke all on function public.complete_child_habit_command(text, uuid, date, uuid) from public;
revoke all on function public.undo_child_habit_command(text, uuid) from public;
revoke all on function public.redeem_child_reward_command(text, uuid, uuid) from public;
grant execute on function public.complete_child_habit_command(text, uuid, date, uuid) to anon, authenticated;
grant execute on function public.undo_child_habit_command(text, uuid) to anon, authenticated;
grant execute on function public.redeem_child_reward_command(text, uuid, uuid) to anon, authenticated;

commit;
