-- Run only on the disposable affiliate fixture, after Money Model v2 is applied.
-- The runner snapshots commission rows and creates the old-price pending order BEFORE migration.
begin;

create temporary table money_model_fixtures (ordinal integer primary key, owner_id uuid, family_id uuid) on commit drop;
do $$
declare
  owner_id uuid;
  family_id uuid;
begin
  for ordinal in 1..5 loop
    owner_id := gen_random_uuid();
    family_id := gen_random_uuid();
    insert into auth.users(id, created_at) values (owner_id, now());
    insert into public.families(id, created_by) values (family_id, owner_id);
    insert into public.family_memberships(family_id, user_id, role) values (family_id, owner_id, 'owner');
    insert into public.referrals(referrer_user_id, referred_family_id, referred_user_id, code)
    values ('00000000-0000-0000-0000-000000000001', family_id, owner_id, 'ABCDEFGH');
    insert into money_model_fixtures values (ordinal, owner_id, family_id);
  end loop;
end
$$;

-- First yearly checkout uses the actual referral discount, then settlement accrues once.
select checkout.* from money_model_fixtures fixture cross join lateral
  public.create_family_payment_order(fixture.family_id, fixture.owner_id, 101001, 'yearly', now() + interval '15 minutes') checkout
where fixture.ordinal = 1;
select public.process_payos_webhook(101001, 531000, 'KIDHABIT 101001', 'money-model-pro', 'local-pro', '{}'::jsonb);
select public.accrue_referral_commission(101001);
select 'pro_yearly_referred' as scenario,
  (select amount = 531000 and status = 'PAID' from public.payment_orders where order_code = 101001)
  and (select count(*) = 1 and bool_and(base_amount = 531000 and amount = 106200 and rate_bps = 2000
    and available_at between now() + interval '40 days' - interval '1 minute' and now() + interval '40 days' + interval '1 minute')
    from public.referral_commissions where order_code = 101001) as ok;

select checkout.* from money_model_fixtures fixture cross join lateral
  public.create_family_payment_order(fixture.family_id, fixture.owner_id, 101002, 'solo_yearly', now() + interval '15 minutes') checkout
where fixture.ordinal = 2;
select public.process_payos_webhook(101002, 359000, 'KIDHABIT 101002', 'money-model-solo', 'local-solo', '{}'::jsonb);
select 'solo_yearly_referred' as scenario,
  (select amount = 359000 and status = 'PAID' from public.payment_orders where order_code = 101002)
  and (select count(*) = 1 and bool_and(base_amount = 359000 and amount = 71800 and rate_bps = 2000)
    from public.referral_commissions where order_code = 101002) as ok;

select checkout.* from money_model_fixtures fixture cross join lateral
  public.create_family_payment_order(fixture.family_id, fixture.owner_id, 101003, 'monthly', now() + interval '15 minutes') checkout
where fixture.ordinal = 3;
select public.process_payos_webhook(101003, 69000, 'KIDHABIT 101003', 'money-model-monthly', 'local-monthly', '{}'::jsonb);
select checkout.* from money_model_fixtures fixture cross join lateral
  public.create_family_payment_order(fixture.family_id, fixture.owner_id, 101004, 'solo_monthly', now() + interval '15 minutes') checkout
where fixture.ordinal = 3;
select public.process_payos_webhook(101004, 49000, 'KIDHABIT 101004', 'money-model-solo-monthly', 'local-solo-monthly', '{}'::jsonb);
select 'monthly_no_commission' as scenario,
  (select count(*) = 2 and bool_and(status = 'PAID') from public.payment_orders where order_code in (101003, 101004))
  and not exists (select 1 from public.referral_commissions where order_code in (101003, 101004)) as ok;

-- Monthly settlement must leave the first-yearly discount and commission eligibility intact.
select checkout.* from money_model_fixtures fixture cross join lateral
  public.create_family_payment_order(fixture.family_id, fixture.owner_id, 101005, 'monthly', now() + interval '15 minutes') checkout
where fixture.ordinal = 4;
select public.process_payos_webhook(101005, 69000, 'KIDHABIT 101005', 'money-model-monthly-first', 'local-monthly-first', '{}'::jsonb);
select checkout.* from money_model_fixtures fixture cross join lateral
  public.create_family_payment_order(fixture.family_id, fixture.owner_id, 101006, 'yearly', now() + interval '15 minutes') checkout
where fixture.ordinal = 4;
select public.process_payos_webhook(101006, 531000, 'KIDHABIT 101006', 'money-model-yearly-next', 'local-yearly-next', '{}'::jsonb);
select 'monthly_then_yearly' as scenario,
  (select count(*) = 2 and bool_and(status = 'PAID') from public.payment_orders where order_code in (101005, 101006))
  and (select count(*) = 1 and bool_and(order_code = 101006 and base_amount = 531000 and amount = 106200 and rate_bps = 2000)
    from public.referral_commissions where order_code in (101005, 101006)) as ok;

-- Lifetime accrual is enabled without adding lifetime to the checkout catalog.
insert into public.payment_orders(order_code, user_id, family_id, amount, status, plan_id)
select 101007, owner_id, family_id, 1990000, 'PAID', 'lifetime' from money_model_fixtures where ordinal = 5;
select public.accrue_referral_commission(101007);
select 'lifetime_referred' as scenario,
  (select count(*) = 1 and bool_and(base_amount = 1990000 and amount = 398000 and rate_bps = 2000)
    from public.referral_commissions where order_code = 101007) as ok;

-- Compare every field, not just rate and amount, against the pre-migration snapshot.
select 'history_untouched' as scenario,
  exists (select 1 from money_model_history where (original->>'rate_bps')::integer = 3000)
  and not exists (
    select 1 from money_model_history history left join public.referral_commissions commission on commission.id = history.id
    where to_jsonb(commission) is distinct from history.original
  ) as ok;

select public.process_payos_webhook(101000, 59000, 'KIDHABIT 101000', 'money-model-old-monthly', 'local-old-monthly', '{}'::jsonb);
select 'old_price_pending_settles' as scenario,
  (select status = 'PAID' and amount = 59000 and plan_id = 'monthly' from public.payment_orders where order_code = 101000)
  and exists (select 1 from public.user_subscriptions subscription join money_model_legacy_pending fixture on fixture.family_id = subscription.family_id
    where subscription.plan = 'monthly' and subscription.status = 'active' and subscription.subscription_ends_at > now())
  and not exists (select 1 from public.referral_commissions where order_code = 101000) as ok;

rollback;
