do $$
begin
  if pg_catalog.has_function_privilege('anon', 'public.admin_activation_funnel(integer)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.admin_activation_funnel(integer)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.admin_retention_snapshot()', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.admin_retention_snapshot()', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.admin_activation_funnel(integer)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.admin_retention_snapshot()', 'EXECUTE') then
    raise exception 'Activation funnel functions must be service-role only';
  end if;
  perform * from public.admin_activation_funnel(7);
  perform * from public.admin_retention_snapshot();
end $$;
