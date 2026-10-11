begin;
do $$
declare signature text; body text;
begin
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
    'public.family_ai_tier(uuid)'
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
  body := pg_catalog.pg_get_functiondef('public.create_family_payment_order(uuid,uuid,bigint,text,timestamptz)'::regprocedure);
  if strpos(body,'when ''pro_plus_monthly'' then 79000')=0 or strpos(body,'when ''pro_plus_yearly'' then 790000')=0
    or strpos(body,'when ''ai_addon_monthly'' then 29000')=0 or strpos(body,'when ''printables'' then 99000')=0
    or strpos(body,'addon_requires_plan')=0 or strpos(body,'already_included')=0 or strpos(body,'already_owned')=0
    or strpos(body,'higher_plan_active')=0
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
  if strpos(body,'''pro_plus_yearly''')=0 then raise exception 'Pro Plus yearly discount history missing'; end if;
  body := pg_catalog.pg_get_functiondef('public.accrue_referral_commission(bigint)'::regprocedure);
  if strpos(body,'not in (''solo_yearly'', ''yearly'', ''lifetime'', ''pro_plus_yearly'')')=0 then
    raise exception 'commission scope incorrect';
  end if;
  body := pg_catalog.pg_get_functiondef('public.process_payos_webhook(bigint,integer,text,text,text,jsonb)'::regprocedure);
  if strpos(body,'insert into public.family_addons')=0 or strpos(body,'then 3')=0
    or strpos(body,'(''yearly'', ''solo_yearly'', ''pro_plus_yearly'')')=0 then raise exception 'settlement branch, rank or duration missing'; end if;
  body := pg_catalog.pg_get_functiondef('public.admin_resolve_billing_case(uuid,text,text,uuid,text)'::regprocedure);
  if strpos(body,'active_until - interval ''1 month''')=0 or strpos(body,'delete from public.family_addons')=0 then
    raise exception 'add-on refund revocation missing';
  end if;
  raise notice 'Pro Plus and add-ons verified';
end $$;
rollback;
