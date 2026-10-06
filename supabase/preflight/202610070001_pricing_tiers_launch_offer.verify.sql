begin;

select count(*) as pro_or_trial_families_over_five_children
from public.user_subscriptions subscription
where subscription.status = 'active'
  and (
    (subscription.plan in ('monthly', 'yearly') and subscription.subscription_ends_at > now())
    or (subscription.plan = 'trial' and subscription.trial_ends_at > now())
  )
  and (select count(*) from public.child_profiles child where child.family_id = subscription.family_id) > 5;

-- Isolate the offer scenarios under its settlement lock; rollback restores all existing claims.
select code from public.launch_offers where code = 'pro_plus_founding' for update;
delete from public.launch_offer_claims where offer_code = 'pro_plus_founding';
update public.launch_offers set slots = 10, opened_at = now(), closed_at = null
where code = 'pro_plus_founding';

create temporary table pricing_verification_families (
  ordinal integer primary key,
  actor_id uuid not null,
  family_id uuid not null
) on commit drop;
create temporary sequence pricing_verification_order_codes start 8000000000000000;

do $$
declare
  actor uuid;
  actor_family uuid;
begin
  for ordinal in 1..15 loop
    actor := gen_random_uuid();
    insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data)
    values (actor, actor::text || '@example.invalid', '{}'::jsonb, '{}'::jsonb);
    select membership.family_id into strict actor_family
    from public.family_memberships membership
    where membership.user_id = actor and membership.role = 'owner';
    insert into pricing_verification_families values (ordinal, actor, actor_family);
  end loop;
end
$$;

create or replace function pg_temp.verify_pricing_payment(family_ordinal integer, selected_plan text)
returns bigint
language plpgsql
as $$
declare
  fixture pricing_verification_families%rowtype;
  code bigint := nextval('pg_temp.pricing_verification_order_codes');
  amount integer := case selected_plan
    when 'solo_monthly' then 39000
    when 'solo_yearly' then 399000
    when 'monthly' then 59000
    when 'yearly' then 590000
    else 590000
  end;
  result text;
begin
  select * into strict fixture from pricing_verification_families where ordinal = family_ordinal;
  insert into public.payment_orders (order_code, user_id, family_id, plan_id, amount, description)
  values (code, fixture.actor_id, fixture.family_id, selected_plan, amount, 'Pricing verification');
  result := public.process_payos_webhook(code, amount, 'Pricing verification', 'verify-' || code, '', '{}'::jsonb);
  if selected_plan like 'family_plus_%' then
    if result is distinct from 'invalid_plan'
      or (select status from public.payment_orders where order_code = code) <> 'PENDING' then
      raise exception 'Unsold Pro Plus plans must be rejected: %', result;
    end if;
  elsif result is distinct from 'activated'
    or (select status from public.payment_orders where order_code = code) <> 'PAID' then
    raise exception 'Payment did not activate: %', result;
  end if;
  return code;
end
$$;

do $$
declare
  fixture pricing_verification_families%rowtype;
  actual_plan text;
  actual_end timestamptz;
  coupon_result record;
  coupon_code text := 'VERIFY_' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));
