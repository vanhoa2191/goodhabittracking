begin;

-- New commissions use the longer hold; existing available_at values are deliberately untouched.
alter table public.affiliate_settings alter column hold_days set default 40;
alter table public.affiliate_settings alter column terms_version set default '2026-10-09';
update public.affiliate_settings set hold_days = 40, terms_version = '2026-10-09', updated_at = now() where singleton;

-- Refund evidence survives deletion of the customer's family, account and support cases.
alter table public.referral_commissions add column refund_confirmed_at timestamptz;
update public.referral_commissions commission
set refund_confirmed_at = coalesce(support_case.resolved_at, support_case.updated_at, now()),
    reverse_reason = coalesce(commission.reverse_reason, 'manual_refund_confirmed'),
    status = case when commission.status = 'pending' then 'reversed' else commission.status end,
    reversed_at = case when commission.status = 'pending'
      then coalesce(support_case.resolved_at, support_case.updated_at, now()) else commission.reversed_at end
from public.billing_support_cases support_case
where support_case.order_code = commission.order_code
  and support_case.status = 'completed' and support_case.resolution_code = 'manual_refund_confirmed';

-- An open billing case freezes the commission on the commission itself: the case row cascades away
-- with the customer's family, so deleting the account must not make a disputed commission payable.
-- Only resolving the case without a refund clears it; a confirmed refund sets refund_confirmed_at.
alter table public.referral_commissions add column dispute_opened_at timestamptz;
update public.referral_commissions commission
set dispute_opened_at = opened.first_opened_at
from (
  select support_case.order_code, min(support_case.created_at) as first_opened_at
  from public.billing_support_cases support_case
  where support_case.order_code is not null and support_case.status in ('requested', 'reviewing', 'approved')
  group by support_case.order_code
) opened
where opened.order_code = commission.order_code and commission.dispute_opened_at is null;

-- Claims use an advisory lock on the referred owner, not a lock on GoTrue's auth.users.
-- Legacy duplicate rows remain intact; accrual uses the first account attribution.
create index referrals_referred_user_idx on public.referrals (referred_user_id, created_at, id);

-- Re-enrolment accepts the current terms without changing the referrer's code or earnings.
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
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(actor::text));
  select * into existing from public.affiliate_accounts where user_id = actor for update;
  if found and existing.terms_version = settings.terms_version then return existing.code; end if;
  if accept_terms is distinct from true then raise exception 'terms_required'; end if;
  if existing.user_id is not null then
    update public.affiliate_accounts set terms_version = settings.terms_version, terms_accepted_at = now()
    where user_id = actor;
    return existing.code;
  end if;
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

-- Both freezes are read from the durable commission record, never from the deletable case row.
create or replace function public.affiliate_commission_block_reason(target_order_code bigint)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when commission.refund_confirmed_at is not null then 'refund_confirmed'
    when commission.dispute_opened_at is not null then 'billing_case_open'
    else null
  end
  from public.referral_commissions commission
  where commission.order_code = target_order_code
$$;

-- Serialize support-case changes with payout eligibility/payment decisions without changing routes,
-- then persist the dispute freeze on the commission (order lock before commission lock).
-- Deleting a case (including the family cascade) deliberately leaves the freeze in place.
create or replace function public.lock_affiliate_billing_case_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    perform 1 from public.payment_orders where order_code = new.order_code for update;
  elsif TG_OP = 'DELETE' then
    perform 1 from public.payment_orders where order_code = old.order_code for update;
  else
    perform 1 from public.payment_orders where order_code in (old.order_code, new.order_code)
    order by order_code for update;
  end if;
  if TG_OP = 'DELETE' then return old; end if;
  if new.order_code is null then return new; end if;

  if new.status in ('requested', 'reviewing', 'approved') then
    update public.referral_commissions set dispute_opened_at = now()
    where order_code = new.order_code and dispute_opened_at is null;
  elsif TG_OP = 'UPDATE' and old.status in ('requested', 'reviewing', 'approved')
    and new.resolution_code is distinct from 'manual_refund_confirmed' then
    -- Resolved without a refund: release only when no other open case still disputes the order.
    update public.referral_commissions set dispute_opened_at = null
    where order_code = new.order_code and dispute_opened_at is not null
      and not exists (
        select 1 from public.billing_support_cases other_case
        where other_case.order_code = new.order_code and other_case.id <> new.id
          and other_case.status in ('requested', 'reviewing', 'approved')
      );
  end if;
  return new;
end
$$;
create trigger affiliate_billing_case_order_lock before insert or update or delete on public.billing_support_cases
for each row execute function public.lock_affiliate_billing_case_order();

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
  referred_actor uuid;
  account public.affiliate_accounts%rowtype;
  account_created timestamptz;
