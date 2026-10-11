begin;

-- Add-ons are independent of subscription entitlements and readable only by family managers.
create table public.family_addons (
  family_id uuid references public.families(id) on delete cascade,
  addon text check (addon in ('ai', 'printables')),
  active_until timestamptz,
  source text not null check (source in ('purchase', 'admin')),
  last_order_code bigint,
  updated_at timestamptz not null default now(),
  primary key (family_id, addon)
);
alter table public.family_addons enable row level security;
alter table public.family_addons force row level security;
create policy family_addons_select_manager on public.family_addons
  for select to authenticated using (public.can_manage_family(family_id));
revoke all on table public.family_addons from public, anon, authenticated;
grant select on table public.family_addons to authenticated;
grant all on table public.family_addons to service_role;

create or replace function public.create_family_payment_order(
  target_family uuid, actor_id uuid, new_order_code bigint, selected_plan text, expires_at timestamptz
)
returns table(amount integer, discount_bps integer, existing_order_code bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  list_price integer;
  discount integer := 0;
  charged integer;
  pending public.payment_orders%rowtype;
  owner_id uuid;
  lock_user uuid;
begin
  list_price := case selected_plan
    when 'solo_monthly' then 49000 when 'solo_yearly' then 399000
    when 'monthly' then 69000 when 'yearly' then 590000
    when 'pro_plus_monthly' then 79000 when 'pro_plus_yearly' then 790000
    when 'ai_addon_monthly' then 29000 when 'printables' then 99000 end;
  if list_price is null then raise exception 'invalid_plan'; end if;
  select user_id into owner_id from public.family_memberships
  where family_id = target_family and role = 'owner' limit 1;
  -- Lock both attribution identities in a stable order: co-parent and owner payments must queue
  -- across every family the referred user owns, not just the family in this request.
  for lock_user in select distinct identity_id from unnest(array[actor_id, owner_id]) identity_id
    where identity_id is not null order by identity_id loop
    perform pg_advisory_xact_lock(hashtextextended('billing-checkout:' || lock_user::text, 0));
  end loop;
  perform 1 from public.families where id = target_family for update;
  if not found or not exists (
    select 1 from public.family_memberships where family_id = target_family and user_id = actor_id
      and role in ('owner', 'parent', 'guardian')
  ) then raise exception 'not_authorized'; end if;
  if selected_plan = 'ai_addon_monthly' then
    if exists (
      select 1 from public.user_subscriptions subscription
      where subscription.family_id = target_family and subscription.status = 'active'
        and (
          (subscription.plan in ('pro_plus_monthly', 'pro_plus_yearly')
            and (subscription.subscription_ends_at is null or subscription.subscription_ends_at > now()))
          or (
            (subscription.plan = 'lifetime'
              or (subscription.plan = 'trial' and subscription.trial_ends_at > now())
              or (subscription.plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly')
                and (subscription.subscription_ends_at is null or subscription.subscription_ends_at > now())))
            and exists (select 1 from public.launch_offer_claims claim
              join public.payment_orders claim_order on claim_order.order_code = claim.order_code
              where claim.family_id = target_family and claim.offer_code = 'pro_plus_founding' and claim.revoked_at is null
                and claim_order.paid_at + interval '1 year' > now())
          )
        )
    ) then raise exception 'already_included'; end if;
    if not exists (
      select 1 from public.user_subscriptions where family_id = target_family and status = 'active'
        and plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'lifetime')
        and (subscription_ends_at is null or subscription_ends_at > now())
    ) then raise exception 'addon_requires_plan'; end if;
  elsif selected_plan = 'printables' then
    if exists (
      select 1 from public.family_addons where family_id = target_family and addon = 'printables'
    ) then raise exception 'already_owned'; end if;
    -- The family lock serializes reservations across managers and tabs.
    select * into pending from public.payment_orders
    where family_id = target_family and plan_id = 'printables' and status = 'PENDING'
    order by created_at desc, order_code desc limit 1;
    if found then
      return query select pending.amount, 0, pending.order_code;
      return;
    end if;
  else
    -- Paid time may only be extended at the same rank or upgraded. Lifetime already
    -- includes permanent paid time, so no subscription order can add value to it.
    if exists (
      select 1 from public.user_subscriptions subscription
      where subscription.family_id = target_family and subscription.status = 'active'
        and subscription.plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'lifetime', 'pro_plus_monthly', 'pro_plus_yearly')
        and (subscription.subscription_ends_at is null or subscription.subscription_ends_at > now())
        and (subscription.plan = 'lifetime'
          or case
            when subscription.plan in ('solo_monthly', 'solo_yearly') then 1
            when subscription.plan in ('pro_plus_monthly', 'pro_plus_yearly') then 3
            else 2
          end > case
            when selected_plan in ('solo_monthly', 'solo_yearly') then 1
            when selected_plan in ('pro_plus_monthly', 'pro_plus_yearly') then 3
            else 2
          end)
    ) then raise exception 'higher_plan_active'; end if;
  end if;
  if selected_plan in ('yearly', 'solo_yearly', 'pro_plus_yearly') then
    -- One yearly link at a time also prevents a full-price link paying before the discounted link.
    select * into pending from public.payment_orders
    where (family_id = target_family or user_id in (actor_id, owner_id)
      or family_owner_user_id in (actor_id, owner_id) or exists (
      select 1 from public.family_memberships owner_membership
      where owner_membership.family_id = payment_orders.family_id
        and owner_membership.role = 'owner' and owner_membership.user_id in (actor_id, owner_id)
    ))
      and plan_id in ('yearly', 'solo_yearly', 'pro_plus_yearly') and status = 'PENDING'
    order by created_at desc, order_code desc limit 1;
    if found then
      return query select pending.amount, 0, pending.order_code;
      return;
    end if;
    discount := coalesce(public.referral_discount_bps(target_family, actor_id), 0);
  end if;
  charged := greatest(1, list_price - floor(list_price::numeric * discount / 10000)::integer);
  if discount > 0 then charged := greatest(1000, (charged / 1000) * 1000); end if;
  insert into public.payment_orders (order_code, family_id, user_id, family_owner_user_id, plan_id, amount, description, status, expires_at)
  values (new_order_code, target_family, actor_id, owner_id, selected_plan, charged,
    left('KIDHABIT ' || new_order_code::text, 25), 'PENDING', expires_at);
  return query select charged, discount, null::bigint;
