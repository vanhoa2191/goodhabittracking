do $$
declare
  constraint_text text;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'child_profiles' and column_name = 'age_band_override'
  ) then
    raise exception 'child_profiles.age_band_override is missing';
  end if;

  select pg_catalog.pg_get_constraintdef(c.oid) into constraint_text
  from pg_catalog.pg_constraint c
  where c.conrelid = 'public.child_profiles'::regclass and c.contype = 'c'
    and pg_catalog.pg_get_constraintdef(c.oid) like '%age_band_override%';
  if constraint_text is null or constraint_text not like '%young%' or constraint_text not like '%off%' then
    raise exception 'age_band_override must be limited to young, tween, teen and off';
  end if;

  if pg_catalog.pg_get_functiondef('public.mutate_child_profile_command(jsonb)'::regprocedure) not like '%ageBandOverride%' then
    raise exception 'mutate_child_profile_command does not update age_band_override';
  end if;

  if pg_catalog.pg_get_functiondef('public.get_child_session(text)'::regprocedure) not like '%ageBandOverride%' then
    raise exception 'get_child_session does not return age_band_override';
  end if;

  if pg_catalog.has_function_privilege('anon', 'public.mutate_child_profile_command(jsonb)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.mutate_child_profile_command(jsonb)', 'EXECUTE') then
    raise exception 'mutate_child_profile_command privileges changed';
  end if;

  if pg_catalog.has_table_privilege('authenticated', 'public.child_profiles', 'UPDATE') then
    raise exception 'authenticated must not update child_profiles directly';
  end if;
end
$$;
