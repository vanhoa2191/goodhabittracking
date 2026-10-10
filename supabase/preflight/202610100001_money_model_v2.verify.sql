begin;

do $$
declare
  checkout_definition text;
  accrual_definition text;
  signature text;
begin
  if not exists (
    select 1 from public.affiliate_settings where singleton
      and commission_bps = 2000 and terms_version = '2026-10-10'
      and referred_discount_bps = 1000 and hold_days = 40 and earning_window_days = 365
  ) then raise exception 'Money Model v2 affiliate settings are incorrect'; end if;

  checkout_definition := pg_catalog.pg_get_functiondef('public.create_family_payment_order(uuid,uuid,bigint,text,timestamptz)'::regprocedure);
  if strpos(checkout_definition, 'when ''solo_monthly'' then 49000') = 0
    or strpos(checkout_definition, 'when ''monthly'' then 69000') = 0
    or strpos(checkout_definition, 'when ''solo_yearly'' then 399000') = 0
    or strpos(checkout_definition, 'when ''yearly'' then 590000') = 0
    or strpos(checkout_definition, 'if discount > 0 then charged := greatest(1000, (charged / 1000) * 1000); end if;') = 0 then
    raise exception 'Money Model v2 checkout prices or discounted rounding are missing';
  end if;

  accrual_definition := pg_catalog.pg_get_functiondef('public.accrue_referral_commission(bigint)'::regprocedure);
  if strpos(accrual_definition, 'if paid_order.plan_id not in (''solo_yearly'', ''yearly'', ''lifetime'') then return; end if;') = 0
    or strpos(accrual_definition, 'if paid_order.plan_id not in') > strpos(accrual_definition, 'commission := floor(')
    or strpos(accrual_definition, 'commission := floor(paid_order.amount::numeric * settings.commission_bps / 10000)::integer;') = 0 then
    raise exception 'Money Model v2 commission scope or paid-amount calculation is missing';
  end if;

  foreach signature in array array[
    'public.create_family_payment_order(uuid,uuid,bigint,text,timestamptz)',
    'public.accrue_referral_commission(bigint)'
  ] loop
    if pg_catalog.has_function_privilege('anon', signature, 'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated', signature, 'EXECUTE')
      or not pg_catalog.has_function_privilege('service_role', signature, 'EXECUTE') then
      raise exception 'Money Model v2 money function must be service-only: %', signature;
    end if;
    if not exists (
      select 1 from pg_catalog.pg_proc
      where oid = signature::regprocedure and prosecdef
        and 'search_path=""' = any(proconfig)
    ) then raise exception 'Money Model v2 definer security or empty search path missing: %', signature; end if;
  end loop;
end
$$;

rollback;
