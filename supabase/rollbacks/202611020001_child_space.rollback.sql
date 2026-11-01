begin;
drop function if exists public.read_parent_child_space(uuid, uuid);
drop function if exists public.read_child_space(text);
drop function if exists public.delete_child_space_note(text, date, text);
drop function if exists public.save_child_space_note(text, date, text, text, boolean);
drop function if exists public.save_child_space_mood(text, date, text, text);
drop table if exists public.child_space_notes;
drop table if exists public.child_space_moods;
commit;
