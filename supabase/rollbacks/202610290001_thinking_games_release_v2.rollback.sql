begin;

-- Serve the previous release again. The release-365-v1 content rows are never modified, so this only changes the
-- trusted version. Pair it with deploying the application commit that pins the v1 manifest digest.
create or replace function public.thinking_game_resolve_trusted_release_version()
returns text language sql stable strict set search_path = '' as $$
  select 'release-365-v1'::text;
$$;
revoke all on function public.thinking_game_resolve_trusted_release_version() from public, anon;
grant execute on function public.thinking_game_resolve_trusted_release_version() to authenticated, service_role;

commit;
