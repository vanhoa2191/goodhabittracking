do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'habit_activities'
      and column_name = 'legacy_template_id'
  ) then
    raise exception 'Legacy template identity column is missing';
  end if;
end $$;

select
  count(*) filter (where legacy_template_id is not null) as identified_legacy_activities,
  count(*) filter (
    where legacy_template_id is null
      and framework_habit_id is null
      and journey_habit_key is null
  ) as unidentified_activities
from public.habit_activities;
