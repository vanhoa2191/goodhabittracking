begin;

-- Restore the two-track constraints. This only succeeds after the age_3_5 / age_13_plus content rows and any
-- age_3_5 / age_13_plus overrides have been removed; run 202610300002's rollback first.
alter table public.thinking_game_settings
  drop constraint if exists thinking_game_settings_age_track_override_check;
alter table public.thinking_game_settings
  add constraint thinking_game_settings_age_track_override_check
  check (age_track_override in ('age_6_8', 'age_9_12'));

alter table public.thinking_game_content
  drop constraint if exists thinking_game_content_age_track_check;
alter table public.thinking_game_content
  add constraint thinking_game_content_age_track_check
  check (age_track in ('age_6_8', 'age_9_12'));

commit;
