begin;

-- Run this duplicate query before applying the migration too; review real financial records, never auto-dedupe.
select order_code, array_agg(id order by created_at, id) as confirmed_refund_case_ids
from public.billing_support_cases
where case_type = 'refund' and status = 'completed' and resolution_code = 'manual_refund_confirmed'
  and order_code is not null
group by order_code having count(*) > 1;

-- This count is deliberately not a local cleanup predicate: require PayOS unpaid/unknown proof.
select count(*) as stale_yearly_orders_needing_provider_verification from public.payment_orders
where status = 'PENDING' and plan_id in ('yearly', 'solo_yearly')
  and coalesce(expires_at, created_at + interval '15 minutes') <= now();


-- Temporarily allow the fixture to claim a seat; rollback restores the offer and all fixture data.
select code from public.launch_offers where code = 'pro_plus_founding' for update;
update public.launch_offers set slots = slots + 1, opened_at = now(), closed_at = null where code = 'pro_plus_founding';

create temporary table billing_hardening_fixtures (ordinal integer, actor uuid, family uuid) on commit drop;
do $$
declare
  actor uuid;
  family uuid;
begin
  for ordinal in 1..8 loop
    actor := gen_random_uuid();
    insert into auth.users(id, email, raw_user_meta_data, raw_app_meta_data)
    values (actor, actor::text || '@example.invalid', '{}'::jsonb, '{}'::jsonb);
    select family_id into family from public.family_memberships where user_id = actor and role = 'owner' limit 1;
    if family is null then
      insert into public.families(name, created_by) values ('Billing verification', actor) returning id into family;
      insert into public.family_memberships(family_id, user_id, role) values (family, actor, 'owner');
    end if;
    insert into billing_hardening_fixtures values (ordinal, actor, family);
    delete from public.user_subscriptions where family_id = family;
    family := null;
  end loop;
end
$$;

-- Caregivers must be rejected before trial state, coupon attempts or redemption counters change.
do $$
declare
  owner_fixture billing_hardening_fixtures%rowtype;
  caregiver_fixture billing_hardening_fixtures%rowtype;
begin
  select * into owner_fixture from billing_hardening_fixtures where ordinal = 1;
  select * into caregiver_fixture from billing_hardening_fixtures where ordinal = 2;
  delete from public.family_memberships where user_id = caregiver_fixture.actor;
  insert into public.family_memberships(family_id, user_id, role) values (owner_fixture.family, caregiver_fixture.actor, 'caregiver');
  perform set_config('request.jwt.claim.sub', caregiver_fixture.actor::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', caregiver_fixture.actor, 'role', 'authenticated')::text, true);
  begin
    perform public.activate_family_trial();
    raise exception 'Caregiver activated a trial';
  exception when others then
    if sqlerrm <> 'not_authorized' then raise; end if;
  end;
  begin
    perform public.redeem_family_coupon('VERIFY_BILLING_COUPON');
    raise exception 'Caregiver redeemed a coupon';
  exception when others then
    if sqlerrm <> 'not_authorized' then raise; end if;
  end;
  if exists (select 1 from public.coupon_attempts where user_id = caregiver_fixture.actor)
    or exists (select 1 from public.user_subscriptions where family_id = owner_fixture.family) then
    raise exception 'Denied caregiver consumed trial or coupon quota';
  end if;
  perform set_config('request.jwt.claim.sub', owner_fixture.actor::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', owner_fixture.actor, 'role', 'authenticated')::text, true);
  perform public.activate_family_trial();
  insert into public.coupons(code, bonus_days) values ('VERIFY_' || upper(substr(replace(owner_fixture.actor::text, '-', ''), 1, 20)), 7);
  perform public.redeem_family_coupon('VERIFY_' || upper(substr(replace(owner_fixture.actor::text, '-', ''), 1, 20)));
  raise notice 'P4: caregiver denied before quota; owner trial succeeds';
end
$$;

-- A webhook/trial committed after the admin read makes the CAS stale, including the no-row case.
do $$
declare
  fixture billing_hardening_fixtures%rowtype;
  version timestamptz;
  consumed timestamptz;
  result text;
begin
  select * into fixture from billing_hardening_fixtures where ordinal = 1;
  select updated_at, trial_consumed_at into version, consumed from public.user_subscriptions where family_id = fixture.family;
  result := public.admin_update_family_subscription(fixture.family, 'free', 'inactive', null, null);
  if result <> 'subscription_changed' then raise exception 'Missing-row CAS overwrote a trial'; end if;
  update public.user_subscriptions set updated_at = version + interval '1 second', plan = 'yearly',
    subscription_ends_at = now() + interval '1 year', trial_ends_at = null where family_id = fixture.family;
  result := public.admin_update_family_subscription(fixture.family, 'free', 'inactive', null, version);
  if result <> 'subscription_changed' then raise exception 'Stale CAS overwrote paid entitlement'; end if;
  result := public.admin_update_family_subscription(fixture.family, 'trial', 'active', now() + interval '7 days', version + interval '1 second');
  if result <> 'updated' or (select trial_consumed_at from public.user_subscriptions where family_id = fixture.family) is distinct from consumed then
    raise exception 'Admin update must preserve consumed trial';
  end if;
  raise notice 'P1: stale/missing-row CAS rejected; trial marker preserved';
end
$$;

-- Monthly history is allowed; a pending yearly link holds the reservation, even after local expiry.
do $$
declare
  fixture billing_hardening_fixtures%rowtype;
  referrer billing_hardening_fixtures%rowtype;
  checkout record;
  checkout_code bigint := 8100000000000010;
  result text;
  recreated_family uuid;
  referral_code text := translate(upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)), '0123456789', 'ABCDEFGHJK');
