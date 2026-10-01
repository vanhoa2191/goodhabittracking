begin;

-- Follow-ups from the admin audit.
-- 1. The activation and retention windows counted one calendar day too many ("last 7 days" covered 8 dates
--    because today was added on top of the 7 before it).
-- 2. The audit snapshot allowlist dropped the fields the affiliate actions record (`claimed`, `referral`).

create or replace function public.admin_activation_funnel(window_days integer default 30)
returns table (
  cohort_day date,
  families bigint,
  with_child bigint,
  with_paired_device bigint,
  with_first_completion bigint,
  with_trial bigint,
  with_payment bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select family.created_at::date as cohort_day,
         count(*) as families,
         count(*) filter (where exists (
           select 1 from public.child_profiles child where child.family_id = family.id
         )) as with_child,
         count(*) filter (where exists (
           select 1 from public.device_sessions device where device.family_id = family.id
         )) as with_paired_device,
         count(*) filter (where exists (
           select 1 from public.activity_logs log
           where log.family_id = family.id and log.status in ('completed', 'approved')
         )) as with_first_completion,
         count(*) filter (where exists (
           select 1 from public.user_subscriptions subscription
           where subscription.family_id = family.id and subscription.trial_consumed_at is not null
         )) as with_trial,
         count(*) filter (where exists (
           select 1 from public.payment_orders payment_order
           where payment_order.family_id = family.id and payment_order.status = 'PAID'
         )) as with_payment
  from public.families family
  where family.created_at >= current_date - (greatest(1, least(coalesce(window_days, 30), 365)) - 1)
  group by family.created_at::date
  order by cohort_day desc
$$;

create or replace function public.admin_retention_snapshot()
returns table (
  families_total bigint,
  families_with_child bigint,
  active_last_7_days bigint,
  active_last_30_days bigint,
  paying_now bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.families),
    (select count(distinct child.family_id) from public.child_profiles child),
    (select count(distinct log.family_id) from public.activity_logs log
      where log.status in ('completed', 'approved') and log.log_date >= current_date - 6),
    (select count(distinct log.family_id) from public.activity_logs log
      where log.status in ('completed', 'approved') and log.log_date >= current_date - 29),
    (select count(*) from public.user_subscriptions subscription
      where subscription.status = 'active'
        and (subscription.plan = 'lifetime'
          or (subscription.plan in ('solo_monthly', 'monthly', 'yearly') and subscription.subscription_ends_at > now())))
$$;

revoke all on function public.admin_activation_funnel(integer) from public, anon, authenticated;
revoke all on function public.admin_retention_snapshot() from public, anon, authenticated;
grant execute on function public.admin_activation_funnel(integer) to service_role;
grant execute on function public.admin_retention_snapshot() to service_role;

create or replace function public.admin_audit_snapshot_is_minimized(snapshot jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(snapshot) = 'object'
    and not exists (
      select 1
      from jsonb_each(snapshot) entry
      where entry.key <> all(array[
        'active', 'bonusDays', 'caseType', 'claimed', 'discountPercent', 'expiresAt',
        'hasDisplayName', 'hasNotes', 'hasPhone', 'marketingConsent',
        'maxRedemptions', 'plan', 'referral', 'resolutionCode', 'role', 'status',
        'subscriptionEndsAt', 'tagCount', 'trialEndsAt'
      ])
      or case
        when entry.key in ('active', 'claimed', 'hasDisplayName', 'hasNotes', 'hasPhone', 'marketingConsent')
          then jsonb_typeof(entry.value) not in ('boolean', 'null')
        when entry.key in ('bonusDays', 'discountPercent', 'maxRedemptions', 'tagCount')
          then jsonb_typeof(entry.value) not in ('number', 'null')
        when entry.key in ('caseType', 'plan', 'referral', 'resolutionCode', 'role', 'status')
          then jsonb_typeof(entry.value) not in ('string', 'null')
            or (jsonb_typeof(entry.value) = 'string' and (entry.value #>> '{}') !~ '^[a-z][a-z0-9_]{0,49}$')
        when entry.key in ('expiresAt', 'subscriptionEndsAt', 'trialEndsAt')
          then jsonb_typeof(entry.value) not in ('string', 'null')
            or (jsonb_typeof(entry.value) = 'string' and (entry.value #>> '{}') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}T')
        else true
      end
    );
$$;

commit;
