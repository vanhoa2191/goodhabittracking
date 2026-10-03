do $$
declare
  signature regprocedure := 'public.caregiver_progress_snapshot(date)'::regprocedure;
  definition text := pg_catalog.pg_get_functiondef('public.caregiver_progress_snapshot(date)'::regprocedure);
begin
  if exists (
    select 1 from pg_catalog.pg_proc function
    where function.pronamespace = 'public'::regnamespace and function.proname = 'caregiver_progress_snapshot'
      and function.oid <> signature
  ) then
    raise exception 'caregiver_progress_snapshot must exist only with the optional date argument';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_proc
    where oid = signature and prosecdef and provolatile = 's' and pronargdefaults = 1
      and proconfig @> array['search_path=""']
  ) or not pg_catalog.has_function_privilege('authenticated', signature, 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', signature, 'EXECUTE')
    or pg_catalog.has_function_privilege('service_role', signature, 'EXECUTE') then
    raise exception 'caregiver_progress_snapshot must be a stable definer with empty search_path, one optional argument and authenticated-only execution';
  end if;

  if exists (
    select 1 from pg_catalog.pg_proc function,
      lateral pg_catalog.aclexplode(coalesce(function.proacl, pg_catalog.acldefault('f', function.proowner))) privilege
    where function.oid = signature and privilege.grantee = 0 and privilege.privilege_type = 'EXECUTE'
  ) then
    raise exception 'caregiver_progress_snapshot must not grant public execution';
  end if;

  if definition not like '%current_date - 1%' or definition not like '%current_date + 1%'
    or definition not like '%window_end - 6%' then
    raise exception 'caregiver_progress_snapshot must clamp the client day to the server day and cover seven days';
  end if;

  -- Per-day counts are the only log-derived output: no log id, note, proof or time may be projected.
  if definition like '%proof_note%' or definition like '%completed_at%' or definition like '%points_awarded%'
    or definition like '%log.id%' then
    raise exception 'caregiver_progress_snapshot must not project log detail';
  end if;
end
$$;
