do $$
declare
  offending_names text;
  signature regprocedure := coalesce(
    pg_catalog.to_regprocedure('public.caregiver_progress_snapshot(date)'),
    pg_catalog.to_regprocedure('public.caregiver_progress_snapshot()')
  );
begin
  select string_agg(policy.tablename || '.' || policy.policyname, ', ' order by policy.tablename, policy.policyname)
  into offending_names
  from pg_catalog.pg_policies policy
  where policy.schemaname = 'public' and policy.tablename <> 'families'
    and policy.cmd in ('SELECT', 'ALL')
    and policy.qual like '%is_family_member%'
    and policy.qual not like '%can_manage_family%';
  if offending_names is not null then
    raise exception 'family member reads remain: %', offending_names;
  end if;

  if not exists (
    select 1 from pg_catalog.pg_policies policy
    where policy.schemaname = 'public' and policy.tablename = 'family_memberships'
      and policy.policyname = 'memberships_select_family'
      and policy.qual like '%auth.uid()%'
      and policy.qual like '%can_manage_family%'
      and policy.qual not like '%is_family_member%'
  ) then
    raise exception 'membership reads must be self or family manager';
  end if;

  if signature is null or not exists (
    select 1 from pg_catalog.pg_proc
    where oid = signature and prosecdef
      and provolatile = 's' and proconfig @> array['search_path=""']
  ) or not pg_catalog.has_function_privilege('authenticated', signature, 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', signature, 'EXECUTE')
    or pg_catalog.has_function_privilege('service_role', signature, 'EXECUTE') then
    raise exception 'caregiver_progress_snapshot must be a stable definer with empty search_path and authenticated-only execution';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_proc
    where oid = 'public.schema_version()'::regprocedure and prosecdef
      and proconfig @> array['search_path=""']
  ) or not pg_catalog.has_function_privilege('service_role', 'public.schema_version()', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.schema_version()', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.schema_version()', 'EXECUTE') then
    raise exception 'schema_version must be a definer with empty search_path and service-role-only execution';
  end if;

  if exists (
    select 1 from pg_catalog.pg_proc function,
      lateral pg_catalog.aclexplode(coalesce(function.proacl, pg_catalog.acldefault('f', function.proowner))) privilege
    where function.oid in (signature, 'public.schema_version()'::regprocedure)
      and privilege.grantee = 0 and privilege.privilege_type = 'EXECUTE'
  ) then
    raise exception 'projection and schema version must not grant public execution';
  end if;

  select string_agg(function.oid::regprocedure::text, ', ' order by function.oid::regprocedure::text)
  into offending_names
  from pg_catalog.pg_proc function
  join pg_catalog.pg_namespace namespace on namespace.oid = function.pronamespace
  -- An empty search_path, or one naming only pg_catalog, cannot be redirected to objects a user created.
  -- Supabase's own RLS event trigger function (rls_auto_enable) uses the pg_catalog form.
  where namespace.nspname = 'public' and function.prosecdef
    and not coalesce(
      function.proconfig @> array['search_path=""'] or function.proconfig @> array['search_path=pg_catalog'],
      false
    );
  if offending_names is not null then
    raise exception 'SECURITY DEFINER functions require an empty or pg_catalog-only search_path: %', offending_names;
  end if;
end
$$;
