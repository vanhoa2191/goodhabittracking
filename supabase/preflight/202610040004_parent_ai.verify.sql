do $$
declare
  signature regprocedure := 'public.consume_ai_quota(integer, integer, integer)'::regprocedure;
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.family_consents'::regclass and contype = 'c'
      and pg_catalog.pg_get_constraintdef(oid) like '%parent_ai%'
      and pg_catalog.pg_get_constraintdef(oid) like '%parent_reminders%'
      and pg_catalog.pg_get_constraintdef(oid) like '%analytics%'
  ) then
    raise exception 'family_consents must allow parent_ai and keep the earlier consent types';
  end if;

  if not (select relrowsecurity and relforcerowsecurity from pg_catalog.pg_class where oid = 'public.ai_usage'::regclass)
    or not (select relrowsecurity and relforcerowsecurity from pg_catalog.pg_class where oid = 'public.ai_system_usage'::regclass) then
    raise exception 'AI usage tables must enable and force row level security';
  end if;

  if pg_catalog.has_table_privilege('anon', 'public.ai_usage', 'SELECT, INSERT, UPDATE, DELETE')
    or pg_catalog.has_table_privilege('authenticated', 'public.ai_usage', 'SELECT, INSERT, UPDATE, DELETE')
    or pg_catalog.has_table_privilege('anon', 'public.ai_system_usage', 'SELECT, INSERT, UPDATE, DELETE')
    or pg_catalog.has_table_privilege('authenticated', 'public.ai_system_usage', 'SELECT, INSERT, UPDATE, DELETE') then
    raise exception 'AI usage tables must be reachable only through the quota function';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_proc
    where oid = signature and prosecdef and proconfig @> array['search_path=""']
  ) then
    raise exception 'consume_ai_quota must be a definer with an empty search_path';
  end if;

  -- Since 202610050002 the originals are closed to every API role; the server calls the service-role-only `_as` wrappers.
  if pg_catalog.has_function_privilege('authenticated', signature, 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', signature, 'EXECUTE')
    or pg_catalog.has_function_privilege('service_role', signature, 'EXECUTE') then
    raise exception 'consume_ai_quota must not be executable by API roles after 202610050002';
  end if;

  if to_regprocedure('public.consume_ai_quota_monthly_as(uuid, integer, integer, integer, integer)') is not null then
    if not pg_catalog.has_function_privilege('service_role', 'public.consume_ai_quota_monthly_as(uuid, integer, integer, integer, integer)'::regprocedure, 'EXECUTE')
      or pg_catalog.has_function_privilege('anon', 'public.consume_ai_quota_monthly_as(uuid, integer, integer, integer, integer)'::regprocedure, 'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated', 'public.consume_ai_quota_monthly_as(uuid, integer, integer, integer, integer)'::regprocedure, 'EXECUTE') then
      raise exception 'consume_ai_quota_monthly_as must be executable by service_role only';
    end if;
  end if;

  if pg_catalog.pg_get_functiondef(signature) not like '%public.can_manage_family(actor_family_id)%'
    or pg_catalog.pg_get_functiondef(signature) not like '%for update%' then
    raise exception 'consume_ai_quota must check manage rights and count under a lock';
  end if;
end
$$;
