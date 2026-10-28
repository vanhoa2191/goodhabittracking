-- NOT auto-executed: run only against an authorized disposable fixture with the schema loaded.
-- Rolls back all fixture data. Source/PLpgSQL parsing alone is not runtime proof.
begin;
set local timezone = 'UTC';
create temporary table recovery_fixtures (n integer primary key, owner_id uuid, family_id uuid) on commit drop;
do $$
declare u uuid; f uuid;
begin
  for n in 1..8 loop
    u := gen_random_uuid(); f := gen_random_uuid();
    insert into auth.users(id,email) values(u,u::text || '@example.test');
    insert into public.families(id,created_by) values(f,u);
    insert into public.family_memberships(family_id,user_id,role) values(f,u,'owner');
    insert into recovery_fixtures values(n,u,f);
  end loop;
end $$;

-- Refund each plan, preserving a subsequent purchase; retry cannot deduct twice.
do $$
declare f recovery_fixtures%rowtype; item text; code bigint; c uuid; state jsonb; result jsonb;
begin
  for f in select * from recovery_fixtures where n <= 4 order by n loop
    item := (array['monthly','yearly','pro_plus_yearly_b1g1','lifetime'])[f.n];
    code := 927000 + f.n * 10;
    insert into public.payment_orders(order_code,family_id,user_id,plan_id,amount,description)
      values(code,f.family_id,f.owner_id,item,1000,'recovery-first');
    if public.process_payos_webhook(code,1000,'recovery-first','first-'||code,'local','{}') <> 'activated' then raise exception 'first settlement'; end if;
    insert into public.payment_orders(order_code,family_id,user_id,plan_id,amount,description)
      values(code+1,f.family_id,f.owner_id,'pro_plus_monthly',1000,'recovery-later');
    if public.process_payos_webhook(code+1,1000,'recovery-later','later-'||code,'local','{}') <> 'activated' then raise exception 'later settlement'; end if;
    insert into public.billing_support_cases(family_id,user_id,order_code,case_type,reason_code,created_by)
      values(f.family_id,f.owner_id,code,'refund','other',f.owner_id) returning id into c;
    result := public.admin_resolve_billing_case(c,'completed','manual_refund_confirmed',f.owner_id,'Verified local fixture');
    if result->>'code' <> 'updated' then raise exception 'refund %: %',item,result; end if;
    state := public.billing_subscription_state(f.family_id);
    if state->>'plan' <> 'pro_plus_monthly' or (state->>'subscription_ends_at')::timestamptz <> now()+interval '1 month' then
      raise exception 'refund removed another purchase for %: %',item,state;
    end if;
    perform public.admin_resolve_billing_case(c,'completed','manual_refund_confirmed',f.owner_id,'Retry');
    if public.billing_subscription_state(f.family_id) <> state then raise exception 'refund retry changed entitlement'; end if;
    if public.process_payos_webhook(code,1000,'recovery-first','first-'||code,'local','{}') <> 'duplicate'
      or public.billing_subscription_state(f.family_id) <> state then raise exception 'duplicate regranted refunded order'; end if;
  end loop;
end $$;

-- Unknown legacy provenance and external entitlement edits keep cases open.
do $$
declare f recovery_fixtures%rowtype; c uuid; result jsonb; before_state jsonb;
begin
  select * into f from recovery_fixtures where n=5;
  insert into public.user_subscriptions(family_id,user_id,plan,status,subscription_ends_at)
    values(f.family_id,f.owner_id,'yearly','active',now()+interval '2 years');
  insert into public.payment_orders(order_code,family_id,user_id,plan_id,amount,description,status,paid_at)
    values(927050,f.family_id,f.owner_id,'yearly',1000,'legacy','PAID',now());
  insert into public.billing_support_cases(family_id,user_id,order_code,case_type,reason_code,created_by)
    values(f.family_id,f.owner_id,927050,'refund','other',f.owner_id) returning id into c;
  before_state := public.billing_subscription_state(f.family_id);
  result := public.admin_resolve_billing_case(c,'completed','manual_refund_confirmed',f.owner_id,'Legacy');
  if result->>'code' <> 'subscription_grant_review_required' or public.billing_subscription_state(f.family_id) <> before_state
    or exists(select 1 from public.billing_support_cases where id=c and status='completed') then raise exception 'legacy refund was not held for review'; end if;
  select * into f from recovery_fixtures where n=8;
  insert into public.payment_orders(order_code,family_id,user_id,plan_id,amount,description)
    values(927080,f.family_id,f.owner_id,'monthly',1000,'externally-edited');
  perform public.process_payos_webhook(927080,1000,'externally-edited','external-927080','local','{}');
  update public.user_subscriptions set subscription_ends_at=subscription_ends_at+interval '3 days' where family_id=f.family_id;
  insert into public.billing_support_cases(family_id,user_id,order_code,case_type,reason_code,created_by)
    values(f.family_id,f.owner_id,927080,'refund','other',f.owner_id) returning id into c;
  before_state := public.billing_subscription_state(f.family_id);
  result := public.admin_resolve_billing_case(c,'completed','manual_refund_confirmed',f.owner_id,'External edit');
  if result->>'code' <> 'subscription_grant_review_required' or public.billing_subscription_state(f.family_id) <> before_state then raise exception 'external grant erased'; end if;
