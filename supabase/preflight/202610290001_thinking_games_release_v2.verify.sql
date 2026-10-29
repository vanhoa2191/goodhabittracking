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
