do $$
begin
  if exists (select 1 from supabase_migrations.schema_migrations where version = '202610300001') is not true then
    raise exception 'age_tracks_migration_missing';
  end if;
  if exists (select 1 from supabase_migrations.schema_migrations where version = '202610300002') is not true then
    raise exception 'release_v3_migration_missing';
  end if;
  if public.thinking_game_resolve_trusted_release_version() is distinct from 'release-365-v3' then
    raise exception 'release_v3_not_trusted';
  end if;
  if (select count(*) from public.thinking_game_content
      where content_version = 'release-365-v3' and status = 'approved') <> 2920 then
    raise exception 'release_v3_content_incomplete';
  end if;
  if exists (
    select 1 from public.thinking_game_content
    where content_version = 'release-365-v3'
    group by age_track, slot_type having count(*) <> 365
  ) then
    raise exception 'release_v3_content_uneven';
  end if;
  if (select count(distinct age_track) from public.thinking_game_content where content_version = 'release-365-v3') <> 4 then
    raise exception 'release_v3_tracks_missing';
  end if;
end $$;
