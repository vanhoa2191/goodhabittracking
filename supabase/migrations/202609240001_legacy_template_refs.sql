begin;

alter table public.habit_activities
  add column if not exists legacy_template_id text;

alter table public.habit_activities
  drop constraint if exists habit_activities_legacy_template_id_check;

alter table public.habit_activities
  add constraint habit_activities_legacy_template_id_check
  check (legacy_template_id is null or legacy_template_id ~ '^WIT-(NUT|GIV|VIR|MIN|PER|WIS|CAP|PHY)-[0-9]{2}$');

create index if not exists habit_activities_legacy_template_idx
  on public.habit_activities (legacy_template_id)
  where legacy_template_id is not null;

commit;
