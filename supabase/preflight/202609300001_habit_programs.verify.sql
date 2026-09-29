do $$
begin
  if to_regclass('public.habit_cue_plans') is null or to_regclass('public.habit_support_observations') is null then
    raise exception 'Habit program tables are missing';
  end if;

  if exists (
    select 1 from pg_catalog.pg_class relation
    where relation.oid in ('public.habit_cue_plans'::regclass, 'public.habit_support_observations'::regclass)
      and not (relation.relrowsecurity and relation.relforcerowsecurity)
  ) then
    raise exception 'Habit program tables must enforce row level security';
  end if;

  if pg_catalog.has_table_privilege('authenticated', 'public.habit_cue_plans', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.habit_support_observations', 'INSERT')
    or pg_catalog.has_table_privilege('anon', 'public.habit_cue_plans', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.habit_support_observations', 'SELECT') then
    raise exception 'Habit program table privileges are too broad';
  end if;

  if pg_catalog.has_function_privilege('anon', 'public.set_parent_habit_support(uuid,uuid,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.save_parent_habit_cue_plan(uuid,uuid,uuid,text,text,time,text,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.record_habit_support_internal(uuid,uuid,uuid,text,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.record_habit_support_internal(uuid,uuid,uuid,text,text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.set_parent_habit_support(uuid,uuid,text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.save_parent_habit_cue_plan(uuid,uuid,uuid,text,text,time,text,text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('anon', 'public.set_child_habit_support(text,uuid,text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('anon', 'public.read_child_habit_programs(text)', 'EXECUTE') then
    raise exception 'Habit program execution grants are incorrect';
  end if;

  if exists (
    select 1 from public.habit_support_observations observation
    join public.activity_logs log on log.id = observation.log_id
    where log.family_id <> observation.family_id
      or log.child_id <> observation.child_id
      or log.activity_id <> observation.activity_id
  ) then
    raise exception 'A support observation does not match its log';
  end if;
end $$;
