do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'habit_activities'
      and column_name = 'journey_habit_key'
  ) then
    raise exception 'Journey habit identity column is missing';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'habit_activities'
      and indexname = 'habit_activities_journey_child_unique'
      and indexdef like 'CREATE UNIQUE INDEX%'
  ) or not exists (
    select 1 from pg_catalog.pg_indexes
    where schemaname = 'public'
      and tablename = 'habit_activities'
      and indexname = 'habit_activities_journey_family_unique'
      and indexdef like 'CREATE UNIQUE INDEX%'
  ) then
    raise exception 'Journey assignment unique indexes are missing';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.habit_activities'::regclass
      and tgname = 'habit_activities_journey_scope_guard'
      and tgenabled = 'O'
  ) then
    raise exception 'Journey assignment scope guard is missing';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_proc
    where oid = 'public.reject_overlapping_journey_assignments()'::regprocedure
      and prosecdef
      and 'search_path=""' = any(proconfig)
  ) then
    raise exception 'Journey assignment scope guard has an unsafe execution context';
  end if;
end $$;
