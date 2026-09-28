begin;

create table if not exists public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('support', 'finance', 'super_admin')),
  granted_by uuid not null references auth.users(id),
  grant_reason text not null check (char_length(trim(grant_reason)) between 5 and 500),
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  revoke_reason text,
  check (expires_at is null or expires_at > granted_at),
  check ((revoked_at is null and revoked_by is null and revoke_reason is null)
    or (revoked_at is not null and revoked_by is not null and char_length(trim(revoke_reason)) between 5 and 500))
);

create index if not exists admin_memberships_active_idx
  on public.admin_memberships (role, expires_at)
  where revoked_at is null;

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
        'active', 'bonusDays', 'caseType', 'discountPercent', 'expiresAt',
        'hasDisplayName', 'hasNotes', 'hasPhone', 'marketingConsent',
        'maxRedemptions', 'plan', 'resolutionCode', 'role', 'status',
        'subscriptionEndsAt', 'tagCount', 'trialEndsAt'
      ])
      or case
        when entry.key in ('active', 'hasDisplayName', 'hasNotes', 'hasPhone', 'marketingConsent')
          then jsonb_typeof(entry.value) not in ('boolean', 'null')
        when entry.key in ('bonusDays', 'discountPercent', 'maxRedemptions', 'tagCount')
          then jsonb_typeof(entry.value) not in ('number', 'null')
        when entry.key in ('caseType', 'plan', 'resolutionCode', 'role', 'status')
          then jsonb_typeof(entry.value) not in ('string', 'null')
            or (jsonb_typeof(entry.value) = 'string' and (entry.value #>> '{}') !~ '^[a-z][a-z0-9_]{0,49}$')
        when entry.key in ('expiresAt', 'subscriptionEndsAt', 'trialEndsAt')
          then jsonb_typeof(entry.value) not in ('string', 'null')
            or (jsonb_typeof(entry.value) = 'string' and (entry.value #>> '{}') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}T')
        else true
      end
    );
$$;

create table if not exists public.admin_audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users(id),
  actor_role text not null check (actor_role in ('support', 'finance', 'super_admin')),
  action text not null check (char_length(action) between 3 and 100),
  target_type text not null check (char_length(target_type) between 3 and 100),
  target_id text not null check (char_length(target_id) between 1 and 160),
  outcome text not null check (outcome in ('attempted', 'succeeded', 'failed')),
  before_data jsonb not null default '{}'::jsonb check (public.admin_audit_snapshot_is_minimized(before_data)),
  after_data jsonb not null default '{}'::jsonb check (public.admin_audit_snapshot_is_minimized(after_data)),
  reason text not null check (char_length(trim(reason)) between 3 and 500),
  correlation_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_events_target_idx
  on public.admin_audit_events (target_type, target_id, created_at desc);
create index if not exists admin_audit_events_actor_idx
  on public.admin_audit_events (actor_user_id, created_at desc);
create index if not exists admin_audit_events_correlation_idx
  on public.admin_audit_events (correlation_id);

create table if not exists public.operational_events (
  id bigint generated always as identity primary key,
  signal_type text not null check (signal_type in (
    'payment_webhook_failure', 'profile_mutation_failure', 'pairing_failure'
  )),
  reason_code text not null check (reason_code in (
    'attempts_exhausted', 'child_limit_reached', 'consumed', 'expired',
    'family_membership_required', 'invalid', 'invalid_code',
    'invalid_profile_mutation', 'order_mismatch', 'order_not_found',
    'processing_failed', 'profile_conflict', 'profile_mutation_failed',
    'profile_not_found', 'profile_service_unavailable', 'rate_limited',
    'redacted', 'revoked', 'service_unavailable', 'unknown_failure'
  )),
  correlation_id uuid not null,
  status integer not null check (status between 400 and 599),
  occurred_at timestamptz not null default now()
);

create index if not exists operational_events_signal_time_idx
  on public.operational_events (signal_type, occurred_at desc);

create or replace function public.prune_operational_events()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.operational_events
  where occurred_at < now() - interval '30 days';
  return null;
end;
$$;

drop trigger if exists operational_events_retention on public.operational_events;
create trigger operational_events_retention
after insert on public.operational_events
for each statement execute function public.prune_operational_events();

create or replace function public.reject_admin_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'admin_audit_events_are_immutable' using errcode = '55000';
end;
$$;

drop trigger if exists admin_audit_events_immutable on public.admin_audit_events;
create trigger admin_audit_events_immutable
before update or delete on public.admin_audit_events
for each row execute function public.reject_admin_audit_mutation();

drop trigger if exists admin_audit_events_no_truncate on public.admin_audit_events;
create trigger admin_audit_events_no_truncate
before truncate on public.admin_audit_events
for each statement execute function public.reject_admin_audit_mutation();

create or replace function public.grant_admin_membership(
  target_user_id uuid,
  target_role text,
  target_expires_at timestamptz,
  actor_id uuid,
  reason text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_membership public.admin_memberships%rowtype;
  other_super_admins integer;
begin
  perform pg_advisory_xact_lock(732908221);
  if target_role not in ('support', 'finance', 'super_admin')
    or target_expires_at is null
    or target_expires_at <= now()
    or target_expires_at > now() + interval '366 days'
    or char_length(trim(reason)) not between 5 and 500 then
    raise exception 'invalid_admin_grant' using errcode = '22023';
  end if;

  select * into current_membership
  from public.admin_memberships
  where user_id = target_user_id
  for update;
  if current_membership.user_id is not null
    and current_membership.role = 'super_admin'
    and current_membership.revoked_at is null
    and (current_membership.expires_at is null or current_membership.expires_at > now())
    and target_role <> 'super_admin' then
    select count(*) into other_super_admins
    from public.admin_memberships membership
    where membership.user_id <> target_user_id
      and membership.role = 'super_admin'
      and membership.revoked_at is null
      and (membership.expires_at is null or membership.expires_at > now());
    if other_super_admins = 0 then
      raise exception 'last_super_admin_required' using errcode = '23514';
    end if;
  end if;

  insert into public.admin_memberships (
    user_id, role, granted_by, grant_reason, granted_at, expires_at,
    revoked_at, revoked_by, revoke_reason
  ) values (
    target_user_id, target_role, actor_id, trim(reason), now(), target_expires_at,
    null, null, null
  )
  on conflict (user_id) do update set
    role = excluded.role,
    granted_by = excluded.granted_by,
    grant_reason = excluded.grant_reason,
    granted_at = excluded.granted_at,
    expires_at = excluded.expires_at,
    revoked_at = null,
    revoked_by = null,
    revoke_reason = null;
  select count(*) into other_super_admins
  from public.admin_memberships membership
  where membership.role = 'super_admin'
    and membership.revoked_at is null
    and (membership.expires_at is null or membership.expires_at > now());
  if other_super_admins = 0 then
    raise exception 'last_super_admin_required' using errcode = '23514';
  end if;
  return true;
end;
$$;

create or replace function public.revoke_admin_membership(
  target_user_id uuid,
  actor_id uuid,
  reason text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_membership public.admin_memberships%rowtype;
  other_super_admins integer;
begin
  perform pg_advisory_xact_lock(732908221);
  if char_length(trim(reason)) not between 5 and 500 then
    raise exception 'invalid_admin_revocation' using errcode = '22023';
  end if;
  select * into current_membership
  from public.admin_memberships
  where user_id = target_user_id and revoked_at is null
  for update;
  if current_membership.user_id is null then return false; end if;
  if current_membership.role = 'super_admin'
    and (current_membership.expires_at is null or current_membership.expires_at > now()) then
    select count(*) into other_super_admins
    from public.admin_memberships membership
    where membership.user_id <> target_user_id
      and membership.role = 'super_admin'
      and membership.revoked_at is null
      and (membership.expires_at is null or membership.expires_at > now());
    if other_super_admins = 0 then
      raise exception 'last_super_admin_required' using errcode = '23514';
    end if;
  end if;
  update public.admin_memberships
  set revoked_at = now(), revoked_by = actor_id, revoke_reason = trim(reason)
  where user_id = target_user_id and revoked_at is null;
  return found;
end;
$$;

alter table public.admin_memberships enable row level security;
alter table public.admin_audit_events enable row level security;
alter table public.operational_events enable row level security;
revoke all on public.admin_memberships from anon, authenticated;
revoke all on public.admin_audit_events from anon, authenticated;
revoke all on public.operational_events from anon, authenticated;
revoke truncate on table public.admin_audit_events from service_role;

revoke all on function public.grant_admin_membership(uuid, text, timestamptz, uuid, text) from public;
revoke all on function public.revoke_admin_membership(uuid, uuid, text) from public;
grant execute on function public.grant_admin_membership(uuid, text, timestamptz, uuid, text) to service_role;
grant execute on function public.revoke_admin_membership(uuid, uuid, text) to service_role;

commit;
