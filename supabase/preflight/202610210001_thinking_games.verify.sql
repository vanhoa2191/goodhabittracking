do $$
begin
  if to_regclass('public.thinking_game_settings') is null
    or to_regclass('public.thinking_game_journeys') is null
    or to_regclass('public.thinking_game_day_snapshots') is null
    or to_regclass('public.thinking_game_entitlements') is null
    or to_regclass('public.thinking_game_attempts') is null
    or to_regclass('public.thinking_game_habit_receipts') is null
    or to_regclass('public.thinking_game_audit_events') is null
    or to_regclass('public.thinking_game_content') is null then
    raise exception 'thinking_games_tables_missing';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='thinking_game_habit_receipts'
      and column_name='received_at' and is_nullable='NO'
  ) then raise exception 'thinking_game_receipt_received_at_not_null'; end if;
  if not exists (
    select 1 from pg_proc where pronamespace='public'::regnamespace
      and proname='thinking_game_lock_key'
  ) then raise exception 'thinking_game_lock_key_missing'; end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid='public.activity_logs'::regclass
      and tgname='thinking_game_activity_lock_before'
      and not tgisinternal
  ) then raise exception 'thinking_game_activity_receipt_trigger_missing'; end if;
  if exists (
    select 1 from pg_class
    where relnamespace='public'::regnamespace
      and relname in (
        'thinking_game_settings', 'thinking_game_day_snapshots',
        'thinking_game_journeys',
        'thinking_game_entitlements', 'thinking_game_attempts',
        'thinking_game_habit_receipts', 'thinking_game_audit_events',
        'thinking_game_content'
      )
      and (relrowsecurity = false or relforcerowsecurity = false)
  ) then raise exception 'thinking_games_rls_not_forced'; end if;
  if exists (
    select 1 from pg_class
    where relnamespace='public'::regnamespace
      and relname in (
        'thinking_game_settings', 'thinking_game_journeys',
        'thinking_game_day_snapshots', 'thinking_game_entitlements',
        'thinking_game_attempts', 'thinking_game_habit_receipts',
        'thinking_game_audit_events', 'thinking_game_content'
      )
      and relrowsecurity = false
  ) then raise exception 'thinking_games_rls_not_enabled'; end if;
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='thinking_game_journeys'
      and policyname='thinking_game_journey_read'
      and roles @> array['authenticated']::name[]
      and qual like '%is_family_member%'
  ) then raise exception 'thinking_games_journey_policy_missing'; end if;
  if exists (
    select 1 from pg_proc p
    where p.pronamespace='public'::regnamespace
      and (p.proname like 'thinking_game%' or p.proname='sync_thinking_game_bonus_for_child')
      and p.prosecdef
      and not (coalesce(p.proconfig,'{}') @> array['search_path=""']::text[])
  ) then raise exception 'thinking_games_security_definer_search_path_missing'; end if;
  if has_function_privilege('anon','public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid,text)','execute')
    or has_function_privilege('authenticated','public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid,text)','execute')
    or has_function_privilege('anon','public.thinking_game_finish_verified(text,uuid,boolean,jsonb,uuid)','execute')
    or has_function_privilege('authenticated','public.thinking_game_finish_verified(text,uuid,boolean,jsonb,uuid)','execute')
  then raise exception 'thinking_games_protected_rpc_acl'; end if;
  if not exists (
    select 1 from pg_proc where pronamespace='public'::regnamespace
      and proname in (
        'thinking_game_preview_day', 'thinking_game_bonus_for_child',
        'thinking_game_child_settings', 'thinking_game_update_settings_as',
        'thinking_game_excuse_task_as', 'thinking_game_resolve_trusted_release_version',
        'thinking_game_resolve_content_version'
      )
    group by pronamespace having count(*) = 7
  ) then raise exception 'thinking_games_settings_functions_missing'; end if;
  if not exists (
    select 1 from pg_proc
    where pronamespace='public'::regnamespace
      and proname in (
        'complete_habit_command', 'complete_child_habit_command',
        'undo_habit_command', 'undo_child_habit_command',
        'review_habit_command', 'review_habits_command'
      )
    group by pronamespace having count(*) = 6
  ) then raise exception 'thinking_games_habit_functions_missing'; end if;
end $$;
