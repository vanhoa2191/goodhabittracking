begin;

-- A family that entered a friend's referral code pays less for its first yearly plan. The percentage lives
-- with the other programme settings so it can be changed with SQL; the payment route reads it per order.
alter table public.affiliate_settings
  add column if not exists referred_discount_bps integer not null default 1000
    check (referred_discount_bps between 0 and 5000);

-- Basis points off the first paid order of a referred family (0 when the family was not referred, has already
-- paid, or the programme is off). Called by the server only, with the family named explicitly.
create or replace function public.referral_discount_bps(target_family uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when settings.enabled
      and exists (select 1 from public.referrals referral where referral.referred_family_id = target_family)
      and not exists (
        select 1 from public.payment_orders payment_order
        where payment_order.family_id = target_family and payment_order.status = 'PAID'
      )
    then settings.referred_discount_bps
    else 0
  end
  from public.affiliate_settings settings
  where settings.singleton
$$;

revoke all on function public.referral_discount_bps(uuid) from public, anon, authenticated;
grant execute on function public.referral_discount_bps(uuid) to service_role;

commit;
