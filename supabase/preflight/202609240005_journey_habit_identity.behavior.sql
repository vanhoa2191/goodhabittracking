begin;

do $$
declare
  seed public.habit_activities%rowtype;
  target_child_id uuid;
  candidate_key text;
  conflict_name text;
  suffix integer;
begin
  select activity.* into seed
  from public.habit_activities as activity
  where exists (
    select 1 from public.child_profiles as child
    where child.family_id = activity.family_id
  )
  limit 1;

  if not found then
    raise exception 'An existing family activity and child are required for the rollback-only journey check';
  end if;

  select child.id into target_child_id
  from public.child_profiles as child
  where child.family_id = seed.family_id
  limit 1;

  for suffix in 0..99 loop
    candidate_key := 'week-4:' || suffix;
    exit when not exists (
      select 1 from public.habit_activities as activity
      where activity.family_id = seed.family_id
        and activity.journey_habit_key = candidate_key
    );
  end loop;

  if exists (
    select 1 from public.habit_activities as activity
    where activity.family_id = seed.family_id
      and activity.journey_habit_key = candidate_key
  ) then
    raise exception 'No unused journey identity is available for the rollback-only check';
  end if;

  insert into public.habit_activities (
    id, user_id, family_id, child_id, title, description, icon, category,
    points, recurrence_type, recurrence_days, time_of_day, duration_minutes,
    requires_approval, is_active, journey_habit_key
  ) values (
    gen_random_uuid(), seed.user_id, seed.family_id, target_child_id,
    seed.title, seed.description, seed.icon, seed.category, seed.points,
    seed.recurrence_type, seed.recurrence_days, seed.time_of_day,
    seed.duration_minutes, seed.requires_approval, seed.is_active, candidate_key
  );

  begin
    insert into public.habit_activities (
      id, user_id, family_id, child_id, title, description, icon, category,
      points, recurrence_type, recurrence_days, time_of_day, duration_minutes,
      requires_approval, is_active, journey_habit_key
    ) values (
      gen_random_uuid(), seed.user_id, seed.family_id, null,
      seed.title, seed.description, seed.icon, seed.category, seed.points,
      seed.recurrence_type, seed.recurrence_days, seed.time_of_day,
      seed.duration_minutes, seed.requires_approval, seed.is_active, candidate_key
    );
    raise exception 'Journey scope guard accepted an overlapping family assignment';
  exception when unique_violation then
    get stacked diagnostics conflict_name = constraint_name;
    if conflict_name <> 'habit_activities_journey_scope_unique' then
      raise exception 'Unexpected uniqueness failure in journey scope check';
    end if;
  end;
end $$;

rollback;
