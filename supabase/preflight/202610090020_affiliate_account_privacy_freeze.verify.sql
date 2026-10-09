do $$
declare
  signature text;
  reversal_definition text;
begin
  if not exists (select 1 from public.affiliate_settings where singleton and hold_days = 40 and terms_version = '2026-10-09') then
    raise exception 'new affiliate commissions must have a 40-day hold';
  end if;
  foreach signature in array array[
    'public.affiliate_commission_block_reason(bigint)',
    'public.lock_affiliate_billing_case_order()',
    'public.accrue_referral_commission(bigint)',
    'public.request_affiliate_payout(uuid)',
    'public.admin_resolve_affiliate_payout(uuid,text,uuid,text,text)',
    'public.admin_affiliate_overview()',
    'public.admin_reverse_referral_commission(bigint,text)'
  ] loop
    if pg_catalog.has_function_privilege('authenticated', signature, 'EXECUTE')
      or pg_catalog.has_function_privilege('anon', signature, 'EXECUTE')
      or not pg_catalog.has_function_privilege('service_role', signature, 'EXECUTE') then
      raise exception 'affiliate money function must be service-only: %', signature;
    end if;
  end loop;
  foreach signature in array array['public.affiliate_enroll(boolean)', 'public.claim_referral(text)', 'public.referral_claim_state()', 'public.affiliate_overview()'] loop
    if not pg_catalog.has_function_privilege('authenticated', signature, 'EXECUTE')
      or pg_catalog.has_function_privilege('anon', signature, 'EXECUTE') then
      raise exception 'affiliate parent function grants are incorrect: %', signature;
    end if;
  end loop;
  if not exists (
    select 1 from pg_catalog.pg_trigger
    where tgrelid = 'public.billing_support_cases'::regclass
      and tgname = 'affiliate_billing_case_order_lock' and not tgisinternal and tgenabled = 'O'
  ) then
    raise exception 'support-case order serialization trigger is missing';
  end if;
  if public.affiliate_commission_block_reason(null) is not null then
    raise exception 'an unlinked order must not be frozen';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'referral_commissions' and column_name = 'refund_confirmed_at'
  ) then raise exception 'durable commission refund evidence is missing'; end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'referral_commissions' and column_name = 'dispute_opened_at'
  ) then raise exception 'durable commission dispute freeze is missing'; end if;
  if pg_catalog.pg_get_functiondef('public.affiliate_commission_block_reason(bigint)'::regprocedure) like '%billing_support_cases%' then
    raise exception 'the dispute freeze must be read from the commission, not the deletable case row';
  end if;
  if exists (
    select 1 from public.referral_commissions commission
    join public.billing_support_cases support_case on support_case.order_code = commission.order_code
    where support_case.status in ('requested', 'reviewing', 'approved') and commission.dispute_opened_at is null
  ) then raise exception 'an open billing case left its commission unfrozen'; end if;
  if pg_catalog.pg_get_functiondef('public.claim_referral(text)'::regprocedure) not like '%pg_advisory_xact_lock%'
    or pg_catalog.pg_get_functiondef('public.accrue_referral_commission(bigint)'::regprocedure) not like '%owner.user_id = attribution.referred_user_id%' then
    raise exception 'attribution must lock the owner account and accrue payments for owned families';
  end if;
  if pg_catalog.pg_get_functiondef('public.affiliate_overview()'::regprocedure) like '%''recent''%'
    or pg_catalog.pg_get_functiondef('public.affiliate_overview()'::regprocedure) like '%''planId''%' then
    raise exception 'affiliate overview must expose aggregate counts and amounts only';
  end if;
  reversal_definition := pg_catalog.pg_get_functiondef('public.admin_reverse_referral_commission(bigint,text)'::regprocedure);
  if strpos(reversal_definition, 'perform 1 from public.payment_orders') = 0
    or strpos(reversal_definition, 'perform 1 from public.payment_orders')
       > strpos(reversal_definition, 'select * into commission from public.referral_commissions') then
    raise exception 'refund reversal must lock the payment order before the commission';
  end if;
end
$$;
