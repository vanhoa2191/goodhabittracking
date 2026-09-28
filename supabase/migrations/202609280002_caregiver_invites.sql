alter table public.family_memberships
  drop constraint if exists family_memberships_role_check;
alter table public.family_memberships
  add constraint family_memberships_role_check
  check (role in ('owner', 'parent', 'guardian', 'caregiver'));

create table if not exists public.caregiver_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  token_hash bytea not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check ((accepted_at is null) = (accepted_by is null)),
  check ((revoked_at is null) = (revoked_by is null))
);

create index if not exists caregiver_invites_family_created_idx
  on public.caregiver_invites (family_id, created_at desc);

create table if not exists public.caregiver_invite_events (
  id bigint generated always as identity primary key,
  invite_id uuid not null references public.caregiver_invites(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'accepted', 'revoked')),
  occurred_at timestamptz not null default now()
);

create index if not exists caregiver_invite_events_family_idx
  on public.caregiver_invite_events (family_id, occurred_at desc);

alter table public.caregiver_invites enable row level security;
alter table public.caregiver_invite_events enable row level security;
revoke all on public.caregiver_invites from anon, authenticated;
revoke all on public.caregiver_invite_events from anon, authenticated;

create or replace function public.create_caregiver_invite(ttl_hours integer default 72)
returns table(invite_id uuid, token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_family_id uuid;
  raw_token text;
  created_invite public.caregiver_invites%rowtype;
begin
  if actor_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if ttl_hours < 1 or ttl_hours > 168 then
    raise exception 'invalid_invite_lifetime' using errcode = '22023';
  end if;

  select membership.family_id into actor_family_id
  from public.family_memberships membership
  where membership.user_id = actor_id and membership.role = 'owner'
  order by membership.created_at
  limit 1;
  if actor_family_id is null then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  raw_token := gen_random_uuid()::text || gen_random_uuid()::text;
  insert into public.caregiver_invites (
    family_id, token_hash, created_by, expires_at
  ) values (
    actor_family_id,
    extensions.digest(raw_token, 'sha256'),
    actor_id,
    now() + make_interval(hours => ttl_hours)
  ) returning * into created_invite;

  insert into public.caregiver_invite_events (invite_id, family_id, actor_user_id, event_type)
  values (created_invite.id, actor_family_id, actor_id, 'created');

  return query select created_invite.id, raw_token, created_invite.expires_at;
end;
$$;

create or replace function public.list_caregiver_invites()
returns table(
  invite_id uuid,
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_family_id uuid;
begin
  select membership.family_id into actor_family_id
  from public.family_memberships membership
  where membership.user_id = actor_id and membership.role = 'owner'
  order by membership.created_at
  limit 1;
  if actor_family_id is null then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  return query
  select invite.id, invite.expires_at, invite.accepted_at, invite.revoked_at, invite.created_at
  from public.caregiver_invites invite
  where invite.family_id = actor_family_id
  order by invite.created_at desc
  limit 20;
end;
$$;

create or replace function public.revoke_caregiver_invite(target_invite_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_family_id uuid;
  revoked_invite public.caregiver_invites%rowtype;
begin
  select membership.family_id into actor_family_id
  from public.family_memberships membership
  where membership.user_id = actor_id and membership.role = 'owner'
  order by membership.created_at
  limit 1;
  if actor_family_id is null then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  update public.caregiver_invites invite
  set revoked_at = now(), revoked_by = actor_id
  where invite.id = target_invite_id
    and invite.family_id = actor_family_id
    and invite.accepted_at is null
    and invite.revoked_at is null
  returning * into revoked_invite;
  if revoked_invite.id is null then return false; end if;

  insert into public.caregiver_invite_events (invite_id, family_id, actor_user_id, event_type)
  values (revoked_invite.id, actor_family_id, actor_id, 'revoked');
  return true;
end;
$$;

create or replace function public.accept_caregiver_invite(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target public.caregiver_invites%rowtype;
begin
  if actor_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if raw_token is null or length(raw_token) <> 72 then
    raise exception 'invalid_invite' using errcode = '22023';
  end if;

  select invite.* into target
  from public.caregiver_invites invite
  where invite.token_hash = extensions.digest(raw_token, 'sha256')
  for update;
  if target.id is null
    or target.accepted_at is not null
    or target.revoked_at is not null
    or target.expires_at <= now() then
    raise exception 'invite_unavailable' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.family_memberships membership
    where membership.user_id = actor_id
  ) then
    raise exception 'account_already_belongs_to_family' using errcode = '23505';
  end if;

  insert into public.family_memberships (family_id, user_id, role)
  values (target.family_id, actor_id, 'caregiver');
  update public.caregiver_invites
  set accepted_at = now(), accepted_by = actor_id
  where id = target.id;
  insert into public.caregiver_invite_events (invite_id, family_id, actor_user_id, event_type)
  values (target.id, target.family_id, actor_id, 'accepted');
  return target.family_id;
end;
$$;

revoke all on function public.create_caregiver_invite(integer) from public;
revoke all on function public.list_caregiver_invites() from public;
revoke all on function public.revoke_caregiver_invite(uuid) from public;
revoke all on function public.accept_caregiver_invite(text) from public;
grant execute on function public.create_caregiver_invite(integer) to authenticated;
grant execute on function public.list_caregiver_invites() to authenticated;
grant execute on function public.revoke_caregiver_invite(uuid) to authenticated;
grant execute on function public.accept_caregiver_invite(text) to authenticated;