begin
  perform pg_temp.verify_pricing_payment(1, 'solo_yearly');
  select * into strict fixture from pricing_verification_families where ordinal = 1;
  select plan, subscription_ends_at into actual_plan, actual_end
  from public.user_subscriptions where family_id = fixture.family_id;
  if actual_plan is distinct from 'solo_yearly' or actual_end is distinct from now() + interval '1 year'
    or public.family_child_limit(fixture.family_id) is distinct from 1
    or public.family_has_pro_entitlement(fixture.family_id) is distinct from true then
    raise exception 'Yearly one-child payment must grant one year and one child';
  end if;
  raise notice 'solo_yearly: plan=%, expires=%, child_limit=1', actual_plan, actual_end;

  insert into public.coupons (code, bonus_days) values (coupon_code, 7);
  perform set_config('request.jwt.claim.sub', fixture.actor_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', fixture.actor_id, 'role', 'authenticated')::text, true);
  select * into strict coupon_result from public.redeem_family_coupon(coupon_code);
  if coupon_result.plan is distinct from 'solo_yearly'
    or coupon_result.subscription_ends_at is distinct from actual_end + interval '7 days' then
    raise exception 'Coupon must preserve solo_yearly and extend its existing end';
  end if;
  raise notice 'Coupon on solo_yearly: plan=%, expires=%', coupon_result.plan, coupon_result.subscription_ends_at;

  select * into strict fixture from pricing_verification_families where ordinal = 2;
  insert into public.user_subscriptions (family_id, user_id, plan, status, subscription_ends_at)
  values (fixture.family_id, fixture.actor_id, 'yearly', 'active', now() + interval '2 months');
  perform pg_temp.verify_pricing_payment(2, 'solo_yearly');
  select plan, subscription_ends_at into actual_plan, actual_end
  from public.user_subscriptions where family_id = fixture.family_id;
  if actual_plan is distinct from 'yearly'
    or actual_end is distinct from now() + interval '2 months' + interval '1 year'
    or public.family_child_limit(fixture.family_id) is distinct from 5 then
    raise exception 'An active Pro yearly subscription must not downgrade to solo_yearly';
  end if;
  raise notice 'Active yearly buying solo_yearly: plan=%, expires=%, child_limit=5', actual_plan, actual_end;

  if exists (select 1 from public.launch_offer_claims where offer_code = 'pro_plus_founding') then
    raise exception 'Solo yearly orders must not claim the Pro yearly offer';
  end if;
  perform pg_temp.verify_pricing_payment(2, 'family_plus_monthly');
  perform pg_temp.verify_pricing_payment(2, 'family_plus_yearly');
  raise notice 'Unsold Pro Plus payment plans rejected';

  update public.user_subscriptions set plan = 'trial', trial_ends_at = now() + interval '1 day'
  where family_id = fixture.family_id;
  if public.family_child_limit(fixture.family_id) is distinct from 5 then
    raise exception 'Active trial must allow five children';
  end if;
  update public.user_subscriptions set trial_ends_at = now() - interval '1 day'
  where family_id = fixture.family_id;
  if public.family_child_limit(fixture.family_id) is distinct from 0 then
    raise exception 'Expired trial must not grant a child allowance';
  end if;
  update public.user_subscriptions set plan = 'lifetime' where family_id = fixture.family_id;
  if public.family_child_limit(fixture.family_id) is not null then
    raise exception 'Lifetime must remain unlimited';
  end if;
  raise notice 'Trial: active=5, expired=0; lifetime=unlimited';
end
$$;

do $$
declare
  first_order bigint;
  repeat_order bigint;
  claim_count integer;
  fixture pricing_verification_families%rowtype;
  result text;
begin
  first_order := pg_temp.verify_pricing_payment(3, 'yearly');
  repeat_order := pg_temp.verify_pricing_payment(3, 'yearly');
  select * into strict fixture from pricing_verification_families where ordinal = 3;
  select count(*) into claim_count from public.launch_offer_claims
  where offer_code = 'pro_plus_founding' and family_id = fixture.family_id;
  if claim_count <> 1 or not exists (
    select 1 from public.launch_offer_claims where order_code = first_order
  ) then raise exception 'Two Pro yearly orders from one family must claim only the first slot'; end if;
  raise notice 'One family, two yearly payments: claims=%', claim_count;

  result := public.process_payos_webhook(first_order, 590000, 'Pricing verification', 'verify-' || first_order, '', '{}'::jsonb);
  if result is distinct from 'duplicate' then raise exception 'Paid webhook replay must remain idempotent'; end if;

  for ordinal in 4..13 loop
    perform pg_temp.verify_pricing_payment(ordinal, 'yearly');
  end loop;
  select count(*) into claim_count from public.launch_offer_claims
  where offer_code = 'pro_plus_founding' and revoked_at is null;
  if claim_count <> 10 or public.launch_offer_remaining('pro_plus_founding') is distinct from 0
    or exists (
      select 1 from public.launch_offer_claims claim
      join pricing_verification_families fixture on fixture.family_id = claim.family_id
      where fixture.ordinal = 13
    ) then raise exception 'Eleven paying families must receive only the first ten claims'; end if;
  raise notice 'Eleven yearly-paying families: active_claims=%, remaining=0', claim_count;

  perform public.admin_revoke_launch_offer_claim(first_order, 'Verification revocation');
  perform public.admin_revoke_launch_offer_claim(first_order, 'Repeated revocation');
  if public.launch_offer_remaining('pro_plus_founding') is distinct from 1
    or not exists (
      select 1 from public.launch_offer_claims
      where order_code = first_order and revoked_at is not null and revoked_reason = 'Verification revocation'
    ) then raise exception 'Idempotent revocation must release one slot and preserve its reason'; end if;
  raise notice 'One revoked claim: remaining=1';

  perform pg_temp.verify_pricing_payment(3, 'yearly');
  if public.launch_offer_remaining('pro_plus_founding') is distinct from 1 then
    raise exception 'A revoked family must not claim a second launch benefit';
  end if;

  update public.launch_offers set closed_at = now() - interval '1 second' where code = 'pro_plus_founding';
  perform pg_temp.verify_pricing_payment(14, 'yearly');
  if public.launch_offer_remaining('pro_plus_founding') is distinct from 0 then
    raise exception 'A closed offer must expose zero remaining';
  end if;
  update public.launch_offers set closed_at = null, opened_at = now() + interval '1 day' where code = 'pro_plus_founding';
  perform pg_temp.verify_pricing_payment(15, 'yearly');
  if exists (
    select 1 from public.launch_offer_claims claim
    join pricing_verification_families fixture on fixture.family_id = claim.family_id
    where fixture.ordinal in (14, 15)
  ) or public.launch_offer_remaining('pro_plus_founding') is distinct from 0
    or public.launch_offer_remaining('unknown_offer') is distinct from 0 then
    raise exception 'Closed, unopened and unknown offers must not grant or expose slots';
  end if;
  raise notice 'Closed and unopened offers: no claims, remaining=0';
end
$$;

do $$
begin
  if pg_catalog.has_table_privilege('anon', 'public.launch_offer_claims', 'SELECT')
    or pg_catalog.has_table_privilege('authenticated', 'public.launch_offer_claims', 'SELECT')
    or exists (select 1 from pg_catalog.pg_policies where schemaname = 'public' and tablename = 'launch_offer_claims') then
    raise exception 'Launch claims must not be readable by browser roles';
  end if;
  if pg_catalog.has_function_privilege('anon', 'public.admin_revoke_launch_offer_claim(bigint,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.admin_revoke_launch_offer_claim(bigint,text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.admin_revoke_launch_offer_claim(bigint,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('service_role', 'public.claim_launch_offer(uuid,bigint)', 'EXECUTE') then
    raise exception 'Revocation must be service-role only and allocation internal only';
  end if;
  if not pg_catalog.has_function_privilege('anon', 'public.launch_offer_remaining(text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.launch_offer_remaining(text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.launch_offer_remaining(text)', 'EXECUTE') then
    raise exception 'Only the remaining count is public';
  end if;
  raise notice 'Launch offer privileges verified';
end
$$;

rollback;
