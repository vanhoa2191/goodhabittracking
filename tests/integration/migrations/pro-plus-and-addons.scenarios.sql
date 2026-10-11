-- Disposable fixture only. Each scenario returns exactly one named boolean row.
begin;
create temporary table addon_fixtures (n integer primary key, owner_id uuid, family_id uuid) on commit drop;
create temporary table addon_results (scenario text primary key, ok boolean not null) on commit drop;
do $$
declare u uuid; f uuid; ref uuid := gen_random_uuid();
begin
  insert into auth.users(id) values (ref);
  insert into public.affiliate_accounts(user_id,code,terms_version) values (ref,'ZZZZZZZZ','2026-10-10');
  for n in 1..21 loop
    u := gen_random_uuid(); f := gen_random_uuid();
    insert into auth.users(id) values(u);
    insert into public.families(id,created_by) values(f,u);
    insert into public.family_memberships(family_id,user_id,role) values(f,u,'owner');
    insert into addon_fixtures values(n,u,f);
    insert into public.referrals(referrer_user_id,referred_family_id,referred_user_id,code) values(ref,f,u,'ZZZZZZZZ');
  end loop;
end $$;
create function pg_temp.buy(n integer, code bigint, item text) returns integer language plpgsql as $$
declare f addon_fixtures%rowtype; price integer; result text;
begin
  select * into f from addon_fixtures where addon_fixtures.n = buy.n;
  select amount into price from public.create_family_payment_order(f.family_id,f.owner_id,code,item,now()+interval '15 minutes');
  result := public.process_payos_webhook(code,price,'KIDHABIT '||code,'addon-test-'||code,'local','{}');
  if result <> 'activated' then raise exception 'settlement %: %', code,result; end if;
  return price;
end $$;
create function pg_temp.order_error(n integer, code bigint, item text, expected text) returns boolean language plpgsql as $$
declare f addon_fixtures%rowtype;
begin
  select * into f from addon_fixtures where addon_fixtures.n = order_error.n;
  perform public.create_family_payment_order(f.family_id,f.owner_id,code,item,now()+interval '15 minutes');
  return false;
exception when others then return sqlerrm = expected;
end $$;

-- New prices, first-yearly referral discount, and commission based on actual payment.
insert into addon_results values ('pro_plus_prices',pg_temp.buy(1,111001,'pro_plus_yearly')=711000 and pg_temp.buy(2,111002,'pro_plus_monthly')=79000);
insert into addon_results select 'pro_plus_commission',
  (select count(*)=1 and bool_and(base_amount=711000 and amount=142200 and rate_bps=2000) from public.referral_commissions where order_code=111001)
  and not exists(select 1 from public.referral_commissions where order_code=111002);
insert into addon_results select 'pro_plus_child_limit',bool_and(public.family_child_limit(family_id)=5 and public.family_has_pro_entitlement(family_id)) from addon_fixtures where n in (1,2);

-- Rank upgrade stacks on Pro yearly and preserves an active founding claim.
select pg_temp.buy(3,111003,'yearly');
create temporary table addon_pro_before as select s.* from public.user_subscriptions s join addon_fixtures f using(family_id) where f.n=3;
select pg_temp.buy(3,111004,'pro_plus_monthly');
insert into addon_results select 'pro_to_pro_plus', s.plan='pro_plus_monthly' and s.subscription_ends_at=b.subscription_ends_at+interval '1 month'
  and public.family_ai_tier(s.family_id)='plus' and exists(select 1 from public.launch_offer_claims where family_id=s.family_id and revoked_at is null)
  from public.user_subscriptions s join addon_pro_before b using(family_id);

insert into addon_results values ('addon_requires_plan', pg_temp.order_error(4,111005,'ai_addon_monthly','addon_requires_plan'));
insert into public.user_subscriptions(family_id,user_id,plan,status,trial_ends_at) select family_id,owner_id,'trial','active',now()+interval '7 days' from addon_fixtures where n=4;
update addon_results set ok=ok and pg_temp.order_error(4,111006,'ai_addon_monthly','addon_requires_plan') where scenario='addon_requires_plan';

select pg_temp.buy(5,111007,'solo_monthly');
create temporary table addon_subscription_before as select s.* from public.user_subscriptions s join addon_fixtures f using(family_id) where f.n=5;
select pg_temp.buy(5,111008,'ai_addon_monthly');
select pg_temp.buy(5,111009,'ai_addon_monthly');
insert into addon_results select 'addon_extends',a.active_until=now()+interval '2 months' and to_jsonb(s)=to_jsonb(b)
  from public.family_addons a join public.user_subscriptions s using(family_id) join addon_subscription_before b using(family_id) where a.addon='ai';
