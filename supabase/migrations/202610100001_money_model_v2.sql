begin;

-- Preserve checkout reservation and attribution locking while updating Money Model v2 amounts.
drop function if exists public.create_family_payment_order(uuid, uuid, bigint, text, timestamptz);
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
    when 'monthly' then 69000 when 'yearly' then 590000 end;
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
  if selected_plan in ('yearly', 'solo_yearly') then
    -- One yearly link at a time also prevents a full-price link paying before the discounted link.
    select * into pending from public.payment_orders
    where (family_id = target_family or user_id in (actor_id, owner_id)
      or family_owner_user_id in (actor_id, owner_id) or exists (
      select 1 from public.family_memberships owner_membership
      where owner_membership.family_id = payment_orders.family_id
        and owner_membership.role = 'owner' and owner_membership.user_id in (actor_id, owner_id)
    ))
      and plan_id in ('yearly', 'solo_yearly') and status = 'PENDING'
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
  if paid_order.plan_id not in ('solo_yearly', 'yearly', 'lifetime') then return; end if;

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

-- Stored commission rates and amounts remain historical facts.
update public.affiliate_settings set commission_bps = 2000, terms_version = '2026-10-10', updated_at = now() where singleton;

revoke all on function public.create_family_payment_order(uuid, uuid, bigint, text, timestamptz) from public, anon, authenticated;
grant execute on function public.create_family_payment_order(uuid, uuid, bigint, text, timestamptz) to service_role;
revoke all on function public.accrue_referral_commission(bigint) from public, anon, authenticated;
grant execute on function public.accrue_referral_commission(bigint) to service_role;

commit;