begin
  select * into fixture from billing_hardening_fixtures where ordinal = 3;
  select * into referrer from billing_hardening_fixtures where ordinal = 4;
  insert into public.affiliate_accounts(user_id, code, terms_version, terms_accepted_at)
  values (referrer.actor, referral_code, 'verification', now());
  insert into public.referrals(referrer_user_id, referred_family_id, referred_user_id, code)
  values (referrer.actor, fixture.family, fixture.actor, referral_code);
  update public.affiliate_settings set enabled = true, referred_discount_bps = 1000 where singleton;
  select * into checkout from public.create_family_payment_order(fixture.family, fixture.actor, checkout_code, 'monthly', now() + interval '15 minutes');
  result := public.process_payos_webhook(checkout_code, checkout.amount, 'KIDHABIT ' || checkout_code, 'verify-monthly', 'monthly-link', '{}'::jsonb);
  if result <> 'activated' then raise exception 'Monthly fixture failed'; end if;
  checkout_code := checkout_code + 1;
  select * into checkout from public.create_family_payment_order(fixture.family, fixture.actor, checkout_code, 'solo_yearly', now() - interval '1 minute');
  if checkout.amount <> 359100 or checkout.discount_bps <> 1000 then raise exception 'Monthly history must not consume yearly discount'; end if;
  select * into checkout from public.create_family_payment_order(fixture.family, fixture.actor, checkout_code + 1, 'yearly', now() + interval '15 minutes');
  if checkout.existing_order_code is distinct from checkout_code then raise exception 'Concurrent yearly checkout bypassed reservation'; end if;
  if exists (select 1 from public.payment_orders where order_code = checkout_code + 1) then raise exception 'Pending lookup inserted a second order'; end if;
  update public.payment_orders set status = 'CANCELLED' where payment_orders.order_code = checkout_code;
  checkout_code := checkout_code + 1;
  select * into checkout from public.create_family_payment_order(fixture.family, fixture.actor, checkout_code, 'yearly', now() + interval '15 minutes');
  if checkout.amount <> 531000 then raise exception 'Provider cancellation must release reservation'; end if;
  result := public.process_payos_webhook(checkout_code, checkout.amount, 'KIDHABIT ' || checkout_code, 'verify-yearly', 'yearly-link', '{}'::jsonb);
  if result <> 'activated' then raise exception 'Yearly fixture failed'; end if;
  result := public.process_payos_webhook(checkout_code, checkout.amount, 'KIDHABIT ' || checkout_code, 'different-reference', 'yearly-link', '{}'::jsonb);
  if result <> 'order_already_paid' then raise exception 'Paid order must be idempotent for another valid reference'; end if;
  if public.referral_discount_bps(fixture.family, fixture.actor) <> 0 then raise exception 'Second paid yearly discount must be zero'; end if;
  insert into public.families(name, created_by) values ('Recreated verification family', fixture.actor) returning id into recreated_family;
  insert into public.family_memberships(family_id, user_id, role) values (recreated_family, fixture.actor, 'owner');
  select * into checkout from public.create_family_payment_order(recreated_family, fixture.actor, checkout_code + 1, 'solo_yearly', now() + interval '15 minutes');
  if checkout.amount <> 399000 then raise exception 'Recreated family must not reset paying-user discount'; end if;
  raise notice 'P3/P7: monthly history allowed, pending reservation unique, yearly discount once per user, paid replay accepted';
