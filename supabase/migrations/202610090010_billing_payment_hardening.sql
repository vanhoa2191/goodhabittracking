begin;

create or replace function public.activate_family_trial()
returns table (
  plan text,
  status text,
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_family_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication_required';
  end if;

  select membership.family_id
    into actor_family_id
  from public.family_memberships membership
  where membership.user_id = actor_id
  order by membership.created_at
  limit 1;

  if actor_family_id is null then
    raise exception 'family_membership_required';
  end if;

  if not public.can_manage_family(actor_family_id) then raise exception 'not_authorized'; end if;
  perform 1 from public.families where id = actor_family_id for update;

  insert into public.user_subscriptions (
    family_id, user_id, plan, status, trial_ends_at, trial_consumed_at, updated_at
  ) values (
    actor_family_id, actor_id, 'trial', 'active', now() + interval '7 days', now(), now()
  )
  on conflict (family_id) do update
    set plan = 'trial',
        status = 'active',
        user_id = actor_id,
        trial_ends_at = now() + interval '7 days',
        trial_consumed_at = now(),
        subscription_ends_at = null,
        updated_at = now()
    where public.user_subscriptions.plan = 'free'
      and public.user_subscriptions.trial_consumed_at is null;

  if not found then
    raise exception 'trial_already_consumed_or_plan_active';
  end if;

  return query
  select subscription.plan,
         subscription.status,
         subscription.trial_ends_at,
         subscription.subscription_ends_at
  from public.user_subscriptions subscription
  where subscription.family_id = actor_family_id;
end
$$;

revoke all on function public.activate_family_trial() from public;
grant execute on function public.activate_family_trial() to authenticated;

create or replace function public.redeem_family_coupon(coupon_code text)
returns table(plan text, subscription_ends_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_family uuid := public.current_family_id();
  target public.coupons%rowtype;
  current_subscription public.user_subscriptions%rowtype;
  owner_id uuid;
  has_paid_time boolean;
  has_trial_time boolean;
  next_plan text;
  next_end timestamptz;
begin
  if actor is null or actor_family is null then raise exception 'not_authorized'; end if;
  if not public.can_manage_family(actor_family) then raise exception 'not_authorized'; end if;
  -- Concurrent guesses from one account queue here so the budget below cannot be raced past.
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));
  if (
    select count(*) from public.coupon_attempts attempt
    where attempt.user_id = actor and attempt.attempted_at > now() - interval '15 minutes'
  ) >= 10 then
    raise exception 'coupon_rate_limited';
  end if;
  delete from public.coupon_attempts attempt
  where attempt.user_id = actor and attempt.attempted_at < now() - interval '1 day';
  insert into public.coupon_attempts (user_id) values (actor);

  -- A refused code answers with an empty row instead of an error so the attempt above is kept.
  select * into target from public.coupons coupon
  where coupon.code = upper(trim(coupon_code))
    and coupon.active
    and (coupon.expires_at is null or coupon.expires_at > now())
  for update;
  if target.id is null or target.bonus_days is null then
    return query select null::text, null::timestamptz;
    return;
  end if;
  if target.max_redemptions is not null and target.redeemed_count >= target.max_redemptions then
    return query select null::text, null::timestamptz;
    return;
  end if;
  if exists (
    select 1 from public.coupon_redemptions redemption
    where redemption.coupon_id = target.id and redemption.family_id = actor_family
  ) then
    return query select null::text, null::timestamptz;
    return;
  end if;

  perform 1 from public.families family where family.id = actor_family for update;

  select * into current_subscription
  from public.user_subscriptions subscription
  where subscription.family_id = actor_family
  for update;

  if found and current_subscription.status = 'active' and current_subscription.plan = 'lifetime' then
    return query select null::text, null::timestamptz;
    return;
  end if;

  has_paid_time := found
    and current_subscription.status = 'active'
    and current_subscription.plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly')
    and current_subscription.subscription_ends_at > now();
  has_trial_time := found
    and current_subscription.status = 'active'
    and current_subscription.plan = 'trial'
    and current_subscription.trial_ends_at > now();

  select membership.user_id into owner_id
  from public.family_memberships membership
  where membership.family_id = actor_family and membership.role = 'owner'
  limit 1;

  next_plan := case when has_paid_time then current_subscription.plan else 'monthly' end;
  next_end := case
      when has_paid_time then current_subscription.subscription_ends_at
      when has_trial_time then current_subscription.trial_ends_at
      else now()
    end + make_interval(days => target.bonus_days);

  insert into public.user_subscriptions (family_id, user_id, plan, status, subscription_ends_at, updated_at)
  values (actor_family, owner_id, next_plan, 'active', next_end, now())
  on conflict (family_id) do update
    set plan = excluded.plan,
        status = 'active',
        subscription_ends_at = excluded.subscription_ends_at,
        updated_at = now();

  insert into public.coupon_redemptions (coupon_id, family_id, user_id)
  values (target.id, actor_family, actor);
  update public.coupons coupon set redeemed_count = coupon.redeemed_count + 1, updated_at = now()
  where coupon.id = target.id;

  return query select next_plan, next_end;
