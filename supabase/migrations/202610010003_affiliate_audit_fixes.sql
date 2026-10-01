begin;

-- Only a family manager (owner, parent or guardian) may attribute the family to a referral code, also when
-- the database is called directly: a caregiver invited into the family cannot choose its referrer.
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
  if not public.can_manage_family(actor_family) then raise exception 'family_manager_required'; end if;
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
  family_created timestamptz;
begin
  if actor is null or actor_family is null then raise exception 'family_membership_required'; end if;
  select * into settings from public.affiliate_settings where singleton;
  if not settings.enabled then return 'disabled'; end if;
  if exists (select 1 from public.referrals where referred_family_id = actor_family) then return 'referred'; end if;
  if not public.can_manage_family(actor_family) then return 'closed'; end if;

  select family.created_at into family_created from public.families family where family.id = actor_family;
  if family_created is null or family_created < now() - make_interval(days => settings.attribution_days) then return 'closed'; end if;
  if exists (select 1 from public.payment_orders payment_order where payment_order.family_id = actor_family and payment_order.status = 'PAID') then
    return 'closed';
  end if;
  return 'eligible';
end
$$;

-- A withdrawal takes exactly the commissions it locked and totalled, so a rejection that returns older
-- commissions to pending at the same moment cannot add rows the payout amount does not cover.
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
  if account.payout_bank is null or account.payout_account_number is null or account.payout_account_name is null then
    return jsonb_build_object('status', 'missing_details');
  end if;
  if account.payout_details_changed_at is not null and account.payout_details_changed_at > now() - interval '24 hours' then
    return jsonb_build_object('status', 'details_recent');
  end if;

  select coalesce(sum(locked.amount), 0), coalesce(array_agg(locked.id), '{}')
  into total, chosen
  from (
    select commission.id, commission.amount
    from public.referral_commissions commission
    join public.referrals referral on referral.id = commission.referral_id
    where referral.referrer_user_id = target_user
      and commission.status = 'pending'
      and commission.available_at <= now()
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

-- One finance admin handles a payout at a time: the transfer happens outside the system, so the payout is
-- claimed before the money moves and nobody else can pay or reject it while the claim is fresh.
alter table public.affiliate_payouts
  add column if not exists processing_by uuid references auth.users(id) on delete set null,
  add column if not exists processing_at timestamptz;

create or replace function public.admin_claim_affiliate_payout(target_payout_id uuid, admin_user uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  payout public.affiliate_payouts%rowtype;
begin
  if admin_user is null then raise exception 'admin_required'; end if;
  select * into payout from public.affiliate_payouts where id = target_payout_id for update;
  if not found then return 'not_found'; end if;
  if payout.status <> 'requested' then return 'already_resolved'; end if;
  if payout.processing_by is not null and payout.processing_by <> admin_user
    and payout.processing_at > now() - interval '2 hours' then
    return 'taken';
  end if;
  update public.affiliate_payouts set processing_by = admin_user, processing_at = now() where id = payout.id;
  return 'claimed';
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
begin
  if resolution not in ('paid', 'rejected') then raise exception 'invalid_resolution'; end if;
  select * into payout from public.affiliate_payouts where id = target_payout_id for update;
  if not found then return 'not_found'; end if;
  if payout.status <> 'requested' then return 'already_resolved'; end if;
  if payout.processing_by is not null and payout.processing_by is distinct from admin_user
    and payout.processing_at > now() - interval '2 hours' then
    return 'claimed_by_other';
  end if;
  if resolution = 'paid' and (payout.processing_by is distinct from admin_user or payout.processing_at is null) then
    return 'claim_required';
  end if;
  if resolution = 'paid' and coalesce(trim(payout_reference), '') = '' then return 'reference_required'; end if;
  if resolution = 'paid' then
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
    update public.referral_commissions set status = 'pending', payout_id = null where payout_id = payout.id and status = 'requested';
  end if;
  return resolution;
end
$$;

-- Every waiting request is listed (never pushed out by newer history), and recent history is capped separately.
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
        (select affiliate_payout.id, affiliate_payout.amount, affiliate_payout.status, affiliate_payout.bank,
                affiliate_payout.account_number as "accountNumber", affiliate_payout.account_name as "accountName",
                affiliate_payout.requested_at as "requestedAt", affiliate_payout.resolved_at as "resolvedAt",
                affiliate_payout.reference,
                affiliate_payout.processing_by as "processingBy", affiliate_payout.processing_at as "processingAt"
         from public.affiliate_payouts affiliate_payout
         where affiliate_payout.status = 'requested')
        union all
        (select affiliate_payout.id, affiliate_payout.amount, affiliate_payout.status, affiliate_payout.bank,
                affiliate_payout.account_number, affiliate_payout.account_name,
                affiliate_payout.requested_at, affiliate_payout.resolved_at,
                affiliate_payout.reference, null::uuid, null::timestamptz
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

revoke all on function public.claim_referral(text) from public, anon;
grant execute on function public.claim_referral(text) to authenticated;
revoke all on function public.referral_claim_state() from public, anon;
grant execute on function public.referral_claim_state() to authenticated;
revoke all on function public.request_affiliate_payout(uuid) from public, anon, authenticated;
grant execute on function public.request_affiliate_payout(uuid) to service_role;
revoke all on function public.admin_claim_affiliate_payout(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_claim_affiliate_payout(uuid, uuid) to service_role;
revoke all on function public.admin_resolve_affiliate_payout(uuid, text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_resolve_affiliate_payout(uuid, text, uuid, text, text) to service_role;
revoke all on function public.admin_affiliate_overview() from public, anon, authenticated;
grant execute on function public.admin_affiliate_overview() to service_role;

commit;
