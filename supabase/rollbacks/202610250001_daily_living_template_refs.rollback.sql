begin;

-- Prevent a concurrent DLY insert between the guard and the restored CHECK.
lock table public.habit_activities in access exclusive mode;

do $$
begin
  if exists (
    select 1 from public.habit_activities where legacy_template_id like 'WIT-DLY-%'
  ) then
    raise exception 'daily_living_template_rows_prevent_rollback';
  end if;
end $$;

alter table public.habit_activities
  drop constraint if exists habit_activities_legacy_template_id_check;

alter table public.habit_activities
  add constraint habit_activities_legacy_template_id_check
  check (legacy_template_id is null or legacy_template_id ~ '^WIT-(NUT|GIV|VIR|MIN|PER|WIS|CAP|PHY)-[0-9]{2}$');

commit;
