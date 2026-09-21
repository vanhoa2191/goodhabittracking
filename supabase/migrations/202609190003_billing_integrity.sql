begin;

alter table public.payment_orders add column if not exists provider_reference text;
alter table public.payment_orders add column if not exists payment_link_id text;
alter table public.payment_orders add column if not exists cancelled_at timestamptz;
alter table public.payment_orders add column if not exists expires_at timestamptz;
alter table public.user_subscriptions add column if not exists trial_consumed_at timestamptz;

create unique index if not exists payment_orders_provider_reference_unique
  on public.payment_orders (provider_reference)
  where provider_reference is not null;
create unique index if not exists user_subscriptions_family_unique
  on public.user_subscriptions (family_id);

create table if not exists public.billing_webhook_events (
  id bigint generated always as identity primary key,
  provider text not null check (provider in ('payos')),
  provider_reference text not null,
  order_code bigint not null,
  payload jsonb not null,
  processed_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

alter table public.billing_webhook_events enable row level security;
revoke all on public.billing_webhook_events from anon, authenticated;

drop policy if exists subscriptions_insert_family on public.user_subscriptions;
drop policy if exists subscriptions_update_family on public.user_subscriptions;
drop policy if exists subscriptions_delete_family on public.user_subscriptions;
drop policy if exists payment_orders_insert_family on public.payment_orders;
drop policy if exists payment_orders_update_family on public.payment_orders;
drop policy if exists payment_orders_delete_family on public.payment_orders;

revoke insert, update, delete on public.user_subscriptions from anon, authenticated;
revoke insert, update, delete on public.payment_orders from anon, authenticated;

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
          subscription.plan in ('monthly', 'yearly')
          and subscription.subscription_ends_at > now()
        )
      )
  )
$$;

revoke all on function public.family_has_pro_entitlement(uuid) from public;
grant execute on function public.family_has_pro_entitlement(uuid) to authenticated, service_role;

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

revoke all on function public.activate_family_trial() from public;
grant execute on function public.activate_family_trial() to authenticated;

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
  if target_order.plan_id not in ('monthly', 'yearly', 'lifetime') then return 'invalid_plan'; end if;

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

  entitlement_end := case target_order.plan_id
    when 'monthly' then now() + interval '1 month'
    when 'yearly' then now() + interval '1 year'
    else null
  end;

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
    target_order.plan_id,
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

revoke all on function public.process_payos_webhook(bigint, integer, text, text, text, jsonb) from public;
grant execute on function public.process_payos_webhook(bigint, integer, text, text, text, jsonb) to service_role;

create or replace function public.enforce_family_child_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.family_has_pro_entitlement(new.family_id)
    and (select count(*) from public.child_profiles child where child.family_id = new.family_id) >= 1
  then
    raise exception 'free_plan_child_limit_reached';
  end if;
  return new;
end
$$;

drop trigger if exists child_profiles_enforce_entitlement on public.child_profiles;
create trigger child_profiles_enforce_entitlement
before insert on public.child_profiles
for each row execute function public.enforce_family_child_limit();

commit;
