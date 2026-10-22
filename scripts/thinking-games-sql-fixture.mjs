// Reusable real-PostgreSQL fixture for the daily thinking-games SQL work.
//
// WHAT THIS IS
//   Harness preparation only. It provides (a) a small, explicitly labelled HARNESS
//   fixture used to prove the harness itself works, and (b) a production-shaped
//   MINIMUM BASELINE of the pre-existing tables an upcoming thinking-games migration
//   must integrate with, so that migration can later be applied to real PostgreSQL.
//
// WHAT THIS IS NOT
//   It proves NOTHING about the thinking-games feature. No game migration, game
//   function, entitlement, snapshot or attempt exists in this repository yet.
//   AC04 game policy proofs remain NOT RUN until the real game SQL is written and
//   exercised.
//
// SOURCE GAPS (do not "fix" these by guessing)
//   * No tracked file in this repository creates `public.activity_logs`. The only
//     matches for `create table ... activity_logs` are local test stubs
//     (scripts/verify-local-billing.mjs, scripts/verify-local-affiliate.mjs,
//     tests/integration/migrations/family-operations-runtime.mjs). The real
//     production DDL - including whether `completed_at` carries a DEFAULT - is
//     therefore UNKNOWN. The baseline below declares `completed_at timestamptz`
//     with NO default and every fixture insert supplies an explicit value.
//   * `public.secret_quests` (supabase/migrations/202609230001_experience_foundation.sql
//     lines 32-46) also declares a `completed_at timestamptz` column. It is a
//     DIFFERENT table and is NOT evidence about `activity_logs`.
//   * The tracked migrations only ever `alter table public.activity_logs add column
//     family_id` (202609190001). Everything else about the table is inferred from
//     runtime SQL casts, which is why the columns below are marked as a projection.
//   * `public.thinking_game_*` tables are intentionally NOT created here: they are
//     owned by the P04 backend migration and must come from that migration, not
//     from a test fixture.
//
// AUTH SIMULATION
//   `auth.uid()`, `auth.role()` and `auth.jwt()` are simulated with `current_setting`
//   on the `request.jwt.claims` / `request.jwt.claim.sub` / `request.jwt.claim.role`
//   GUCs, exactly like PostgREST + Supabase. `public.current_family_id()` is derived
//   from `auth.uid()` and the membership table - never a hard-coded constant - so a
//   changed claim changes the tenant. Reads that assert a policy MUST run under a
//   non-superuser role (`SET ROLE authenticated`); RLS is never disabled.
import { createSqlTestDatabase, stopSqlTestServer } from './sql-test-database.mjs';
import pg from 'pg';

const ROLE_PATTERN = /^[a-z_][a-z0-9_]*$/;

// ---------------------------------------------------------------------------
// Identities
// ---------------------------------------------------------------------------

export const THINKING_GAMES_IDENTITIES = Object.freeze({
  families: {
    alpha: '11111111-1111-4111-8111-111111111111',
    beta: '22222222-2222-4222-8222-222222222222',
  },
  users: {
    parentAlpha: 'aaaaaaaa-0000-4000-8000-00000000000a',
    guardianAlpha: 'aaaaaaaa-0000-4000-8000-00000000000b',
    caregiverAlpha: 'aaaaaaaa-0000-4000-8000-00000000000c',
    parentBeta: 'bbbbbbbb-0000-4000-8000-00000000000d',
  },
  children: {
    alpha: 'cccccccc-0000-4000-8000-00000000000a',
    beta: 'cccccccc-0000-4000-8000-00000000000b',
  },
  sessions: {
    childAlphaLive: {
      id: 'eeeeeeee-0000-4000-8000-00000000000a',
      tokenHash: 'harness-token-child-alpha-live',
    },
    childAlphaRevoked: {
      id: 'eeeeeeee-0000-4000-8000-00000000000b',
      tokenHash: 'harness-token-child-alpha-revoked',
    },
    childBetaLive: {
      id: 'eeeeeeee-0000-4000-8000-00000000000c',
      tokenHash: 'harness-token-child-beta-live',
    },
  },
});

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const AUTH_SCHEMA_SQL = `
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text,
  created_at timestamptz not null default now()
);

-- Supabase-compatible dynamic auth context. Never a constant: the value always
-- comes from the request GUCs, so a changed claim changes the tenant.
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role() returns text
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

create or replace function auth.jwt() returns jsonb
language sql stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;
`;

