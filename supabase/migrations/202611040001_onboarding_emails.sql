-- Three-mail onboarding sequence (day 1, 3, 7 after signup) on the existing lifecycle outbox.
-- Nothing here sends mail: the producer only enqueues, and the hourly dispatch route sends. The route calls it only
-- when LIFECYCLE_CARE_EMAILS_ENABLED=true. Mail is category 'marketing', so the claim step honours
-- email_suppressions and parent_profiles.marketing_consent. Onboarding is exempt from the 7-day care cap, but a family
-- never gets more than one care/onboarding message per Vietnam calendar day, and each onboarding template at most once.
begin;

alter table public.lifecycle_outbox drop constraint if exists lifecycle_outbox_template_key_check;
alter table public.lifecycle_outbox add constraint lifecycle_outbox_template_key_check check (template_key in (
  'welcome_setup', 'trial_ending', 'payment_receipt',
  'support_status', 'refund_status', 'subscription_cancelled',
  'care_week1_tips', 'care_child_inactive', 'care_weekly_summary', 'care_space_alert',
  'onboarding_day1', 'onboarding_day3', 'onboarding_day7'
));

-- The care gate from 202611030002 plus the one-per-day rule against onboarding mail. Otherwise unchanged.
create or replace function public.enqueue_care_message(
  target_family_id uuid,
  target_template_key text,
  target_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  care_keys constant text[] := array['care_week1_tips', 'care_child_inactive', 'care_weekly_summary', 'care_space_alert'];
begin
  if not target_template_key = any(care_keys) then
    raise exception 'care_template_not_allowed';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('care-email/' || target_family_id::text, 0));

  select membership.user_id into owner_id
  from public.family_memberships membership
  where membership.family_id = target_family_id and membership.role = 'owner';
  if owner_id is null then return null; end if;

  if exists (
    select 1 from public.email_suppressions suppression where suppression.user_id = owner_id
  ) then return null; end if;
  if not exists (
    select 1 from public.parent_profiles profile
    where profile.user_id = owner_id and profile.marketing_consent = true
  ) then return null; end if;

  if exists (
    select 1 from public.lifecycle_outbox message
    where message.family_id = target_family_id
      and message.template_key = any(care_keys)
      and message.status <> 'suppressed'
      and message.created_at > now() - interval '7 days'
  ) then return null; end if;

  if exists (
    select 1 from public.lifecycle_outbox message
    where message.family_id = target_family_id
      and message.template_key like 'onboarding\_%'
      and message.status <> 'suppressed'
      and (message.created_at at time zone 'Asia/Ho_Chi_Minh')::date = (now() at time zone 'Asia/Ho_Chi_Minh')::date
  ) then return null; end if;

  return public.enqueue_lifecycle_message(
    owner_id, target_family_id, target_template_key, 'marketing', 'vi', coalesce(target_payload, '{}'::jsonb),
    'care/' || target_template_key || '/' || target_family_id::text || '/' ||
      to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'IYYY-"W"IW')
  );
end
$$;

-- Gate for onboarding mail: owner recipient, no suppression, marketing consent, at most one care/onboarding message per
-- family per Vietnam calendar day, and a once-per-family dedupe key. Returns the outbox id, or null when not eligible now.
create or replace function public.enqueue_onboarding_message(
  target_family_id uuid,
  target_template_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
begin
  if not target_template_key = any (array['onboarding_day1', 'onboarding_day3', 'onboarding_day7']) then
    raise exception 'onboarding_template_not_allowed';
  end if;
  -- Same lock as care mail so the two producers cannot both pass the per-day check.
  perform pg_advisory_xact_lock(hashtextextended('care-email/' || target_family_id::text, 0));

  select membership.user_id into owner_id
  from public.family_memberships membership
  where membership.family_id = target_family_id and membership.role = 'owner';
  if owner_id is null then return null; end if;

  if exists (select 1 from public.email_suppressions suppression where suppression.user_id = owner_id) then return null; end if;
  if not exists (
    select 1 from public.parent_profiles profile
    where profile.user_id = owner_id and profile.marketing_consent = true
  ) then return null; end if;

  if exists (
    select 1 from public.lifecycle_outbox message
    where message.family_id = target_family_id
      and (message.template_key like 'care\_%' or message.template_key like 'onboarding\_%')
      and message.status <> 'suppressed'
      and (message.created_at at time zone 'Asia/Ho_Chi_Minh')::date = (now() at time zone 'Asia/Ho_Chi_Minh')::date
  ) then return null; end if;

  return public.enqueue_lifecycle_message(
    owner_id, target_family_id, target_template_key, 'marketing', 'vi', '{}'::jsonb,
    'onboarding/' || target_template_key || '/' || target_family_id::text
  );
end
$$;

-- Each step has a catch-up window so an hourly run that was blocked by the per-day rule retries, while families that
-- signed up long before this shipped are never back-filled.
create or replace function public.schedule_onboarding_messages()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  queued integer := 0;
  step record;
  candidate record;
begin
  for step in
    select * from (values
      ('onboarding_day1', interval '1 day', interval '3 days'),
      ('onboarding_day3', interval '3 days', interval '6 days'),
      ('onboarding_day7', interval '7 days', interval '10 days')
    ) as steps(template_key, min_age, max_age)
  loop
    for candidate in
      select family.id as family_id
      from public.families family
      where family.created_at <= now() - step.min_age
        and family.created_at > now() - step.max_age
        and not exists (
          select 1 from public.lifecycle_outbox sent
          where sent.family_id = family.id and sent.template_key = step.template_key
        )
      order by family.created_at
    loop
      if public.enqueue_onboarding_message(candidate.family_id, step.template_key) is not null then queued := queued + 1; end if;
    end loop;
  end loop;
  return queued;
end
$$;

revoke all on function public.enqueue_care_message(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.enqueue_onboarding_message(uuid, text) from public, anon, authenticated;
revoke all on function public.schedule_onboarding_messages() from public, anon, authenticated;
grant execute on function public.enqueue_care_message(uuid, text, jsonb) to service_role;
grant execute on function public.enqueue_onboarding_message(uuid, text) to service_role;
grant execute on function public.schedule_onboarding_messages() to service_role;

commit;
