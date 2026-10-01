do $$
declare
  settings public.affiliate_settings%rowtype;
begin
  select * into settings from public.affiliate_settings where singleton;
  if not found or settings.commission_bps <> 3000 then
    raise exception 'The default commission must be 30 percent';
  end if;

  if pg_catalog.has_table_privilege('authenticated', 'public.affiliate_accounts', 'SELECT')
    or pg_catalog.has_table_privilege('authenticated', 'public.referral_commissions', 'SELECT')
    or pg_catalog.has_table_privilege('authenticated', 'public.affiliate_payouts', 'SELECT')
    or pg_catalog.has_table_privilege('authenticated', 'public.referrals', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.affiliate_settings', 'SELECT') then
    raise exception 'Affiliate tables must not be readable by clients';
  end if;

  if exists (
    select 1 from pg_catalog.pg_class relation
    where relation.oid in (
      'public.affiliate_settings'::regclass, 'public.affiliate_accounts'::regclass, 'public.referrals'::regclass,
      'public.affiliate_payouts'::regclass, 'public.referral_commissions'::regclass
    ) and not relation.relforcerowsecurity
  ) then
    raise exception 'Row-level security must be forced on the affiliate tables';
  end if;

  if not pg_catalog.has_function_privilege('authenticated', 'public.claim_referral(text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.affiliate_overview()', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.claim_referral(text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.admin_resolve_affiliate_payout(uuid,text,uuid,text,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.admin_reverse_referral_commission(bigint,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.accrue_referral_commission(bigint)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.process_payos_webhook(bigint,integer,text,text,text,jsonb)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.admin_affiliate_overview()', 'EXECUTE') then
    raise exception 'Affiliate function grants are incorrect';
  end if;

  if pg_catalog.pg_get_functiondef('public.process_payos_webhook(bigint,integer,text,text,text,jsonb)'::regprocedure)
    not like '%accrue_referral_commission%' then
    raise exception 'A paid order must accrue its referral commission';
  end if;
end $$;
