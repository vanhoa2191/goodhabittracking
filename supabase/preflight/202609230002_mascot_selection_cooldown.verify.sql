do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_roles owner_role on owner_role.oid = function_row.proowner
    where function_row.oid = 'public.record_mascot_selection()'::regprocedure
      and function_row.prosecdef
      and (owner_role.rolsuper or owner_role.rolbypassrls)
      and 'search_path=""' = any(function_row.proconfig)
  ) then
    raise exception 'Mascot selection trigger must have a protected execution context';
  end if;

  if pg_catalog.has_table_privilege('authenticated', 'public.child_engagement_profiles', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.child_engagement_profiles', 'UPDATE')
    or pg_catalog.has_table_privilege('authenticated', 'public.child_engagement_profiles', 'DELETE') then
    raise exception 'Mascot selection timestamp must not be writable directly';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger trigger_row
    join pg_catalog.pg_class relation on relation.oid = trigger_row.tgrelid
    join pg_catalog.pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'child_profiles'
      and trigger_row.tgname = 'child_profile_mascot_selection'
      and trigger_row.tgfoid = 'public.record_mascot_selection()'::regprocedure
      and trigger_row.tgenabled <> 'D'
      and not trigger_row.tgisinternal
  ) then
    raise exception 'Mascot selection trigger is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger trigger_row
    join pg_catalog.pg_class relation on relation.oid = trigger_row.tgrelid
    join pg_catalog.pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'child_profiles'
      and trigger_row.tgname = 'child_profile_initial_mascot_selection'
      and trigger_row.tgfoid = 'public.record_mascot_selection()'::regprocedure
      and trigger_row.tgenabled <> 'D'
      and not trigger_row.tgisinternal
  ) then
    raise exception 'Initial mascot selection trigger is missing';
  end if;

  if pg_catalog.has_function_privilege('authenticated', 'public.record_mascot_selection()', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.record_mascot_selection()', 'EXECUTE') then
    raise exception 'Mascot selection trigger must not be callable directly';
  end if;

  if not pg_catalog.has_function_privilege('anon', 'public.read_child_mascot_selection(text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('anon', 'public.update_child_mascot_command(text, text, text)', 'EXECUTE') then
    raise exception 'Paired child mascot commands are unavailable';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_roles owner_role on owner_role.oid = function_row.proowner
    where function_row.oid in (
      'public.read_child_mascot_selection(text)'::regprocedure,
      'public.update_child_mascot_command(text, text, text)'::regprocedure
    )
      and function_row.prosecdef
      and (owner_role.rolsuper or owner_role.rolbypassrls)
      and 'search_path=""' = any(function_row.proconfig)
  ) <> 2 then
    raise exception 'Paired child mascot commands need a protected execution context';
  end if;
end $$;
