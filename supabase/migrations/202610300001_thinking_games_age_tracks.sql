begin;

-- Allow all four age tracks in stored settings and content. Content for age_3_5 and age_13_plus is imported before
-- the release is switched on (202610300002), so this migration only widens what the tables may hold.
alter table public.thinking_game_settings
  drop constraint if exists thinking_game_settings_age_track_override_check;
alter table public.thinking_game_settings
  add constraint thinking_game_settings_age_track_override_check
  check (age_track_override in ('age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus'));

alter table public.thinking_game_content
  drop constraint if exists thinking_game_content_age_track_check;
alter table public.thinking_game_content
  add constraint thinking_game_content_age_track_check
  check (age_track in ('age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus'));

commit;
