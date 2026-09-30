do $$
declare
  leaked text;
begin
  if pg_catalog.has_function_privilege('anon', 'public.delete_owned_family(text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.complete_habit_command(uuid,uuid,date,uuid)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.redeem_family_coupon(text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('anon', 'public.get_child_session(text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('anon', 'public.get_public_leaderboard(text,date,uuid,integer)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.complete_habit_command(uuid,uuid,date,uuid)', 'EXECUTE') then
    raise exception 'Function execution grants are incorrect';
  end if;

  if pg_catalog.has_table_privilege('anon', 'public.child_profiles', 'SELECT')
    or pg_catalog.has_table_privilege('authenticated', 'public.child_profiles', 'UPDATE')
    or pg_catalog.has_table_privilege('authenticated', 'public.activity_logs', 'TRUNCATE') then
    raise exception 'Table grants are too broad';
  end if;

  if pg_catalog.has_column_privilege('authenticated', 'public.parent_settings', 'parent_pin_hash', 'SELECT')
    or pg_catalog.has_column_privilege('authenticated', 'public.device_sessions', 'token_hash', 'SELECT')
    or pg_catalog.has_table_privilege('authenticated', 'public.pairing_credentials', 'SELECT') then
    raise exception 'Secret columns are readable by signed-in parents';
  end if;

  select string_agg(relation.relname, ', ') into leaked
  from pg_catalog.pg_class relation
  join pg_catalog.pg_namespace namespace_row on namespace_row.oid = relation.relnamespace
  where namespace_row.nspname = 'public' and relation.relkind = 'r' and not relation.relforcerowsecurity;
  if leaked is not null then
    raise exception 'Row-level security is not forced on: %', leaked;
  end if;

  if pg_catalog.pg_get_functiondef('public.complete_habit_command(uuid,uuid,date,uuid)'::regprocedure) not like '%log_date_out_of_range%'
    or pg_catalog.pg_get_functiondef('public.complete_child_habit_command(text,uuid,date,uuid)'::regprocedure) not like '%log_date_out_of_range%' then
    raise exception 'Completion commands must limit the log date';
  end if;
end $$;