insert into addon_results select 'addon_duplicate_webhook',public.process_payos_webhook(111009,29000,'KIDHABIT 111009','addon-test-111009','local','{}')='duplicate'
  and public.process_payos_webhook(111009,29000,'KIDHABIT 111009','another-reference','local','{}')='order_already_paid'
  and a.active_until=now()+interval '2 months' from public.family_addons a join addon_fixtures f using(family_id) where f.n=5;
select pg_temp.buy(5,111010,'pro_plus_monthly');
insert into addon_results select 'addon_then_pro_plus',public.family_ai_tier(family_id)='plus'
  and exists(select 1 from public.family_addons where family_id=f.family_id and addon='ai')
  and pg_temp.order_error(5,111011,'ai_addon_monthly','already_included') from addon_fixtures f where n=5;

select pg_temp.buy(6,111012,'printables');
insert into addon_results select 'printables_once',pg_temp.order_error(6,111013,'printables','already_owned')
  and exists(select 1 from public.family_addons where family_id=f.family_id and addon='printables' and active_until is null)
  and not exists(select 1 from public.user_subscriptions where family_id=f.family_id) from addon_fixtures f where n=6;
insert into addon_results select 'addon_no_commission_no_discount',
  (select count(*)=3 and bool_and(amount=case plan_id when 'ai_addon_monthly' then 29000 else 99000 end) from public.payment_orders where order_code in (111008,111009,111012))
  and not exists(select 1 from public.referral_commissions where order_code in (111008,111009,111012))
  and not exists(select 1 from public.launch_offer_claims where order_code in (111008,111009,111012));

select pg_temp.buy(7,111014,'yearly');
insert into addon_results select 'founding_tier',public.family_ai_tier(family_id)='plus' from addon_fixtures where n=7;
update public.user_subscriptions set subscription_ends_at=now()-interval '1 second' where family_id=(select family_id from addon_fixtures where n=7);
update addon_results set ok=ok and public.family_ai_tier((select family_id from addon_fixtures where n=7))='basic' where scenario='founding_tier';

-- Refund once, repeat the same resolution, and ensure the subscription is untouched.
create temporary table addon_refund_before as select s.* from public.user_subscriptions s join addon_fixtures f using(family_id) where n=5;
do $$
declare f addon_fixtures%rowtype; c uuid;
begin
  select * into f from addon_fixtures where n=5;
  insert into public.billing_support_cases(family_id,user_id,order_code,case_type,reason_code,created_by)
  values(f.family_id,f.owner_id,111009,'refund','other',f.owner_id) returning id into c;
  if public.admin_resolve_billing_case(c,'completed','manual_refund_confirmed',f.owner_id,'test')->>'code' <> 'updated' then raise exception 'AI refund failed'; end if;
  perform public.admin_resolve_billing_case(c,'completed','manual_refund_confirmed',f.owner_id,'test repeat');
  select * into f from addon_fixtures where n=6;
  insert into public.billing_support_cases(family_id,user_id,order_code,case_type,reason_code,created_by)
  values(f.family_id,f.owner_id,111012,'refund','other',f.owner_id) returning id into c;
  if public.admin_resolve_billing_case(c,'completed','manual_refund_confirmed',f.owner_id,'test')->>'code' <> 'updated' then raise exception 'printables refund failed'; end if;
end $$;
insert into addon_results select 'refund_revokes_addon',
  (select active_until=now()+interval '1 month' from public.family_addons a join addon_fixtures f using(family_id) where f.n=5 and a.addon='ai')
  and not exists(select 1 from public.family_addons a join addon_fixtures f using(family_id) where f.n=6)
  and (select to_jsonb(s)=to_jsonb(b) from public.user_subscriptions s join addon_refund_before b using(family_id));

-- Authenticated snapshot uses the caller's family and has the exact app contract.
select set_config('request.jwt.claim.sub',(select owner_id::text from addon_fixtures where n=5),true);
select set_config('test.family_id',(select family_id::text from addon_fixtures where n=5),true);
create temporary table addon_snapshot (value jsonb);
grant insert on addon_snapshot to authenticated;
set local role authenticated;
insert into addon_snapshot select public.family_addons_snapshot();
reset role;

insert into addon_results select 'snapshot_shape', value=jsonb_build_object('aiUntil',now()+interval '1 month','aiIncluded',true,'printables',false) from addon_snapshot;
select pg_temp.buy(8,111015,'solo_monthly');
select pg_temp.buy(9,111016,'solo_yearly');
select pg_temp.buy(10,111017,'monthly');
select pg_temp.buy(11,111018,'yearly');
insert into addon_results select 'regression_existing_plans',count(*)=4 and bool_and(s.status='active' and s.subscription_ends_at=now()+case when f.n in (9,11) then interval '1 year' else interval '1 month' end
  and s.plan=case f.n when 8 then 'solo_monthly' when 9 then 'solo_yearly' when 10 then 'monthly' else 'yearly' end)
  from public.user_subscriptions s join addon_fixtures f using(family_id) where f.n between 8 and 11;
