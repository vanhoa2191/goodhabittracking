begin;

-- Referral programme. A signed-in parent can enrol and get a code. A family that signs up through the
-- code is attributed once, and every verified payment it makes in its first year earns the referrer a
-- commission that is held until the refund window has passed. Payouts are requested by the referrer and
-- paid by hand by an admin. Nothing here exposes who was referred: the referrer sees counts and amounts.

create table if not exists public.affiliate_settings (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default true,
  commission_bps integer not null default 3000 check (commission_bps between 0 and 10000),
  attribution_days integer not null default 60 check (attribution_days between 1 and 365),
  earning_window_days integer not null default 365 check (earning_window_days between 1 and 3650),
  hold_days integer not null default 35 check (hold_days between 0 and 180),
  min_payout_vnd integer not null default 200000 check (min_payout_vnd >= 0),
  terms_version text not null default '2026-10-01',
  updated_at timestamptz not null default now()
);
insert into public.affiliate_settings (singleton) values (true) on conflict (singleton) do nothing;

create table if not exists public.affiliate_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  status text not null default 'active' check (status in ('active', 'suspended')),
  terms_version text not null,
  terms_accepted_at timestamptz not null default now(),
  payout_bank text check (payout_bank is null or char_length(payout_bank) between 2 and 80),
  payout_account_number text check (payout_account_number is null or payout_account_number ~ '^[0-9A-Za-z -]{4,30}$'),
  payout_account_name text check (payout_account_name is null or char_length(payout_account_name) between 2 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid references auth.users(id) on delete set null,
  referred_family_id uuid unique references public.families(id) on delete set null,
  referred_user_id uuid references auth.users(id) on delete set null,
  code text not null,
  created_at timestamptz not null default now()
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_user_id);

create table if not exists public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  amount integer not null check (amount > 0),
  status text not null default 'requested' check (status in ('requested', 'paid', 'rejected')),
  bank text not null,
  account_number text not null,
  account_name text not null,
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  reference text check (reference is null or char_length(reference) <= 120),
  note text check (note is null or char_length(note) <= 500)
);
create index if not exists affiliate_payouts_user_idx on public.affiliate_payouts (user_id, requested_at desc);
create index if not exists affiliate_payouts_status_idx on public.affiliate_payouts (status, requested_at);

create table if not exists public.referral_commissions (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id),
  order_code bigint not null unique,
  base_amount integer not null check (base_amount > 0),
  rate_bps integer not null check (rate_bps between 0 and 10000),
  amount integer not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'requested', 'paid', 'reversed')),
  available_at timestamptz not null,
  payout_id uuid references public.affiliate_payouts(id),
  reversed_at timestamptz,
  reverse_reason text check (reverse_reason is null or char_length(reverse_reason) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists referral_commissions_referral_idx on public.referral_commissions (referral_id);
create index if not exists referral_commissions_payout_idx on public.referral_commissions (payout_id);

alter table public.affiliate_settings enable row level security;
alter table public.affiliate_accounts enable row level security;
alter table public.referrals enable row level security;
alter table public.affiliate_payouts enable row level security;
alter table public.referral_commissions enable row level security;
alter table public.affiliate_settings force row level security;
alter table public.affiliate_accounts force row level security;
alter table public.referrals force row level security;
alter table public.affiliate_payouts force row level security;
alter table public.referral_commissions force row level security;
revoke all on public.affiliate_settings, public.affiliate_accounts, public.referrals,
  public.affiliate_payouts, public.referral_commissions from public, anon, authenticated;

-- Enrol the signed-in parent (idempotent) and return the code.
create or replace function public.affiliate_enroll(accept_terms boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  settings public.affiliate_settings%rowtype;
  existing public.affiliate_accounts%rowtype;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  attempt integer := 0;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  select * into settings from public.affiliate_settings where singleton;
  if not settings.enabled then raise exception 'affiliate_disabled'; end if;

  select * into existing from public.affiliate_accounts where user_id = actor;
  if found then return existing.code; end if;
  if accept_terms is distinct from true then raise exception 'terms_required'; end if;

  loop
    attempt := attempt + 1;
    candidate := '';
    for slot in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * 32)::integer, 1);
    end loop;
    begin
      insert into public.affiliate_accounts (user_id, code, terms_version)
      values (actor, candidate, settings.terms_version);
      return candidate;
    exception when unique_violation then
      if attempt >= 10 then raise exception 'code_generation_failed'; end if;
    end;
  end loop;
end
$$;

