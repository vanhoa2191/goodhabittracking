do $$
declare
  missing text;
begin
  select string_agg(expected.column_name, ', ') into missing
  from (values ('graduated_at'), ('graduation_check_due'), ('base_points')) as expected(column_name)
  where not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'habit_activities' and column_name = expected.column_name
  );
  if missing is not null then
    raise exception 'habit_activities is missing columns: %', missing;
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.habit_activities'::regclass and conname = 'habit_activities_base_points_range'
  ) or not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.habit_activities'::regclass and conname = 'habit_activities_graduation_check_needs_graduation'
  ) then
    raise exception 'habit_activities graduation constraints are missing';
  end if;

  if pg_catalog.pg_get_functiondef('public.family_snapshot(boolean, boolean, boolean)'::regprocedure) not like '%graduation_check_due%'
    or pg_catalog.pg_get_functiondef('public.family_snapshot(boolean, boolean, boolean)'::regprocedure) not like '%base_points%' then
    raise exception 'family_snapshot does not return the graduation columns';
  end if;

  if pg_catalog.pg_get_functiondef('public.get_child_session(text)'::regprocedure) not like '%graduatedAt%' then
    raise exception 'get_child_session does not return graduatedAt';
  end if;

  if not pg_catalog.has_function_privilege('authenticated', 'public.family_snapshot(boolean, boolean, boolean)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.family_snapshot(boolean, boolean, boolean)', 'EXECUTE') then
    raise exception 'family_snapshot privileges changed';
  end if;

  if pg_catalog.has_table_privilege('anon', 'public.habit_activities', 'UPDATE')
    or pg_catalog.has_table_privilege('anon', 'public.habit_activities', 'SELECT') then
    raise exception 'anon must not reach habit_activities';
  end if;
end
$$;
