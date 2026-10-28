begin;

-- Receipt queue survives family deletion; no raw provider payload or customer content.
create table public.billing_late_payments (
  id bigint generated always as identity primary key,
  order_code bigint not null references public.payment_orders(order_code),
  provider_reference text not null unique,
  amount integer not null check (amount >= 0),
  reason text not null check (reason in ('cancelled_order', 'owner_missing')),
  status text not null default 'needs_review' check (status in ('needs_review', 'resolved')),
  received_at timestamptz not null default now(),
  resolved_at timestamptz,
  check ((status = 'resolved') = (resolved_at is not null))
);

-- Mutable projection snapshots let a refund replay later purchases without that order.
-- Sequence is settlement order, independent of provider timestamps and order codes.
create table public.subscription_order_grants (
  sequence bigint generated always as identity primary key,
  order_code bigint not null unique references public.payment_orders(order_code),
  family_id uuid not null references public.families(id) on delete cascade,
  plan_id text not null,
  granted_at timestamptz not null,
  before_state jsonb not null,
  after_state jsonb not null,
  revoked_at timestamptz
);
create index subscription_order_grants_family_sequence on public.subscription_order_grants (family_id, sequence);
alter table public.billing_late_payments enable row level security;
alter table public.billing_late_payments force row level security;
alter table public.subscription_order_grants enable row level security;
alter table public.subscription_order_grants force row level security;
revoke all on public.billing_late_payments, public.subscription_order_grants from public, anon, authenticated;
grant select, update on public.billing_late_payments to service_role;
-- Only the security-definer settlement/refund functions write grant provenance.
grant select on public.subscription_order_grants to service_role;

create or replace function public.billing_subscription_state(target_family uuid)
returns jsonb language sql stable security definer set search_path = '' set timezone = 'UTC' as $$
  select coalesce((select jsonb_build_object('plan', plan, 'status', status,
    'subscription_ends_at', subscription_ends_at, 'trial_ends_at', trial_ends_at)
    from public.user_subscriptions where family_id = target_family),
    jsonb_build_object('plan', 'free', 'status', 'inactive', 'subscription_ends_at', null, 'trial_ends_at', null))
$$;

create or replace function public.project_subscription_order(previous jsonb, order_plan text, paid_time timestamptz)
returns jsonb language plpgsql stable set search_path = '' set timezone = 'UTC' as $$
declare
  paid_end timestamptz := (previous->>'subscription_ends_at')::timestamptz;
  trial_end timestamptz := (previous->>'trial_ends_at')::timestamptz;
  has_paid boolean := previous->>'status' = 'active' and previous->>'plan' in
    ('solo_monthly','solo_yearly','monthly','yearly','pro_plus_monthly','pro_plus_yearly') and paid_end > paid_time;
  current_rank integer := 0;
  order_rank integer;
  next_plan text;
  next_end timestamptz;
begin
  if order_plan = 'lifetime' or (previous->>'plan' = 'lifetime' and previous->>'status' = 'active') then
    next_plan := 'lifetime';
  else
    order_rank := case when order_plan in ('solo_monthly','solo_yearly') then 1
      when order_plan in ('pro_plus_monthly','pro_plus_yearly','pro_plus_yearly_upsell','pro_plus_yearly_b1g1') then 3 else 2 end;
    if has_paid then current_rank := case when previous->>'plan' in ('solo_monthly','solo_yearly') then 1
      when previous->>'plan' in ('pro_plus_monthly','pro_plus_yearly') then 3 else 2 end; end if;
    next_plan := case when current_rank > order_rank then previous->>'plan'
      when order_plan in ('pro_plus_yearly_upsell','pro_plus_yearly_b1g1') then 'pro_plus_yearly' else order_plan end;
    next_end := case when has_paid then paid_end
      when previous->>'status' = 'active' and previous->>'plan' = 'trial' and trial_end > paid_time then trial_end
      else paid_time end + case when order_plan = 'pro_plus_yearly_b1g1' then interval '2 years'
      when order_plan in ('solo_yearly','yearly','pro_plus_yearly','pro_plus_yearly_upsell') then interval '1 year' else interval '1 month' end;
  end if;
  return jsonb_build_object('plan', next_plan, 'status', 'active', 'subscription_ends_at', next_end, 'trial_ends_at', null);
end
$$;

