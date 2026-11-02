-- Removes the onboarding sequence and restores the care gate from 202611030002.
-- Deletes queued/sent onboarding outbox rows: the previous template check cannot hold them.
begin;
drop function if exists public.schedule_onboarding_messages();
drop function if exists public.enqueue_onboarding_message(uuid, text);
delete from public.lifecycle_outbox where template_key like 'onboarding\_%';
alter table public.lifecycle_outbox drop constraint if exists lifecycle_outbox_template_key_check;
alter table public.lifecycle_outbox add constraint lifecycle_outbox_template_key_check check (template_key in (
  'welcome_setup', 'trial_ending', 'payment_receipt',
  'support_status', 'refund_status', 'subscription_cancelled',
  'care_week1_tips', 'care_child_inactive', 'care_weekly_summary', 'care_space_alert'
));

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
  -- Serialise per family so two overlapping runs cannot both pass the 7-day check.
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

  return public.enqueue_lifecycle_message(
    owner_id, target_family_id, target_template_key, 'marketing', 'vi', coalesce(target_payload, '{}'::jsonb),
    'care/' || target_template_key || '/' || target_family_id::text || '/' ||
      to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'IYYY-"W"IW')
  );
end
$$;

commit;