end
$$;

revoke execute on function public.redeem_family_coupon(text) from public, anon;
grant execute on function public.redeem_family_coupon(text) to authenticated;

-- User attribution survives deletion/recreation of a family. Check both user and family histories.
create or replace function public.referral_discount_bps(target_family uuid, target_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case when settings.enabled
    and exists (select 1 from public.referrals where referred_user_id = target_user)
    and not exists (select 1 from public.payment_orders payment_order
      where (payment_order.user_id = target_user or payment_order.family_id = target_family)
        and payment_order.status in ('PAID', 'PENDING')
        and payment_order.plan_id in ('yearly', 'solo_yearly'))
    then settings.referred_discount_bps else 0 end
  from public.affiliate_settings settings where settings.singleton
$$;
revoke all on function public.referral_discount_bps(uuid, uuid) from public, anon, authenticated;
grant execute on function public.referral_discount_bps(uuid, uuid) to service_role;

create or replace function public.referral_discount_bps(target_family uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select public.referral_discount_bps(target_family, (
    select user_id from public.family_memberships where family_id = target_family and role = 'owner' limit 1
  ))
$$;

revoke all on function public.referral_discount_bps(uuid) from public, anon, authenticated;
grant execute on function public.referral_discount_bps(uuid) to service_role;

-- The family lock is shared with settlement, coupons and trial activation, including the no-row case.
create or replace function public.admin_update_family_subscription(
  target_family uuid, next_plan text, next_status text, ends_at timestamptz, expected_updated_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_subscription public.user_subscriptions%rowtype;
  owner_id uuid;
begin
  perform 1 from public.families where id = target_family for update;
  if not found then return 'family_not_found'; end if;
  select user_id into owner_id from public.family_memberships where family_id = target_family and role = 'owner' limit 1;
  if owner_id is null then return 'family_not_found'; end if;
  select * into current_subscription from public.user_subscriptions where family_id = target_family for update;
  if current_subscription.updated_at is distinct from expected_updated_at then return 'subscription_changed'; end if;
  if next_plan not in ('free', 'trial', 'solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'lifetime')
    or next_status not in ('active', 'inactive', 'cancelled') then raise exception 'invalid_subscription'; end if;
  insert into public.user_subscriptions (
    family_id, user_id, plan, status, subscription_ends_at, trial_ends_at, trial_consumed_at, updated_at
  ) values (
    target_family, owner_id, next_plan, next_status,
    case when next_plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly') then ends_at end,
    case when next_plan = 'trial' then ends_at end,
    coalesce(current_subscription.trial_consumed_at, case when next_plan = 'trial' then now() end), clock_timestamp()
  ) on conflict (family_id) do update set
    plan = excluded.plan, status = excluded.status, user_id = excluded.user_id,
    subscription_ends_at = excluded.subscription_ends_at, trial_ends_at = excluded.trial_ends_at,
    trial_consumed_at = excluded.trial_consumed_at, updated_at = excluded.updated_at;
  return 'updated';
end
$$;
revoke all on function public.admin_update_family_subscription(uuid, text, text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_update_family_subscription(uuid, text, text, timestamptz, timestamptz) to service_role;

-- A pending yearly checkout reserves the first-year price until PayOS confirms payment or cancellation.
-- Local expiry alone never releases the reservation: an older provider link might still accept money.
create or replace function public.create_family_payment_order(
  target_family uuid, actor_id uuid, new_order_code bigint, selected_plan text, expires_at timestamptz
)
returns table(amount integer, discount_bps integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  list_price integer;
  discount integer := 0;
  charged integer;
begin
  list_price := case selected_plan
    when 'solo_monthly' then 39000 when 'solo_yearly' then 399000
    when 'monthly' then 59000 when 'yearly' then 590000 end;
  if list_price is null then raise exception 'invalid_plan'; end if;
  -- Serialize the same paying user across recreated/different families as well.
  perform pg_advisory_xact_lock(hashtextextended('billing-checkout:' || actor_id::text, 0));
  perform 1 from public.families where id = target_family for update;
  if not found or not exists (
    select 1 from public.family_memberships where family_id = target_family and user_id = actor_id
      and role in ('owner', 'parent', 'guardian')
  ) then raise exception 'not_authorized'; end if;
  if selected_plan in ('yearly', 'solo_yearly') then
    -- One yearly link at a time also prevents a full-price link paying before the discounted link.
    if exists (select 1 from public.payment_orders where (family_id = target_family or user_id = actor_id)
      and plan_id in ('yearly', 'solo_yearly') and status = 'PENDING') then
      raise exception 'yearly_checkout_pending';
    end if;
    discount := coalesce(public.referral_discount_bps(target_family, actor_id), 0);
  end if;
  charged := greatest(1, list_price - floor(list_price::numeric * discount / 10000)::integer);
  insert into public.payment_orders (order_code, family_id, user_id, plan_id, amount, description, status, expires_at)
  values (new_order_code, target_family, actor_id, selected_plan, charged,
    left('KIDHABIT ' || new_order_code::text, 25), 'PENDING', expires_at);
  return query select charged, discount;
end
$$;
revoke all on function public.create_family_payment_order(uuid, uuid, bigint, text, timestamptz) from public, anon, authenticated;
grant execute on function public.create_family_payment_order(uuid, uuid, bigint, text, timestamptz) to service_role;

create unique index billing_one_confirmed_refund_per_order on public.billing_support_cases(order_code)
where case_type = 'refund' and status = 'completed' and resolution_code = 'manual_refund_confirmed';

create or replace function public.admin_resolve_billing_case(
  target_case uuid, next_status text, next_resolution text, actor_id uuid, reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  support_case public.billing_support_cases%rowtype;
  payment_order public.payment_orders%rowtype;
  referral_result text;
  launch_result text;
begin
  select * into support_case from public.billing_support_cases where id = target_case for update;
  if not found then return jsonb_build_object('code', 'case_not_found'); end if;
  if next_status not in ('requested', 'reviewing', 'approved', 'rejected', 'completed')
    or (next_resolution is not null and next_resolution not in ('information_provided', 'payment_link_cancelled',
      'manual_refund_required', 'manual_refund_confirmed', 'not_eligible', 'subscription_cancelled')) then
    raise exception 'invalid_case_update';
  end if;
  if support_case.status in ('completed', 'rejected') and
    (next_status is distinct from support_case.status or next_resolution is distinct from support_case.resolution_code) then
    return jsonb_build_object('code', 'case_closed');
  end if;
  if support_case.case_type = 'refund' and next_status = 'completed' then
    if next_resolution is distinct from 'manual_refund_confirmed' then return jsonb_build_object('code', 'refund_not_confirmed'); end if;
    if support_case.order_code is null then return jsonb_build_object('code', 'refund_needs_order'); end if;
    -- Both cases for one order queue here before checking the confirmed-refund uniqueness.
    select * into payment_order from public.payment_orders
    where order_code = support_case.order_code and family_id = support_case.family_id for update;
    if payment_order.status is distinct from 'PAID' then return jsonb_build_object('code', 'refund_order_not_paid'); end if;
    if exists (select 1 from public.billing_support_cases where order_code = support_case.order_code
      and case_type = 'refund' and status = 'completed' and resolution_code = 'manual_refund_confirmed'
      and id <> support_case.id) then return jsonb_build_object('code', 'refund_already_confirmed'); end if;
    referral_result := public.admin_reverse_referral_commission(support_case.order_code, 'Refund confirmed (case ' || support_case.id::text || '): ' || reason);
    if referral_result is null or referral_result not in ('reversed', 'already_reversed', 'no_commission', 'in_payout', 'already_paid') then
      raise exception 'referral_reversal_failed';
    end if;
    perform public.admin_revoke_launch_offer_claim(support_case.order_code, reason);
    launch_result := case when exists (select 1 from public.launch_offer_claims
      where order_code = support_case.order_code and revoked_at is not null) then 'revoked' else 'not_found' end;
  elsif next_resolution = 'manual_refund_confirmed' then
    return jsonb_build_object('code', 'refund_not_confirmed');
  end if;
  if next_resolution = 'payment_link_cancelled' then
    if support_case.case_type <> 'cancellation' or not exists (select 1 from public.payment_orders
      where order_code = support_case.order_code and family_id = support_case.family_id and status = 'CANCELLED') then
      return jsonb_build_object('code', 'payment_not_cancelled');
    end if;
  end if;
  if next_resolution = 'subscription_cancelled' then
    if support_case.case_type <> 'cancellation' or next_status <> 'completed' then
      return jsonb_build_object('code', 'invalid_subscription_cancellation');
    end if;
    perform 1 from public.families where id = support_case.family_id for update;
    update public.user_subscriptions set status = 'cancelled', updated_at = clock_timestamp() where family_id = support_case.family_id;
  end if;
  update public.billing_support_cases set status = next_status, resolution_code = next_resolution, assigned_to = actor_id,
    resolved_at = case when next_status in ('completed', 'rejected') then coalesce(resolved_at, now()) end,
    updated_at = clock_timestamp() where id = support_case.id;
  return jsonb_build_object('code', 'updated', 'referralCommission', referral_result, 'launchOfferClaim', launch_result);
end
$$;
revoke all on function public.admin_resolve_billing_case(uuid, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_resolve_billing_case(uuid, text, text, uuid, text) to service_role;

commit;
