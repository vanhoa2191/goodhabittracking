do $$
begin
  if to_regprocedure('public.get_public_leaderboard(text,date,uuid,integer)') is null then
    raise exception 'The public leaderboard function is missing';
  end if;

  if to_regprocedure('public.get_public_leaderboard(integer)') is not null then
    raise exception 'The old public leaderboard function must be removed';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_proc function_row
    where function_row.oid = 'public.get_public_leaderboard(text,date,uuid,integer)'::regprocedure
      and function_row.prosecdef
      and 'search_path=""' = any(function_row.proconfig)
  ) then
    raise exception 'The public leaderboard must run with a protected search path';
  end if;

  if not pg_catalog.has_function_privilege('anon', 'public.get_public_leaderboard(text,date,uuid,integer)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.set_family_public_leaderboard(uuid,boolean)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.set_family_public_leaderboard(uuid,boolean)', 'EXECUTE') then
    raise exception 'Public leaderboard execution grants are incorrect';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_attribute attribute
    join pg_catalog.pg_class relation on relation.oid = attribute.attrelid
    where relation.oid = 'public.child_profiles'::regclass
      and attribute.attname = 'is_public_on_leaderboard'
      and pg_catalog.pg_get_expr((select default_row.adbin from pg_catalog.pg_attrdef default_row
        where default_row.adrelid = attribute.attrelid and default_row.adnum = attribute.attnum), attribute.attrelid) <> 'false'
  ) then
    raise exception 'Children must start private on the public leaderboard';
  end if;
end $$;