end
$$;

create or replace function public.referral_discount_bps(target_family uuid, target_user uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  with eligible_users as (
    select target_user as user_id
    union
    select user_id from public.family_memberships where family_id = target_family and role = 'owner'
  )
  select case when settings.enabled and exists (
    select 1 from eligible_users eligible
    where exists (select 1 from public.referrals where referred_user_id = eligible.user_id)
      and not exists (select 1 from public.payment_orders payment_order
        where (payment_order.user_id = eligible.user_id or payment_order.family_owner_user_id = eligible.user_id or exists (
          select 1 from public.family_memberships owner_membership
          where owner_membership.family_id = payment_order.family_id
            and owner_membership.user_id = eligible.user_id and owner_membership.role = 'owner'
        ))
          and payment_order.status in ('PAID', 'PENDING')
          and payment_order.plan_id in ('yearly', 'solo_yearly', 'pro_plus_yearly'))
  )
    then settings.referred_discount_bps else 0 end
  from public.affiliate_settings settings where settings.singleton
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
  if target_order.plan_id not in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly', 'lifetime', 'ai_addon_monthly', 'printables') then return 'invalid_plan'; end if;

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

  -- The order and family locks make both settlement and refund updates serial.
  -- Duplicate checks above run before either add-on can extend an entitlement.
  if target_order.plan_id in ('ai_addon_monthly', 'printables') then
    insert into public.family_addons (family_id, addon, active_until, source, last_order_code)
    values (target_order.family_id,
      case when target_order.plan_id = 'ai_addon_monthly' then 'ai' else 'printables' end,
      case when target_order.plan_id = 'ai_addon_monthly' then now() + interval '1 month' end,
      'purchase', target_order.order_code)
    on conflict (family_id, addon) do update set
      active_until = case when excluded.addon = 'ai'
        then greatest(now(), public.family_addons.active_until) + interval '1 month' end,
      source = 'purchase', last_order_code = excluded.last_order_code, updated_at = now();
    update public.payment_orders
      set status = 'PAID', paid_at = now(), provider_reference = incoming_reference,
          payment_link_id = nullif(incoming_payment_link_id, ''), metadata = incoming_payload
    where id = target_order.id;
    return 'activated';
  end if;

  select * into current_subscription
  from public.user_subscriptions subscription
  where subscription.family_id = target_order.family_id
  for update;

  has_paid_time := found
    and current_subscription.status = 'active'
    and current_subscription.plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly')
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
    order_rank := case when target_order.plan_id in ('solo_monthly', 'solo_yearly') then 1 when target_order.plan_id in ('pro_plus_monthly', 'pro_plus_yearly') then 3 else 2 end;
    current_rank := case when has_paid_time then case when current_subscription.plan in ('solo_monthly', 'solo_yearly') then 1 when current_subscription.plan in ('pro_plus_monthly', 'pro_plus_yearly') then 3 else 2 end else 0 end;
    next_plan := case when current_rank > order_rank then current_subscription.plan else target_order.plan_id end;
    entitlement_end := case
        when has_paid_time then current_subscription.subscription_ends_at
        when has_trial_time then current_subscription.trial_ends_at
        else now()
      end + case when target_order.plan_id in ('yearly', 'solo_yearly', 'pro_plus_yearly') then interval '1 year' else interval '1 month' end;
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
    begin
      perform public.claim_launch_offer(target_order.family_id, target_order.order_code);
    exception when others then
      raise warning 'launch offer claim skipped for order %: %', target_order.order_code, sqlerrm;
    end;
  end if;

  perform public.accrue_referral_commission(target_order.order_code);

  return 'activated';
end
$$;

create or replace function public.accrue_referral_commission(target_order_code bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.affiliate_settings%rowtype;
  paid_order public.payment_orders%rowtype;
  referral public.referrals%rowtype;
  account public.affiliate_accounts%rowtype;
  account_created timestamptz;
  commission integer;
begin
  select * into settings from public.affiliate_settings where singleton;
  if not settings.enabled then return; end if;

  select * into paid_order from public.payment_orders where order_code = target_order_code and status = 'PAID';
  if not found or paid_order.family_id is null then return; end if;
  if paid_order.plan_id not in ('solo_yearly', 'yearly', 'lifetime', 'pro_plus_yearly') then return; end if;

  select attribution.* into referral
  from public.referrals attribution
  join public.family_memberships owner on owner.user_id = attribution.referred_user_id
    and owner.family_id = paid_order.family_id and owner.role = 'owner'
  order by attribution.created_at, attribution.id limit 1;
  if not found or referral.referrer_user_id is null then return; end if;

  select * into account from public.affiliate_accounts where user_id = referral.referrer_user_id;
  if not found or account.status <> 'active' then return; end if;

  if exists (
    select 1 from public.family_memberships membership
    where membership.user_id = referral.referrer_user_id and membership.family_id = paid_order.family_id
  ) then
    return;
  end if;

  select user_account.created_at into account_created from auth.users user_account where user_account.id = referral.referred_user_id;
  if account_created is null or account_created < now() - make_interval(days => settings.earning_window_days) then return; end if;

  commission := floor(paid_order.amount::numeric * settings.commission_bps / 10000)::integer;
  if commission <= 0 then return; end if;

  -- A case opened before settlement already disputes the order; carry its freeze onto the commission.
  insert into public.referral_commissions (referral_id, order_code, base_amount, rate_bps, amount, available_at, dispute_opened_at)
  values (referral.id, paid_order.order_code, paid_order.amount, settings.commission_bps, commission, now() + make_interval(days => settings.hold_days),
    (select min(support_case.created_at) from public.billing_support_cases support_case
     where support_case.order_code = paid_order.order_code and support_case.status in ('requested', 'reviewing', 'approved')))
  on conflict (order_code) do nothing;
exception when others then
  raise warning 'referral commission skipped for order %: %', target_order_code, sqlerrm;
end
$$;

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
          subscription.plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly')
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
            subscription.plan in ('monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly')
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
          or (subscription.plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly') and subscription.subscription_ends_at > now())))
$$;

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
  if next_plan not in ('free', 'trial', 'solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly', 'lifetime')
    or next_status not in ('active', 'inactive', 'cancelled') then raise exception 'invalid_subscription'; end if;
  insert into public.user_subscriptions (
    family_id, user_id, plan, status, subscription_ends_at, trial_ends_at, trial_consumed_at, updated_at
  ) values (
    target_family, owner_id, next_plan, next_status,
    case when next_plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly') then ends_at end,
    case when next_plan = 'trial' then ends_at end,
    coalesce(current_subscription.trial_consumed_at, case when next_plan = 'trial' then now() end), clock_timestamp()
  ) on conflict (family_id) do update set
    plan = excluded.plan, status = excluded.status, user_id = excluded.user_id,
    subscription_ends_at = excluded.subscription_ends_at, trial_ends_at = excluded.trial_ends_at,
    trial_consumed_at = excluded.trial_consumed_at, updated_at = excluded.updated_at;
  return 'updated';
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
    and current_subscription.plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly')
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
    -- Repeating a closed case's resolution must not deduct another month.
    if not (support_case.status = 'completed' and support_case.resolution_code = 'manual_refund_confirmed') then
      perform 1 from public.families where id = support_case.family_id for update;
      if payment_order.plan_id = 'ai_addon_monthly' then
        update public.family_addons set active_until = greatest(now(), active_until - interval '1 month'),
          updated_at = now() where family_id = support_case.family_id and addon = 'ai';
      elsif payment_order.plan_id = 'printables' then
        delete from public.family_addons where family_id = support_case.family_id and addon = 'printables';
      end if;
    end if;
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
    -- Same order -> family lock order as process_payos_webhook; the case update trigger below then
    -- re-locks an order this transaction already holds instead of waiting behind a webhook.
    perform 1 from public.payment_orders where order_code = support_case.order_code for update;
    perform 1 from public.families where id = support_case.family_id for update;
    update public.user_subscriptions set status = 'cancelled', updated_at = clock_timestamp() where family_id = support_case.family_id;
  end if;
  update public.billing_support_cases set status = next_status, resolution_code = next_resolution, assigned_to = actor_id,
    resolved_at = case when next_status in ('completed', 'rejected') then coalesce(resolved_at, now()) end,
    updated_at = clock_timestamp() where id = support_case.id;
  return jsonb_build_object('code', 'updated', 'referralCommission', referral_result, 'launchOfferClaim', launch_result);
end
$$;

-- Founding AI access ends at the original paid-year anniversary, even after renewal.
create or replace function public.family_ai_tier(target_family uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when exists (
    select 1 from public.user_subscriptions subscription
    where subscription.family_id = target_family and subscription.status = 'active'
      and (
        (subscription.plan in ('pro_plus_monthly', 'pro_plus_yearly')
          and (subscription.subscription_ends_at is null or subscription.subscription_ends_at > now()))
        or (
          (subscription.plan = 'lifetime'
            or (subscription.plan = 'trial' and subscription.trial_ends_at > now())
            or (subscription.plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly')
              and (subscription.subscription_ends_at is null or subscription.subscription_ends_at > now())))
          and exists (select 1 from public.launch_offer_claims claim
            join public.payment_orders claim_order on claim_order.order_code = claim.order_code
            where claim.family_id = target_family and claim.offer_code = 'pro_plus_founding' and claim.revoked_at is null
              and claim_order.paid_at + interval '1 year' > now())
        )
      )
  ) or exists (
    select 1 from public.family_addons where family_id = target_family and addon = 'ai' and active_until > now()
  ) then 'plus' else 'basic' end
$$;

create or replace function public.family_addons_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_family uuid := public.current_family_id();
  included boolean;
begin
  if target_family is null or not public.can_manage_family(target_family) then raise exception 'not_authorized'; end if;
  select exists (
    select 1 from public.user_subscriptions subscription
    where subscription.family_id = target_family and subscription.status = 'active'
      and (
        (subscription.plan in ('pro_plus_monthly', 'pro_plus_yearly')
          and (subscription.subscription_ends_at is null or subscription.subscription_ends_at > now()))
        or (
          (subscription.plan = 'lifetime'
            or (subscription.plan = 'trial' and subscription.trial_ends_at > now())
            or (subscription.plan in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly')
              and (subscription.subscription_ends_at is null or subscription.subscription_ends_at > now())))
          and exists (select 1 from public.launch_offer_claims claim
            join public.payment_orders claim_order on claim_order.order_code = claim.order_code
            where claim.family_id = target_family and claim.offer_code = 'pro_plus_founding' and claim.revoked_at is null
              and claim_order.paid_at + interval '1 year' > now())
        )
      )
  ) into included;
  return jsonb_build_object(
    'aiUntil', (select active_until from public.family_addons where family_id = target_family and addon = 'ai'),
    'aiIncluded', included,
    'printables', exists(select 1 from public.family_addons where family_id = target_family and addon = 'printables')
  );
end
$$;

revoke all on function public.create_family_payment_order(uuid, uuid, bigint, text, timestamptz) from public, anon, authenticated;
grant execute on function public.create_family_payment_order(uuid, uuid, bigint, text, timestamptz) to service_role;
revoke all on function public.accrue_referral_commission(bigint) from public, anon, authenticated;
grant execute on function public.accrue_referral_commission(bigint) to service_role;
revoke all on function public.referral_discount_bps(uuid, uuid) from public, anon, authenticated;
grant execute on function public.referral_discount_bps(uuid, uuid) to service_role;
revoke all on function public.referral_discount_bps(uuid) from public, anon, authenticated;
grant execute on function public.referral_discount_bps(uuid) to service_role;
revoke all on function public.activate_family_trial() from public;
grant execute on function public.activate_family_trial() to authenticated;
revoke all on function public.admin_update_family_subscription(uuid, text, text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_update_family_subscription(uuid, text, text, timestamptz, timestamptz) to service_role;
revoke execute on function public.redeem_family_coupon(text) from public, anon;
grant execute on function public.redeem_family_coupon(text) to authenticated;
revoke all on function public.admin_resolve_billing_case(uuid, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_resolve_billing_case(uuid, text, text, uuid, text) to service_role;
revoke all on function public.process_payos_webhook(bigint, integer, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.process_payos_webhook(bigint, integer, text, text, text, jsonb) to service_role;
revoke all on function public.family_has_pro_entitlement(uuid) from public;
grant execute on function public.family_has_pro_entitlement(uuid) to authenticated, service_role;
revoke all on function public.family_child_limit(uuid) from public;
grant execute on function public.family_child_limit(uuid) to authenticated, service_role;
revoke all on function public.admin_retention_snapshot() from public, anon, authenticated;
grant execute on function public.admin_retention_snapshot() to service_role;
revoke all on function public.admin_revoke_launch_offer_claim(bigint, text) from public, anon, authenticated;
grant execute on function public.admin_revoke_launch_offer_claim(bigint, text) to service_role;
revoke all on function public.family_ai_tier(uuid) from public, anon, authenticated;
grant execute on function public.family_ai_tier(uuid) to service_role;
revoke all on function public.family_addons_snapshot() from public, anon;
grant execute on function public.family_addons_snapshot() to authenticated;

commit;
