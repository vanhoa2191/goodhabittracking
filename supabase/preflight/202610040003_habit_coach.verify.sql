do $$
declare
  missing text;
  function_row record;
begin
  select string_agg(expected.column_name, ', ') into missing
  from (values
    ('habit_tries', 'id'), ('habit_tries', 'family_id'), ('habit_tries', 'child_id'),
    ('habit_tries', 'activity_id'), ('habit_tries', 'kind'), ('habit_tries', 'started_on'),
    ('habit_tries', 'ends_on'), ('habit_tries', 'outcome'), ('habit_tries', 'created_at'),
    ('habit_tries', 'resolved_at'), ('child_weekly_focus', 'family_id'), ('child_weekly_focus', 'child_id'),
    ('child_weekly_focus', 'week_start'), ('child_weekly_focus', 'activity_ids'),
    ('child_weekly_focus', 'chosen_by'), ('child_weekly_focus', 'updated_at'),
    ('habit_activities', 'offered_for_focus')
  ) as expected(table_name, column_name)
  where not exists (
    select 1 from information_schema.columns column_row
    where column_row.table_schema = 'public'
      and column_row.table_name = expected.table_name
      and column_row.column_name = expected.column_name
  );
  if missing is not null then raise exception 'habit coach columns are missing: %', missing; end if;

  if not exists (select 1 from pg_catalog.pg_constraint where conrelid = 'public.habit_tries'::regclass and conname = 'habit_tries_child_family_fk')
    or not exists (select 1 from pg_catalog.pg_constraint where conrelid = 'public.habit_tries'::regclass and conname = 'habit_tries_activity_family_fk')
    or not exists (select 1 from pg_catalog.pg_constraint where conrelid = 'public.habit_tries'::regclass and conname = 'habit_tries_kind_check')
    or not exists (select 1 from pg_catalog.pg_constraint where conrelid = 'public.habit_tries'::regclass and conname = 'habit_tries_ends_on_check')
    or not exists (select 1 from pg_catalog.pg_constraint where conrelid = 'public.habit_tries'::regclass and conname = 'habit_tries_outcome_check')
    or not exists (select 1 from pg_catalog.pg_constraint where conrelid = 'public.child_weekly_focus'::regclass and conname = 'child_weekly_focus_child_family_fk')
    or not exists (select 1 from pg_catalog.pg_constraint where conrelid = 'public.child_weekly_focus'::regclass and conname = 'child_weekly_focus_activity_ids_limit')
    or not exists (select 1 from pg_catalog.pg_constraint where conrelid = 'public.child_weekly_focus'::regclass and conname = 'child_weekly_focus_chosen_by_check') then
    raise exception 'habit coach constraints are missing';
  end if;

  if not (select relrowsecurity and relforcerowsecurity from pg_catalog.pg_class where oid = 'public.habit_tries'::regclass)
    or not (select relrowsecurity and relforcerowsecurity from pg_catalog.pg_class where oid = 'public.child_weekly_focus'::regclass) then
    raise exception 'habit coach tables must enable and force row level security';
  end if;

  if has_table_privilege('anon', 'public.habit_tries', 'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
    or has_table_privilege('authenticated', 'public.habit_tries', 'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
    or has_table_privilege('anon', 'public.child_weekly_focus', 'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
    or has_table_privilege('authenticated', 'public.child_weekly_focus', 'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') then
    raise exception 'habit coach tables must have no direct write privileges';
  end if;
  if not has_table_privilege('authenticated', 'public.habit_tries', 'SELECT')
    or not has_table_privilege('authenticated', 'public.child_weekly_focus', 'SELECT') then
    raise exception 'authenticated must have select access to habit coach tables';
  end if;

  for function_row in
    select procedure.oid::regprocedure as signature, procedure.prosecdef, procedure.proconfig
    from pg_catalog.pg_proc procedure
    join pg_catalog.pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname in (
        'start_habit_try', 'resolve_habit_try', 'set_weekly_focus_for_child',
        'set_child_weekly_focus', 'family_snapshot', 'get_child_session'
      )
  loop
    if not function_row.prosecdef or not coalesce(function_row.proconfig, '{}'::text[]) @> array['search_path=""'] then
      raise exception 'function % must be security definer with an empty search_path', function_row.signature;
    end if;
  end loop;

  if not has_function_privilege('authenticated', 'public.start_habit_try(uuid, uuid, text, integer, date, jsonb)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.resolve_habit_try(uuid, text)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.set_weekly_focus_for_child(uuid, date, uuid[])', 'EXECUTE')
    or not has_function_privilege('anon', 'public.set_child_weekly_focus(text, date, uuid[])', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.set_child_weekly_focus(text, date, uuid[])', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.family_snapshot(boolean, boolean, boolean)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.get_child_session(text)', 'EXECUTE')
    or not has_function_privilege('anon', 'public.get_child_session(text)', 'EXECUTE') then
    raise exception 'habit coach function grants are incorrect';
  end if;
  if has_function_privilege('anon', 'public.start_habit_try(uuid, uuid, text, integer, date, jsonb)', 'EXECUTE')
    or has_function_privilege('service_role', 'public.start_habit_try(uuid, uuid, text, integer, date, jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.resolve_habit_try(uuid, text)', 'EXECUTE')
    or has_function_privilege('service_role', 'public.resolve_habit_try(uuid, text)', 'EXECUTE')
    or has_function_privilege('anon', 'public.set_weekly_focus_for_child(uuid, date, uuid[])', 'EXECUTE')
    or has_function_privilege('anon', 'public.family_snapshot(boolean, boolean, boolean)', 'EXECUTE')
    or has_function_privilege('service_role', 'public.set_weekly_focus_for_child(uuid, date, uuid[])', 'EXECUTE')
    or has_function_privilege('service_role', 'public.set_child_weekly_focus(text, date, uuid[])', 'EXECUTE')
    or has_function_privilege('service_role', 'public.family_snapshot(boolean, boolean, boolean)', 'EXECUTE')
    or has_function_privilege('service_role', 'public.get_child_session(text)', 'EXECUTE') then
    raise exception 'habit coach function grants expose a function to an unintended role';
  end if;

  if pg_catalog.pg_get_functiondef('public.family_snapshot(boolean, boolean, boolean)'::regprocedure)
       not like '%''offered_for_focus'', t.offered_for_focus%'
    or pg_catalog.pg_get_functiondef('public.family_snapshot(boolean, boolean, boolean)'::regprocedure)
       not like '%''habitTries''%''weeklyFocus''%'
    or pg_catalog.pg_get_functiondef('public.get_child_session(text)'::regprocedure)
       not like '%''offeredForFocus'', activity.offered_for_focus%'
    or pg_catalog.pg_get_functiondef('public.get_child_session(text)'::regprocedure)
       not like '%''weeklyFocus''%week_start >= current_date - 14%' then
    raise exception 'habit coach snapshot functions omit required keys';
  end if;
end
$$;
