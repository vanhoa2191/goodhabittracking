begin;

alter table public.habit_activities
  add column if not exists instructions text;

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

commit;
