begin;

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
          subscription.plan in ('solo_monthly', 'monthly', 'yearly')
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
        and (
          subscription.plan = 'lifetime'
          or (subscription.plan = 'trial' and subscription.trial_ends_at > now())
          or (
            subscription.plan in ('monthly', 'yearly')
            and subscription.subscription_ends_at > now()
          )
        )
    ) then null
    when exists (
      select 1
      from public.user_subscriptions subscription
      where subscription.family_id = target_family_id
        and subscription.status = 'active'
        and subscription.plan = 'solo_monthly'
        and subscription.subscription_ends_at > now()
    ) then 1
    else 0
  end
$$;

revoke all on function public.family_child_limit(uuid) from public;
grant execute on function public.family_child_limit(uuid) to authenticated, service_role;

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

  entitlement_end := case target_order.plan_id
    when 'solo_monthly' then now() + interval '1 month'
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

create or replace function public.enforce_family_child_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed_children integer;
begin
  allowed_children := public.family_child_limit(new.family_id);
  if allowed_children is not null
    and (select count(*) from public.child_profiles child where child.family_id = new.family_id) >= allowed_children
  then
    raise exception 'child_limit_reached';
  end if;
  return new;
end
$$;

commit;
