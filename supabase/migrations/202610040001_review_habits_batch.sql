begin;

-- Reviews several waiting tasks in one call, with the same rules as reviewing a single task: every log goes
-- through review_habit_command, so stars, level and streak are credited exactly once and a log that was already
-- reviewed is reported, not touched again. Locks are always taken logs first, then the children's profiles, each in
-- id order, which is the order a single review takes them too, so reviews running at the same time cannot wait on
-- each other in a circle.
create or replace function public.review_habits_command(target_log_ids uuid[], decision text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  ordered_ids uuid[];
  current_id uuid;
  outcome jsonb;
  results jsonb := '[]'::jsonb;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  if decision not in ('approve', 'reject') then raise exception 'invalid_decision'; end if;
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
      results := results || jsonb_build_array(jsonb_build_object('logId', current_id, 'status', 'not_found'));
    else
      outcome := public.review_habit_command(current_id, decision);
      results := results || jsonb_build_array(outcome || jsonb_build_object('logId', current_id));
    end if;
  end loop;

  return jsonb_build_object('status', 'reviewed', 'results', results);
end
$$;

revoke all on function public.review_habits_command(uuid[], text) from public, anon, service_role;
grant execute on function public.review_habits_command(uuid[], text) to authenticated;

commit;
