begin;

revoke insert, update, delete on public.activity_logs from authenticated;
revoke insert, update, delete on public.redemptions from authenticated;

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
begin
  select * into log_row from public.activity_logs
  where id = target_log_id and family_id = actor_family_id for update;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  if log_row.status not in ('completed', 'pending_approval') then
    return jsonb_build_object('status', 'not_reversible');
  end if;

  if log_row.points_awarded > 0 then
    update public.child_profiles
      set points = greatest(0, points - log_row.points_awarded),
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

revoke all on function public.complete_habit_command(uuid, uuid, date, uuid) from public;
revoke all on function public.undo_habit_command(uuid) from public;
revoke all on function public.review_habit_command(uuid, text) from public;
revoke all on function public.redeem_reward_command(uuid, uuid, uuid) from public;
revoke all on function public.transition_redemption_command(uuid, text) from public;
grant execute on function public.complete_habit_command(uuid, uuid, date, uuid) to authenticated;
grant execute on function public.undo_habit_command(uuid) to authenticated;
grant execute on function public.review_habit_command(uuid, text) to authenticated;
grant execute on function public.redeem_reward_command(uuid, uuid, uuid) to authenticated;
grant execute on function public.transition_redemption_command(uuid, text) to authenticated;

commit;