// The small, explicitly labelled harness fixture: families, memberships, child
// profiles and child device sessions, with the production-shaped RLS policies.
export const HARNESS_SCHEMA_SQL = `
-- ==== HARNESS FIXTURE (test-only projection of the production schema) ====
-- This is NOT the production schema. It exists so the harness itself can be
-- proven against real PostgreSQL before any game migration exists.
${AUTH_SCHEMA_SQL}

create table if not exists public.families (
  id uuid primary key,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.family_memberships (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'parent', 'guardian', 'caregiver')),
  created_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create table if not exists public.child_profiles (
  id uuid primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  name text,
  birth_year integer,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, family_id)
);

create table if not exists public.device_sessions (
  id uuid primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  token_hash text not null unique,
  capabilities text[] not null default '{}',
  revoked_at timestamptz,
  expires_at timestamptz,
  last_seen_at timestamptz,
  constraint device_sessions_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade
);

-- Production-shaped helpers (supabase/migrations/202609190001_family_tenancy.sql
-- lines 101-142). current_family_id() is derived from auth.uid(); it is never a
-- fixed constant.
create or replace function public.current_family_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select membership.family_id
  from public.family_memberships membership
  where membership.user_id = auth.uid()
  order by membership.created_at
  limit 1
$$;

create or replace function public.is_family_member(target_family_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.family_memberships membership
    where membership.family_id = target_family_id
      and membership.user_id = auth.uid()
  )
$$;

create or replace function public.can_manage_family(target_family_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.family_memberships membership
    where membership.family_id = target_family_id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'parent', 'guardian')
  )
$$;

-- Child-session lookup: a revoked session must resolve to nothing.
create or replace function public.resolve_child_session(session_token_hash text) returns uuid
language sql stable security definer set search_path = ''
as $$
  select session.child_id
  from public.device_sessions session
  where session.token_hash = session_token_hash
    and session.revoked_at is null
    and (session.expires_at is null or session.expires_at > now())
$$;

alter table public.families enable row level security;
alter table public.families force row level security;
alter table public.family_memberships enable row level security;
alter table public.family_memberships force row level security;
alter table public.child_profiles enable row level security;
alter table public.child_profiles force row level security;
alter table public.device_sessions enable row level security;
alter table public.device_sessions force row level security;

create policy families_select_member on public.families
  for select to authenticated using (public.is_family_member(id));

create policy memberships_select_family on public.family_memberships
  for select to authenticated using (public.is_family_member(family_id));

create policy children_select_family on public.child_profiles
  for select to authenticated using (public.is_family_member(family_id));
create policy children_insert_family on public.child_profiles
  for insert to authenticated with check (public.can_manage_family(family_id));
create policy children_update_family on public.child_profiles
  for update to authenticated
  using (public.can_manage_family(family_id)) with check (public.can_manage_family(family_id));
create policy children_delete_family on public.child_profiles
  for delete to authenticated using (public.can_manage_family(family_id));

create policy sessions_select_family on public.device_sessions
  for select to authenticated using (public.is_family_member(family_id));

revoke all on function auth.uid() from public;
revoke all on function auth.role() from public;
revoke all on function auth.jwt() from public;
revoke all on function public.current_family_id() from public;
revoke all on function public.is_family_member(uuid) from public;
revoke all on function public.can_manage_family(uuid) from public;
revoke all on function public.resolve_child_session(text) from public;

grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;
grant execute on function auth.jwt() to anon, authenticated, service_role;
grant execute on function public.current_family_id() to anon, authenticated, service_role;
grant execute on function public.is_family_member(uuid) to anon, authenticated, service_role;
grant execute on function public.can_manage_family(uuid) to anon, authenticated, service_role;
grant execute on function public.resolve_child_session(text) to anon, authenticated, service_role;

grant select on public.families, public.family_memberships, public.child_profiles, public.device_sessions
  to authenticated;
grant insert, update, delete on public.child_profiles to authenticated;
-- ==== END HARNESS FIXTURE ====
`;

