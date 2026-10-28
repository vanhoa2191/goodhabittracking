begin;

alter table public.habit_activities
  drop constraint if exists habit_activities_legacy_template_id_check;

alter table public.habit_activities
  add constraint habit_activities_legacy_template_id_check
  check (legacy_template_id is null or legacy_template_id ~ '^WIT-(NUT|GIV|VIR|MIN|PER|WIS|CAP|PHY|DLY)-[0-9]{2}$');

commit;