create or replace function public.affiliate_overview()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  settings public.affiliate_settings%rowtype;
  account public.affiliate_accounts%rowtype;
  held integer;
  available integer;
  requested integer;
  paid integer;
  signups integer;
  paying integer;
  recent jsonb;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  select * into settings from public.affiliate_settings where singleton;
  select * into account from public.affiliate_accounts where user_id = actor;
  if not found then
    return jsonb_build_object(
      'enrolled', false,
      'enabled', settings.enabled,
      'settings', jsonb_build_object(
        'commissionBps', settings.commission_bps,
        'attributionDays', settings.attribution_days,
        'earningWindowDays', settings.earning_window_days,
        'holdDays', settings.hold_days,
        'minPayout', settings.min_payout_vnd,
        'termsVersion', settings.terms_version
      )
    );
  end if;

  select
    coalesce(sum(commission.amount) filter (where commission.status = 'pending' and commission.available_at > now()), 0),
    coalesce(sum(commission.amount) filter (where commission.status = 'pending' and commission.available_at <= now()), 0),
    coalesce(sum(commission.amount) filter (where commission.status = 'requested'), 0),
    coalesce(sum(commission.amount) filter (where commission.status = 'paid'), 0),
    count(distinct commission.referral_id) filter (where commission.status <> 'reversed')
  into held, available, requested, paid, paying
  from public.referral_commissions commission
  join public.referrals referral on referral.id = commission.referral_id
  where referral.referrer_user_id = actor;

  select count(*) into signups from public.referrals where referrer_user_id = actor;

  select coalesce(jsonb_agg(row_to_json(entry)::jsonb order by entry."createdAt" desc), '[]'::jsonb) into recent
  from (
    select commission.created_at as "createdAt",
           commission.amount,
           case
             when commission.status = 'pending' and commission.available_at <= now() then 'available'
             else commission.status
           end as status,
           commission.available_at as "availableAt",
           payment_order.plan_id as "planId"
    from public.referral_commissions commission
    join public.referrals referral on referral.id = commission.referral_id
    left join public.payment_orders payment_order on payment_order.order_code = commission.order_code
    where referral.referrer_user_id = actor
    order by commission.created_at desc
    limit 20
  ) entry;

  return jsonb_build_object(
    'enrolled', true,
    'enabled', settings.enabled,
    'code', account.code,
    'status', account.status,
    'signups', signups,
    'paying', paying,
    'amounts', jsonb_build_object('held', held, 'available', available, 'requested', requested, 'paid', paid),
    'recent', recent,
    'payout', jsonb_build_object(
      'bank', account.payout_bank,
      'accountLast4', case when account.payout_account_number is null then null else right(account.payout_account_number, 4) end,
      'accountName', account.payout_account_name,
      'complete', account.payout_bank is not null and account.payout_account_number is not null and account.payout_account_name is not null
    ),
    'settings', jsonb_build_object(
      'commissionBps', settings.commission_bps,
      'attributionDays', settings.attribution_days,
      'earningWindowDays', settings.earning_window_days,
      'holdDays', settings.hold_days,
      'minPayout', settings.min_payout_vnd,
      'termsVersion', settings.terms_version
    )
  );
end
$$;

