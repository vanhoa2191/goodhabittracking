do $$
declare
  webhook_source text := pg_catalog.pg_get_functiondef('public.process_payos_webhook(bigint,integer,text,text,text,jsonb)'::regprocedure);
  coupon_source text := pg_catalog.pg_get_functiondef('public.redeem_family_coupon(text)'::regprocedure);
begin
  if webhook_source not like '%for update%' or webhook_source not like '%current_subscription.subscription_ends_at%' then
    raise exception 'The payment webhook must extend the time already paid';
  end if;
  if webhook_source not like '%next_plan := ''lifetime''%' then
    raise exception 'A lifetime plan must never be lowered';
  end if;
  if coupon_source not like '%coupon_rate_limited%' or coupon_source not like '%coupon_attempts%' then
    raise exception 'Coupon redemption must be rate limited per account';
  end if;
  if pg_catalog.has_table_privilege('authenticated', 'public.coupon_attempts', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.coupon_attempts', 'INSERT') then
    raise exception 'Coupon attempts must be private';
  end if;
  if pg_catalog.has_function_privilege('anon', 'public.process_payos_webhook(bigint,integer,text,text,text,jsonb)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.process_payos_webhook(bigint,integer,text,text,text,jsonb)', 'EXECUTE') then
    raise exception 'Payment settlement must stay service-only';
  end if;
  if pg_catalog.pg_get_functiondef('public.enforce_family_child_limit()'::regprocedure) not like '%for update%' then
    raise exception 'The child limit must lock the family before counting';
  end if;
end $$;
