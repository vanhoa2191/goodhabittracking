-- Vietnamese customer-care email sequence on the existing lifecycle outbox.
-- Nothing here sends mail: producers only enqueue, and the hourly dispatch route sends. The route calls these
-- producers only when LIFECYCLE_CARE_EMAILS_ENABLED=true. Care mail is category 'marketing', so the existing claim
-- step already honours email_suppressions and parent_profiles.marketing_consent.
begin;

alter table public.lifecycle_outbox drop constraint if exists lifecycle_outbox_template_key_check;
alter table public.lifecycle_outbox add constraint lifecycle_outbox_template_key_check check (template_key in (
  'welcome_setup', 'trial_ending', 'payment_receipt',
  'support_status', 'refund_status', 'subscription_cancelled',
  'care_week1_tips', 'care_child_inactive', 'care_weekly_summary', 'care_space_alert'
));

-- Same function as before with two aggregate counters allowed (weekly recap). Still no free text, names or notes.
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
    'trialEndsAt', 'orderCode', 'amount', 'planId', 'caseId', 'status',
    'completedCount', 'activeDays'
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

-- The one gate every care message passes: owner recipient, no suppression, marketing consent,
-- at most one care message per family in any rolling 7 days, and a per-family+template+ISO-week dedupe key.
-- Returns the outbox id, or null when the family is not eligible right now.
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

-- Queues the three data-driven care messages. Families are visited at most once per run and the 7-day cap in
-- enqueue_care_message means a family gets one message; the order below is the priority.
create or replace function public.schedule_care_messages()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  queued integer := 0;
  local_today constant date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  candidate record;
begin
  -- 1. Three or more days after signup, no active task yet: how to set the first tasks (once per family).
  for candidate in
    select family.id as family_id
    from public.families family
    where family.created_at <= now() - interval '3 days'
      and family.created_at > now() - interval '7 days'
      and not exists (select 1 from public.habit_activities activity where activity.family_id = family.id and activity.is_active)
      and not exists (select 1 from public.lifecycle_outbox sent where sent.family_id = family.id and sent.template_key = 'care_week1_tips')
  loop
    if public.enqueue_care_message(candidate.family_id, 'care_week1_tips') is not null then queued := queued + 1; end if;
  end loop;

  -- 2. Active tasks exist but nothing was completed for 3 days (not older than 30 days, and not while paused).
  for candidate in
    select family.id as family_id
    from public.families family
    where family.created_at <= now() - interval '3 days'
      and exists (select 1 from public.habit_activities activity where activity.family_id = family.id and activity.is_active)
      and not exists (select 1 from public.family_engagement_settings paused where paused.family_id = family.id and paused.paused_at is not null)
      and not exists (
        select 1 from public.activity_logs log
        where log.family_id = family.id and log.status in ('completed', 'approved') and log.log_date > local_today - 3
      )
      and (
        select coalesce(max(log.log_date), (family.created_at at time zone 'Asia/Ho_Chi_Minh')::date)
        from public.activity_logs log
        where log.family_id = family.id and log.status in ('completed', 'approved')
      ) > local_today - 30
  loop
    if public.enqueue_care_message(candidate.family_id, 'care_child_inactive') is not null then queued := queued + 1; end if;
  end loop;

  -- 3. Sundays (Vietnam time): counts of what was completed in the last 7 days. Counts only, no names or titles.
  if extract(dow from local_today) = 0 then
    for candidate in
      select log.family_id,
             count(*)::integer as completed_count,
             count(distinct log.log_date)::integer as active_days
      from public.activity_logs log
      where log.status in ('completed', 'approved') and log.log_date > local_today - 7
      group by log.family_id
    loop
      if public.enqueue_care_message(
        candidate.family_id, 'care_weekly_summary',
        jsonb_build_object('completedCount', least(candidate.completed_count, 9999), 'activeDays', least(candidate.active_days, 7))
      ) is not null then queued := queued + 1; end if;
    end loop;
  end if;
  return queued;
end
$$;

-- Mood rows for the application's evaluateMoodAlert (src/lib/child-space.ts). Only date and mood leave the
-- database: nothing else from the child's space. Families that cannot currently receive care mail are left out.
create or replace function public.care_space_mood_snapshot()
returns table (family_id uuid, child_id uuid, local_date date, mood text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.family_id, m.child_id, m.local_date, m.mood
  from public.child_space_moods m
  where m.local_date > (now() at time zone 'Asia/Ho_Chi_Minh')::date - 7
    and m.mood in ('worried', 'sad', 'angry')
    and exists (
      select 1 from public.family_memberships owner_membership
      join public.parent_profiles profile on profile.user_id = owner_membership.user_id
      where owner_membership.family_id = m.family_id and owner_membership.role = 'owner'
        and profile.marketing_consent = true
        and not exists (select 1 from public.email_suppressions s where s.user_id = owner_membership.user_id)
    )
$$;

revoke all on function public.enqueue_care_message(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.schedule_care_messages() from public, anon, authenticated;
revoke all on function public.care_space_mood_snapshot() from public, anon, authenticated;
grant execute on function public.enqueue_care_message(uuid, text, jsonb) to service_role;
grant execute on function public.schedule_care_messages() to service_role;
grant execute on function public.care_space_mood_snapshot() to service_role;

commit;