begin
  if actor is null or actor_family is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family) then raise exception 'family_manager_required'; end if;
  select * into settings from public.affiliate_settings where singleton;
  if not settings.enabled then return 'disabled'; end if;
  select membership.user_id into referred_actor from public.family_memberships membership
  where membership.family_id = actor_family and membership.role = 'owner';
  if referred_actor is null then raise exception 'family_owner_required'; end if;

  select * into account from public.affiliate_accounts where code = upper(trim(coalesce(referral_code, '')));
  if not found or account.status <> 'active' then return 'invalid'; end if;
  if account.user_id = referred_actor
    or exists (
      select 1 from public.family_memberships membership
      where membership.user_id = account.user_id and membership.family_id = actor_family
    ) then
    return 'self';
  end if;

  -- Serialize owner attribution even across deleted/recreated families.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(referred_actor::text));
  select user_account.created_at into account_created from auth.users user_account where user_account.id = referred_actor;
  if exists (select 1 from public.referrals where referred_user_id = referred_actor or referred_family_id = actor_family) then return 'already_referred'; end if;

  perform 1 from public.families family where family.id = actor_family for update;
  if account_created is null or account_created < now() - make_interval(days => settings.attribution_days) then return 'expired'; end if;
  if exists (
    select 1 from public.payment_orders payment_order
    join public.family_memberships owner on owner.family_id = payment_order.family_id and owner.role = 'owner'
    where owner.user_id = referred_actor and payment_order.status = 'PAID'
  ) then
    return 'expired';
  end if;

  insert into public.referrals (referrer_user_id, referred_family_id, referred_user_id, code)
  values (account.user_id, actor_family, referred_actor, account.code)
  on conflict do nothing;
  if not found then return 'already_referred'; end if;
  return 'claimed';
end
$$;

create or replace function public.referral_claim_state()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_family uuid := public.current_family_id();
  settings public.affiliate_settings%rowtype;
  referred_actor uuid;
  account_created timestamptz;
begin
  if actor is null or actor_family is null then raise exception 'family_membership_required'; end if;
  select * into settings from public.affiliate_settings where singleton;
  if not settings.enabled then return 'disabled'; end if;
  select membership.user_id into referred_actor from public.family_memberships membership
  where membership.family_id = actor_family and membership.role = 'owner';
  if exists (select 1 from public.referrals where referred_user_id = referred_actor or referred_family_id = actor_family) then return 'referred'; end if;
  if not public.can_manage_family(actor_family) then return 'closed'; end if;

  select user_account.created_at into account_created from auth.users user_account where user_account.id = referred_actor;
  if account_created is null or account_created < now() - make_interval(days => settings.attribution_days) then return 'closed'; end if;
  if exists (
    select 1 from public.payment_orders payment_order
    join public.family_memberships owner on owner.family_id = payment_order.family_id and owner.role = 'owner'
    where owner.user_id = referred_actor and payment_order.status = 'PAID'
  ) then
    return 'closed';
  end if;
  return 'eligible';
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

