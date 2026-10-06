begin;

-- Only new child inserts use these limits; existing profiles remain untouched.
-- Launch claims are assigned at payment settlement, never when an order is created.
create table public.launch_offers (
  code text primary key,
  slots integer not null check (slots > 0),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

insert into public.launch_offers (code, slots) values ('pro_plus_founding', 10);

create table public.launch_offer_claims (
  offer_code text references public.launch_offers(code),
  family_id uuid not null,
  order_code bigint not null unique,
  claimed_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text
);

create unique index launch_offer_claims_active_family_unique
  on public.launch_offer_claims (offer_code, family_id) where revoked_at is null;

alter table public.launch_offers enable row level security;
alter table public.launch_offer_claims enable row level security;
alter table public.launch_offers force row level security;
alter table public.launch_offer_claims force row level security;
revoke all on public.launch_offers, public.launch_offer_claims from public, anon, authenticated;

create or replace function public.launch_offer_remaining(offer text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select case
      when offer_row.opened_at > now() or offer_row.closed_at <= now() then 0
      else greatest(0, offer_row.slots - (
        select count(*)::integer from public.launch_offer_claims claim
        where claim.offer_code = offer_row.code and claim.revoked_at is null
      ))
    end
    from public.launch_offers offer_row
    where offer_row.code = offer
  ), 0)
$$;

revoke all on function public.launch_offer_remaining(text) from public, anon, authenticated;
grant execute on function public.launch_offer_remaining(text) to anon, authenticated, service_role;

