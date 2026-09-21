begin;

create table if not exists public.pairing_challenges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  display_code_id text not null unique check (display_code_id ~ '^[A-Z2-9]{4}$'),
  verifier_hash bytea not null,
  attempts_remaining smallint not null default 5 check (attempts_remaining between 0 and 5),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  foreign key (child_id, family_id) references public.child_profiles(id, family_id) on delete cascade
);

create table if not exists public.pairing_rate_limits (
  fingerprint_hash bytea primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0)
);

alter table public.device_sessions add column if not exists device_label text;
alter table public.device_sessions add column if not exists last_seen_at timestamptz;

create table if not exists public.device_audit_log (
  id bigint generated always as identity primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid references public.child_profiles(id) on delete set null,
  device_session_id uuid references public.device_sessions(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('challenge_created', 'challenge_revoked', 'paired', 'replayed', 'expired', 'rate_limited', 'device_revoked')),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists pairing_challenges_family_child_idx
  on public.pairing_challenges(family_id, child_id, created_at desc);
create index if not exists pairing_challenges_expiry_idx
  on public.pairing_challenges(expires_at) where consumed_at is null and revoked_at is null;
create index if not exists device_audit_family_time_idx
  on public.device_audit_log(family_id, occurred_at desc);

alter table public.pairing_challenges enable row level security;
alter table public.pairing_challenges force row level security;
alter table public.pairing_rate_limits enable row level security;
alter table public.pairing_rate_limits force row level security;
alter table public.device_audit_log enable row level security;
alter table public.device_audit_log force row level security;

create policy pairing_challenges_select_family on public.pairing_challenges
  for select to authenticated using (public.is_family_member(family_id));
create policy pairing_challenges_insert_family on public.pairing_challenges
  for insert to authenticated with check (
    public.can_manage_family(family_id)
    and created_by = auth.uid()
    and exists (
      select 1 from public.child_profiles child
      where child.id = child_id and child.family_id = pairing_challenges.family_id
    )
  );
create policy pairing_challenges_update_family on public.pairing_challenges
  for update to authenticated using (public.can_manage_family(family_id))
  with check (public.can_manage_family(family_id));

create policy device_audit_select_family on public.device_audit_log
  for select to authenticated using (public.is_family_member(family_id));

revoke all on public.pairing_rate_limits from anon, authenticated;
revoke all on public.device_sessions from anon, authenticated;
revoke insert, update, delete on public.device_audit_log from anon, authenticated;
grant select, insert, update on public.pairing_challenges to authenticated;
grant select on public.device_audit_log to authenticated;
grant select on public.device_sessions to authenticated;
create policy device_sessions_select_family on public.device_sessions
  for select to authenticated using (public.is_family_member(family_id));

create or replace function public.audit_pairing_challenge_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.device_audit_log (family_id, child_id, actor_user_id, event_type)
    values (new.family_id, new.child_id, auth.uid(), 'challenge_created');
  elsif old.revoked_at is null and new.revoked_at is not null then
    insert into public.device_audit_log (family_id, child_id, actor_user_id, event_type)
    values (new.family_id, new.child_id, auth.uid(), 'challenge_revoked');
  end if;
  return new;
end
$$;

drop trigger if exists pairing_challenge_audit on public.pairing_challenges;
create trigger pairing_challenge_audit
  after insert or update on public.pairing_challenges
  for each row execute procedure public.audit_pairing_challenge_change();

create or replace function public.revoke_device_session(target_device_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.device_sessions%rowtype;
begin
  select * into target
  from public.device_sessions device
  where device.id = target_device_session_id
  for update;

  if not found or not public.can_manage_family(target.family_id) then
    return false;
  end if;

  update public.device_sessions
  set revoked_at = coalesce(revoked_at, now())
  where id = target.id;

  insert into public.device_audit_log (
    family_id,
    child_id,
    device_session_id,
    actor_user_id,
    event_type
  ) values (
    target.family_id,
    target.child_id,
    target.id,
    auth.uid(),
    'device_revoked'
  );

  return true;
end
$$;

revoke all on function public.revoke_device_session(uuid) from public;
grant execute on function public.revoke_device_session(uuid) to authenticated;

create or replace function public.exchange_pairing_challenge(
  code_id text,
  verifier_hash_hex text,
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
  challenge public.pairing_challenges%rowtype;
  rate_record public.pairing_rate_limits%rowtype;
  created_session_id uuid;
  created_session_expiry timestamptz := now() + interval '30 days';
begin
  insert into public.pairing_rate_limits (fingerprint_hash, window_started_at, attempts)
  values (decode(request_fingerprint_hex, 'hex'), now(), 1)
  on conflict (fingerprint_hash) do update
  set
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

  select * into challenge
  from public.pairing_challenges pairing
  where pairing.display_code_id = upper(code_id)
  for update;

  if not found then
    return query select 'invalid', null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if challenge.revoked_at is not null then
    return query select 'revoked', null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if challenge.consumed_at is not null then
    insert into public.device_audit_log (family_id, child_id, event_type)
    values (challenge.family_id, challenge.child_id, 'replayed');
    return query select 'consumed', null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if challenge.expires_at <= now() then
    insert into public.device_audit_log (family_id, child_id, event_type)
    values (challenge.family_id, challenge.child_id, 'expired');
    return query select 'expired', null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if challenge.attempts_remaining <= 0 then
    return query select 'attempts_exhausted', null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if challenge.verifier_hash <> decode(verifier_hash_hex, 'hex') then
    update public.pairing_challenges
    set attempts_remaining = greatest(attempts_remaining - 1, 0)
    where id = challenge.id;
    return query select 'invalid', null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  update public.pairing_challenges
  set consumed_at = now()
  where id = challenge.id and consumed_at is null;

  insert into public.device_sessions (
    family_id,
    child_id,
    token_hash,
    capabilities,
    expires_at,
    device_label,
    last_seen_at
  ) values (
    challenge.family_id,
    challenge.child_id,
    session_token_hash,
    array['child:read', 'child:complete'],
    created_session_expiry,
    nullif(left(requested_device_label, 80), ''),
    now()
  ) returning id into created_session_id;

  insert into public.device_audit_log (
    family_id,
    child_id,
    device_session_id,
    event_type
  ) values (
    challenge.family_id,
    challenge.child_id,
    created_session_id,
    'paired'
  );

  return query select
    'ok',
    created_session_id,
    challenge.family_id,
    challenge.child_id,
    created_session_expiry;
end
$$;

revoke all on function public.exchange_pairing_challenge(text, text, text, text, text) from public;
grant execute on function public.exchange_pairing_challenge(text, text, text, text, text) to anon, authenticated;

create or replace function public.get_child_session(session_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
  result jsonb;
begin
  select * into child_session
  from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:read' = any(device.capabilities)
  for update;

  if not found then
    return null;
  end if;

  update public.device_sessions
  set last_seen_at = now()
  where id = child_session.id;

  select jsonb_build_object(
    'deviceSessionId', child_session.id,
    'expiresAt', child_session.expires_at,
    'child', jsonb_build_object(
      'id', child.id,
      'name', child.name,
      'nickname', child.nickname,
      'avatar', child.avatar,
      'themeColor', child.theme_color,
      'points', child.points,
      'totalEarned', child.total_earned,
      'level', child.level,
      'streak', child.streak,
      'birthYear', child.birth_year,
      'ageStage', child.age_stage,
      'lastActiveDate', child.last_active_date,
      'leagueTier', child.league_tier,
      'createdAt', child.created_at
    ),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', activity.id,
        'childId', activity.child_id,
        'title', activity.title,
        'description', activity.description,
        'icon', activity.icon,
        'category', activity.category,
        'points', activity.points,
        'recurrenceType', activity.recurrence_type,
        'recurrenceDays', activity.recurrence_days,
        'timeOfDay', activity.time_of_day,
        'durationMinutes', activity.duration_minutes,
        'requiresApproval', activity.requires_approval,
        'isActive', activity.is_active,
        'targetAgeStage', activity.target_age_stage,
        'isParentRole', activity.is_parent_role,
        'portrait16Key', activity.portrait16_key,
        'boThi7Key', activity.bo_thi7_key,
        'createdAt', activity.created_at
      ) order by activity.created_at)
      from public.habit_activities activity
      where activity.family_id = child_session.family_id
        and (activity.child_id is null or activity.child_id = child_session.child_id)
        and activity.is_active
    ), '[]'::jsonb),
    'rewards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', reward.id,
        'title', reward.title,
        'description', reward.description,
        'icon', reward.icon,
        'costPoints', reward.cost_points,
        'stock', reward.stock,
        'isActive', reward.is_active,
        'createdAt', reward.created_at
      ) order by reward.created_at)
      from public.rewards reward
      where reward.family_id = child_session.family_id and reward.is_active
    ), '[]'::jsonb)
  ) into result
  from public.child_profiles child
  where child.id = child_session.child_id
    and child.family_id = child_session.family_id;

  return result;
end
$$;

create or replace function public.revoke_child_session(session_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.device_sessions%rowtype;
begin
  select * into target
  from public.device_sessions device
  where device.token_hash = session_token_hash and device.revoked_at is null
  for update;

  if not found then
    return false;
  end if;

  update public.device_sessions
  set revoked_at = coalesce(revoked_at, now())
  where id = target.id;

  insert into public.device_audit_log (
    family_id,
    child_id,
    device_session_id,
    event_type
  ) values (
    target.family_id,
    target.child_id,
    target.id,
    'device_revoked'
  );

  return true;
end
$$;

revoke all on function public.get_child_session(text) from public;
revoke all on function public.revoke_child_session(text) from public;
grant execute on function public.get_child_session(text) to anon, authenticated;
grant execute on function public.revoke_child_session(text) to anon, authenticated;

commit;