// The production-shaped MINIMUM BASELINE the future thinking-games migration needs.
// Only tables that already exist in the product are declared here; the
// thinking_game_* tables are owned by the P04 migration and are NOT faked here.
export const BASELINE_SCHEMA_SQL = `
-- ==== MINIMUM BASELINE for the upcoming thinking-games migration ====
-- Columns are a projection cross-checked against the tracked migrations and the
-- runtime SQL casts. The base CREATE TABLE for public.activity_logs is absent
-- from this repository, so completed_at is declared WITHOUT a default and every
-- insert must supply it explicitly. The thinking-games migration is expected to
-- add its own reviewed_at column (contracts.md section 7.1); that is the P04
-- migration's job, not this fixture's.
${HARNESS_SCHEMA_SQL}

create table if not exists public.parent_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  marketing_consent boolean not null default false
);

create table if not exists public.parent_settings (
  family_id uuid primary key references public.families(id) on delete cascade,
  parent_pin_hash text,
  parent_pin_configured_at timestamptz,
  parent_pin_failed_attempts integer not null default 0,
  parent_pin_locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.family_engagement_settings (
  family_id uuid primary key references public.families(id) on delete cascade,
  paused_at timestamptz,
  pause_reason text,
  updated_at timestamptz not null default now()
);

create table if not exists public.habit_activities (
  id uuid primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid references public.child_profiles(id) on delete cascade,
  title text,
  description text,
  instructions text,
  icon text,
  category text,
  points integer not null default 10,
  requires_approval boolean not null default false,
  is_active boolean not null default true,
  recurrence_type text not null default 'daily',
  recurrence_days jsonb,
  time_of_day text,
  duration_minutes integer,
  target_age_stage text,
  is_parent_role boolean,
  created_at timestamptz not null default now(),
  unique (id, family_id)
);

create table if not exists public.activity_logs (
  id uuid primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid default auth.uid(),
  child_id uuid not null,
  activity_id uuid not null,
  log_date date not null,
  status text not null,
  points_awarded integer not null default 0,
  completed_at timestamptz,
  proof_note text,
  unique (activity_id, child_id, log_date),
  constraint activity_logs_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint activity_logs_activity_family_fk foreign key (activity_id, family_id)
    references public.habit_activities(id, family_id) on delete cascade
);

create table if not exists public.child_task_deferrals (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  activity_id uuid not null,
  local_date date not null,
  deferred_at timestamptz not null default now(),
  primary key (child_id, activity_id, local_date),
  constraint child_task_deferrals_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint child_task_deferrals_activity_family_fk foreign key (activity_id, family_id)
    references public.habit_activities(id, family_id) on delete cascade
);

alter table public.parent_profiles enable row level security;
alter table public.parent_profiles force row level security;
alter table public.parent_settings enable row level security;
alter table public.parent_settings force row level security;
alter table public.family_engagement_settings enable row level security;
alter table public.family_engagement_settings force row level security;
alter table public.habit_activities enable row level security;
alter table public.habit_activities force row level security;
alter table public.activity_logs enable row level security;
alter table public.activity_logs force row level security;
alter table public.child_task_deferrals enable row level security;
alter table public.child_task_deferrals force row level security;

create policy parent_profiles_self on public.parent_profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy parent_settings_select_family on public.parent_settings
  for select to authenticated using (public.is_family_member(family_id));
create policy parent_settings_manage_family on public.parent_settings
  for all to authenticated
  using (public.can_manage_family(family_id)) with check (public.can_manage_family(family_id));

create policy family_engagement_settings_read on public.family_engagement_settings
  for select to authenticated using (public.is_family_member(family_id));
create policy family_engagement_settings_manage on public.family_engagement_settings
  for all to authenticated
  using (public.can_manage_family(family_id)) with check (public.can_manage_family(family_id));

create policy activities_select_family on public.habit_activities
  for select to authenticated using (public.is_family_member(family_id));
create policy activities_insert_family on public.habit_activities
  for insert to authenticated with check (public.can_manage_family(family_id));
create policy activities_update_family on public.habit_activities
  for update to authenticated
  using (public.can_manage_family(family_id)) with check (public.can_manage_family(family_id));
create policy activities_delete_family on public.habit_activities
  for delete to authenticated using (public.can_manage_family(family_id));

create policy activity_logs_select_family on public.activity_logs
  for select to authenticated using (public.is_family_member(family_id));
create policy activity_logs_insert_family on public.activity_logs
  for insert to authenticated with check (public.can_manage_family(family_id));
create policy activity_logs_update_family on public.activity_logs
  for update to authenticated
  using (public.can_manage_family(family_id)) with check (public.can_manage_family(family_id));
create policy activity_logs_delete_family on public.activity_logs
  for delete to authenticated using (public.can_manage_family(family_id));

create policy child_task_deferrals_read on public.child_task_deferrals
  for select to authenticated using (public.is_family_member(family_id));

revoke all on function public.current_family_id() from public;
revoke all on function public.is_family_member(uuid) from public;
revoke all on function public.can_manage_family(uuid) from public;
revoke all on function public.resolve_child_session(text) from public;

grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant execute on function auth.role() to anon, authenticated, service_role;
grant execute on function auth.jwt() to anon, authenticated, service_role;
grant execute on function public.current_family_id() to anon, authenticated, service_role;
grant execute on function public.is_family_member(uuid) to anon, authenticated, service_role;
grant execute on function public.can_manage_family(uuid) to anon, authenticated, service_role;
grant execute on function public.resolve_child_session(text) to anon, authenticated, service_role;

grant select on public.families, public.family_memberships, public.child_profiles, public.device_sessions,
  public.parent_profiles, public.parent_settings, public.habit_activities, public.activity_logs,
  public.child_task_deferrals, public.family_engagement_settings to authenticated;
grant insert, update, delete on public.child_profiles, public.habit_activities, public.activity_logs to authenticated;

-- ==== PRODUCTION HABIT RPCs (pre-existing, from 202610090030_family_operations_hardening.sql) ====
-- These are the six authoritative habit command paths. The migration CREATE OR REPLACEs them.
-- ACLs match production after 202610050002_close_pin_gated_originals.sql:
--   review_habit_command, review_habits_command: only postgres (owner) can execute directly.
--   Access is via review_habit_command_as, review_habits_command_as (service_role only).
--   complete_habit_command, undo_habit_command: postgres, authenticated, service_role.
--   complete_child_habit_command, undo_child_habit_command: postgres, anon, authenticated, service_role.

-- act_as_user helper (from 202610050001_pin_gated_server_wrappers.sql)
create or replace function public.act_as_user(actor_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if actor_user_id is null then raise exception 'actor_required'; end if;
  if not exists (select 1 from auth.users where id = actor_user_id) then raise exception 'actor_not_found'; end if;
  perform set_config('request.jwt.claim.sub', actor_user_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', actor_user_id, 'role', 'authenticated')::text,
    true
  );
end
$$;

-- Server-only wrappers (from 202610050001_pin_gated_server_wrappers.sql)
-- Only service_role can call these; they run as the acting parent and delegate to the originals.
create or replace function public.review_habit_command_as(actor_user_id uuid, target_log_id uuid, decision text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.act_as_user(actor_user_id);
  return public.review_habit_command(target_log_id, decision);
end
$$;

create or replace function public.review_habits_command_as(actor_user_id uuid, target_log_ids uuid[], decision text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.act_as_user(actor_user_id);
  return public.review_habits_command(target_log_ids, decision);
end
$$;
-- Six legacy habit RPCs (from 202610090030_family_operations_hardening.sql)
create or replace function public.complete_habit_command(
  target_activity_id uuid, target_child_id uuid, target_log_date date, command_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare fid uuid := public.current_family_id(); activity public.habit_activities%rowtype;
  awarded integer; next_status text; inserted boolean;
begin
  if fid is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(fid) then raise exception 'family_manage_required'; end if;
  if target_log_date is null or target_log_date not between current_date - 2 and current_date + 1 then raise exception 'log_date_out_of_range'; end if;
  select * into activity from public.habit_activities where id=target_activity_id and family_id=fid and is_active for share;
  if not found then raise exception 'activity_not_found'; end if;
  if activity.child_id is not null and activity.child_id <> target_child_id then raise exception 'activity_child_mismatch'; end if;
  perform 1 from public.child_profiles where id=target_child_id and family_id=fid for update;
  if not found then raise exception 'child_not_found'; end if;
  next_status := case when activity.requires_approval then 'pending_approval' else 'completed' end;
  awarded := case when activity.requires_approval then 0 else activity.points end;
  insert into public.activity_logs(id,family_id,user_id,activity_id,child_id,log_date,status,points_awarded)
    values(command_id,fid,auth.uid(),target_activity_id,target_child_id,target_log_date,next_status,awarded)
    on conflict (activity_id,child_id,log_date) do nothing;
  inserted := found;
  if not inserted then return jsonb_build_object('status','duplicate'); end if;
  if awarded > 0 then update public.child_profiles set points=points+awarded,total_earned=total_earned+awarded,
    level=greatest(1,floor((total_earned+awarded)/100.0)::integer+1) where id=target_child_id and family_id=fid; end if;
  perform public.recompute_child_streak(target_child_id);
  return jsonb_build_object('status',next_status,'logId',command_id,'pointsAwarded',awarded);
end $$;

create or replace function public.complete_child_habit_command(
  session_token_hash text, target_activity_id uuid, target_log_date date, command_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.device_sessions%rowtype; activity public.habit_activities%rowtype;
  awarded integer; next_status text;
begin
  select * into s from public.device_sessions where token_hash=session_token_hash and revoked_at is null
    and expires_at>now() and 'child:complete'=any(capabilities)
  for update;
  if not found then return jsonb_build_object('status','session_invalid'); end if;
  if target_log_date is null or target_log_date not between current_date - 2 and current_date + 1 then raise exception 'log_date_out_of_range'; end if;
  select * into activity from public.habit_activities where id=target_activity_id and family_id=s.family_id and is_active for share;
  if not found then raise exception 'activity_not_found'; end if;
  if activity.child_id is not null and activity.child_id <> s.child_id then raise exception 'activity_child_mismatch'; end if;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(s.child_id));
  next_status := case when activity.requires_approval then 'pending_approval' else 'completed' end;
  awarded := case when activity.requires_approval then 0 else activity.points end;
  insert into public.activity_logs(id,family_id,user_id,activity_id,child_id,log_date,status,points_awarded)
    values(command_id,s.family_id,null,target_activity_id,s.child_id,target_log_date,next_status,awarded)
    on conflict (activity_id,child_id,log_date) do update set status=next_status,points_awarded=awarded
    where activity_logs.status='pending_approval' returning id into command_id;
  if awarded > 0 then update public.child_profiles set points=points+awarded,total_earned=total_earned+awarded,
    level=greatest(1,floor((total_earned+awarded)/100.0)::integer+1) where id=s.child_id and family_id=s.family_id; end if;
  perform public.recompute_child_streak(s.child_id);
  return jsonb_build_object('status',next_status,'logId',command_id,'pointsAwarded',awarded);
end $$;

create or replace function public.undo_habit_command(target_log_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare fid uuid:=public.current_family_id(); l public.activity_logs%rowtype; c public.child_profiles%rowtype;
begin
  if fid is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(fid) then raise exception 'family_manage_required'; end if;
  select * into l from public.activity_logs where id=target_log_id and family_id=fid for update;
  if not found then raise exception 'log_not_found'; end if;
  if l.status='pending_approval' then update public.activity_logs set status='cancelled' where id=l.id;
    return jsonb_build_object('status','cancelled'); end if;
  if l.status='rejected' then return jsonb_build_object('status','already_rejected'); end if;
  if l.status='cancelled' then return jsonb_build_object('status','already_cancelled'); end if;
  if l.points_awarded>0 then
    select * into c from public.child_profiles where id=l.child_id and family_id=fid for update;
    if c.points < l.points_awarded then raise exception 'points_already_spent'; end if;
    update public.child_profiles set points=points-l.points_awarded,total_earned=total_earned-l.points_awarded,
      level=greatest(1,floor((total_earned-l.points_awarded)/100.0)::integer+1) where id=l.child_id and family_id=fid;
  end if;
  update public.activity_logs set status='undone',points_awarded=0 where id=l.id;
  perform public.recompute_child_streak(l.child_id);
  return jsonb_build_object('status','undone');
end $$;
create or replace function public.undo_child_habit_command(session_token_hash text,target_log_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.device_sessions%rowtype; l public.activity_logs%rowtype; c public.child_profiles%rowtype;
begin
  select * into s from public.device_sessions where token_hash=session_token_hash and revoked_at is null
    and expires_at>now() and 'child:complete'=any(capabilities) for update;
  if not found then return jsonb_build_object('status','session_invalid'); end if;
  select * into l from public.activity_logs where id=target_log_id and child_id=s.child_id and family_id=s.family_id for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if l.status='pending_approval' then update public.activity_logs set status='cancelled' where id=l.id;
    return jsonb_build_object('status','cancelled'); end if;
  if l.status in ('rejected','cancelled','undone') then return jsonb_build_object('status',l.status); end if;
  if l.points_awarded>0 then
    select * into c from public.child_profiles where id=l.child_id and family_id=s.family_id for update;
    if c.points < l.points_awarded then raise exception 'points_already_spent'; end if;
    update public.child_profiles set points=points-l.points_awarded,total_earned=total_earned-l.points_awarded,
      level=greatest(1,floor((total_earned-l.points_awarded)/100.0)::integer+1) where id=l.child_id and family_id=s.family_id;
  end if;
  update public.activity_logs set status='undone',points_awarded=0 where id=l.id;
  perform public.recompute_child_streak(l.child_id);
  return jsonb_build_object('status','undone');
end $$;

create or replace function public.review_habit_command(target_log_id uuid, decision text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare fid uuid:=public.current_family_id(); l public.activity_logs%rowtype; award integer;
begin
  if fid is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(fid) then raise exception 'family_manage_required'; end if;
  if decision not in ('approve','reject') then raise exception 'invalid_decision'; end if;
  select * into l from public.activity_logs where id=target_log_id and family_id=fid for update;
  if not found then raise exception 'log_not_found'; end if;
  if l.status <> 'pending_approval' then return jsonb_build_object('status','already_reviewed'); end if;
  if decision='reject' then update public.activity_logs set status='rejected',points_awarded=0 where id=l.id;
    return jsonb_build_object('status','rejected');
  else
    select points into award from public.habit_activities where id=l.activity_id and family_id=fid;
    update public.activity_logs set status='approved',points_awarded=award where id=l.id;
    update public.child_profiles set points=points+award,total_earned=total_earned+award,
      level=greatest(1,floor((total_earned+award)/100.0)::integer+1) where id=l.child_id and family_id=fid;
    perform public.recompute_child_streak(l.child_id);
    return jsonb_build_object('status','approved','pointsAwarded',award);
  end if;
end $$;
create or replace function public.review_habits_command(target_log_ids uuid[], decision text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor_family_id uuid := public.current_family_id();
  ordered_ids uuid[];
  current_id uuid;
  outcome jsonb;
  results jsonb := '[]'::jsonb;
  l_status text;
  l_points integer;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  if decision not in ('approve','reject') then raise exception 'invalid_decision'; end if;
  if target_log_ids is null or cardinality(target_log_ids) = 0 then raise exception 'no_logs'; end if;

  select coalesce(array_agg(id order by id), '{}'::uuid[]) into ordered_ids
  from (select distinct unnest(target_log_ids) as id) ids;
  if cardinality(ordered_ids) > 50 then raise exception 'too_many_logs'; end if;

  perform 1 from public.activity_logs
  where id = any(ordered_ids) and family_id = actor_family_id
  order by id for update;
  perform 1 from public.child_profiles
  where family_id = actor_family_id
    and id in (select child_id from public.activity_logs where id = any(ordered_ids) and family_id = actor_family_id)
  order by id for update;

  foreach current_id in array ordered_ids loop
    if not exists (
      select 1 from public.activity_logs where id = current_id and family_id = actor_family_id
    ) then
      results := results || jsonb_build_object('logId', current_id, 'status', 'not_found');
    else
      -- Delegate to review_habit_command for consistent level calculation and audit trail
      perform public.review_habit_command(current_id, decision);
      select status, points_awarded into l_status, l_points from public.activity_logs where id = current_id;
      results := results || jsonb_build_object('logId', current_id, 'status', l_status, 'pointsAwarded', l_points);
    end if;
  end loop;

  return jsonb_build_object('status', 'reviewed', 'results', results);
end $$;

-- Production ACLs (matching 202610050002_close_pin_gated_originals.sql + wrapper grants from 202610050001)
-- review_habit_command and review_habits_command: ONLY postgres (owner) can execute directly.
-- Access is via _as wrappers granted to service_role only.
revoke all on function public.review_habit_command(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.review_habits_command(uuid[], text) from public, anon, authenticated, service_role;

revoke all on function public.review_habit_command_as(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.review_habits_command_as(uuid, uuid[], text) from public, anon, authenticated;
grant execute on function public.review_habit_command_as(uuid, uuid, text) to service_role;
grant execute on function public.review_habits_command_as(uuid, uuid[], text) to service_role;

-- complete_habit_command, undo_habit_command: postgres (owner), authenticated, service_role
revoke all on function public.complete_habit_command(uuid,uuid,date,uuid) from public, anon;
revoke all on function public.undo_habit_command(uuid) from public, anon;
grant execute on function public.complete_habit_command(uuid,uuid,date,uuid) to authenticated, service_role;
grant execute on function public.undo_habit_command(uuid) to authenticated, service_role;

-- complete_child_habit_command, undo_child_habit_command: postgres (owner), anon, authenticated, service_role
revoke all on function public.complete_child_habit_command(text,uuid,date,uuid) from public;
revoke all on function public.undo_child_habit_command(text,uuid) from public;
grant execute on function public.complete_child_habit_command(text,uuid,date,uuid) to anon, authenticated, service_role;
grant execute on function public.undo_child_habit_command(text,uuid) to anon, authenticated, service_role;

-- act_as_user: no grants to any role (internal helper only)
revoke all on function public.act_as_user(uuid) from public, anon, authenticated, service_role;

-- ==== END MINIMUM BASELINE ====
`;

