-- Disposable fixture only. Each scenario returns exactly one named boolean row.
begin;
create temporary table addon_fixtures (n integer primary key, owner_id uuid, family_id uuid) on commit drop;
create temporary table addon_results (scenario text primary key, ok boolean not null) on commit drop;
do $$
declare u uuid; f uuid; ref uuid := gen_random_uuid();
begin
  insert into auth.users(id) values (ref);
  insert into public.affiliate_accounts(user_id,code,terms_version) values (ref,'ZZZZZZZZ','2026-10-10');
  for n in 1..20 loop
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
select scenario,ok from addon_results order by scenario;
rollback;