end
$$;

do $$
declare
  fixture billing_hardening_fixtures%rowtype;
  case_id uuid := gen_random_uuid();
  other_case uuid := gen_random_uuid();
  result jsonb;
begin
  select * into fixture from billing_hardening_fixtures where ordinal = 3;
  perform set_config('request.jwt.claim.sub', fixture.actor::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', fixture.actor, 'role', 'authenticated')::text, true);
  insert into public.billing_support_cases(id, family_id, user_id, order_code, case_type, reason_code, created_by)
  values (case_id, fixture.family, fixture.actor, 8100000000000012, 'refund', 'other', fixture.actor),
    (other_case, fixture.family, fixture.actor, 8100000000000012, 'refund', 'other', fixture.actor);
  result := public.admin_resolve_billing_case(case_id, 'completed', 'manual_refund_confirmed', fixture.actor, 'Verification refund');
  if result->>'code' <> 'updated' then raise exception 'Refund failed: %', result; end if;
  if result->>'launchOfferClaim' is distinct from 'revoked'
    or not exists (select 1 from public.launch_offer_claims where order_code = 8100000000000012 and revoked_at is not null) then
    raise exception 'Confirmed refund did not revoke launch seat';
  end if;
  result := public.admin_resolve_billing_case(other_case, 'completed', 'manual_refund_confirmed', fixture.actor, 'Duplicate refund');
  if result->>'code' <> 'refund_already_confirmed' then raise exception 'Duplicate refund allowed'; end if;
  begin
    update public.billing_support_cases set status = 'completed', resolution_code = 'manual_refund_confirmed' where id = other_case;
    raise exception 'Unique refund constraint bypassed';
  exception when unique_violation then null;
  end;
  result := public.admin_resolve_billing_case(case_id, 'reviewing', 'manual_refund_required', fixture.actor, 'Stale page');
  if result->>'code' <> 'case_closed' then raise exception 'Closed case reopened'; end if;
  result := public.admin_resolve_billing_case(case_id, 'completed', 'manual_refund_confirmed', fixture.actor, 'Retry refund');
  if result->>'code' <> 'updated' then raise exception 'Idempotent refund retry failed'; end if;
  raise notice 'P6/LAUNCH: one confirmed refund, final closed case, automatic launch revocation, retry succeeds';
end
$$;

-- Referral eligibility belongs to either the payer or the family owner, including co-parent history.
do $$
declare
  owner_fixture billing_hardening_fixtures%rowtype;
  payer_fixture billing_hardening_fixtures%rowtype;
  referrer_fixture billing_hardening_fixtures%rowtype;
  family_fixture billing_hardening_fixtures%rowtype;
  checkout record;
  other_family uuid;
  result text;
  code text;
begin
  select * into owner_fixture from billing_hardening_fixtures where ordinal = 5;
  select * into payer_fixture from billing_hardening_fixtures where ordinal = 6;
  select * into referrer_fixture from billing_hardening_fixtures where ordinal = 4;
  select affiliate.code into code from public.affiliate_accounts affiliate where user_id = referrer_fixture.actor;
  insert into public.referrals(referrer_user_id, referred_family_id, referred_user_id, code)
  values (referrer_fixture.actor, owner_fixture.family, owner_fixture.actor, code);
  insert into public.family_memberships(family_id, user_id, role) values (owner_fixture.family, payer_fixture.actor, 'parent');
  select * into checkout from public.create_family_payment_order(owner_fixture.family, payer_fixture.actor, 8100000000000030, 'yearly', now() + interval '15 minutes');
  if checkout.amount <> 531000 then raise exception 'Co-parent payment must use referred owner eligibility'; end if;
  select * into checkout from public.create_family_payment_order(owner_fixture.family, owner_fixture.actor, 8100000000000031, 'solo_yearly', now() + interval '15 minutes');
  if checkout.existing_order_code is distinct from 8100000000000030::bigint then raise exception 'Owner and co-parent reservations must serialize'; end if;
  result := public.process_payos_webhook(8100000000000030, 531000, 'KIDHABIT 8100000000000030', 'verify-co-parent', 'co-parent-link', '{}'::jsonb);
  if result <> 'activated' then raise exception 'Co-parent fixture payment failed'; end if;
  -- Deletion must not erase the owner identity on an order paid by a co-parent.
  update public.payment_orders set family_id = null where order_code = 8100000000000030;
  delete from public.family_memberships where family_id = owner_fixture.family;
  insert into public.families(name, created_by) values ('Other owned verification family', owner_fixture.actor) returning id into other_family;
  insert into public.family_memberships(family_id, user_id, role) values (other_family, owner_fixture.actor, 'owner');
  select * into checkout from public.create_family_payment_order(other_family, owner_fixture.actor, 8100000000000032, 'solo_yearly', now() + interval '15 minutes');
  if checkout.amount <> 399000 then raise exception 'Prior paid yearly in any owned family, even by co-parent, must consume eligibility'; end if;

  select * into payer_fixture from billing_hardening_fixtures where ordinal = 7;
  select * into family_fixture from billing_hardening_fixtures where ordinal = 8;
  insert into public.referrals(referrer_user_id, referred_family_id, referred_user_id, code)
  values (referrer_fixture.actor, payer_fixture.family, payer_fixture.actor, code);
  insert into public.family_memberships(family_id, user_id, role) values (family_fixture.family, payer_fixture.actor, 'parent');
  select * into checkout from public.create_family_payment_order(family_fixture.family, payer_fixture.actor, 8100000000000033, 'solo_yearly', now() + interval '15 minutes');
  if checkout.amount <> 359100 then raise exception 'Referred payer must qualify even when the owner is not referred'; end if;
  update public.payment_orders set status = 'CANCELLED' where order_code = 8100000000000033;
  insert into public.payment_orders(order_code,family_id,user_id,plan_id,amount,description,status)
  values (8100000000000034, payer_fixture.family, family_fixture.actor, 'yearly', 590000, 'KIDHABIT 8100000000000034', 'PAID');
  select * into checkout from public.create_family_payment_order(family_fixture.family, payer_fixture.actor, 8100000000000035, 'yearly', now() + interval '15 minutes');
  if checkout.amount <> 590000 then raise exception 'Referred payer with paid history in an owned family must not qualify again'; end if;
  raise notice 'Owner/payer OR eligibility: co-parent qualifies; owned-family paid history consumes eligibility; referred payer qualifies independently';
end
$$;

-- Admin signals support a 200 ACK for a possible double charge, and saved cursors stay private.
insert into public.operational_events(signal_type, reason_code, correlation_id, status)
values ('payment_webhook_failure', 'order_already_paid', gen_random_uuid(), 200);
do $$
begin
  if has_table_privilege('anon', 'public.billing_reconcile_state', 'SELECT')
    or has_table_privilege('authenticated', 'public.billing_reconcile_state', 'SELECT')
    or has_table_privilege('authenticated', 'public.billing_reconcile_state', 'UPDATE')
    or not has_table_privilege('service_role', 'public.billing_reconcile_state', 'UPDATE') then
    raise exception 'Reconcile cursor must be service-only';
  end if;
  raise notice 'Double-charge signal accepted; reconcile cursor service-only';
end
$$;

do $$
declare
  signature text;
begin
  foreach signature in array array[
    'public.admin_update_family_subscription(uuid,text,text,timestamptz,timestamptz)',
    'public.create_family_payment_order(uuid,uuid,bigint,text,timestamptz)',
    'public.admin_resolve_billing_case(uuid,text,text,uuid,text)',
    'public.referral_discount_bps(uuid,uuid)'
  ] loop
    if pg_catalog.has_function_privilege('anon', signature, 'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated', signature, 'EXECUTE')
      or not pg_catalog.has_function_privilege('service_role', signature, 'EXECUTE') then
      raise exception 'Service-only privilege failure for %', signature;
    end if;
  end loop;
  raise notice 'New billing RPC privileges verified';
end
$$;

-- The cancellation path must take order -> family locks like process_payos_webhook, never family -> order.
do $$
declare
  definition text := pg_catalog.pg_get_functiondef('public.admin_resolve_billing_case(uuid,text,text,uuid,text)'::regprocedure);
  cancellation integer := strpos(definition, 'subscription_cancelled'' then');
  order_lock integer;
  family_lock integer;
begin
  order_lock := strpos(substr(definition, cancellation), 'perform 1 from public.payment_orders');
  family_lock := strpos(substr(definition, cancellation), 'perform 1 from public.families');
  if cancellation = 0 or order_lock = 0 or family_lock = 0 or order_lock > family_lock then
    raise exception 'Subscription cancellation must lock the payment order before the family';
  end if;
  raise notice 'Cancellation lock order matches the webhook';
end
$$;

rollback;
