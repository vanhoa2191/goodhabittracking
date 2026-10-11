begin;
do $$
declare signature text; body text;
begin
  if not exists(select 1 from public.launch_offers where code='pro_plus_upsell_690' and slots=200 and closed_at is null)
    or not exists(select 1 from public.launch_offers where code='pro_plus_b1g1' and slots=100 and closed_at='2026-12-31 17:00:00+00')
    or not exists(select 1 from public.launch_offers where code='pro_plus_founding' and slots=10) then
    raise exception 'promo prices, capacities or closing instant incorrect';
  end if;
  if not exists(select 1 from pg_catalog.pg_class where oid='public.family_addons'::regclass and relrowsecurity and relforcerowsecurity) then
    raise exception 'family_addons must enable and force RLS';
  end if;
  if not exists(select 1 from pg_catalog.pg_policies where schemaname='public' and tablename='family_addons' and cmd='SELECT' and qual like '%can_manage_family%') then
    raise exception 'family_addons manager read policy missing';
  end if;
  if pg_catalog.has_table_privilege('authenticated','public.family_addons','INSERT,UPDATE,DELETE')
    or pg_catalog.has_table_privilege('anon','public.family_addons','SELECT')
    or not pg_catalog.has_table_privilege('authenticated','public.family_addons','SELECT') then
    raise exception 'family_addons client permissions incorrect';
  end if;
  foreach signature in array array[
    'public.create_family_payment_order(uuid,uuid,bigint,text,timestamptz)',
    'public.referral_discount_bps(uuid,uuid)',
    'public.process_payos_webhook(bigint,integer,text,text,text,jsonb)',
    'public.accrue_referral_commission(bigint)',
    'public.admin_retention_snapshot()',
    'public.admin_revoke_launch_offer_claim(bigint,text)',
    'public.admin_update_family_subscription(uuid,text,text,timestamptz,timestamptz)',
    'public.admin_resolve_billing_case(uuid,text,text,uuid,text)',
    'public.family_ai_tier(uuid)',
    'public.consume_ai_quota_monthly_as(uuid,integer,integer,integer,integer)'
  ] loop
    if pg_catalog.has_function_privilege('anon',signature,'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated',signature,'EXECUTE')
      or not pg_catalog.has_function_privilege('service_role',signature,'EXECUTE') then
      raise exception 'money/admin/tier function must be service-only: %',signature;
    end if;
    if not exists(select 1 from pg_catalog.pg_proc where oid=signature::regprocedure and prosecdef and 'search_path=""'=any(proconfig)) then
      raise exception 'definer security or empty search path missing: %',signature;
    end if;
  end loop;
  foreach signature in array array[
    'public.family_has_pro_entitlement(uuid)', 'public.family_child_limit(uuid)',
    'public.activate_family_trial()', 'public.redeem_family_coupon(text)', 'public.family_addons_snapshot()'
  ] loop
    if not pg_catalog.has_function_privilege('authenticated',signature,'EXECUTE')
      or pg_catalog.has_function_privilege('anon',signature,'EXECUTE') then
      raise exception 'authenticated family function permissions incorrect: %',signature;
    end if;
    if not exists(select 1 from pg_catalog.pg_proc where oid=signature::regprocedure and prosecdef and 'search_path=""'=any(proconfig)) then
      raise exception 'family function security incorrect: %',signature;
    end if;
  end loop;
  -- No API role may execute these originals; owner-run actor wrappers are required.
  foreach signature in array array[
    'public.consume_ai_quota_monthly(integer,integer,integer,integer)'
  ] loop
    if pg_catalog.has_function_privilege('anon',signature,'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated',signature,'EXECUTE')
      or pg_catalog.has_function_privilege('service_role',signature,'EXECUTE') then
      raise exception 'no API role may execute original function: %',signature;
    end if;
    if not exists(select 1 from pg_catalog.pg_proc where oid=signature::regprocedure and prosecdef and 'search_path=""'=any(proconfig)) then
      raise exception 'original function security incorrect: %',signature;
    end if;
  end loop;
  body := pg_catalog.pg_get_functiondef('public.consume_ai_quota_monthly_as(uuid,integer,integer,integer,integer)'::regprocedure);
  if strpos(body,'public.act_as_user(actor_user_id)')=0
    or strpos(body,'public.consume_ai_quota_monthly(per_month, per_day, system_per_day, min_gap_seconds)')=0 then
    raise exception 'monthly quota actor wrapper missing';
  end if;
  body := pg_catalog.pg_get_functiondef('public.consume_ai_quota_monthly(integer,integer,integer,integer)'::regprocedure);
  if strpos(body,'per_month is not null')=0 or strpos(body,'per_month not between 1 and 1000')=0
    or strpos(body,'per_day not between 1 and 1000')=0
    or strpos(body,'day >= date_trunc(''month'', today)')=0
    or strpos(body,'remainingThisMonth')=0
    or not (strpos(body,'''system_day''') < strpos(body,'''family_month''')
      and strpos(body,'''family_month''') < strpos(body,'''family_day''')
      and strpos(body,'''family_day''') < strpos(body,'''too_fast''')) then
    raise exception 'monthly quota limits, UTC month or refusal order incorrect';
  end if;
  body := pg_catalog.pg_get_functiondef('public.family_ai_tier(uuid)'::regprocedure);
  if strpos(body,'''plus''')=0 or strpos(body,'''standard''')=0 or strpos(body,'''free''')=0
    or strpos(body,'''basic''')>0 or strpos(body,'subscription.plan = ''trial''')>0 then
    raise exception 'AI tiers must distinguish paid, free/trial and plus';
  end if;
  body := pg_catalog.pg_get_functiondef('public.create_family_payment_order(uuid,uuid,bigint,text,timestamptz)'::regprocedure);
  if strpos(body,'when ''pro_plus_monthly'' then 79000')=0 or strpos(body,'when ''pro_plus_yearly'' then 790000')=0
    or strpos(body,'when ''pro_plus_yearly_upsell'' then 690000')=0 or strpos(body,'when ''pro_plus_yearly_b1g1'' then 790000')=0
    or strpos(body,'public.launch_offer_remaining(promo_offer)')=0 or strpos(body,'offer_unavailable')=0 or strpos(body,'offer_already_used')=0
    or strpos(body,'if promo_offer is null then')=0
    or strpos(body,'when ''ai_addon_monthly'' then 29000')=0 or strpos(body,'when ''printables'' then 99000')=0
    or strpos(body,'addon_requires_plan')=0 or strpos(body,'already_included')=0 or strpos(body,'already_owned')=0
    or strpos(body,'higher_plan_active')=0 or strpos(body,'lifetime_active')=0
    or strpos(body,'family_id = target_family and plan_id = ''printables'' and status = ''PENDING''')=0 then
    raise exception 'new checkout prices or eligibility missing';
  end if;
  foreach signature in array array[
    'public.create_family_payment_order(uuid,uuid,bigint,text,timestamptz)',
    'public.family_ai_tier(uuid)', 'public.family_addons_snapshot()'
  ] loop
    body := pg_catalog.pg_get_functiondef(signature::regprocedure);
    if strpos(body,'claim.revoked_at is null')=0
      or strpos(body,'claim_order.order_code = claim.order_code')=0
      or strpos(body,'claim_order.paid_at + interval ''1 year'' > now()')=0 then
      raise exception 'founding inclusion must end at original paid-year anniversary: %',signature;
    end if;
  end loop;
  body := pg_catalog.pg_get_functiondef('public.referral_discount_bps(uuid,uuid)'::regprocedure);
  if strpos(body,'''pro_plus_yearly''')=0 or strpos(body,'''pro_plus_yearly_upsell''')=0
    or strpos(body,'''pro_plus_yearly_b1g1''')=0 then raise exception 'Pro Plus/promo yearly discount history missing'; end if;
  body := pg_catalog.pg_get_functiondef('public.accrue_referral_commission(bigint)'::regprocedure);
  if strpos(body,'not in (''solo_yearly'', ''yearly'', ''lifetime'', ''pro_plus_yearly'', ''pro_plus_yearly_upsell'', ''pro_plus_yearly_b1g1'')')=0 then
    raise exception 'commission scope incorrect';
  end if;
  body := pg_catalog.pg_get_functiondef('public.process_payos_webhook(bigint,integer,text,text,text,jsonb)'::regprocedure);
  if strpos(body,'insert into public.family_addons')=0 or strpos(body,'then 3')=0
    or strpos(body,'when target_order.plan_id = ''pro_plus_yearly_b1g1'' then interval ''2 years''')=0
    or strpos(body,'(''yearly'', ''solo_yearly'', ''pro_plus_yearly'', ''pro_plus_yearly_upsell'')')=0
    or strpos(body,'then ''pro_plus_yearly''')=0 or strpos(body,'insert into public.launch_offer_claims')=0
    or strpos(body,'on conflict (offer_code, family_id) where revoked_at is null do nothing')=0
    or strpos(body,'public.launch_offer_remaining')>0 then raise exception 'settlement branch, rank, duration or unconditional promo claim missing'; end if;
  body := pg_catalog.pg_get_functiondef('public.admin_resolve_billing_case(uuid,text,text,uuid,text)'::regprocedure);
  if strpos(body,'active_until - interval ''1 month''')=0 or strpos(body,'delete from public.family_addons')=0
    or strpos(body,'public.admin_revoke_launch_offer_claim(support_case.order_code, reason)')=0 then
    raise exception 'add-on refund revocation missing';
  end if;
  raise notice 'Pro Plus and add-ons verified';
end $$;
rollback;