-- Review regressions: reservation guards and founding benefits have independent expiry.
create function pg_temp.snapshot(n integer) returns jsonb language plpgsql as $$
declare f addon_fixtures%rowtype;
begin
  select * into f from addon_fixtures where addon_fixtures.n = snapshot.n;
  perform set_config('request.jwt.claim.sub',f.owner_id::text,true);
  perform set_config('test.family_id',f.family_id::text,true);
  return public.family_addons_snapshot();
end $$;

do $$
declare f addon_fixtures%rowtype; first_order record; reused record;
begin
  select * into f from addon_fixtures where n=12;
  select * into first_order from public.create_family_payment_order(f.family_id,f.owner_id,112001,'printables',now()+interval '15 minutes');
  select * into reused from public.create_family_payment_order(f.family_id,f.owner_id,112002,'printables',now()+interval '15 minutes');
  insert into addon_results values ('printables_pending_reused',first_order.amount=99000 and first_order.existing_order_code is null
    and reused.amount=99000 and reused.discount_bps=0 and reused.existing_order_code=112001
    and (select count(*)=1 from public.payment_orders where family_id=f.family_id and plan_id='printables'));
  -- A cancelled reservation must not block another purchase.
  update public.payment_orders set status='CANCELLED' where order_code=112001;
  select * into reused from public.create_family_payment_order(f.family_id,f.owner_id,112003,'printables',now()+interval '15 minutes');
  update addon_results set ok=ok and reused.existing_order_code is null where scenario='printables_pending_reused';
end $$;

select pg_temp.buy(13,112004,'yearly');
insert into addon_results select 'founding_already_included',public.family_ai_tier(family_id)='plus'
  and (pg_temp.snapshot(13)->>'aiIncluded')::boolean
  and pg_temp.order_error(13,112005,'ai_addon_monthly','already_included') from addon_fixtures where n=13;
-- Renewal keeps the subscription active beyond the founding year; it cannot renew the claim.
select pg_temp.buy(13,112006,'yearly');
update public.payment_orders set paid_at=now()-interval '1 year'+interval '1 second' where order_code=112004;
insert into addon_results select 'founding_expires_after_year',public.family_ai_tier(family_id)='plus'
  and (pg_temp.snapshot(13)->>'aiIncluded')::boolean from addon_fixtures where n=13;
-- At exactly the anniversary it is no longer included.
update public.payment_orders set paid_at=now()-interval '1 year' where order_code=112004;
update addon_results set ok=ok and public.family_ai_tier((select family_id from addon_fixtures where n=13))='basic'
  and not (pg_temp.snapshot(13)->>'aiIncluded')::boolean where scenario='founding_expires_after_year';
select pg_temp.buy(13,112007,'ai_addon_monthly');
update addon_results set ok=ok and public.family_ai_tier((select family_id from addon_fixtures where n=13))='plus'
  and not (pg_temp.snapshot(13)->>'aiIncluded')::boolean where scenario='founding_expires_after_year';

select pg_temp.buy(14,112008,'yearly');
update public.launch_offer_claims set revoked_at=now() where family_id=(select family_id from addon_fixtures where n=14);
insert into addon_results select 'founding_revoked_basic',public.family_ai_tier(family_id)='basic'
  and not (pg_temp.snapshot(14)->>'aiIncluded')::boolean from addon_fixtures where n=14;
select pg_temp.buy(14,112009,'ai_addon_monthly');
update addon_results set ok=ok and public.family_ai_tier((select family_id from addon_fixtures where n=14))='plus'
  and not (pg_temp.snapshot(14)->>'aiIncluded')::boolean where scenario='founding_revoked_basic';

select pg_temp.buy(15,112010,'pro_plus_monthly');
create temporary table addon_plus_before as select s.* from public.user_subscriptions s join addon_fixtures f using(family_id) where n=15;
select pg_temp.buy(15,112011,'pro_plus_yearly');
insert into addon_results select 'pro_plus_yearly_adds_year',s.plan='pro_plus_yearly'
  and s.subscription_ends_at=b.subscription_ends_at+interval '1 year' from public.user_subscriptions s join addon_plus_before b using(family_id);
insert into addon_results select 'pro_plus_yearly_prior_paid_no_discount',pg_temp.buy(15,112012,'pro_plus_yearly')=790000;
update addon_results set ok=ok and (select subscription_ends_at=now()+interval '1 month'+interval '2 years'
  from public.user_subscriptions s join addon_fixtures f using(family_id) where n=15) where scenario='pro_plus_yearly_adds_year';

