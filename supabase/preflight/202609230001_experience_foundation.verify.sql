do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'child_engagement_profiles',
    'family_engagement_settings',
    'daily_mascot_letters',
    'secret_quests',
    'child_wishlists'
  ] loop
    if not exists (
      select 1
      from pg_catalog.pg_class relation
      join pg_catalog.pg_namespace namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relname = table_name
        and relation.relkind = 'r'
        and relation.relrowsecurity
        and relation.relforcerowsecurity
    ) then
      raise exception 'Experience table % is missing or does not force RLS', table_name;
    end if;
  end loop;

  if (
    select count(*)
    from pg_catalog.pg_constraint constraint_row
    where constraint_row.conname in (
      'child_engagement_profiles_child_family_fk',
      'daily_mascot_letters_child_family_fk',
      'secret_quests_child_family_fk',
      'child_wishlists_child_family_fk',
      'child_wishlists_reward_family_fk'
    )
      and constraint_row.contype = 'f'
  ) <> 5 then
    raise exception 'Experience family foreign keys are incomplete';
  end if;

  if pg_catalog.has_table_privilege('authenticated', 'public.daily_mascot_letters', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.daily_mascot_letters', 'UPDATE')
    or pg_catalog.has_table_privilege('authenticated', 'public.secret_quests', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.secret_quests', 'UPDATE')
  then
    raise exception 'Child engagement generation tables must remain read-only to authenticated clients';
  end if;

  if pg_catalog.has_table_privilege('anon', 'public.child_engagement_profiles', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.family_engagement_settings', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.daily_mascot_letters', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.secret_quests', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.child_wishlists', 'SELECT')
  then
    raise exception 'Anonymous access to engagement records must remain denied';
  end if;
end $$;
