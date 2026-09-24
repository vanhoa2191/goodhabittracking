begin;

alter table public.habit_activities
  add column if not exists journey_habit_key text;

alter table public.habit_activities
  drop constraint if exists habit_activities_journey_habit_key_check;

alter table public.habit_activities
  add constraint habit_activities_journey_habit_key_check
  check (journey_habit_key is null or journey_habit_key ~ '^(week|month)-[1-4]:[0-9]{1,2}$');

create unique index if not exists habit_activities_journey_child_unique
  on public.habit_activities (family_id, child_id, journey_habit_key)
  where journey_habit_key is not null and child_id is not null;

create unique index if not exists habit_activities_journey_family_unique
  on public.habit_activities (family_id, journey_habit_key)
  where journey_habit_key is not null and child_id is null;

create or replace function public.reject_overlapping_journey_assignments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.journey_habit_key is null then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.family_id::text || ':' || new.journey_habit_key, 0)
  );

  if exists (
    select 1 from public.habit_activities as existing
    where existing.family_id = new.family_id
      and existing.journey_habit_key = new.journey_habit_key
      and existing.id <> new.id
      and (
        existing.child_id is null
        or new.child_id is null
        or existing.child_id = new.child_id
      )
  ) then
    raise exception 'Journey assignment already covers this child.'
      using errcode = '23505', constraint = 'habit_activities_journey_scope_unique';
  end if;

  return new;
end;
$$;

drop trigger if exists habit_activities_journey_scope_guard on public.habit_activities;
create trigger habit_activities_journey_scope_guard
  before insert or update of child_id, journey_habit_key, family_id
  on public.habit_activities
  for each row execute function public.reject_overlapping_journey_assignments();

commit;
