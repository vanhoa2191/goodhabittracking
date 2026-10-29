begin;

-- Serve release-365-v2. The v2 content rows are imported first (ids use the E prefix so they coexist with the
-- v1 rows) and the application pins the matching manifest digest; this flips the one trusted version that
-- starts, bonus-grant and sync resolve. No stored child progress is rewritten.
do $$
begin
  if to_regprocedure('public.thinking_game_resolve_trusted_release_version()') is null then
    raise exception 'thinking_game_trusted_release_version_required';
  end if;
end $$;

create or replace function public.thinking_game_resolve_trusted_release_version()
returns text language sql stable strict set search_path = '' as $$
  select 'release-365-v2'::text;
$$;
revoke all on function public.thinking_game_resolve_trusted_release_version() from public, anon;
grant execute on function public.thinking_game_resolve_trusted_release_version() to authenticated, service_role;

commit;
