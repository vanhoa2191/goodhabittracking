begin;

-- Put back the previous family_snapshot and get_child_session first: run the function definitions from
-- supabase/migrations/202610020004_member_read_scope.sql (family_snapshot) and
-- supabase/migrations/202610020003_age_band_override.sql (get_child_session), then drop the columns below.

alter table public.habit_activities
  drop constraint if exists habit_activities_graduation_check_needs_graduation,
  drop constraint if exists habit_activities_base_points_range,
  drop column if exists base_points,
  drop column if exists graduation_check_due,
  drop column if exists graduated_at;

commit;