-- The offer row serialises eligibility checks and writes across all paying families.
create or replace function public.claim_launch_offer(target_family_id uuid, target_order_code bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  offer public.launch_offers%rowtype;
  claimed_slots integer;
begin
  select * into offer from public.launch_offers
  where code = 'pro_plus_founding'
  for update;

  if not found or offer.opened_at > now() or offer.closed_at <= now() then return; end if;
  select count(*) into claimed_slots from public.launch_offer_claims claim
  where claim.offer_code = offer.code and claim.revoked_at is null;
  if claimed_slots >= offer.slots then return; end if;
  if exists (
    select 1 from public.launch_offer_claims claim
    where claim.offer_code = offer.code and claim.family_id = target_family_id
  ) then return; end if;

  insert into public.launch_offer_claims (offer_code, family_id, order_code)
  values (offer.code, target_family_id, target_order_code);
end
$$;

revoke all on function public.claim_launch_offer(uuid, bigint) from public, anon, authenticated, service_role;

create or replace function public.admin_revoke_launch_offer_claim(target_order_code bigint, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_offer text;
begin
  select claim.offer_code into target_offer from public.launch_offer_claims claim
  where claim.order_code = target_order_code;
  if not found then return; end if;

  -- Revocation uses the same lock as settlement before releasing a slot.
  perform 1 from public.launch_offers where code = target_offer for update;
  update public.launch_offer_claims
  set revoked_at = now(), revoked_reason = reason
  where order_code = target_order_code and revoked_at is null;
end
$$;

revoke all on function public.admin_revoke_launch_offer_claim(bigint, text) from public, anon, authenticated;
grant execute on function public.admin_revoke_launch_offer_claim(bigint, text) to service_role;

create or replace function public.family_has_pro_entitlement(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_subscriptions subscription
    where subscription.family_id = target_family_id
      and subscription.status = 'active'
      and (
        subscription.plan = 'lifetime'
        or (subscription.plan = 'trial' and subscription.trial_ends_at > now())
        or (
          subscription.plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly')
          and subscription.subscription_ends_at > now()
        )
      )
  )
$$;

create or replace function public.family_child_limit(target_family_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1
      from public.user_subscriptions subscription
      where subscription.family_id = target_family_id
        and subscription.status = 'active'
        and subscription.plan = 'lifetime'
    ) then null
    when exists (
      select 1
      from public.user_subscriptions subscription
      where subscription.family_id = target_family_id
        and subscription.status = 'active'
        and (
          (subscription.plan = 'trial' and subscription.trial_ends_at > now())
          or (
            subscription.plan in ('monthly', 'yearly')
            and subscription.subscription_ends_at > now()
          )
        )
    ) then 5
    when exists (
      select 1
      from public.user_subscriptions subscription
      where subscription.family_id = target_family_id
        and subscription.status = 'active'
        and subscription.plan in ('solo_monthly', 'solo_yearly')
        and subscription.subscription_ends_at > now()
    ) then 1
    else 0
  end
$$;

create or replace function public.process_payos_webhook(
  incoming_order_code bigint,
  incoming_amount integer,
  incoming_description text,
  incoming_reference text,
  incoming_payment_link_id text,
  incoming_payload jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_order public.payment_orders%rowtype;
  current_subscription public.user_subscriptions%rowtype;
  has_paid_time boolean;
  has_trial_time boolean;
  current_rank integer;
  order_rank integer;
  next_plan text;
  entitlement_end timestamptz;
begin
  select * into target_order
  from public.payment_orders payment_order
  where payment_order.order_code = incoming_order_code
  for update;

  if not found then return 'order_not_found'; end if;
  if target_order.status = 'CANCELLED' then return 'order_cancelled'; end if;
  if target_order.amount <> incoming_amount then return 'amount_mismatch'; end if;
  if target_order.description <> incoming_description then return 'description_mismatch'; end if;
  if target_order.family_id is null or target_order.user_id is null then return 'owner_missing'; end if;
  if target_order.plan_id not in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'lifetime') then return 'invalid_plan'; end if;

  if target_order.status = 'PAID' then
    if target_order.provider_reference = incoming_reference then return 'duplicate'; end if;
    return 'order_already_paid';
  end if;

  insert into public.billing_webhook_events (
    provider, provider_reference, order_code, payload
  ) values (
    'payos', incoming_reference, incoming_order_code, incoming_payload
  ) on conflict (provider, provider_reference) do nothing;

  if not found then return 'duplicate'; end if;

  perform 1 from public.families family where family.id = target_order.family_id for update;

  select * into current_subscription
  from public.user_subscriptions subscription
  where subscription.family_id = target_order.family_id
  for update;

  has_paid_time := found
    and current_subscription.status = 'active'
    and current_subscription.plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly')
    and current_subscription.subscription_ends_at > now();
  has_trial_time := found
    and current_subscription.status = 'active'
    and current_subscription.plan = 'trial'
    and current_subscription.trial_ends_at > now();

  if target_order.plan_id = 'lifetime'
    or (found and current_subscription.status = 'active' and current_subscription.plan = 'lifetime') then
    next_plan := 'lifetime';
    entitlement_end := null;
  else
    order_rank := case when target_order.plan_id in ('solo_monthly', 'solo_yearly') then 1 else 2 end;
    current_rank := case when has_paid_time then case when current_subscription.plan in ('solo_monthly', 'solo_yearly') then 1 else 2 end else 0 end;
    next_plan := case when current_rank > order_rank then current_subscription.plan else target_order.plan_id end;
    entitlement_end := case
        when has_paid_time then current_subscription.subscription_ends_at
        when has_trial_time then current_subscription.trial_ends_at
        else now()
      end + case when target_order.plan_id in ('yearly', 'solo_yearly') then interval '1 year' else interval '1 month' end;
  end if;

  update public.payment_orders
    set status = 'PAID',
        paid_at = now(),
        provider_reference = incoming_reference,
        payment_link_id = nullif(incoming_payment_link_id, ''),
        metadata = incoming_payload
  where id = target_order.id;

  insert into public.user_subscriptions (
    family_id, user_id, plan, status, subscription_ends_at, trial_ends_at, updated_at
  ) values (
    target_order.family_id,
    target_order.user_id,
    next_plan,
    'active',
    entitlement_end,
    null,
    now()
  )
  on conflict (family_id) do update
    set user_id = excluded.user_id,
        plan = excluded.plan,
        status = 'active',
        subscription_ends_at = excluded.subscription_ends_at,
        trial_ends_at = null,
        updated_at = now();

  if target_order.plan_id = 'yearly' then
    perform public.claim_launch_offer(target_order.family_id, target_order.order_code);
  end if;

  perform public.accrue_referral_commission(target_order.order_code);

  return 'activated';
end
$$;

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

create or replace function public.admin_retention_snapshot()
returns table (
  families_total bigint,
  families_with_child bigint,
  active_last_7_days bigint,
  active_last_30_days bigint,
  paying_now bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.families),
    (select count(distinct child.family_id) from public.child_profiles child),
    (select count(distinct log.family_id) from public.activity_logs log
      where log.status in ('completed', 'approved') and log.log_date >= current_date - 6),
    (select count(distinct log.family_id) from public.activity_logs log
      where log.status in ('completed', 'approved') and log.log_date >= current_date - 29),
    (select count(*) from public.user_subscriptions subscription
      where subscription.status = 'active'
        and (subscription.plan = 'lifetime'
          or (subscription.plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly') and subscription.subscription_ends_at > now())))
$$;

revoke all on function public.family_has_pro_entitlement(uuid) from public;
grant execute on function public.family_has_pro_entitlement(uuid) to authenticated, service_role;

revoke all on function public.family_child_limit(uuid) from public;
grant execute on function public.family_child_limit(uuid) to authenticated, service_role;

revoke all on function public.process_payos_webhook(bigint, integer, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.process_payos_webhook(bigint, integer, text, text, text, jsonb) to service_role;

revoke execute on function public.redeem_family_coupon(text) from public, anon;
grant execute on function public.redeem_family_coupon(text) to authenticated;

revoke all on function public.admin_retention_snapshot() from public, anon, authenticated;
grant execute on function public.admin_retention_snapshot() to service_role;

commit;

