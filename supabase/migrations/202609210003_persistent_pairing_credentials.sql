begin;

create table public.pairing_credentials (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  rotation_nonce uuid not null default gen_random_uuid(),
  display_code_id text not null unique check (display_code_id ~ '^[A-HJ-NP-Z2-9]{4}$'),
  verifier_hash bytea not null,
  token_hash bytea not null unique,
  rotated_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade,
  unique (family_id, child_id),
  foreign key (child_id, family_id) references public.child_profiles(id, family_id) on delete cascade
);

alter table public.pairing_credentials enable row level security;
alter table public.pairing_credentials force row level security;

create policy pairing_credentials_select_manager on public.pairing_credentials
  for select to authenticated using (public.can_manage_family(family_id));

revoke all on public.pairing_credentials from anon, authenticated;
grant select on public.pairing_credentials to authenticated;

create or replace function public.ensure_pairing_credential(
  target_child_id uuid,
  proposed_rotation_nonce uuid,
  proposed_display_code_id text,
  proposed_verifier_hash text,
  proposed_token_hash text
)
returns table (rotation_nonce uuid, rotated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_family_id uuid := public.current_family_id();
begin
  if actor_id is null or actor_family_id is null or not public.can_manage_family(actor_family_id) then
    return;
  end if;
  if not exists (
    select 1 from public.child_profiles child
    where child.id = target_child_id and child.family_id = actor_family_id
  ) then
    return;
  end if;

  insert into public.pairing_credentials (
    family_id, child_id, rotation_nonce, display_code_id, verifier_hash, token_hash, created_by
  ) values (
    actor_family_id,
    target_child_id,
    proposed_rotation_nonce,
    upper(proposed_display_code_id),
    decode(proposed_verifier_hash, 'hex'),
    decode(proposed_token_hash, 'hex'),
    actor_id
  ) on conflict (family_id, child_id) do nothing;

  return query
  select credential.rotation_nonce, credential.rotated_at
  from public.pairing_credentials credential
  where credential.family_id = actor_family_id and credential.child_id = target_child_id;
end
$$;

create or replace function public.rotate_pairing_credential(
  target_child_id uuid,
  next_rotation_nonce uuid,
  next_display_code_id text,
  next_verifier_hash text,
  next_token_hash text
)
returns table (rotation_nonce uuid, rotated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_family_id uuid := public.current_family_id();
begin
  if actor_id is null or actor_family_id is null or not public.can_manage_family(actor_family_id) then
    return;
  end if;
  if not exists (
    select 1 from public.child_profiles child
    where child.id = target_child_id and child.family_id = actor_family_id
  ) then
    return;
  end if;

  insert into public.pairing_credentials (
    family_id, child_id, rotation_nonce, display_code_id, verifier_hash, token_hash, created_by
  ) values (
    actor_family_id,
    target_child_id,
    next_rotation_nonce,
    upper(next_display_code_id),
    decode(next_verifier_hash, 'hex'),
    decode(next_token_hash, 'hex'),
    actor_id
  )
  on conflict (family_id, child_id) do update set
    rotation_nonce = excluded.rotation_nonce,
    display_code_id = excluded.display_code_id,
    verifier_hash = excluded.verifier_hash,
    token_hash = excluded.token_hash,
    rotated_at = now(),
    created_by = excluded.created_by;

  return query
  select credential.rotation_nonce, credential.rotated_at
  from public.pairing_credentials credential
  where credential.family_id = actor_family_id and credential.child_id = target_child_id;
end
$$;

create or replace function public.exchange_pairing_credential(
  manual_code_id text,
  manual_verifier_hash text,
  pairing_token_hash text,
  session_token_hash text,
  request_fingerprint_hex text,
  requested_device_label text default null
)
returns table (
  exchange_status text,
  device_session_id uuid,
  family_id uuid,
  child_id uuid,
  session_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  credential public.pairing_credentials%rowtype;
  rate_record public.pairing_rate_limits%rowtype;
  created_session_id uuid;
  created_session_expiry timestamptz := now() + interval '30 days';
begin
  insert into public.pairing_rate_limits (fingerprint_hash, window_started_at, attempts)
  values (decode(request_fingerprint_hex, 'hex'), now(), 1)
  on conflict (fingerprint_hash) do update set
    window_started_at = case
      when public.pairing_rate_limits.window_started_at < now() - interval '10 minutes' then now()
      else public.pairing_rate_limits.window_started_at
    end,
    attempts = case
      when public.pairing_rate_limits.window_started_at < now() - interval '10 minutes' then 1
      else public.pairing_rate_limits.attempts + 1
    end
  returning * into rate_record;

  if rate_record.attempts > 10 then
    return query select 'rate_limited', null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if pairing_token_hash is not null then
    select * into credential
    from public.pairing_credentials stored
    where stored.token_hash = decode(pairing_token_hash, 'hex');
  elsif manual_code_id is not null and manual_verifier_hash is not null then
    select * into credential
    from public.pairing_credentials stored
    where stored.display_code_id = upper(manual_code_id)
      and stored.verifier_hash = decode(manual_verifier_hash, 'hex');
  end if;

  if not found then
    return query select 'invalid', null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  insert into public.device_sessions (
    family_id, child_id, token_hash, capabilities, expires_at, device_label, last_seen_at
  ) values (
    credential.family_id,
    credential.child_id,
    session_token_hash,
    array['child:read', 'child:complete'],
    created_session_expiry,
    nullif(left(requested_device_label, 80), ''),
    now()
  ) returning id into created_session_id;

  insert into public.device_audit_log (family_id, child_id, device_session_id, event_type)
  values (credential.family_id, credential.child_id, created_session_id, 'paired');

  return query select 'ok', created_session_id, credential.family_id, credential.child_id, created_session_expiry;
end
$$;

revoke all on function public.ensure_pairing_credential(uuid, uuid, text, text, text) from public;
revoke all on function public.rotate_pairing_credential(uuid, uuid, text, text, text) from public;
revoke all on function public.exchange_pairing_credential(text, text, text, text, text, text) from public;
grant execute on function public.ensure_pairing_credential(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.rotate_pairing_credential(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.exchange_pairing_credential(text, text, text, text, text, text) to anon, authenticated;

commit;