create or replace function public.request_affiliate_payout(target_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.affiliate_settings%rowtype;
  account public.affiliate_accounts%rowtype;
  total bigint;
  chosen uuid[];
  new_payout_id uuid;
begin
  if target_user is null then raise exception 'authentication_required'; end if;
  select * into settings from public.affiliate_settings where singleton;
  select * into account from public.affiliate_accounts where user_id = target_user for update;
  if not found then return jsonb_build_object('status', 'not_enrolled'); end if;
  if account.status <> 'active' then return jsonb_build_object('status', 'suspended'); end if;
  if account.terms_version <> settings.terms_version then return jsonb_build_object('status', 'terms_required'); end if;
  if account.payout_bank is null or account.payout_account_number is null or account.payout_account_name is null then
    return jsonb_build_object('status', 'missing_details');
  end if;
  if account.payout_details_changed_at is not null and account.payout_details_changed_at > now() - interval '24 hours' then
    return jsonb_build_object('status', 'details_recent');
  end if;

  -- Case creation/update takes the same order lock. Check eligibility only after acquiring it.
  perform payment_order.order_code
  from public.payment_orders payment_order
  join public.referral_commissions commission on commission.order_code = payment_order.order_code
  join public.referrals referral on referral.id = commission.referral_id
  where referral.referrer_user_id = target_user and commission.status = 'pending' and commission.available_at <= now()
  order by payment_order.order_code
  for update of payment_order;

  select coalesce(sum(locked.amount), 0), coalesce(array_agg(locked.id), '{}')
  into total, chosen
  from (
    select commission.id, commission.amount
    from public.referral_commissions commission
    join public.referrals referral on referral.id = commission.referral_id
    where referral.referrer_user_id = target_user
      and commission.status = 'pending'
      and commission.available_at <= now()
      and public.affiliate_commission_block_reason(commission.order_code) is null
    for update of commission
  ) locked;
  if total <= 0 or total < settings.min_payout_vnd then
    return jsonb_build_object('status', 'below_minimum', 'available', total, 'minimum', settings.min_payout_vnd);
  end if;
  if total > 2000000000 then
    return jsonb_build_object('status', 'amount_too_large');
  end if;

  insert into public.affiliate_payouts (user_id, amount, bank, account_number, account_name)
  values (target_user, total::integer, account.payout_bank, account.payout_account_number, account.payout_account_name)
  returning id into new_payout_id;

  update public.referral_commissions
  set status = 'requested', payout_id = new_payout_id
  where id = any(chosen);

  return jsonb_build_object('status', 'requested', 'amount', total);
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
  attached bigint;
  block_reason text;
begin
  if resolution not in ('paid', 'rejected') then raise exception 'invalid_resolution'; end if;
  select * into payout from public.affiliate_payouts where id = target_payout_id for update;
  if not found then return 'not_found'; end if;
  if payout.status <> 'requested' then return 'already_resolved'; end if;
  if payout.processing_by is not null and payout.processing_by is distinct from admin_user
    and payout.processing_at > now() - interval '2 hours' then
    return 'claimed_by_other';
  end if;
  -- Paying needs a claim that is still fresh: an expired claim means somebody else may have taken over and paid.
  if resolution = 'paid' and (
    payout.processing_by is distinct from admin_user
    or payout.processing_at is null
    or payout.processing_at <= now() - interval '2 hours'
  ) then
    return 'claim_required';
  end if;
  if resolution = 'paid' and coalesce(trim(payout_reference), '') = '' then return 'reference_required'; end if;
  if resolution = 'paid' then
    perform payment_order.order_code
    from public.payment_orders payment_order
    join public.referral_commissions commission on commission.order_code = payment_order.order_code
    where commission.payout_id = payout.id and commission.status = 'requested'
    order by payment_order.order_code
    for update of payment_order;

    select public.affiliate_commission_block_reason(commission.order_code) into block_reason
    from public.referral_commissions commission
    where commission.payout_id = payout.id and commission.status = 'requested'
      and public.affiliate_commission_block_reason(commission.order_code) is not null
    limit 1;
    if block_reason is not null then return block_reason; end if;

    select coalesce(sum(commission.amount), 0) into attached
    from public.referral_commissions commission
    where commission.payout_id = payout.id and commission.status = 'requested';
    if attached <> payout.amount then return 'amount_mismatch'; end if;
  end if;

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
    update public.referral_commissions
    set status = case when refund_confirmed_at is not null then 'reversed' else 'pending' end,
        reversed_at = case when refund_confirmed_at is not null then now() else reversed_at end,
        payout_id = null
    where payout_id = payout.id and status = 'requested';
  end if;
  return resolution;
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
    coalesce(sum(commission.amount) filter (where commission.status = 'pending' and (commission.available_at > now() or public.affiliate_commission_block_reason(commission.order_code) is not null)), 0),
    coalesce(sum(commission.amount) filter (where commission.status = 'pending' and commission.available_at <= now() and public.affiliate_commission_block_reason(commission.order_code) is null), 0),
    coalesce(sum(commission.amount) filter (where commission.status = 'requested'), 0),
    coalesce(sum(commission.amount) filter (where commission.status = 'paid'), 0),
    count(distinct commission.referral_id)
  into held, available, requested, paid, paying
  from public.referral_commissions commission
  join public.referrals referral on referral.id = commission.referral_id
  where referral.referrer_user_id = actor;

  select count(*) into signups from public.referrals where referrer_user_id = actor;

  return jsonb_build_object(
    'enrolled', true,
    'enabled', settings.enabled,
    'code', account.code,
    'status', account.status,
    'termsAccepted', account.terms_version = settings.terms_version,
    'signups', signups,
    'paying', paying,
    'amounts', jsonb_build_object('held', held, 'available', available, 'requested', requested, 'paid', paid),
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
      'held', coalesce((select sum(amount) from public.referral_commissions where status = 'pending' and (available_at > now() or public.affiliate_commission_block_reason(order_code) is not null)), 0),
      'available', coalesce((select sum(amount) from public.referral_commissions where status = 'pending' and available_at <= now() and public.affiliate_commission_block_reason(order_code) is null), 0),
      'requested', coalesce((select sum(amount) from public.referral_commissions where status = 'requested'), 0),
      'paid', coalesce((select sum(amount) from public.referral_commissions where status = 'paid'), 0)
    ),
    'payouts', coalesce((
      select jsonb_agg(row_to_json(payout)::jsonb order by payout."requestedAt")
      from (
        (select affiliate_payout.id, affiliate_payout.amount, affiliate_payout.status, affiliate_payout.bank,
                affiliate_payout.account_number as "accountNumber", affiliate_payout.account_name as "accountName",
                affiliate_payout.requested_at as "requestedAt", affiliate_payout.resolved_at as "resolvedAt",
                affiliate_payout.reference,
                affiliate_payout.processing_by as "processingBy", affiliate_payout.processing_at as "processingAt",
                exists (select 1 from public.referral_commissions commission
                        where commission.payout_id = affiliate_payout.id
                          and public.affiliate_commission_block_reason(commission.order_code) is not null) as blocked,
                array(select commission.order_code from public.referral_commissions commission
                      where commission.payout_id = affiliate_payout.id
                        and public.affiliate_commission_block_reason(commission.order_code) is not null
                      order by commission.order_code) as "blockedOrderCodes"
         from public.affiliate_payouts affiliate_payout
         where affiliate_payout.status = 'requested')
        union all
        (select affiliate_payout.id, affiliate_payout.amount, affiliate_payout.status, affiliate_payout.bank,
                affiliate_payout.account_number, affiliate_payout.account_name,
                affiliate_payout.requested_at, affiliate_payout.resolved_at,
                affiliate_payout.reference, null::uuid, null::timestamptz, false, array[]::bigint[]
         from public.affiliate_payouts affiliate_payout
         where affiliate_payout.status <> 'requested' and affiliate_payout.resolved_at > now() - interval '60 days'
         order by affiliate_payout.resolved_at desc
         limit 50)
      ) payout
    ), '[]'::jsonb)
  ) into result;
  return result;
