begin;

-- Parent settings reads use the authenticated client; the existing family RLS
-- policy also needs a table-level SELECT grant to become reachable.
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
end $$;

grant select on public.thinking_game_settings to authenticated;

commit;