// ---------------------------------------------------------------------------
// Auth context helpers
// ---------------------------------------------------------------------------

export function buildClaims(userId, { role = 'authenticated', email = null, extra = {} } = {}) {
  return { sub: userId, role, ...(email ? { email } : {}), ...extra };
}

function assertSafeRole(role) {
  if (!ROLE_PATTERN.test(role)) throw new Error(`Unsafe role identifier: ${role}`);
  return role;
}

/**
 * Sets the request GUCs that PostgREST would set, then switches the session role.
 * Session-level GUCs are used on purpose: the pg client runs statements in
 * implicit transactions, so a transaction-local setting would be lost immediately.
 */
export async function applyAuthContext(client, { role = null, claims = null } = {}) {
  if (role) await client.query(`set role ${assertSafeRole(role)}`);
  else await client.query('reset role');
  if (claims) {
    await client.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify(claims)]);
    await client.query(`select set_config('request.jwt.claim.sub', $1, false)`, [String(claims.sub ?? '')]);
    await client.query(`select set_config('request.jwt.claim.role', $1, false)`, [String(claims.role ?? '')]);
  }
}

/** Clears the request GUCs so no tenant can be reused. The role is left untouched. */
export async function clearClaims(client) {
  await client.query(`select set_config('request.jwt.claims', '', false)`);
  await client.query(`select set_config('request.jwt.claim.sub', '', false)`);
  await client.query(`select set_config('request.jwt.claim.role', '', false)`);
}

