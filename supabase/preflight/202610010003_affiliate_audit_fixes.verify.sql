do $$
begin
  if pg_catalog.has_function_privilege('authenticated', 'public.admin_claim_affiliate_payout(uuid,uuid)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.admin_claim_affiliate_payout(uuid,uuid)', 'EXECUTE') then
    raise exception 'admin_claim_affiliate_payout must be callable by the service role only';
  end if;
  if not pg_catalog.has_function_privilege('authenticated', 'public.claim_referral(text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.claim_referral(text)', 'EXECUTE') then
    raise exception 'claim_referral grants are incorrect';
  end if;
  if pg_catalog.pg_get_functiondef('public.claim_referral(text)'::regprocedure) not like '%can_manage_family%' then
    raise exception 'claim_referral must require a family manager';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'affiliate_payouts' and column_name = 'processing_by'
  ) then
    raise exception 'affiliate_payouts.processing_by is missing';
  end if;
end
$$;
