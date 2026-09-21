alter table public.parent_profiles add column if not exists email text;
alter table public.parent_profiles add column if not exists phone text;
alter table public.parent_profiles add column if not exists marketing_consent boolean not null default false;
alter table public.parent_profiles add column if not exists customer_tags text[] not null default '{}';
alter table public.parent_profiles add column if not exists admin_notes text;

revoke select, insert, update on public.parent_profiles from authenticated;
grant select (user_id, display_name, email, phone, marketing_consent, created_at, updated_at)
  on public.parent_profiles to authenticated;
grant insert (user_id, display_name, email, phone, marketing_consent, created_at, updated_at)
  on public.parent_profiles to authenticated;
grant update (display_name, email, phone, marketing_consent, updated_at)
  on public.parent_profiles to authenticated;

update public.parent_profiles profile
set email = auth_user.email,
    display_name = coalesce(nullif(profile.display_name, ''), auth_user.raw_user_meta_data ->> 'full_name', '')
from auth.users auth_user
where auth_user.id = profile.user_id;

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,32}$'),
  description text,
  discount_percent integer check (discount_percent between 1 and 100),
  bonus_days integer check (bonus_days between 1 and 3650),
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_percent is not null or bonus_days is not null)
);

alter table public.coupons enable row level security;
revoke all on public.coupons from anon, authenticated;

create or replace function public.sync_customer_identity()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  update public.parent_profiles set
    email = new.email,
    display_name = coalesce(nullif(display_name, ''), new.raw_user_meta_data ->> 'full_name', ''),
    updated_at = now()
  where user_id = new.id;
  return new;
end;
$$;
drop trigger if exists sync_customer_identity_trigger on auth.users;
create trigger sync_customer_identity_trigger after insert or update of email, raw_user_meta_data on auth.users for each row execute function public.sync_customer_identity();

create table if not exists public.coupon_redemptions (
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  primary key (coupon_id, family_id)
);
alter table public.coupon_redemptions enable row level security;
revoke all on public.coupon_redemptions from anon, authenticated;

create or replace function public.redeem_family_coupon(coupon_code text)
returns table(plan text, subscription_ends_at timestamptz)
language plpgsql security definer set search_path = public, auth as $$
declare target public.coupons%rowtype; actor uuid := auth.uid(); actor_family uuid := public.current_family_id(); owner_id uuid; current_end timestamptz; current_plan text;
begin
  if actor is null or actor_family is null then raise exception 'not_authorized'; end if;
  select * into target from public.coupons where code = upper(trim(coupon_code)) and active and (expires_at is null or expires_at > now()) for update;
  if target.id is null or target.bonus_days is null then raise exception 'coupon_not_available'; end if;
  if target.max_redemptions is not null and target.redeemed_count >= target.max_redemptions then raise exception 'coupon_limit_reached'; end if;
  if exists(select 1 from public.coupon_redemptions r where r.coupon_id=target.id and r.family_id=actor_family) then raise exception 'coupon_already_used'; end if;
  select user_id into owner_id from public.family_memberships where family_id=actor_family and role='owner' limit 1;
  select s.plan, greatest(coalesce(s.subscription_ends_at, now()), now()) into current_plan, current_end from public.user_subscriptions s where s.family_id=actor_family;
  current_plan := case when current_plan in ('monthly', 'yearly') then current_plan else 'monthly' end;
  current_end := coalesce(current_end, now()) + make_interval(days => target.bonus_days);
  insert into public.user_subscriptions(family_id,user_id,plan,status,subscription_ends_at,updated_at) values(actor_family,owner_id,current_plan,'active',current_end,now()) on conflict(family_id) do update set plan=current_plan,status='active',subscription_ends_at=current_end,updated_at=now();
  insert into public.coupon_redemptions(coupon_id,family_id,user_id) values(target.id,actor_family,actor);
  update public.coupons set redeemed_count=redeemed_count+1,updated_at=now() where id=target.id;
  return query select current_plan,current_end;
end;
$$;
grant execute on function public.redeem_family_coupon(text) to authenticated;