end
$$;

-- Reversal follows the payout/case order-to-commission lock order, including when service callers
-- invoke reversal and a case update in the same transaction.
create or replace function public.admin_reverse_referral_commission(target_order_code bigint, reason text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  commission public.referral_commissions%rowtype;
begin
  perform 1 from public.payment_orders where order_code = target_order_code for update;
  select * into commission from public.referral_commissions where order_code = target_order_code for update;
  if not found then return 'no_commission'; end if;
  if commission.status = 'reversed' then return 'already_reversed'; end if;
  update public.referral_commissions
  set refund_confirmed_at = coalesce(refund_confirmed_at, now()),
      reverse_reason = left(coalesce(reason, ''), 300)
  where id = commission.id;
  if commission.status = 'requested' then return 'in_payout'; end if;
  if commission.status = 'paid' then return 'already_paid'; end if;
  update public.referral_commissions
  set status = 'reversed', reversed_at = now(), reverse_reason = left(coalesce(reason, ''), 300)
  where id = commission.id;
  return 'reversed';
end
$$;

revoke all on function public.affiliate_enroll(boolean) from public, anon;
grant execute on function public.affiliate_enroll(boolean) to authenticated;
revoke all on function public.claim_referral(text) from public, anon;
grant execute on function public.claim_referral(text) to authenticated;
revoke all on function public.referral_claim_state() from public, anon;
grant execute on function public.referral_claim_state() to authenticated;
revoke all on function public.affiliate_overview() from public, anon;
grant execute on function public.affiliate_overview() to authenticated;
revoke all on function public.affiliate_commission_block_reason(bigint) from public, anon, authenticated;
grant execute on function public.affiliate_commission_block_reason(bigint) to service_role;
revoke all on function public.lock_affiliate_billing_case_order() from public, anon, authenticated;
grant execute on function public.lock_affiliate_billing_case_order() to service_role;
revoke all on function public.accrue_referral_commission(bigint) from public, anon, authenticated;
grant execute on function public.accrue_referral_commission(bigint) to service_role;
revoke all on function public.request_affiliate_payout(uuid) from public, anon, authenticated;
grant execute on function public.request_affiliate_payout(uuid) to service_role;
revoke all on function public.admin_resolve_affiliate_payout(uuid, text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_resolve_affiliate_payout(uuid, text, uuid, text, text) to service_role;
revoke all on function public.admin_affiliate_overview() from public, anon, authenticated;
grant execute on function public.admin_affiliate_overview() to service_role;
revoke all on function public.admin_reverse_referral_commission(bigint, text) from public, anon, authenticated;
grant execute on function public.admin_reverse_referral_commission(bigint, text) to service_role;

commit;
