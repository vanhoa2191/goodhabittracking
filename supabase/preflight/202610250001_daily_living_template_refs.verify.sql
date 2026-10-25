-- Post-migration verification. Rollback requires no WIT-DLY-% rows;
-- this reports that condition without deleting or changing family data.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.habit_activities'::regclass
      and conname = 'habit_activities_legacy_template_id_check'
      and contype = 'c'
      and convalidated
      and position('^WIT-(NUT|GIV|VIR|MIN|PER|WIS|CAP|PHY|DLY)-[0-9]{2}$' in pg_get_constraintdef(oid)) > 0
  ) then
    raise exception 'daily_living_template_check_missing_or_invalid';
  end if;

  if exists (
    select 1 from public.habit_activities
    where legacy_template_id is not null
      and legacy_template_id !~ '^WIT-(NUT|GIV|VIR|MIN|PER|WIS|CAP|PHY|DLY)-[0-9]{2}$'
  ) then
    raise exception 'daily_living_template_invalid_rows';
  end if;

  if exists (
    select 1 from public.habit_activities where legacy_template_id like 'WIT-DLY-%'
  ) then
    raise notice 'daily_living_template_rollback_blocked: WIT-DLY rows must be removed or migrated before rollback';
  end if;
end $$;
