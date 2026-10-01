begin;

-- Lets the app know whether a family can still enter a referral code by hand, without exposing who
-- referred it or any other family's data.
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

  select family.created_at into family_created from public.families family where family.id = actor_family;
  if family_created is null or family_created < now() - make_interval(days => settings.attribution_days) then return 'closed'; end if;
  if exists (select 1 from public.payment_orders payment_order where payment_order.family_id = actor_family and payment_order.status = 'PAID') then
    return 'closed';
  end if;
  return 'eligible';
end
$$;

revoke all on function public.referral_claim_state() from public, anon;
grant execute on function public.referral_claim_state() to authenticated;

commit;