/** Returns the session to its login role (postgres) and drops every request claim. */
export async function resetAuthContext(client) {
  await client.query('reset role');
  await clearClaims(client);
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const SEED_SQL = `
insert into auth.users (id, email) values
  ('${THINKING_GAMES_IDENTITIES.users.parentAlpha}', 'parent-alpha@example.test'),
  ('${THINKING_GAMES_IDENTITIES.users.guardianAlpha}', 'guardian-alpha@example.test'),
  ('${THINKING_GAMES_IDENTITIES.users.caregiverAlpha}', 'caregiver-alpha@example.test'),
  ('${THINKING_GAMES_IDENTITIES.users.parentBeta}', 'parent-beta@example.test');

insert into public.families (id, created_by) values
  ('${THINKING_GAMES_IDENTITIES.families.alpha}', '${THINKING_GAMES_IDENTITIES.users.parentAlpha}'),
  ('${THINKING_GAMES_IDENTITIES.families.beta}', '${THINKING_GAMES_IDENTITIES.users.parentBeta}');

insert into public.family_memberships (family_id, user_id, role, created_at) values
  ('${THINKING_GAMES_IDENTITIES.families.alpha}', '${THINKING_GAMES_IDENTITIES.users.parentAlpha}', 'owner', now() - interval '3 days'),
  ('${THINKING_GAMES_IDENTITIES.families.alpha}', '${THINKING_GAMES_IDENTITIES.users.guardianAlpha}', 'guardian', now() - interval '2 days'),
  ('${THINKING_GAMES_IDENTITIES.families.alpha}', '${THINKING_GAMES_IDENTITIES.users.caregiverAlpha}', 'caregiver', now() - interval '1 day'),
  ('${THINKING_GAMES_IDENTITIES.families.beta}', '${THINKING_GAMES_IDENTITIES.users.parentBeta}', 'owner', now() - interval '3 days');

insert into public.child_profiles (id, family_id, name, birth_year, points) values
  ('${THINKING_GAMES_IDENTITIES.children.alpha}', '${THINKING_GAMES_IDENTITIES.families.alpha}', 'Child Alpha', 2017, 120),
  ('${THINKING_GAMES_IDENTITIES.children.beta}', '${THINKING_GAMES_IDENTITIES.families.beta}', 'Child Beta', 2014, 40);

insert into public.device_sessions (id, family_id, child_id, token_hash, capabilities, revoked_at, expires_at, last_seen_at) values
  ('${THINKING_GAMES_IDENTITIES.sessions.childAlphaLive.id}', '${THINKING_GAMES_IDENTITIES.families.alpha}', '${THINKING_GAMES_IDENTITIES.children.alpha}', '${THINKING_GAMES_IDENTITIES.sessions.childAlphaLive.tokenHash}', array['child:read', 'child:complete'], null, now() + interval '1 day', now() - interval '1 hour'),
  ('${THINKING_GAMES_IDENTITIES.sessions.childAlphaRevoked.id}', '${THINKING_GAMES_IDENTITIES.families.alpha}', '${THINKING_GAMES_IDENTITIES.children.alpha}', '${THINKING_GAMES_IDENTITIES.sessions.childAlphaRevoked.tokenHash}', array['child:read', 'child:complete'], now() - interval '30 minutes', now() + interval '1 day', now() - interval '2 hours'),
  ('${THINKING_GAMES_IDENTITIES.sessions.childBetaLive.id}', '${THINKING_GAMES_IDENTITIES.families.beta}', '${THINKING_GAMES_IDENTITIES.children.beta}', '${THINKING_GAMES_IDENTITIES.sessions.childBetaLive.tokenHash}', array['child:read', 'child:complete'], null, now() + interval '1 day', now() - interval '1 hour');
`;

async function databaseExists(databaseName) {
  const url = new URL(process.env.SQL_TEST_DATABASE_URL);
  url.pathname = '/postgres';
  const control = new pg.Client({ connectionString: url.href });
  await control.connect();
  try {
    const result = await control.query('select 1 from pg_database where datname = $1', [databaseName]);
    return result.rowCount > 0;
  } finally {
    await control.end();
  }
}

/**
 * Creates a disposable per-test database, applies the schema and seeds the
 * fixture identities. The helper only ever creates and drops its own
 * `kidhabit_test_*` database; the root `postgres` database and every other
 * database on the server are left untouched.
 */
export async function createThinkingGamesFixture({ schema = HARNESS_SCHEMA_SQL, label = 'harness' } = {}) {
  const db = await createSqlTestDatabase();
  try {
    await db.exec(schema);
    // Seeding runs as the server login role (a superuser) because RLS is
    // enforced. Seeding is NOT a policy proof; every policy proof in the smoke
    // runner switches to the non-superuser `authenticated` role first.
    await db.exec(SEED_SQL);
  } catch (error) {
    await db.close();
    throw error;
  }
  const client = db.client;
  const nameRow = await client.query('select current_database() as name');
  const databaseName = nameRow.rows[0].name;

  return {
    label,
    databaseName,
    identities: THINKING_GAMES_IDENTITIES,
    db,
    client,
    exec: sql => db.exec(sql),
    query: (sql, args) => db.query(sql, args),
    async rows(sql, args) {
      const result = await db.query(sql, args);
      return result.rows;
    },
    async one(sql, args) {
      const result = await db.query(sql, args);
      return result.rows[0];
    },
    async scalar(sql, args) {
      const result = await db.query(sql, args);
      return result.rows[0] ? Object.values(result.rows[0])[0] : null;
    },
    /**
     * Resolves a family-local "today" (date) and year from the actual DB clock and
     * an IANA family timezone (e.g. 'Asia/Ho_Chi_Minh' or 'UTC'). Runtime tests pass
     * these values into the day-gate SQL as expected_local_day so they always agree
     * with the function's server_day = (now() at time zone <timezone>)::date, never
     * the Node/browser UTC date. This keeps tests green across the UTC/local midnight
     * boundary without weakening any day-gate assertion.
     */
    async familyClock(timezone) {
      const row = await db.query(
        `select (now() at time zone $1)::date::text as local_day,
                extract(year from (now() at time zone $1)::date)::int as local_year`,
        [timezone]);
      return { localDay: row.rows[0].local_day, localYear: Number(row.rows[0].local_year) };
    },
    applyAuthContext: options => applyAuthContext(client, options),
    clearClaims: () => clearClaims(client),
    resetAuthContext: () => resetAuthContext(client),
    async close() {
      await db.close();
    },
  };
}

export { stopSqlTestServer, databaseExists };
