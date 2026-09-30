begin;

-- The pairing exchange is reached through the server route, which derives the caller
-- fingerprint from the request. Direct calls with an invented fingerprint would get a fresh
-- attempt budget each time, so only the service role may run it. A global budget also caps
-- how many attempts any number of callers can make per minute, and old counters are pruned.

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
  global_record public.pairing_rate_limits%rowtype;
  global_key constant bytea := decode(repeat('00', 32), 'hex');
  created_session_id uuid;
  created_session_expiry timestamptz := now() + interval '30 days';
begin
  insert into public.pairing_rate_limits (fingerprint_hash, window_started_at, attempts)
  values (global_key, now(), 1)
  on conflict (fingerprint_hash) do update set
    window_started_at = case
      when public.pairing_rate_limits.window_started_at < now() - interval '1 minute' then now()
      else public.pairing_rate_limits.window_started_at
    end,
    attempts = case
      when public.pairing_rate_limits.window_started_at < now() - interval '1 minute' then 1
      else public.pairing_rate_limits.attempts + 1
    end
  returning * into global_record;

  if global_record.attempts > 120 then
    return query select 'rate_limited', null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if random() < 0.02 then
    delete from public.pairing_rate_limits stale
    where stale.window_started_at < now() - interval '1 day' and stale.fingerprint_hash <> global_key;
  end if;

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

revoke all on function public.exchange_pairing_credential(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.exchange_pairing_credential(text, text, text, text, text, text) to service_role;

commit;
