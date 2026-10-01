do $$
begin
  if pg_catalog.pg_get_functiondef('public.grant_admin_membership(uuid,text,timestamptz,uuid,text)'::regprocedure) not like '%actor_not_authorized%'
    or pg_catalog.pg_get_functiondef('public.revoke_admin_membership(uuid,uuid,text)'::regprocedure) not like '%actor_not_authorized%' then
    raise exception 'Admin grant and revoke must re-check the acting admin';
  end if;
  if pg_catalog.pg_get_functiondef('public.admin_resolve_affiliate_payout(uuid,text,uuid,text,text)'::regprocedure) not like '%interval ''2 hours''%' then
    raise exception 'Paying a payout must need a fresh claim';
  end if;
  if pg_catalog.has_function_privilege('authenticated', 'public.grant_admin_membership(uuid,text,timestamptz,uuid,text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.grant_admin_membership(uuid,text,timestamptz,uuid,text)', 'EXECUTE') then
    raise exception 'grant_admin_membership must stay service-role only';
  end if;
end
$$;