end $$;

-- Pending checkout blocks deletion; cancelled, ownerless late receipt remains actionable and deduped.
do $$
declare f recovery_fixtures%rowtype; blocked boolean := false;
begin
  select * into f from recovery_fixtures where n=6;
  insert into public.payment_orders(order_code,family_id,user_id,plan_id,amount,description)
    values(927060,f.family_id,f.owner_id,'monthly',1000,'late-order');
  perform set_config('request.jwt.claim.sub',f.owner_id::text,true);
  begin perform public.delete_owned_family('DELETE FAMILY');
  exception when others then if sqlerrm <> 'family_has_pending_payments' then raise; end if; blocked := true;
  end;
  if not blocked or not exists(select 1 from public.families where id=f.family_id) then raise exception 'pending deletion allowed'; end if;
  -- Fixture only: production cancellation must first be confirmed by the provider.
  update public.payment_orders set status='CANCELLED' where order_code=927060;
  perform public.delete_owned_family('DELETE FAMILY');
  if public.process_payos_webhook(927060,1000,'late-order','late-927060','local','{}') <> 'late_payment_recorded' then raise exception 'late receipt lost'; end if;
  perform public.process_payos_webhook(927060,1000,'late-order','late-927060','local','{}');
  if (select count(*) from public.billing_late_payments where order_code=927060 and status='needs_review') <> 1 then raise exception 'late receipt missing/duplicated'; end if;
  if public.process_payos_webhook(927060,2000,'late-order','invalid-late','local','{}') <> 'amount_mismatch'
    or exists(select 1 from public.billing_late_payments where provider_reference='invalid-late') then raise exception 'late amount validation skipped'; end if;
end $$;

-- A timed-out lease is quarantined; manual verified requeue issues a fresh fence.
do $$
declare f recovery_fixtures%rowtype; m uuid; token_a uuid; token_b uuid;
begin
  select * into f from recovery_fixtures where n=7;
  update public.lifecycle_outbox set status='suppressed' where status in ('pending','failed');
  insert into public.lifecycle_outbox(user_id,family_id,template_key,category,locale,payload,dedupe_key)
    values(f.owner_id,f.family_id,'welcome_setup','transactional','vi','{}','recovery-lease') returning id into m;
  select claim_token into token_a from public.claim_lifecycle_messages(100) where id=m;
  if token_a is null then raise exception 'claim token missing'; end if;
  update public.lifecycle_outbox set locked_at=now()-interval '11 minutes' where id=m;
  perform public.claim_lifecycle_messages(100);
  if not exists(select 1 from public.lifecycle_outbox where id=m and status='dead_letter' and last_error_code='delivery_uncertain') then raise exception 'uncertain lease auto-reclaimed'; end if;
  update public.lifecycle_outbox set status='pending',locked_at=null,available_at=now() where id=m;
  select claim_token into token_b from public.claim_lifecycle_messages(100) where id=m;
  if token_b is null or token_b=token_a then raise exception 'token reused'; end if;
  if public.finish_lifecycle_message(m,token_a,'failed',null,'old_worker') then raise exception 'stale worker overwrote new lease'; end if;
  if not public.finish_lifecycle_message(m,token_b,'sent','provider-new',null) then raise exception 'current worker could not finish'; end if;
  if public.finish_lifecycle_message(m,token_a,'sent','provider-old',null) then raise exception 'stale success overwrote current result'; end if;
end $$;
rollback;
