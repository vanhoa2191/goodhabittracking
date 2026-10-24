do $$
begin
  if not exists (
    select 1 from pg_class
    where oid = to_regclass('public.thinking_game_settings')
      and relrowsecurity and relforcerowsecurity
  ) then raise exception 'thinking_game_settings_forced_rls_required'; end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'thinking_game_settings'
      and policyname = 'thinking_game_settings_read' and cmd = 'SELECT'
      and roles @> array['authenticated']::name[]
      and qual in (
        'is_family_member(family_id)', '(is_family_member(family_id))',
        'public.is_family_member(family_id)', '(public.is_family_member(family_id))'
      )
  ) then raise exception 'thinking_game_settings_family_read_policy_required'; end if;
  if not has_table_privilege('authenticated', 'public.thinking_game_settings', 'SELECT')
  then raise exception 'thinking_game_settings_authenticated_read_missing'; end if;
  if has_table_privilege('authenticated', 'public.thinking_game_settings', 'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
    or has_table_privilege('anon', 'public.thinking_game_settings', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
  then raise exception 'thinking_game_settings_unexpected_client_privileges'; end if;
  if has_table_privilege('authenticated', 'public.thinking_game_content', 'SELECT')
    or has_table_privilege('anon', 'public.thinking_game_content', 'SELECT')
  then raise exception 'thinking_game_private_content_read_granted'; end if;
end $$;