do $$
declare f addon_fixtures%rowtype; reserved record; reused record;
begin
  select * into f from addon_fixtures where n=16;
  -- Pro Plus participates on both sides of the cross-yearly reservation lock.
  select * into reserved from public.create_family_payment_order(f.family_id,f.owner_id,112013,'pro_plus_yearly',now()+interval '15 minutes');
  select * into reused from public.create_family_payment_order(f.family_id,f.owner_id,112014,'yearly',now()+interval '15 minutes');
  insert into addon_results values ('pro_plus_yearly_pending_lock',reserved.amount=711000 and reserved.discount_bps=1000
    and reused.amount=711000 and reused.discount_bps=0 and reused.existing_order_code=112013
    and (select count(*)=1 from public.payment_orders where family_id=f.family_id));
  update public.payment_orders set status='CANCELLED' where order_code=112013;
  select * into reserved from public.create_family_payment_order(f.family_id,f.owner_id,112015,'solo_yearly',now()+interval '15 minutes');
  select * into reused from public.create_family_payment_order(f.family_id,f.owner_id,112016,'pro_plus_yearly',now()+interval '15 minutes');
  update addon_results set ok=ok and reserved.amount=359000 and reused.amount=359000
    and reused.discount_bps=0 and reused.existing_order_code=112015
    and not exists(select 1 from public.payment_orders where order_code in (112014,112016)) where scenario='pro_plus_yearly_pending_lock';
end $$;

insert into public.user_subscriptions(family_id,user_id,plan,status,subscription_ends_at)
  select family_id,owner_id,'monthly','active',now()-interval '1 second' from addon_fixtures where n=17;
insert into addon_results values ('addon_expired_plan_refused',pg_temp.order_error(17,112017,'ai_addon_monthly','addon_requires_plan'));
insert into public.user_subscriptions(family_id,user_id,plan,status,subscription_ends_at)
  select family_id,owner_id,'lifetime','active',null from addon_fixtures where n=18;
select pg_temp.buy(18,112018,'ai_addon_monthly');
insert into addon_results select 'addon_allowed_lifetime',(select amount=29000 from public.payment_orders where order_code=112018)
  and public.family_ai_tier(family_id)='plus' and not (pg_temp.snapshot(18)->>'aiIncluded')::boolean
  and (select plan='lifetime' and subscription_ends_at is null from public.user_subscriptions where family_id=f.family_id)
  from addon_fixtures f where n=18;

select pg_temp.buy(19,112019,'monthly');
insert into addon_results values ('higher_plan_active',
  pg_temp.order_error(1,112020,'yearly','higher_plan_active')
  and pg_temp.order_error(1,112021,'solo_yearly','higher_plan_active')
  and pg_temp.order_error(1,112022,'monthly','higher_plan_active')
  and pg_temp.order_error(1,112023,'solo_monthly','higher_plan_active')
  and pg_temp.order_error(19,112024,'solo_monthly','higher_plan_active')
  and pg_temp.order_error(19,112025,'solo_yearly','higher_plan_active'));
do $$
declare item text; code bigint := 112030;
begin
  foreach item in array array['solo_monthly','solo_yearly','monthly','yearly','pro_plus_monthly','pro_plus_yearly'] loop
    update addon_results set ok=ok and pg_temp.order_error(18,code,item,'higher_plan_active') where scenario='higher_plan_active';
    code := code+1;
  end loop;
end $$;
-- Printables remains purchasable on the same high-tier family.
select pg_temp.buy(1,112040,'printables');
update addon_results set ok=ok and not exists(select 1 from public.payment_orders where order_code between 112020 and 112035)
  where scenario='higher_plan_active';
-- An expired or inactive higher plan does not block a fresh lower plan purchase.
insert into public.user_subscriptions(family_id,user_id,plan,status,subscription_ends_at)
  select family_id,owner_id,'pro_plus_monthly','active',now()-interval '1 second' from addon_fixtures where n=20;
select pg_temp.buy(20,112041,'solo_monthly');
update addon_results set ok=ok and (select plan='solo_monthly' from public.user_subscriptions s join addon_fixtures f using(family_id) where n=20)
  where scenario='higher_plan_active';
insert into public.user_subscriptions(family_id,user_id,plan,status,subscription_ends_at)
  select family_id,owner_id,'pro_plus_monthly','cancelled',now()+interval '1 year' from addon_fixtures where n=21;
select pg_temp.buy(21,112042,'monthly');
update addon_results set ok=ok and (select plan='monthly' from public.user_subscriptions s join addon_fixtures f using(family_id) where n=21)
  where scenario='higher_plan_active';
select scenario,ok from addon_results order by scenario;
rollback;
