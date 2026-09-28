begin;

create table if not exists public.email_suppressions (
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('marketing', 'all')),
  reason text not null check (reason in ('unsubscribe', 'bounce', 'complaint', 'manual')),
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, scope)
);

create table if not exists public.lifecycle_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  family_id uuid references public.families(id) on delete cascade,
  template_key text not null check (template_key in (
    'welcome_setup', 'trial_ending', 'payment_receipt',
    'support_status', 'refund_status', 'subscription_cancelled'
  )),
  category text not null check (category in ('transactional', 'marketing')),
  locale text not null default 'vi',
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  dedupe_key text not null unique check (char_length(dedupe_key) between 1 and 256),
  status text not null default 'pending' check (status in (
    'pending', 'processing', 'sent', 'failed', 'suppressed', 'dead_letter'
  )),
  attempts integer not null default 0 check (attempts between 0 and 5),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  provider_message_id text,
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lifecycle_outbox_dispatch_idx
  on public.lifecycle_outbox (status, available_at, created_at)
  where status in ('pending', 'failed');

create table if not exists public.billing_support_cases (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_code bigint references public.payment_orders(order_code) on delete set null,
  case_type text not null check (case_type in ('support', 'refund', 'cancellation')),
  reason_code text not null check (reason_code in (
    'duplicate_payment', 'wrong_plan', 'service_issue', 'changed_mind', 'other'
  )),
  status text not null default 'requested' check (status in (
    'requested', 'reviewing', 'approved', 'rejected', 'completed'
  )),
  resolution_code text check (resolution_code is null or resolution_code in (
    'information_provided', 'payment_link_cancelled', 'manual_refund_required',
    'manual_refund_confirmed', 'not_eligible', 'subscription_cancelled'
  )),
  created_by uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.billing_support_case_events (
  id bigint generated always as identity primary key,
  case_id uuid not null references public.billing_support_cases(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  previous_status text,
  next_status text not null,
  resolution_code text,
  created_at timestamptz not null default now()
);

alter table public.email_suppressions enable row level security;
alter table public.lifecycle_outbox enable row level security;
alter table public.billing_support_cases enable row level security;
alter table public.billing_support_case_events enable row level security;
revoke all on public.email_suppressions from anon, authenticated;
revoke all on public.lifecycle_outbox from anon, authenticated;
revoke all on public.billing_support_cases from anon, authenticated;
revoke all on public.billing_support_case_events from anon, authenticated;

create or replace function public.enqueue_lifecycle_message(
  target_user_id uuid,
  target_family_id uuid,
  target_template_key text,
  target_category text,
  target_locale text,
  target_payload jsonb,
  target_dedupe_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  message_id uuid;
  payload_key text;
  allowed_payload_keys text[] := array[
    'trialEndsAt', 'orderCode', 'amount', 'planId', 'caseId', 'status'
  ];
begin
  if jsonb_typeof(coalesce(target_payload, '{}'::jsonb)) <> 'object' then
    raise exception 'invalid_lifecycle_payload';
  end if;
  for payload_key in select jsonb_object_keys(coalesce(target_payload, '{}'::jsonb)) loop
    if not payload_key = any(allowed_payload_keys) then
      raise exception 'lifecycle_payload_key_not_allowed';
    end if;
  end loop;
  insert into public.lifecycle_outbox (
    user_id, family_id, template_key, category, locale, payload, dedupe_key
  ) values (
    target_user_id,
    target_family_id,
    target_template_key,
    target_category,
    coalesce(nullif(target_locale, ''), 'vi'),
    coalesce(target_payload, '{}'::jsonb),
    target_dedupe_key
  )
  on conflict (dedupe_key) do update set updated_at = public.lifecycle_outbox.updated_at
  returning id into message_id;
  return message_id;
end
$$;

create or replace function public.schedule_trial_ending_messages()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  queued integer := 0;
  subscription record;
begin
  for subscription in
    select user_id, family_id, trial_ends_at
    from public.user_subscriptions
    where plan = 'trial'
      and status = 'active'
      and trial_ends_at > now()
      and trial_ends_at <= now() + interval '48 hours'
  loop
    perform public.enqueue_lifecycle_message(
      subscription.user_id,
      subscription.family_id,
      'trial_ending',
      'transactional',
      'vi',
      jsonb_build_object('trialEndsAt', subscription.trial_ends_at),
      'trial-ending/' || subscription.family_id::text || '/' || subscription.trial_ends_at::date::text
    );
    queued := queued + 1;
  end loop;
  return queued;
end
$$;

create or replace function public.claim_lifecycle_messages(batch_size integer default 25)
returns table (
  id uuid,
  user_id uuid,
  template_key text,
  locale text,
  payload jsonb,
  dedupe_key text,
  recipient_email text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.lifecycle_outbox message
  set status = 'suppressed', updated_at = now(), last_error_code = 'suppressed'
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
        locked_at = now(), updated_at = now()
    from candidates
    where message.id = candidates.id
    returning message.*
  )
  select claimed.id, claimed.user_id, claimed.template_key, claimed.locale,
         claimed.payload, claimed.dedupe_key, auth_user.email::text
  from claimed
  join auth.users auth_user on auth_user.id = claimed.user_id
  where auth_user.email is not null;
end
$$;

create or replace function public.finish_lifecycle_message(
  target_id uuid,
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
  if outcome not in ('sent', 'failed', 'suppressed') then
    raise exception 'invalid_lifecycle_outcome';
  end if;
  update public.lifecycle_outbox message
  set status = case
        when outcome = 'failed' and message.attempts >= 5 then 'dead_letter'
        else outcome
      end,
      provider_message_id = provider_id,
      last_error_code = error_code,
      sent_at = case when outcome = 'sent' then now() else message.sent_at end,
      available_at = case when outcome = 'failed' then now() + make_interval(mins => least(60, message.attempts * 5)) else message.available_at end,
      locked_at = null,
      updated_at = now()
  where message.id = target_id and message.status = 'processing';
  return found;
end
$$;

create or replace function public.queue_parent_welcome_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_family_id uuid;
begin
  select membership.family_id into target_family_id
  from public.family_memberships membership
  where membership.user_id = new.user_id
  order by membership.created_at
  limit 1;
  perform public.enqueue_lifecycle_message(
    new.user_id, target_family_id, 'welcome_setup', 'transactional', 'vi', '{}'::jsonb,
    'welcome-setup/' || new.user_id::text
  );
  return new;
end
$$;

drop trigger if exists parent_profile_queue_welcome on public.parent_profiles;
create trigger parent_profile_queue_welcome
after insert or update of display_name, phone on public.parent_profiles
for each row execute function public.queue_parent_welcome_message();

create or replace function public.queue_payment_receipt_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'PAID' and new.user_id is not null
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
  then
    perform public.enqueue_lifecycle_message(
      new.user_id, new.family_id, 'payment_receipt', 'transactional', 'vi',
      jsonb_build_object(
        'orderCode', new.order_code,
        'amount', new.amount,
        'planId', new.plan_id
      ),
      'payment-receipt/' || new.order_code::text
    );
  end if;
  return new;
end
$$;

drop trigger if exists payment_order_queue_receipt on public.payment_orders;
create trigger payment_order_queue_receipt
after insert or update of status on public.payment_orders
for each row execute function public.queue_payment_receipt_message();

create or replace function public.queue_subscription_cancelled_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from new.status then
    perform public.enqueue_lifecycle_message(
      new.user_id, new.family_id, 'subscription_cancelled', 'transactional', 'vi', '{}'::jsonb,
      'subscription-cancelled/' || new.family_id::text || '/' || new.updated_at::date::text
    );
  end if;
  return new;
end
$$;

drop trigger if exists subscription_queue_cancelled on public.user_subscriptions;
create trigger subscription_queue_cancelled
after update of status on public.user_subscriptions
for each row execute function public.queue_subscription_cancelled_message();

create or replace function public.audit_and_queue_billing_case()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := coalesce(new.assigned_to, new.created_by);
  previous text := case when tg_op = 'UPDATE' then old.status else null end;
  template text := case when new.case_type = 'refund' then 'refund_status' else 'support_status' end;
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status or old.resolution_code is distinct from new.resolution_code then
    insert into public.billing_support_case_events (
      case_id, actor_id, previous_status, next_status, resolution_code
    ) values (
      new.id, actor, previous, new.status, new.resolution_code
    );
    perform public.enqueue_lifecycle_message(
      new.user_id, new.family_id, template, 'transactional', 'vi',
      jsonb_build_object('caseId', new.id, 'status', new.status),
      new.case_type || '-status/' || new.id::text || '/' || new.status
    );
  end if;
  return new;
end
$$;

drop trigger if exists billing_case_audit_and_notify on public.billing_support_cases;
create trigger billing_case_audit_and_notify
after insert or update of status, resolution_code on public.billing_support_cases
for each row execute function public.audit_and_queue_billing_case();

revoke all on function public.enqueue_lifecycle_message(uuid, uuid, text, text, text, jsonb, text) from public;
revoke all on function public.schedule_trial_ending_messages() from public;
revoke all on function public.claim_lifecycle_messages(integer) from public;
revoke all on function public.finish_lifecycle_message(uuid, text, text, text) from public;
grant execute on function public.enqueue_lifecycle_message(uuid, uuid, text, text, text, jsonb, text) to service_role;
grant execute on function public.schedule_trial_ending_messages() to service_role;
grant execute on function public.claim_lifecycle_messages(integer) to service_role;
grant execute on function public.finish_lifecycle_message(uuid, text, text, text) to service_role;

commit;
