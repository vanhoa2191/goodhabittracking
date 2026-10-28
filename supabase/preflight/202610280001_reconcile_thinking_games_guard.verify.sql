do $$
declare required_versions text[] := array[
  '202610120001', '202610120002', '202610210001', '202610240001',
  '202610250001', '202610270001', '202610280001'
];
begin
  if exists (
    select 1 from unnest(required_versions) required(version)
    where not exists (
      select 1 from supabase_migrations.schema_migrations applied
      where applied.version = required.version
    )
  ) then
    raise exception 'required_migration_missing';
  end if;
  if public.schema_version() is distinct from
    (select max(version)::text from supabase_migrations.schema_migrations) then
    raise exception 'schema_version_incomplete';
  end if;
  if not exists (
    select 1 from pg_proc proc join pg_namespace namespace on namespace.oid=proc.pronamespace
    where namespace.nspname='public' and proc.proname='complete_habit_command'
      and pg_get_functiondef(proc.oid) like '%parent_role_activity%'
      and pg_get_functiondef(proc.oid) like '%sync_thinking_game_bonus_for_child%'
      and pg_get_functiondef(proc.oid) like '%thinking_game_lock_key%'
  ) or not exists (
    select 1 from pg_proc proc join pg_namespace namespace on namespace.oid=proc.pronamespace
    where namespace.nspname='public' and proc.proname='complete_child_habit_command'
      and pg_get_functiondef(proc.oid) like '%parent_role_activity%'
      and pg_get_functiondef(proc.oid) like '%sync_thinking_game_bonus_for_child%'
      and pg_get_functiondef(proc.oid) like '%thinking_game_lock_key%'
  ) then
    raise exception 'habit_rpc_reconciliation_missing';
  end if;
end $$;
