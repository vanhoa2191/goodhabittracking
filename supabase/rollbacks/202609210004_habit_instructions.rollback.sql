begin;

alter table public.habit_activities
  drop column if exists instructions;

commit;
