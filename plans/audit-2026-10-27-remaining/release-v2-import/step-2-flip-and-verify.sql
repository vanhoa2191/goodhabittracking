-- STEP 2 (run after all 15 batches and verify-after-import.sql): flip the trusted release to release-365-v2.
-- Refuses to flip unless all 1460 approved v2 rows are present.
do $$ begin if (select count(*) from public.thinking_game_content where content_version='release-365-v2' and status='approved') <> 1460 then raise exception 'release_v2_content_incomplete_do_not_flip'; end if; end $$;
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

insert into supabase_migrations.schema_migrations (version, name) values ('202610290001', 'thinking_games_release_v2') on conflict (version) do nothing;

do $$
begin
  if exists (select 1 from supabase_migrations.schema_migrations where version = '202610290001') is not true then
    raise exception 'release_v2_migration_missing';
  end if;
  if public.thinking_game_resolve_trusted_release_version() is distinct from 'release-365-v2' then
    raise exception 'release_v2_not_trusted';
  end if;
  if (select count(*) from public.thinking_game_content
      where content_version = 'release-365-v2' and status = 'approved') <> 1460 then
    raise exception 'release_v2_content_incomplete';
  end if;
  if exists (
    select 1 from public.thinking_game_content
    where content_version = 'release-365-v2'
    group by age_track, slot_type having count(*) <> 365
  ) then
    raise exception 'release_v2_content_uneven';
  end if;
end $$;

select version, name from supabase_migrations.schema_migrations where version >= '202610280001' order by version;
select public.thinking_game_resolve_trusted_release_version() as trusted_release;
