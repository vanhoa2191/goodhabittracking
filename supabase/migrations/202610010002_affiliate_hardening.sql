begin;

-- Payout controls move behind the server: the parent PIN is checked in the route, so the database
-- functions that move money accept only the service role and take the user id explicitly.
alter table public.affiliate_accounts
  add column if not exists payout_details_changed_at timestamptz;

drop function if exists public.affiliate_save_payout_details(text, text, text);
drop function if exists public.request_affiliate_payout();

create or replace function public.affiliate_save_payout_details(target_user uuid, bank text, account_number text, account_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_bank text := trim(coalesce(bank, ''));
  clean_number text := trim(coalesce(account_number, ''));
  clean_name text := trim(coalesce(account_name, ''));
begin
  if target_user is null then raise exception 'authentication_required'; end if;
  if char_length(clean_bank) not between 2 and 80
    or clean_number !~ '^[0-9A-Za-z -]{4,30}$'
    or char_length(clean_name) not between 2 and 80 then
    return jsonb_build_object('status', 'invalid_details');
  end if;
  update public.affiliate_accounts
  set payout_bank = clean_bank,
      payout_account_number = clean_number,
      payout_account_name = upper(clean_name),
      payout_details_changed_at = now()
  where user_id = target_user;
  if not found then return jsonb_build_object('status', 'not_enrolled'); end if;
  return jsonb_build_object('status', 'saved');
end
$$;

-- Moves the commissions that have passed the hold into one payout request. The rows are locked first,
-- so a refund reversing one of them at the same moment cannot leave the payout larger than its commissions.
create or replace function public.request_affiliate_payout(target_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.affiliate_settings%rowtype;
  account public.affiliate_accounts%rowtype;
  total integer;
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
  -- A bank account changed in the last day cannot receive a payout yet, so a hijacked session cannot
  -- redirect money before the owner notices.
  if account.payout_details_changed_at is not null and account.payout_details_changed_at > now() - interval '24 hours' then
    return jsonb_build_object('status', 'details_recent');
  end if;

  select coalesce(sum(locked.amount), 0) into total
  from (
    select commission.amount
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

  insert into public.affiliate_payouts (user_id, amount, bank, account_number, account_name)
  values (target_user, total, account.payout_bank, account.payout_account_number, account.payout_account_name)
  returning id into new_payout_id;

  update public.referral_commissions commission
  set status = 'requested', payout_id = new_payout_id
  from public.referrals referral
  where referral.id = commission.referral_id
    and referral.referrer_user_id = target_user
    and commission.status = 'pending'
    and commission.available_at <= now();

  return jsonb_build_object('status', 'requested', 'amount', total);
end
$$;

-- A payout is only marked paid when the commissions still attached to it add up to the amount the
-- admin was asked to transfer.
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
  attached integer;
begin
  if resolution not in ('paid', 'rejected') then raise exception 'invalid_resolution'; end if;
  select * into payout from public.affiliate_payouts where id = target_payout_id for update;
  if not found then return 'not_found'; end if;
  if payout.status <> 'requested' then return 'already_resolved'; end if;
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

-- Enrolment keeps working when two requests arrive together: the second finds the account the first made.
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
      select * into existing from public.affiliate_accounts where user_id = actor;
      if found then return existing.code; end if;
      if attempt >= 10 then raise exception 'code_generation_failed'; end if;
    end;
  end loop;
end
$$;

-- The commission is computed in numeric so a large order or a promotional rate cannot overflow, and it is
-- never earned on a family the referrer has since joined.
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

  if exists (
    select 1 from public.family_memberships membership
    where membership.user_id = referral.referrer_user_id and membership.family_id = paid_order.family_id
  ) then
    return;
  end if;

  select family.created_at into family_created from public.families family where family.id = paid_order.family_id;
  if family_created is null or family_created < now() - make_interval(days => settings.earning_window_days) then return; end if;

  commission := floor(paid_order.amount::numeric * settings.commission_bps / 10000)::integer;
  if commission <= 0 then return; end if;

  insert into public.referral_commissions (referral_id, order_code, base_amount, rate_bps, amount, available_at)
  values (referral.id, paid_order.order_code, paid_order.amount, settings.commission_bps, commission, now() + make_interval(days => settings.hold_days))
  on conflict (order_code) do nothing;
exception when others then
  raise warning 'referral commission skipped for order %: %', target_order_code, sqlerrm;
end
$$;

revoke all on function public.affiliate_save_payout_details(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.request_affiliate_payout(uuid) from public, anon, authenticated;
grant execute on function public.affiliate_save_payout_details(uuid, text, text, text) to service_role;
grant execute on function public.request_affiliate_payout(uuid) to service_role;
revoke all on function public.admin_resolve_affiliate_payout(uuid, text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_resolve_affiliate_payout(uuid, text, uuid, text, text) to service_role;
revoke all on function public.accrue_referral_commission(bigint) from public, anon, authenticated;
grant execute on function public.accrue_referral_commission(bigint) to service_role;
revoke all on function public.affiliate_enroll(boolean) from public, anon;
grant execute on function public.affiliate_enroll(boolean) to authenticated;

commit;
