do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_proc function_row
    join pg_catalog.pg_roles owner_role on owner_role.oid = function_row.proowner
    where function_row.oid = 'public.open_daily_mascot_letter(uuid,date,boolean,text)'::regprocedure
      and function_row.prosecdef
      and (owner_role.rolsuper or owner_role.rolbypassrls)
      and 'search_path=""' = any(function_row.proconfig)
  ) then
    raise exception 'Daily letter command must have a protected execution context';
  end if;

  if not pg_catalog.has_function_privilege(
    'anon', 'public.open_daily_mascot_letter(uuid,date,boolean,text)', 'EXECUTE'
  ) or not pg_catalog.has_function_privilege(
    'authenticated', 'public.open_daily_mascot_letter(uuid,date,boolean,text)', 'EXECUTE'
  ) then
    raise exception 'Daily letter command is unavailable to a paired child or parent';
  end if;

  if pg_catalog.has_table_privilege('anon', 'public.daily_mascot_letters', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.daily_mascot_letters', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.daily_mascot_letters', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.daily_mascot_letters', 'UPDATE') then
    raise exception 'Daily letters must only be written through the authorized command';
  end if;
end $$;
