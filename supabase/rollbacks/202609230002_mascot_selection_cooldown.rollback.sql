begin;
drop trigger if exists child_profile_mascot_selection on public.child_profiles;
drop trigger if exists child_profile_initial_mascot_selection on public.child_profiles;
drop function if exists public.record_mascot_selection();
drop function if exists public.read_child_mascot_selection(text);
drop function if exists public.update_child_mascot_command(text, text, text);
grant insert, update on public.child_engagement_profiles to authenticated;
commit;
