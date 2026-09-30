begin;

-- Payments and coupons add time on top of what the family already has, never replace it,
-- and never lower a plan. Coupon guesses are budgeted per account.

create table if not exists public.coupon_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index if not exists coupon_attempts_user_time_idx on public.coupon_attempts (user_id, attempted_at desc);
alter table public.coupon_attempts enable row level security;
alter table public.coupon_attempts force row level security;
revoke all on public.coupon_attempts from public, anon, authenticated;

alter table public.coupons
  add constraint coupons_code_min_length check (char_length(code) >= 8) not valid;

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
  if target_order.plan_id not in ('solo_monthly', 'monthly', 'yearly', 'lifetime') then return 'invalid_plan'; end if;

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

  select * into current_subscription
  from public.user_subscriptions subscription
  where subscription.family_id = target_order.family_id
  for update;

  has_paid_time := found
    and current_subscription.status = 'active'
    and current_subscription.plan in ('solo_monthly', 'monthly', 'yearly')
    and current_subscription.subscription_ends_at > now();

  if target_order.plan_id = 'lifetime'
    or (found and current_subscription.status = 'active' and current_subscription.plan = 'lifetime') then
    next_plan := 'lifetime';
    entitlement_end := null;
  else
    order_rank := case target_order.plan_id when 'solo_monthly' then 1 else 2 end;
    current_rank := case when has_paid_time then case current_subscription.plan when 'solo_monthly' then 1 else 2 end else 0 end;
    next_plan := case when current_rank > order_rank then current_subscription.plan else target_order.plan_id end;
    entitlement_end := case when has_paid_time then current_subscription.subscription_ends_at else now() end
      + case target_order.plan_id when 'yearly' then interval '1 year' else interval '1 month' end;
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
  next_plan text;
  next_end timestamptz;
begin
  if actor is null or actor_family is null then raise exception 'not_authorized'; end if;
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
    and current_subscription.plan in ('solo_monthly', 'monthly', 'yearly')
    and current_subscription.subscription_ends_at > now();

  select membership.user_id into owner_id
  from public.family_memberships membership
  where membership.family_id = actor_family and membership.role = 'owner'
  limit 1;

  next_plan := case when has_paid_time then current_subscription.plan else 'monthly' end;
  next_end := case when has_paid_time then current_subscription.subscription_ends_at else now() end
    + make_interval(days => target.bonus_days);

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

create or replace function public.enforce_family_child_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed_children integer;
begin
  -- Serialise concurrent inserts for one family so the count below cannot be raced past.
  perform 1 from public.families family where family.id = new.family_id for update;
  allowed_children := public.family_child_limit(new.family_id);
  if allowed_children is not null
    and (select count(*) from public.child_profiles child where child.family_id = new.family_id) >= allowed_children
  then
    raise exception 'child_limit_reached';
  end if;
  return new;
end
$$;

commit;
