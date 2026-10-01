do $$
begin
  if pg_catalog.pg_get_functiondef('public.admin_retention_snapshot()'::regprocedure) not like '%current_date - 6%' then
    raise exception 'Retention windows must count exactly 7 and 30 calendar days';
  end if;
  if not public.admin_audit_snapshot_is_minimized('{"claimed": true, "referral": "reversed"}'::jsonb)
    or public.admin_audit_snapshot_is_minimized('{"referral": "Not Allowed"}'::jsonb)
    or public.admin_audit_snapshot_is_minimized('{"email": "a@b.c"}'::jsonb) then
    raise exception 'Audit snapshot allowlist must accept claimed and referral only';
  end if;
  if pg_catalog.has_function_privilege('authenticated', 'public.admin_activation_funnel(integer)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.admin_retention_snapshot()', 'EXECUTE') then
    raise exception 'Activation funnel functions must stay service-role only';
  end if;
  perform * from public.admin_activation_funnel(7);
  perform * from public.admin_retention_snapshot();
end
$$;
