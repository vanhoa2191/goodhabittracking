do $$
begin
  if pg_catalog.has_function_privilege('anon', 'public.admin_unfreeze_referral_commission(bigint,uuid,text,uuid)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.admin_unfreeze_referral_commission(bigint,uuid,text,uuid)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.admin_unfreeze_referral_commission(bigint,uuid,text,uuid)', 'EXECUTE') then
    raise exception 'commission unfreeze must be service-only';
  end if;
  if pg_catalog.pg_get_functiondef('public.admin_unfreeze_referral_commission(bigint,uuid,text,uuid)'::regprocedure) not like '%public.admin_audit_events%'
    or pg_catalog.pg_get_functiondef('public.admin_unfreeze_referral_commission(bigint,uuid,text,uuid)'::regprocedure) not like '%public.admin_memberships%' then
    raise exception 'commission unfreeze must check membership and audit atomically';
  end if;
  if not (public.admin_affiliate_overview() ? 'frozenCommissions') then
    raise exception 'admin overview must list releasable frozen commissions';
  end if;
end
$$;