create or replace function public.revoke_subscription_order_grant(target_order bigint, target_family uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  target_grant public.subscription_order_grants%rowtype;
  grant_row public.subscription_order_grants%rowtype;
  expected jsonb;
  projected jsonb;
  prior jsonb;
begin
  -- Caller already holds order -> family locks. Never lock another order here.
  perform 1 from public.user_subscriptions where family_id = target_family for update;
  select * into target_grant from public.subscription_order_grants
    where order_code = target_order and family_id = target_family;
  if not found then return false; end if; -- No guessing for historical orders.
  if target_grant.revoked_at is not null then return true; end if;
  expected := target_grant.before_state;
  for grant_row in select * from public.subscription_order_grants
    where family_id = target_family and sequence >= target_grant.sequence order by sequence
  loop
    -- Coupon/admin changes between purchases must be reviewed, never silently erased.
    if grant_row.before_state is distinct from expected then return false; end if;
    expected := grant_row.after_state;
  end loop;
  if public.billing_subscription_state(target_family) is distinct from expected then return false; end if;
  projected := target_grant.before_state;
  for grant_row in select * from public.subscription_order_grants
    where family_id = target_family and sequence >= target_grant.sequence order by sequence
  loop
    prior := projected;
    if grant_row.order_code <> target_order and grant_row.revoked_at is null then
      projected := public.project_subscription_order(projected, grant_row.plan_id, grant_row.granted_at);
    end if;
    update public.subscription_order_grants set before_state = prior, after_state = projected,
      revoked_at = case when order_code = target_order then now() else revoked_at end
    where sequence = grant_row.sequence;
  end loop;
  update public.user_subscriptions set plan = projected->>'plan', status = projected->>'status',
    subscription_ends_at = (projected->>'subscription_ends_at')::timestamptz,
    trial_ends_at = (projected->>'trial_ends_at')::timestamptz, updated_at = clock_timestamp()
  where family_id = target_family;
  return true;
end
$$;


create or replace function public.delete_owned_family(confirmation text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_family_id uuid;
begin
  if confirmation <> 'DELETE FAMILY' then raise exception 'confirmation_required'; end if;
  select family.id into target_family_id
  from public.families family
  where family.created_by = actor_id
  limit 1;
  if target_family_id is null then raise exception 'owned_family_not_found'; end if;

  -- Lock orders before family, matching settlement/refund. Check again after family lock
  -- so a checkout inserted while we waited cannot escape the deletion guard.
  perform 1 from public.payment_orders where family_id = target_family_id order by order_code for update;
  perform 1 from public.families where id = target_family_id and created_by = actor_id for update;
  if exists (select 1 from public.payment_orders where family_id = target_family_id and status = 'PENDING') then
    raise exception 'family_has_pending_payments';
  end if;

  update public.billing_webhook_events event
  set payload = jsonb_build_object('orderCode', event.order_code, 'minimised', true)
  where event.order_code in (
    select payment_order.order_code from public.payment_orders payment_order
    where payment_order.family_id = target_family_id
  );
  update public.payment_orders payment_order
  set metadata = jsonb_build_object('minimised', true),
      payment_url = null,
      qr_code = null
  where payment_order.family_id = target_family_id;

  delete from public.families where id = target_family_id and created_by = actor_id;
  delete from public.parent_profiles where user_id = actor_id;
  return true;
end
$$;

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
  next_plan text;
  entitlement_end timestamptz;
  promo_offer text;
  grant_before jsonb;
  grant_after jsonb;
begin
  select * into target_order
  from public.payment_orders payment_order
  where payment_order.order_code = incoming_order_code
  for update;

  if not found then return 'order_not_found'; end if;
  if target_order.amount <> incoming_amount then return 'amount_mismatch'; end if;
  if target_order.description <> incoming_description then return 'description_mismatch'; end if;
  if target_order.status = 'PAID' then
    if target_order.provider_reference = incoming_reference then return 'duplicate'; end if;
    return 'order_already_paid';
  end if;
  if exists (select 1 from public.billing_webhook_events
    where provider = 'payos' and provider_reference = incoming_reference and order_code <> incoming_order_code) then
    return 'reference_mismatch';
  end if;

  -- Keep receipt evidence independent of a deleted family. Never activate a cancelled checkout.
  if target_order.status = 'CANCELLED' or target_order.family_id is null or target_order.user_id is null then
    insert into public.billing_late_payments (order_code, provider_reference, amount, reason)
    values (incoming_order_code, incoming_reference, incoming_amount,
      case when target_order.status = 'CANCELLED' then 'cancelled_order' else 'owner_missing' end)
    on conflict (provider_reference) do nothing;
    if exists (select 1 from public.billing_late_payments
      where provider_reference = incoming_reference and order_code <> incoming_order_code) then
      return 'reference_mismatch';
    end if;
    insert into public.billing_webhook_events (provider, provider_reference, order_code, payload)
    values ('payos', incoming_reference, incoming_order_code,
      jsonb_build_object('orderCode', incoming_order_code, 'minimised', true))
    on conflict (provider, provider_reference) do nothing;
    return 'late_payment_recorded';
  end if;
  if target_order.plan_id not in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly', 'pro_plus_yearly_upsell', 'pro_plus_yearly_b1g1', 'lifetime', 'ai_addon_monthly', 'printables') then return 'invalid_plan'; end if;


  insert into public.billing_webhook_events (
    provider, provider_reference, order_code, payload
  ) values (
    'payos', incoming_reference, incoming_order_code, incoming_payload
  ) on conflict (provider, provider_reference) do nothing;

  if not found then return 'duplicate'; end if;

  perform 1 from public.families family where family.id = target_order.family_id for update;

  -- The order and family locks make both settlement and refund updates serial.
  -- Duplicate checks above run before either add-on can extend an entitlement.
  if target_order.plan_id in ('ai_addon_monthly', 'printables') then
    insert into public.family_addons (family_id, addon, active_until, source, last_order_code)
    values (target_order.family_id,
      case when target_order.plan_id = 'ai_addon_monthly' then 'ai' else 'printables' end,
      case when target_order.plan_id = 'ai_addon_monthly' then now() + interval '1 month' end,
      'purchase', target_order.order_code)
    on conflict (family_id, addon) do update set
      active_until = case when excluded.addon = 'ai'
        then greatest(now(), public.family_addons.active_until) + interval '1 month' end,
      source = 'purchase', last_order_code = excluded.last_order_code, updated_at = now();
    update public.payment_orders
      set status = 'PAID', paid_at = now(), provider_reference = incoming_reference,
          payment_link_id = nullif(incoming_payment_link_id, ''), metadata = incoming_payload
    where id = target_order.id;
    return 'activated';
  end if;

  perform 1 from public.user_subscriptions subscription
  where subscription.family_id = target_order.family_id
  for update;

  grant_before := public.billing_subscription_state(target_order.family_id);

  grant_after := public.project_subscription_order(grant_before, target_order.plan_id, now());
  next_plan := grant_after->>'plan';
  entitlement_end := (grant_after->>'subscription_ends_at')::timestamptz;

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

  insert into public.subscription_order_grants
    (order_code, family_id, plan_id, granted_at, before_state, after_state)
  values (target_order.order_code, target_order.family_id, target_order.plan_id, now(), grant_before,
    public.billing_subscription_state(target_order.family_id));

  promo_offer := case target_order.plan_id
    when 'pro_plus_yearly_upsell' then 'pro_plus_upsell_690'
    when 'pro_plus_yearly_b1g1' then 'pro_plus_b1g1' end;
  if promo_offer is not null then
    -- Same offer lock as refunds. Deliberately do not recheck capacity or closing:
    -- two paid reservations for the last slot both activate and both count.
    perform 1 from public.launch_offers where code = promo_offer for update;
    insert into public.launch_offer_claims (offer_code, family_id, order_code)
    values (promo_offer, target_order.family_id, target_order.order_code)
    on conflict (offer_code, family_id) where revoked_at is null do nothing;
  end if;

  if target_order.plan_id = 'yearly' then
    begin
      perform public.claim_launch_offer(target_order.family_id, target_order.order_code);
    exception when others then
      raise warning 'launch offer claim skipped for order %: %', target_order.order_code, sqlerrm;
    end;
  end if;

  perform public.accrue_referral_commission(target_order.order_code);

  return 'activated';
end
$$;

create or replace function public.admin_resolve_billing_case(
  target_case uuid, next_status text, next_resolution text, actor_id uuid, reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  support_case public.billing_support_cases%rowtype;
  payment_order public.payment_orders%rowtype;
  referral_result text;
  launch_result text;
begin
  select * into support_case from public.billing_support_cases where id = target_case for update;
  if not found then return jsonb_build_object('code', 'case_not_found'); end if;
  if next_status not in ('requested', 'reviewing', 'approved', 'rejected', 'completed')
    or (next_resolution is not null and next_resolution not in ('information_provided', 'payment_link_cancelled',
      'manual_refund_required', 'manual_refund_confirmed', 'not_eligible', 'subscription_cancelled')) then
    raise exception 'invalid_case_update';
  end if;
  if support_case.status in ('completed', 'rejected') and
    (next_status is distinct from support_case.status or next_resolution is distinct from support_case.resolution_code) then
    return jsonb_build_object('code', 'case_closed');
  end if;
  if support_case.case_type = 'refund' and next_status = 'completed' then
    if next_resolution is distinct from 'manual_refund_confirmed' then return jsonb_build_object('code', 'refund_not_confirmed'); end if;
    if support_case.order_code is null then return jsonb_build_object('code', 'refund_needs_order'); end if;
    -- Both cases for one order queue here before checking the confirmed-refund uniqueness.
    select * into payment_order from public.payment_orders
    where order_code = support_case.order_code and family_id = support_case.family_id for update;
    if payment_order.status is distinct from 'PAID' then return jsonb_build_object('code', 'refund_order_not_paid'); end if;
    if exists (select 1 from public.billing_support_cases where order_code = support_case.order_code
      and case_type = 'refund' and status = 'completed' and resolution_code = 'manual_refund_confirmed'
      and id <> support_case.id) then return jsonb_build_object('code', 'refund_already_confirmed'); end if;
    -- Repeating a closed case's resolution must not deduct another month.
    if not (support_case.status = 'completed' and support_case.resolution_code = 'manual_refund_confirmed') then
      perform 1 from public.families where id = support_case.family_id for update;
      if payment_order.plan_id = 'ai_addon_monthly' then
        update public.family_addons set active_until = greatest(now(), active_until - interval '1 month'),
          updated_at = now() where family_id = support_case.family_id and addon = 'ai';
      elsif payment_order.plan_id = 'printables' then
        delete from public.family_addons where family_id = support_case.family_id and addon = 'printables';
      elsif not public.revoke_subscription_order_grant(payment_order.order_code, support_case.family_id) then
        return jsonb_build_object('code', 'subscription_grant_review_required');
      end if;
    end if;
    referral_result := public.admin_reverse_referral_commission(support_case.order_code, 'Refund confirmed (case ' || support_case.id::text || '): ' || reason);
    if referral_result is null or referral_result not in ('reversed', 'already_reversed', 'no_commission', 'in_payout', 'already_paid') then
      raise exception 'referral_reversal_failed';
    end if;
    -- Revokes founding or promo claims by order, releasing capacity for the matching offer.
    perform public.admin_revoke_launch_offer_claim(support_case.order_code, reason);
    launch_result := case when exists (select 1 from public.launch_offer_claims
      where order_code = support_case.order_code and revoked_at is not null) then 'revoked' else 'not_found' end;
  elsif next_resolution = 'manual_refund_confirmed' then
    return jsonb_build_object('code', 'refund_not_confirmed');
  end if;
  if next_resolution = 'payment_link_cancelled' then
    if support_case.case_type <> 'cancellation' or not exists (select 1 from public.payment_orders
      where order_code = support_case.order_code and family_id = support_case.family_id and status = 'CANCELLED') then
      return jsonb_build_object('code', 'payment_not_cancelled');
    end if;
  end if;
  if next_resolution = 'subscription_cancelled' then
    if support_case.case_type <> 'cancellation' or next_status <> 'completed' then
      return jsonb_build_object('code', 'invalid_subscription_cancellation');
    end if;
    -- Same order -> family lock order as process_payos_webhook; the case update trigger below then
    -- re-locks an order this transaction already holds instead of waiting behind a webhook.
    perform 1 from public.payment_orders where order_code = support_case.order_code for update;
    perform 1 from public.families where id = support_case.family_id for update;
    update public.user_subscriptions set status = 'cancelled', updated_at = clock_timestamp() where family_id = support_case.family_id;
  end if;
  update public.billing_support_cases set status = next_status, resolution_code = next_resolution, assigned_to = actor_id,
    resolved_at = case when next_status in ('completed', 'rejected') then coalesce(resolved_at, now()) end,
    updated_at = clock_timestamp() where id = support_case.id;
  return jsonb_build_object('code', 'updated', 'referralCommission', referral_result, 'launchOfferClaim', launch_result);
end
$$;

alter table public.lifecycle_outbox add column claim_token uuid;
-- Changing the return type requires replacing the claim function.
drop function public.claim_lifecycle_messages(integer);

create or replace function public.claim_lifecycle_messages(batch_size integer default 25)
returns table (
  id uuid,
  user_id uuid,
  template_key text,
  locale text,
  payload jsonb,
  dedupe_key text,
  recipient_email text,
  claim_token uuid
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.lifecycle_outbox message
  set status = 'dead_letter', locked_at = null, updated_at = now(), last_error_code = 'delivery_uncertain', claim_token = null
  where message.status = 'processing'
    and message.locked_at < now() - interval '10 minutes';

  update public.lifecycle_outbox message
  set status = 'suppressed', locked_at = null, updated_at = now(), last_error_code = 'suppressed'
  where message.status in ('pending', 'failed')
    and (
      exists (
        select 1 from public.email_suppressions suppression
        where suppression.user_id = message.user_id
          and (suppression.scope = 'all' or message.category = 'marketing')
      )
      or (
        message.category = 'marketing'
        and not exists (
          select 1 from public.parent_profiles profile
          where profile.user_id = message.user_id and profile.marketing_consent = true
        )
      )
    );

  return query
  with candidates as (
    select message.id
    from public.lifecycle_outbox message
    where message.status in ('pending', 'failed')
      and message.available_at <= now()
      and message.attempts < 5
      and (message.locked_at is null or message.locked_at < now() - interval '10 minutes')
    order by message.created_at
    for update skip locked
    limit greatest(1, least(coalesce(batch_size, 25), 100))
  ), claimed as (
    update public.lifecycle_outbox message
    set status = 'processing', attempts = message.attempts + 1,
        locked_at = now(), claim_token = gen_random_uuid(), updated_at = now()
    from candidates
    where message.id = candidates.id
    returning message.*
  )
  select claimed.id, claimed.user_id, claimed.template_key, claimed.locale,
         claimed.payload, claimed.dedupe_key, auth_user.email::text, claimed.claim_token
  from claimed
  join auth.users auth_user on auth_user.id = claimed.user_id
  where auth_user.email is not null;
end
$$;

-- Old workers cannot finish a newly token-fenced lease during deployment overlap.
create or replace function public.finish_lifecycle_message(target_id uuid, outcome text, provider_id text default null, error_code text default null)
returns boolean language sql security definer set search_path = '' as $$ select false $$;


create or replace function public.finish_lifecycle_message(
  target_id uuid,
  lease_token uuid,
  outcome text,
  provider_id text default null,
  error_code text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if outcome not in ('sent', 'failed', 'suppressed', 'uncertain') then
    raise exception 'invalid_lifecycle_outcome';
  end if;
  update public.lifecycle_outbox message
  set status = case
        when outcome = 'uncertain' or (outcome = 'failed' and message.attempts >= 5) then 'dead_letter'
        else outcome
      end,
      provider_message_id = provider_id,
      last_error_code = error_code,
      sent_at = case when outcome = 'sent' then now() else message.sent_at end,
      available_at = case when outcome = 'failed' then now() + make_interval(mins => least(60, message.attempts * 5)) else message.available_at end,
      locked_at = null, claim_token = null,
      updated_at = now()
  where message.id = target_id and message.status = 'processing'
    and message.claim_token = lease_token and lease_token is not null;
  return found;
end
$$;

revoke all on function public.billing_subscription_state(uuid) from public, anon, authenticated, service_role;

revoke all on function public.project_subscription_order(jsonb, text, timestamptz) from public, anon, authenticated, service_role;

revoke all on function public.revoke_subscription_order_grant(bigint, uuid) from public, anon, authenticated, service_role;

revoke all on function public.process_payos_webhook(bigint, integer, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.process_payos_webhook(bigint, integer, text, text, text, jsonb) to service_role;

revoke all on function public.admin_resolve_billing_case(uuid, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_resolve_billing_case(uuid, text, text, uuid, text) to service_role;

revoke all on function public.claim_lifecycle_messages(integer) from public, anon, authenticated;
grant execute on function public.claim_lifecycle_messages(integer) to service_role;

revoke all on function public.finish_lifecycle_message(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.finish_lifecycle_message(uuid, uuid, text, text, text) to service_role;

commit;