create or replace function public.affiliate_save_payout_details(bank text, account_number text, account_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  clean_bank text := trim(coalesce(bank, ''));
  clean_number text := trim(coalesce(account_number, ''));
  clean_name text := trim(coalesce(account_name, ''));
begin
  if actor is null then raise exception 'authentication_required'; end if;
  if char_length(clean_bank) not between 2 and 80
    or clean_number !~ '^[0-9A-Za-z -]{4,30}$'
    or char_length(clean_name) not between 2 and 80 then
    return jsonb_build_object('status', 'invalid_details');
  end if;
  update public.affiliate_accounts
  set payout_bank = clean_bank, payout_account_number = clean_number, payout_account_name = upper(clean_name)
  where user_id = actor;
  if not found then return jsonb_build_object('status', 'not_enrolled'); end if;
  return jsonb_build_object('status', 'saved');
end
$$;

-- Attribute the caller's family to a referral code. Only a family that is new enough, has not paid
-- yet and has no referrer can be attributed, and never to its own owner or family.
create or replace function public.claim_referral(referral_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_family uuid := public.current_family_id();
  settings public.affiliate_settings%rowtype;
  account public.affiliate_accounts%rowtype;
  family_created timestamptz;
begin
  if actor is null or actor_family is null then raise exception 'family_membership_required'; end if;
  select * into settings from public.affiliate_settings where singleton;
  if not settings.enabled then return 'disabled'; end if;

  select * into account from public.affiliate_accounts where code = upper(trim(coalesce(referral_code, '')));
  if not found or account.status <> 'active' then return 'invalid'; end if;
  if account.user_id = actor
    or exists (
      select 1 from public.family_memberships membership
      where membership.user_id = account.user_id and membership.family_id = actor_family
    ) then
    return 'self';
  end if;

  if exists (select 1 from public.referrals where referred_family_id = actor_family) then return 'already_referred'; end if;

  select family.created_at into family_created from public.families family where family.id = actor_family for update;
  if family_created is null or family_created < now() - make_interval(days => settings.attribution_days) then return 'expired'; end if;
  if exists (select 1 from public.payment_orders payment_order where payment_order.family_id = actor_family and payment_order.status = 'PAID') then
    return 'expired';
  end if;

  insert into public.referrals (referrer_user_id, referred_family_id, referred_user_id, code)
  values (account.user_id, actor_family, actor, account.code)
  on conflict (referred_family_id) do nothing;
  if not found then return 'already_referred'; end if;
  return 'claimed';
end
$$;

-- Move the commissions that have passed the hold into a payout request.
create or replace function public.request_affiliate_payout()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  settings public.affiliate_settings%rowtype;
  account public.affiliate_accounts%rowtype;
  total integer;
  new_payout_id uuid;
begin
  if actor is null then raise exception 'authentication_required'; end if;
  select * into settings from public.affiliate_settings where singleton;
  select * into account from public.affiliate_accounts where user_id = actor for update;
  if not found then return jsonb_build_object('status', 'not_enrolled'); end if;
  if account.status <> 'active' then return jsonb_build_object('status', 'suspended'); end if;
  if account.payout_bank is null or account.payout_account_number is null or account.payout_account_name is null then
    return jsonb_build_object('status', 'missing_details');
  end if;

  select coalesce(sum(commission.amount), 0) into total
  from public.referral_commissions commission
  join public.referrals referral on referral.id = commission.referral_id
  where referral.referrer_user_id = actor
    and commission.status = 'pending'
    and commission.available_at <= now();
  if total <= 0 or total < settings.min_payout_vnd then
    return jsonb_build_object('status', 'below_minimum', 'available', total, 'minimum', settings.min_payout_vnd);
  end if;

  insert into public.affiliate_payouts (user_id, amount, bank, account_number, account_name)
  values (actor, total, account.payout_bank, account.payout_account_number, account.payout_account_name)
  returning id into new_payout_id;

  update public.referral_commissions commission
  set status = 'requested', payout_id = new_payout_id
  from public.referrals referral
  where referral.id = commission.referral_id
    and referral.referrer_user_id = actor
    and commission.status = 'pending'
    and commission.available_at <= now();

  return jsonb_build_object('status', 'requested', 'amount', total);
end
$$;

-- Called from the payment settlement. A failure here must never undo a payment, so it only warns.
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
  family_created timestamptz;
  commission integer;
begin
  select * into settings from public.affiliate_settings where singleton;
  if not settings.enabled then return; end if;

  select * into paid_order from public.payment_orders where order_code = target_order_code and status = 'PAID';
  if not found or paid_order.family_id is null then return; end if;

  select * into referral from public.referrals where referred_family_id = paid_order.family_id;
  if not found or referral.referrer_user_id is null then return; end if;

  select * into account from public.affiliate_accounts where user_id = referral.referrer_user_id;
  if not found or account.status <> 'active' then return; end if;

  select family.created_at into family_created from public.families family where family.id = paid_order.family_id;
  if family_created is null or family_created < now() - make_interval(days => settings.earning_window_days) then return; end if;

  commission := floor(paid_order.amount * settings.commission_bps / 10000.0)::integer;
  if commission <= 0 then return; end if;

  insert into public.referral_commissions (referral_id, order_code, base_amount, rate_bps, amount, available_at)
  values (referral.id, paid_order.order_code, paid_order.amount, settings.commission_bps, commission, now() + make_interval(days => settings.hold_days))
  on conflict (order_code) do nothing;
exception when others then
  raise warning 'referral commission skipped for order %: %', target_order_code, sqlerrm;
end
$$;

-- The payment settlement, unchanged except that a paid order now accrues its referral commission.
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

  perform 1 from public.families family where family.id = target_order.family_id for update;

  select * into current_subscription
  from public.user_subscriptions subscription
  where subscription.family_id = target_order.family_id
  for update;

  has_paid_time := found
    and current_subscription.status = 'active'
    and current_subscription.plan in ('solo_monthly', 'monthly', 'yearly')
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
    order_rank := case target_order.plan_id when 'solo_monthly' then 1 else 2 end;
    current_rank := case when has_paid_time then case current_subscription.plan when 'solo_monthly' then 1 else 2 end else 0 end;
    next_plan := case when current_rank > order_rank then current_subscription.plan else target_order.plan_id end;
    entitlement_end := case
        when has_paid_time then current_subscription.subscription_ends_at
        when has_trial_time then current_subscription.trial_ends_at
        else now()
      end + case target_order.plan_id when 'yearly' then interval '1 year' else interval '1 month' end;
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

  perform public.accrue_referral_commission(target_order.order_code);

  return 'activated';
end
$$;

-- Admin side (service role only).
create or replace function public.admin_affiliate_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'affiliates', (select count(*) from public.affiliate_accounts),
    'referrals', (select count(*) from public.referrals),
    'owed', jsonb_build_object(
      'held', coalesce((select sum(amount) from public.referral_commissions where status = 'pending' and available_at > now()), 0),
      'available', coalesce((select sum(amount) from public.referral_commissions where status = 'pending' and available_at <= now()), 0),
      'requested', coalesce((select sum(amount) from public.referral_commissions where status = 'requested'), 0),
      'paid', coalesce((select sum(amount) from public.referral_commissions where status = 'paid'), 0)
    ),
    'payouts', coalesce((
      select jsonb_agg(row_to_json(payout)::jsonb order by payout."requestedAt")
      from (
        select affiliate_payout.id,
               affiliate_payout.amount,
               affiliate_payout.status,
               affiliate_payout.bank,
               affiliate_payout.account_number as "accountNumber",
               affiliate_payout.account_name as "accountName",
               affiliate_payout.requested_at as "requestedAt",
               affiliate_payout.resolved_at as "resolvedAt",
               affiliate_payout.reference
        from public.affiliate_payouts affiliate_payout
        where affiliate_payout.status = 'requested'
           or affiliate_payout.resolved_at > now() - interval '60 days'
        order by affiliate_payout.requested_at desc
        limit 100
      ) payout
    ), '[]'::jsonb)
  ) into result;
  return result;
end
$$;

create or replace function public.admin_resolve_affiliate_payout(
  target_payout_id uuid,
  resolution text,
  admin_user uuid,
  payout_reference text,
  payout_note text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  payout public.affiliate_payouts%rowtype;
begin
  if resolution not in ('paid', 'rejected') then raise exception 'invalid_resolution'; end if;
  select * into payout from public.affiliate_payouts where id = target_payout_id for update;
  if not found then return 'not_found'; end if;
  if payout.status <> 'requested' then return 'already_resolved'; end if;
  if resolution = 'paid' and coalesce(trim(payout_reference), '') = '' then return 'reference_required'; end if;

  update public.affiliate_payouts
  set status = resolution,
      resolved_at = now(),
      resolved_by = admin_user,
      reference = left(nullif(trim(coalesce(payout_reference, '')), ''), 120),
      note = left(nullif(trim(coalesce(payout_note, '')), ''), 500)
  where id = payout.id;

  if resolution = 'paid' then
    update public.referral_commissions set status = 'paid' where payout_id = payout.id and status = 'requested';
  else
    update public.referral_commissions set status = 'pending', payout_id = null where payout_id = payout.id and status = 'requested';
  end if;
  return resolution;
end
$$;

-- A refund takes the commission back while it is still held. Once it is in a payout the admin settles
-- it by rejecting that payout first; once paid it stays and is handled by hand.
create or replace function public.admin_reverse_referral_commission(target_order_code bigint, reason text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  commission public.referral_commissions%rowtype;
begin
  select * into commission from public.referral_commissions where order_code = target_order_code for update;
  if not found then return 'no_commission'; end if;
  if commission.status = 'reversed' then return 'already_reversed'; end if;
  if commission.status = 'requested' then return 'in_payout'; end if;
  if commission.status = 'paid' then return 'already_paid'; end if;
  update public.referral_commissions
  set status = 'reversed', reversed_at = now(), reverse_reason = left(coalesce(reason, ''), 300)
  where id = commission.id;
  return 'reversed';
end
$$;

revoke all on function public.affiliate_enroll(boolean) from public, anon;
revoke all on function public.affiliate_overview() from public, anon;
revoke all on function public.affiliate_save_payout_details(text, text, text) from public, anon;
revoke all on function public.claim_referral(text) from public, anon;
revoke all on function public.request_affiliate_payout() from public, anon;
grant execute on function public.affiliate_enroll(boolean) to authenticated;
grant execute on function public.affiliate_overview() to authenticated;
grant execute on function public.affiliate_save_payout_details(text, text, text) to authenticated;
grant execute on function public.claim_referral(text) to authenticated;
grant execute on function public.request_affiliate_payout() to authenticated;

revoke all on function public.accrue_referral_commission(bigint) from public, anon, authenticated;
revoke all on function public.process_payos_webhook(bigint, integer, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.admin_affiliate_overview() from public, anon, authenticated;
revoke all on function public.admin_resolve_affiliate_payout(uuid, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_reverse_referral_commission(bigint, text) from public, anon, authenticated;
grant execute on function public.accrue_referral_commission(bigint) to service_role;
grant execute on function public.process_payos_webhook(bigint, integer, text, text, text, jsonb) to service_role;
grant execute on function public.admin_affiliate_overview() to service_role;
grant execute on function public.admin_resolve_affiliate_payout(uuid, text, uuid, text, text) to service_role;
grant execute on function public.admin_reverse_referral_commission(bigint, text) to service_role;

commit;
