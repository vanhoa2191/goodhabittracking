begin;

create table if not exists public.thinking_game_settings (
  family_id uuid primary key references public.families(id) on delete cascade,
  enabled boolean not null default false,
  bonus_enabled boolean not null default false,
  timezone text,
  cutoff_local time not null default '19:00',
  bedtime_start_local time not null default '21:00',
  bedtime_end_local time not null default '07:00',
  age_track_override text check (age_track_override in ('age_6_8', 'age_9_12')),
  effective_from_local_day date,
  settings_version bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.thinking_game_settings add column if not exists pending_settings jsonb;
alter table public.thinking_game_settings add column if not exists pending_effective_local_day date;

create table if not exists public.thinking_game_journeys (
  child_id uuid primary key references public.child_profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  next_day_index integer not null default 1 check (next_day_index between 1 and 366),
  last_main_started_local_day date,
  updated_at timestamptz not null default now()
);

create table if not exists public.thinking_game_day_snapshots (
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  local_day date not null,
  timezone text not null,
  settings_version bigint not null,
  cutoff_at timestamptz not null,
  bedtime_start_at timestamptz not null,
  bedtime_end_at timestamptz not null,
  enabled boolean not null,
  mandatory_tasks jsonb not null default '[]'::jsonb,
  journey_day_index integer not null check (journey_day_index between 1 and 365),
  snapshot_at timestamptz not null default now(),
  primary key (child_id, local_day)
);

create table if not exists public.thinking_game_content (
  id text primary key,
  content_version text not null,
  day_index integer not null check (day_index between 1 and 365),
  slot_type text not null check (slot_type in ('main', 'bonus')),
  age_track text not null check (age_track in ('age_6_8', 'age_9_12')),
  locale text not null check (locale = 'vi'),
  game_type_id text not null,
  rule_variant_id text not null,
  status text not null check (status in ('design_only', 'reviewed', 'approved', 'retired')),
  checker_id text not null,
  public_payload jsonb not null,
  grading_payload jsonb not null,
  fingerprint text not null,
  unique (content_version, day_index, slot_type, age_track, locale)
);

create table if not exists public.thinking_game_entitlements (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  local_day date not null,
  slot_type text not null check (slot_type in ('main', 'bonus')),
  journey_day_index integer not null check (journey_day_index between 1 and 365),
  content_id text references public.thinking_game_content(id),
  content_version text not null,
  state text not null check (state in ('granted', 'started', 'finished', 'revoked_unused', 'revoked_after_use', 'expired')),
  command_id uuid not null,
  granted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, local_day, slot_type)
);

create table if not exists public.thinking_game_attempts (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null references public.thinking_game_entitlements(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  state text not null check (state in ('started', 'paused', 'finished', 'abandoned_rollover')),
  result jsonb,
  command_id uuid not null,
  unique (entitlement_id)
);

create table if not exists public.thinking_game_habit_receipts (
  log_id uuid primary key,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  local_day date not null,
  activity_id uuid not null references public.habit_activities(id) on delete restrict,
  received_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_status text check (review_status in ('approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.thinking_game_audit_events (
  id bigint generated always as identity primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  event_type text not null,
  entitlement_id uuid,
  attempt_id uuid,
  command_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists thinking_game_entitlements_child_day_idx
  on public.thinking_game_entitlements (child_id, local_day);
create index if not exists thinking_game_attempts_child_idx
  on public.thinking_game_attempts (child_id, started_at desc);

create or replace function public.thinking_game_activity_lock()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(coalesce(new.child_id, old.child_id)));
  return coalesce(new, old);
end $$;

create or replace function public.thinking_game_activity_receipt()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.thinking_game_habit_receipts
      (log_id, child_id, family_id, local_day, activity_id, received_at)
    values (new.id, new.child_id, new.family_id, new.log_date, new.activity_id, now())
    on conflict (log_id) do nothing;
  elsif new.status in ('approved', 'rejected') then
    update public.thinking_game_habit_receipts
    set reviewed_at = coalesce(reviewed_at, now()), review_status = new.status
    where log_id = new.id;
  end if;
  return new;
end $$;

create or replace function public.sync_thinking_game_bonus_for_child(target_child_id uuid, target_local_day date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare settings public.thinking_game_settings%rowtype; snapshot_row public.thinking_game_day_snapshots%rowtype;
  child_family uuid; bonus_content public.thinking_game_content%rowtype; bonus_id uuid;
  existing_bonus public.thinking_game_entitlements%rowtype;
begin
  select family_id into child_family from public.child_profiles where id=target_child_id;
  select * into settings from public.thinking_game_settings where family_id=child_family;
  if not found or not settings.enabled or not settings.bonus_enabled then return jsonb_build_object('status','disabled'); end if;
  select * into snapshot_row from public.thinking_game_day_snapshots
    where child_id=target_child_id and local_day=target_local_day;
  if not found or not snapshot_row.enabled or snapshot_row.mandatory_tasks='[]'::jsonb then
    return jsonb_build_object('status','not_eligible');
  end if;
  select * into existing_bonus from public.thinking_game_entitlements
    where child_id=target_child_id and local_day=target_local_day and slot_type='bonus'
    for update;
  if found then
    if existing_bonus.state in ('granted','started') then
      if exists (
        select 1 from jsonb_array_elements(snapshot_row.mandatory_tasks) task
        where not exists (
          select 1 from public.activity_logs log
          join public.thinking_game_habit_receipts receipt on receipt.log_id=log.id
          where log.child_id=target_child_id and log.activity_id=(task->>'activityId')::uuid
            and log.log_date=target_local_day and log.status in ('completed','approved')
            and receipt.received_at <= snapshot_row.cutoff_at
            and (coalesce((task->>'requiresApproval')::boolean,false)=false or log.status='approved')
        )
      ) then
        update public.thinking_game_entitlements
        set state = case when exists (
          select 1 from public.thinking_game_attempts
          where entitlement_id = existing_bonus.id
            and state in (
              'finished','abandoned_rollover','paused',
              case when existing_bonus.state = 'granted' then 'started' else null end
            )
        ) then 'revoked_after_use' else 'revoked_unused' end,
            updated_at = now()
        where id = existing_bonus.id;
      end if;
    elsif existing_bonus.state in ('revoked_unused','revoked_after_use') then
      if not exists (
        select 1 from jsonb_array_elements(snapshot_row.mandatory_tasks) task
        where not exists (
          select 1 from public.activity_logs log
          join public.thinking_game_habit_receipts receipt on receipt.log_id=log.id
          where log.child_id=target_child_id and log.activity_id=(task->>'activityId')::uuid
            and log.log_date=target_local_day and log.status in ('completed','approved')
            and receipt.received_at <= snapshot_row.cutoff_at
            and (coalesce((task->>'requiresApproval')::boolean,false)=false or log.status='approved')
        )
      ) then
        update public.thinking_game_entitlements
        set state='granted', updated_at=now()
        where id=existing_bonus.id;
      end if;
    end if;
    return jsonb_build_object('status','duplicate');
  end if;
  if exists (
    select 1 from jsonb_array_elements(snapshot_row.mandatory_tasks) task
    where not exists (
      select 1 from public.activity_logs log
      join public.thinking_game_habit_receipts receipt on receipt.log_id=log.id
      where log.child_id=target_child_id and log.activity_id=(task->>'activityId')::uuid
        and log.log_date=target_local_day and log.status in ('completed','approved')
        and receipt.received_at <= snapshot_row.cutoff_at
        and (coalesce((task->>'requiresApproval')::boolean,false)=false or log.status='approved')
    )
  ) then return jsonb_build_object('status','locked'); end if;
  select * into bonus_content from public.thinking_game_content
    where content_version=public.thinking_game_resolve_trusted_release_version()
      and day_index=snapshot_row.journey_day_index
      and slot_type='bonus' and status='approved' and locale='vi'
    order by id limit 1;
  if not found then return jsonb_build_object('status','content_unavailable'); end if;
  insert into public.thinking_game_entitlements(child_id,family_id,local_day,slot_type,journey_day_index,
    content_id,content_version,state,command_id)
    values(target_child_id,child_family,target_local_day,'bonus',snapshot_row.journey_day_index,
      bonus_content.id,bonus_content.content_version,'granted',gen_random_uuid())
    returning id into bonus_id;
  return jsonb_build_object('status','granted','entitlementId',bonus_id);
end $$;

drop trigger if exists thinking_game_activity_lock_receipt on public.activity_logs;
drop trigger if exists thinking_game_activity_lock_before on public.activity_logs;
drop trigger if exists thinking_game_activity_receipt_after on public.activity_logs;
create trigger thinking_game_activity_lock_before
  before insert or update of status or delete on public.activity_logs
  for each row execute function public.thinking_game_activity_lock();
create trigger thinking_game_activity_receipt_after
  after insert or update of status on public.activity_logs
  for each row execute function public.thinking_game_activity_receipt();
create or replace function public.thinking_game_activity_bonus_sync()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.sync_thinking_game_bonus_for_child(coalesce(new.child_id, old.child_id), coalesce(new.log_date, old.log_date));
  return coalesce(new, old);
end $$;
drop trigger if exists thinking_game_activity_bonus_sync_after on public.activity_logs;
drop trigger if exists thinking_game_activity_z_bonus_sync_after on public.activity_logs;
create trigger thinking_game_activity_z_bonus_sync_after
  after insert or update of status or delete on public.activity_logs
  for each row execute function public.thinking_game_activity_bonus_sync();
revoke all on function public.thinking_game_activity_lock() from public, anon, authenticated;
revoke all on function public.thinking_game_activity_receipt() from public, anon, authenticated;
revoke all on function public.thinking_game_activity_bonus_sync() from public, anon, authenticated;
revoke all on function public.sync_thinking_game_bonus_for_child(uuid,date) from public, anon, authenticated;

alter table public.thinking_game_settings enable row level security;
alter table public.thinking_game_day_snapshots enable row level security;
alter table public.thinking_game_entitlements enable row level security;
alter table public.thinking_game_attempts enable row level security;
alter table public.thinking_game_habit_receipts enable row level security;
alter table public.thinking_game_audit_events enable row level security;
alter table public.thinking_game_content enable row level security;
alter table public.thinking_game_settings force row level security;
alter table public.thinking_game_journeys enable row level security;
alter table public.thinking_game_journeys force row level security;
alter table public.thinking_game_day_snapshots force row level security;
alter table public.thinking_game_entitlements force row level security;
alter table public.thinking_game_attempts force row level security;
alter table public.thinking_game_habit_receipts force row level security;
alter table public.thinking_game_audit_events force row level security;
alter table public.thinking_game_content force row level security;
revoke all on public.thinking_game_settings, public.thinking_game_day_snapshots,
  public.thinking_game_entitlements, public.thinking_game_attempts,
  public.thinking_game_habit_receipts, public.thinking_game_audit_events,
  public.thinking_game_content from public, anon, authenticated;
create policy thinking_game_settings_read on public.thinking_game_settings for select to authenticated
  using (public.is_family_member(family_id));
create policy thinking_game_journey_read on public.thinking_game_journeys for select to authenticated
  using (public.is_family_member(family_id));
create policy thinking_game_snapshot_read on public.thinking_game_day_snapshots for select to authenticated
  using (public.is_family_member(family_id));
create policy thinking_game_entitlement_read on public.thinking_game_entitlements for select to authenticated
  using (public.is_family_member(family_id));
create policy thinking_game_attempt_read on public.thinking_game_attempts for select to authenticated
  using (public.is_family_member(family_id));
create policy thinking_game_audit_read on public.thinking_game_audit_events for select to authenticated
  using (public.is_family_member(family_id));
create policy thinking_game_content_read on public.thinking_game_content for select to authenticated
  using (status = 'approved');

create or replace function public.thinking_game_lock_key(target_child_id uuid)
returns bigint language sql immutable strict set search_path = '' as $$
  select ('x' || substr(md5('thinking_games:' || target_child_id::text), 1, 16))::bit(64)::bigint
$$;
revoke all on function public.thinking_game_lock_key(uuid) from public, anon, authenticated;

create or replace function public.thinking_game_resolve_age_track_for_child(target_child_id uuid, target_family_id uuid default null)
returns text language sql stable strict set search_path = '' as $$
  with child_record as (
    select cp.family_id, cp.birth_year,
      coalesce((select gs.age_track_override from public.thinking_game_settings gs where gs.family_id = coalesce(target_family_id, cp.family_id)), null) as override,
      (select gs.timezone from public.thinking_game_settings gs where gs.family_id = coalesce(target_family_id, cp.family_id)) as timezone
    from public.child_profiles cp
    where cp.id = target_child_id
  ),
  age_years as (
    select
      birth_year,
      timezone,
      case
        when birth_year is null or birth_year <= 0 or timezone is null then null
        else extract(year from age((now() at time zone timezone)::date, make_date(birth_year, 1, 1)))
      end as age_value
    from child_record
  )
  select coalesce(
    (select override from child_record where override is not null),
    case
      when (select birth_year from child_record) is null then 'age_track_unavailable'
      when (select age_value from age_years) between 6 and 8 then 'age_6_8'
      when (select age_value from age_years) between 9 and 12 then 'age_9_12'
      else 'age_track_unavailable'
    end
  );
$$;
revoke all on function public.thinking_game_resolve_age_track_for_child(uuid,uuid) from public, anon, authenticated;

create or replace function public.thinking_game_resolve_trusted_release_version()
returns text language sql stable strict set search_path = '' as $$
  select 'release-365-v1'::text;
$$;
revoke all on function public.thinking_game_resolve_trusted_release_version() from public, anon;
grant execute on function public.thinking_game_resolve_trusted_release_version() to authenticated, service_role;

create or replace function public.thinking_game_resolve_content_version()
returns text language sql stable set search_path = '' as $$
  select coalesce(
    nullif(current_setting('thinking_games.content_version', true), ''),
    public.thinking_game_resolve_trusted_release_version()
  );
$$;
revoke all on function public.thinking_game_resolve_content_version() from public, anon;
grant execute on function public.thinking_game_resolve_content_version() to authenticated, service_role;

create or replace function public.thinking_game_rollover_child(
  target_child_id uuid, target_family_id uuid, current_local_day date
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.thinking_game_attempts a
  set state = 'abandoned_rollover', finished_at = null
  from public.thinking_game_entitlements e
  where e.id = a.entitlement_id
    and e.child_id = target_child_id
    and e.family_id = target_family_id
    and e.local_day < current_local_day
    and a.state in ('started', 'paused');

  update public.thinking_game_entitlements
  set state = 'expired', updated_at = now()
  where child_id = target_child_id
    and family_id = target_family_id
    and local_day < current_local_day
    and state in ('granted', 'started');
end $$;
revoke all on function public.thinking_game_rollover_child(uuid,uuid,date) from public, anon, authenticated;

create or replace function public.thinking_game_apply_pending_settings(target_family_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.thinking_game_settings%rowtype; today date; p jsonb;
begin
  select * into s from public.thinking_game_settings where family_id=target_family_id;
  if not found or s.pending_settings is null or s.timezone is null then return; end if;
  begin today := (now() at time zone s.timezone)::date;
  exception when invalid_parameter_value then return; end;
  if s.pending_effective_local_day is null or s.pending_effective_local_day > today then return; end if;
  p := s.pending_settings;
  update public.thinking_game_settings set
    enabled = coalesce((p->>'enabled')::boolean, enabled),
    bonus_enabled = coalesce((p->>'bonusEnabled')::boolean, bonus_enabled),
    timezone = coalesce(p->>'timezone', timezone),
    cutoff_local = coalesce((p->>'cutoffLocal')::time, cutoff_local),
    bedtime_start_local = coalesce((p->>'bedtimeStartLocal')::time, bedtime_start_local),
    bedtime_end_local = coalesce((p->>'bedtimeEndLocal')::time, bedtime_end_local),
    age_track_override = case when p ? 'ageTrackOverride' then nullif(p->>'ageTrackOverride','') else age_track_override end,
    effective_from_local_day = pending_effective_local_day,
    pending_settings = null, pending_effective_local_day = null,
    settings_version = settings_version + 1, updated_at = now()
  where family_id=target_family_id;
end $$;
revoke all on function public.thinking_game_apply_pending_settings(uuid) from public, anon, authenticated;

create or replace function public.thinking_game_state(session_token_hash text, expected_local_day date default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.device_sessions%rowtype; settings public.thinking_game_settings%rowtype;
  server_day date; journey public.thinking_game_journeys%rowtype; snapshot public.thinking_game_day_snapshots%rowtype;
begin
  select * into s from public.device_sessions where token_hash=session_token_hash
    and revoked_at is null and expires_at > now() and 'child:read'=any(capabilities);
  if not found then raise exception 'session_invalid'; end if;
  perform public.thinking_game_apply_pending_settings(s.family_id);
  select * into settings from public.thinking_game_settings where family_id=s.family_id;
  if settings.timezone is null then return jsonb_build_object('ok',false,'code','timezone_required'); end if;
  begin server_day := (now() at time zone settings.timezone)::date;
  exception when invalid_parameter_value then raise exception 'timezone_invalid'; end;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(s.child_id));
  perform public.thinking_game_rollover_child(s.child_id, s.family_id, server_day);
  if expected_local_day is not null and expected_local_day <> server_day then
    return jsonb_build_object('ok',false,'code','day_changed','serverLocalDay',server_day);
  end if;
  select * into journey from public.thinking_game_journeys where child_id=s.child_id;
  select * into snapshot from public.thinking_game_day_snapshots snapshot_row
    where snapshot_row.child_id=s.child_id and snapshot_row.local_day=server_day;
  return jsonb_build_object('ok',true,'serverLocalDay',server_day,'featureEnabled',coalesce(settings.enabled,false),
    'ageTrack',public.thinking_game_resolve_age_track_for_child(s.child_id,s.family_id),
    'journey',jsonb_build_object('nextDayIndex',coalesce(journey.next_day_index,1)),
    'snapshot',to_jsonb(snapshot));
end $$;

create or replace function public.thinking_game_start(session_token_hash text, p_slot_type text,
  p_expected_local_day date, command_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  return public.thinking_game_start(session_token_hash, p_slot_type, p_expected_local_day, command_id, public.thinking_game_resolve_content_version());
end $$;
grant execute on function public.thinking_game_start(text,text,date,uuid) to service_role;

create or replace function public.thinking_game_start(session_token_hash text, p_slot_type text,
  p_expected_local_day date, command_id uuid, p_content_version text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.device_sessions%rowtype; settings public.thinking_game_settings%rowtype;
  server_day date; local_now time; journey public.thinking_game_journeys%rowtype; e public.thinking_game_entitlements%rowtype;
  c public.thinking_game_content%rowtype; snap public.thinking_game_day_snapshots%rowtype; attempt public.thinking_game_attempts%rowtype;
    stale boolean := false;
begin
  select * into s from public.device_sessions where token_hash=session_token_hash and revoked_at is null and expires_at > now()
    and 'child:read'=any(capabilities);
  if not found then raise exception 'session_invalid'; end if;
  perform public.thinking_game_apply_pending_settings(s.family_id);
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(s.child_id));
  select * into settings from public.thinking_game_settings where family_id=s.family_id for share;
  if settings.timezone is null then raise exception 'timezone_required'; end if;
  begin server_day := (now() at time zone settings.timezone)::date; exception when invalid_parameter_value then raise exception 'timezone_invalid'; end;
  if p_expected_local_day <> server_day then raise exception 'day_changed'; end if;
  perform public.thinking_game_rollover_child(s.child_id, s.family_id, server_day);
  if settings.settings_version = 1
    and settings.effective_from_local_day = server_day
    and settings.pending_settings is null
  then
    raise exception 'feature_off';
  end if;
  if not coalesce(settings.enabled,false) then raise exception 'feature_off'; end if;
  if exists (select 1 from public.family_engagement_settings where family_id=s.family_id and paused_at is not null) then
    raise exception 'paused';
  end if;
  if p_slot_type not in ('main','bonus') then raise exception 'invalid_slot'; end if;
  local_now := (now() at time zone settings.timezone)::time;
  if settings.bedtime_end_local <= settings.bedtime_start_local then
    if local_now >= settings.bedtime_start_local or local_now < settings.bedtime_end_local then
      raise exception 'bedtime';
    end if;
  elsif local_now >= settings.bedtime_start_local and local_now < settings.bedtime_end_local then
    raise exception 'bedtime';
  end if;
  select * into e from public.thinking_game_entitlements entitlement_row
    where entitlement_row.child_id=s.child_id and entitlement_row.local_day=server_day
      and entitlement_row.slot_type=p_slot_type;
  if found and e.state <> 'granted' then
    select * into attempt from public.thinking_game_attempts where entitlement_id=e.id;
    if e.content_id is not null then
      select * into c from public.thinking_game_content where id=e.content_id;
    elsif e.content_version is not null then
      select * into c from public.thinking_game_content
        where content_version=e.content_version and slot_type=e.slot_type and day_index=e.journey_day_index
        order by id limit 1;
    end if;
    if c.id is not null and c.age_track is not null
      and c.age_track <> public.thinking_game_resolve_age_track_for_child(s.child_id, s.family_id)
    then
      update public.thinking_game_entitlements set state='revoked_unused', updated_at=now()
        where id=e.id;
      stale := true;
    end if;
    if e.id is not null and not stale then
      return jsonb_build_object('ok',true,'status',case when attempt.id is null then 'available' else 'started' end,
        'data',jsonb_build_object('entitlementId',e.id,'attemptId',attempt.id,'state',e.state,
          'contentVersion',e.content_version,'ageTrack',coalesce(c.age_track,public.thinking_game_resolve_age_track_for_child(s.child_id,s.family_id)),
          'puzzle',coalesce(c.public_payload,'{}'::jsonb)));
    end if;
  end if;
  select * into journey from public.thinking_game_journeys where child_id=s.child_id for update;
  if not found then insert into public.thinking_game_journeys(child_id,family_id) values(s.child_id,s.family_id) returning * into journey; end if;
  if p_slot_type='main' and journey.next_day_index > 365 then raise exception 'journey_complete'; end if;
  insert into public.thinking_game_day_snapshots(child_id,family_id,local_day,timezone,settings_version,cutoff_at,bedtime_start_at,bedtime_end_at,enabled,mandatory_tasks,journey_day_index)
    values(s.child_id,s.family_id,server_day,settings.timezone,settings.settings_version,
      (server_day::timestamp + settings.cutoff_local) at time zone settings.timezone,
      (server_day::timestamp + settings.bedtime_start_local) at time zone settings.timezone,
      ((server_day::timestamp + settings.bedtime_end_local
        + case when settings.bedtime_end_local <= settings.bedtime_start_local then interval '1 day' else interval '0 day' end)
        at time zone settings.timezone),
      settings.enabled,
      coalesce((select jsonb_agg(jsonb_build_object(
        'activityId', activity.id, 'requiresApproval', activity.requires_approval, 'title', activity.title
      ) order by activity.id) from public.habit_activities activity
        where activity.family_id=s.family_id and activity.child_id=s.child_id and activity.is_active), '[]'::jsonb),
      journey.next_day_index) on conflict do nothing returning * into snap;
  if snap.child_id is null then
    select * into snap from public.thinking_game_day_snapshots snapshot_row
      where snapshot_row.child_id=s.child_id and snapshot_row.local_day=server_day;
  end if;
  if p_slot_type='bonus' then
    if not settings.bonus_enabled then raise exception 'bonus_locked'; end if;
    if not exists (
      select 1 from public.thinking_game_entitlements main_entitlement
      where main_entitlement.child_id=s.child_id and main_entitlement.local_day=server_day
        and main_entitlement.slot_type='main'
        and main_entitlement.state in ('started','finished')
        and coalesce((select (result->>'won')::boolean from public.thinking_game_attempts main_attempt
          where main_attempt.entitlement_id=main_entitlement.id), false) = false
    ) then raise exception 'bonus_locked'; end if;
    if snap.mandatory_tasks = '[]'::jsonb then raise exception 'bonus_not_eligible'; end if;
    if exists (
      select 1 from jsonb_array_elements(snap.mandatory_tasks) task
      where not exists (
        select 1 from public.activity_logs log
        join public.thinking_game_habit_receipts receipt on receipt.log_id=log.id
        where log.child_id=s.child_id and log.activity_id=(task->>'activityId')::uuid
          and log.log_date=server_day and log.status in ('completed','approved')
          and receipt.received_at <= snap.cutoff_at
          and (coalesce((task->>'requiresApproval')::boolean,false) = false or log.status='approved')
      )
    ) then raise exception 'bonus_locked'; end if;
  end if;
  if public.thinking_game_resolve_age_track_for_child(s.child_id, s.family_id) = 'age_track_unavailable' then
    raise exception 'age_track_unavailable';
  end if;
  select * into c from public.thinking_game_content
    where content_version=p_content_version
      and day_index=(case when p_slot_type='bonus' then snap.journey_day_index else journey.next_day_index end)
      and thinking_game_content.slot_type=p_slot_type
      and (status='approved' or (status='design_only'
        and (current_user='service_role'
          or current_setting('request.jwt.claim.role', true)='service_role')))
    and age_track = public.thinking_game_resolve_age_track_for_child(s.child_id, s.family_id)
    and locale='vi' limit 1;
  if not found then raise exception 'content_unavailable'; end if;
  if e.id is not null then
    update public.thinking_game_entitlements
      set state='started', content_id=c.id, content_version=c.content_version,
        command_id=thinking_game_start.command_id, updated_at=now()
      where id=e.id
      returning * into e;
  else
    insert into public.thinking_game_entitlements(child_id,family_id,local_day,slot_type,journey_day_index,content_id,content_version,state,command_id)
      values(s.child_id,s.family_id,server_day,p_slot_type,journey.next_day_index,c.id,c.content_version,'started',thinking_game_start.command_id) returning * into e;
  end if;
  if attempt.id is null then
    insert into public.thinking_game_attempts(entitlement_id,child_id,family_id,state,command_id) values(e.id,s.child_id,s.family_id,'started',thinking_game_start.command_id) returning * into attempt;
  else
    update public.thinking_game_attempts set state='started', command_id=thinking_game_start.command_id
      where id=attempt.id returning * into attempt;
  end if;
  if p_slot_type='main' then
    update public.thinking_game_journeys
      set next_day_index=next_day_index+1,last_main_started_local_day=server_day,updated_at=now()
      where child_id=s.child_id;
  end if;
  return jsonb_build_object('ok',true,'status','started','data',jsonb_build_object('entitlementId',e.id,'attemptId',attempt.id,'puzzle',c.public_payload));
end $$;

create or replace function public.thinking_game_pause(session_token_hash text, attempt_id uuid, command_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.device_sessions%rowtype; a public.thinking_game_attempts%rowtype;
begin
  select * into s from public.device_sessions where token_hash=session_token_hash and revoked_at is null
    and expires_at > now() and 'child:read'=any(capabilities);
  if not found then raise exception 'session_invalid'; end if;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(s.child_id));
  select * into a from public.thinking_game_attempts where id=attempt_id and child_id=s.child_id for update;
  if not found then raise exception 'not_found'; end if;
  if a.state = 'finished' then raise exception 'already_finished'; end if;
  update public.thinking_game_attempts set state='paused', command_id=thinking_game_pause.command_id
    where id=a.id;
  return jsonb_build_object('ok',true,'status','paused','data',jsonb_build_object('attemptId',a.id));
end $$;

create or replace function public.thinking_game_finish(session_token_hash text, attempt_id uuid,
  answer jsonb, command_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.device_sessions%rowtype; a public.thinking_game_attempts%rowtype;
  e public.thinking_game_entitlements%rowtype; c public.thinking_game_content%rowtype;
  settings public.thinking_game_settings%rowtype; server_day date;
begin
  select * into s from public.device_sessions where token_hash=session_token_hash and revoked_at is null
    and expires_at > now() and 'child:read'=any(capabilities);
  if not found then raise exception 'session_invalid'; end if;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(s.child_id));
  select * into a from public.thinking_game_attempts where id=attempt_id and child_id=s.child_id for update;
  if not found then raise exception 'not_found'; end if;
  if a.state = 'finished' then
    return jsonb_build_object('ok',true,'status','duplicate','data',a.result);
  end if;
  select * into settings from public.thinking_game_settings where family_id=s.family_id;
  if settings.timezone is null then raise exception 'timezone_required'; end if;
  begin server_day := (now() at time zone settings.timezone)::date;
  exception when invalid_parameter_value then raise exception 'timezone_invalid'; end;
  perform public.thinking_game_rollover_child(s.child_id, s.family_id, server_day);
  select * into e from public.thinking_game_entitlements where id=a.entitlement_id for update;
  if e.local_day <> server_day then
    update public.thinking_game_attempts set state='abandoned_rollover' where id=a.id;
    update public.thinking_game_entitlements set state='expired',updated_at=now() where id=e.id;
    return jsonb_build_object('ok',false,'code','attempt_expired','status','expired',
      'data',jsonb_build_object('attemptId',a.id,'entitlementId',e.id,'localDay',e.local_day,'serverLocalDay',server_day));
  end if;
  select * into c from public.thinking_game_content where id=e.content_id
    and (status='approved' or (status='design_only'
      and (current_user='service_role'
      or current_setting('request.jwt.claim.role', true)='service_role')));
  if not found or c.grading_payload is null then raise exception 'content_unavailable'; end if;
  if answer is null or jsonb_typeof(answer) = 'null' then raise exception 'invalid_answer'; end if;
  -- Grading is owned by the reviewed server engine. Never infer a win from a
  -- client boolean or accept an answer until that checker is wired here.
  raise exception 'content_unavailable';
end $$;

create or replace function public.thinking_game_child_settings(session_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.device_sessions%rowtype; g public.thinking_game_settings%rowtype;
begin
  select * into s from public.device_sessions where token_hash=session_token_hash and revoked_at is null
    and expires_at > now() and 'child:read'=any(capabilities);
  if not found then raise exception 'session_invalid'; end if;
  perform public.thinking_game_apply_pending_settings(s.family_id);
  select * into g from public.thinking_game_settings where family_id=s.family_id;
  if not found then return jsonb_build_object('enabled',false,'timezoneConfigured',false); end if;
  return jsonb_build_object(
    'enabled',g.enabled,'bonusEnabled',g.bonus_enabled,'timezoneConfigured',g.timezone is not null,
    'ageTrackOverride',g.age_track_override,'ageTrack',public.thinking_game_resolve_age_track_for_child(s.child_id,s.family_id),
    'settingsVersion',g.settings_version,'effectiveFromLocalDay',g.effective_from_local_day
  );
end $$;

-- Parent dashboard gameplay uses the authenticated parent identity directly;
-- it never creates or borrows a paired child session.
create or replace function public.thinking_game_parent_state_as(
  actor_user_id uuid, target_child_id uuid, expected_local_day date default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare family uuid; settings public.thinking_game_settings%rowtype;
  server_day date; journey public.thinking_game_journeys%rowtype;
  snapshot public.thinking_game_day_snapshots%rowtype;
begin
  perform public.act_as_user(actor_user_id);
  perform set_config('request.jwt.claim.role', 'service_role', true);
  family := public.current_family_id();
  if family is null or not public.can_manage_family(family) then raise exception 'family_manage_required'; end if;
  if not exists (select 1 from public.child_profiles where id=target_child_id and family_id=family) then
    raise exception 'child_not_found';
  end if;
  perform public.thinking_game_apply_pending_settings(family);
  select * into settings from public.thinking_game_settings where family_id=family;
  if settings.timezone is null then raise exception 'timezone_required'; end if;
  begin server_day := (now() at time zone settings.timezone)::date;
  exception when invalid_parameter_value then raise exception 'timezone_invalid'; end;
  perform public.thinking_game_rollover_child(target_child_id, family, server_day);
  if expected_local_day is not null and expected_local_day <> server_day then
    return jsonb_build_object('ok',false,'code','day_changed','serverLocalDay',server_day);
  end if;
  select * into journey from public.thinking_game_journeys where child_id=target_child_id;
  select * into snapshot from public.thinking_game_day_snapshots
    where child_id=target_child_id and local_day=server_day;
  return jsonb_build_object('ok',true,'serverLocalDay',server_day,
    'featureEnabled',coalesce(settings.enabled,false),
    'ageTrack',public.thinking_game_resolve_age_track_for_child(target_child_id,family),
    'journey',jsonb_build_object('nextDayIndex',coalesce(journey.next_day_index,1)),
    'snapshot',to_jsonb(snapshot));
end $$;

create or replace function public.thinking_game_parent_start_as(
  actor_user_id uuid, target_child_id uuid, p_slot_type text,
  p_expected_local_day date, command_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  return public.thinking_game_parent_start_as(actor_user_id, target_child_id, p_slot_type, p_expected_local_day, command_id, public.thinking_game_resolve_content_version());
end $$;
grant execute on function public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid) to service_role;

create or replace function public.thinking_game_parent_start_as(
  actor_user_id uuid, target_child_id uuid, p_slot_type text,
  p_expected_local_day date, command_id uuid, p_content_version text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare family uuid; settings public.thinking_game_settings%rowtype;
  server_day date; local_now time; journey public.thinking_game_journeys%rowtype;
  snap public.thinking_game_day_snapshots%rowtype; c public.thinking_game_content%rowtype;
  e public.thinking_game_entitlements%rowtype; a public.thinking_game_attempts%rowtype;
  selected_track text;
begin
  perform public.act_as_user(actor_user_id);
  perform set_config('request.jwt.claim.role', 'service_role', true);
  family := public.current_family_id();
  if family is null or not public.can_manage_family(family) then raise exception 'family_manage_required'; end if;
  if not exists (select 1 from public.child_profiles where id=target_child_id and family_id=family) then raise exception 'child_not_found'; end if;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(target_child_id));
  perform public.thinking_game_apply_pending_settings(family);
  select * into settings from public.thinking_game_settings where family_id=family for share;
  if not found or not settings.enabled then raise exception 'feature_off'; end if;
  if settings.timezone is null then raise exception 'timezone_required'; end if;
  begin server_day := (now() at time zone settings.timezone)::date;
  exception when invalid_parameter_value then raise exception 'timezone_invalid'; end;
  if p_expected_local_day <> server_day then raise exception 'day_changed'; end if;
  perform public.thinking_game_rollover_child(target_child_id, family, server_day);
  if exists (select 1 from public.family_engagement_settings where family_id=family and paused_at is not null) then
    raise exception 'paused';
  end if;
  if p_slot_type not in ('main','bonus') then raise exception 'invalid_slot'; end if;
  local_now := (now() at time zone settings.timezone)::time;
  if settings.bedtime_end_local <= settings.bedtime_start_local then
    if local_now >= settings.bedtime_start_local or local_now < settings.bedtime_end_local then
      raise exception 'bedtime';
    end if;
  elsif local_now >= settings.bedtime_start_local and local_now < settings.bedtime_end_local then
    raise exception 'bedtime';
  end if;
  select * into e from public.thinking_game_entitlements
    where child_id=target_child_id and local_day=server_day and slot_type=p_slot_type;
  if found and e.state <> 'granted' then
    select * into a from public.thinking_game_attempts where entitlement_id=e.id;
    return jsonb_build_object('ok',true,'status',case when a.id is null then 'available' else 'started' end,
      'data',jsonb_build_object('entitlementId',e.id,'attemptId',a.id,'state',e.state));
  end if;
  select * into journey from public.thinking_game_journeys where child_id=target_child_id for update;
  if not found then insert into public.thinking_game_journeys(child_id,family_id) values(target_child_id,family) returning * into journey; end if;
  if p_slot_type='main' and journey.next_day_index > 365 then raise exception 'journey_complete'; end if;
  select * into snap from public.thinking_game_day_snapshots
    where child_id=target_child_id and local_day=server_day;
  if not found then
    insert into public.thinking_game_day_snapshots(child_id,family_id,local_day,timezone,settings_version,
      cutoff_at,bedtime_start_at,bedtime_end_at,enabled,mandatory_tasks,journey_day_index)
    values(target_child_id,family,server_day,settings.timezone,settings.settings_version,
      (server_day::timestamp + settings.cutoff_local) at time zone settings.timezone,
      (server_day::timestamp + settings.bedtime_start_local) at time zone settings.timezone,
      ((server_day::timestamp + settings.bedtime_end_local +
        case when settings.bedtime_end_local <= settings.bedtime_start_local then interval '1 day' else interval '0 day' end)
        at time zone settings.timezone),settings.enabled,
      coalesce((select jsonb_agg(jsonb_build_object(
        'activityId', activity.id, 'requiresApproval', activity.requires_approval, 'title', activity.title
      ) order by activity.id) from public.habit_activities activity
        where activity.family_id=family and activity.child_id=target_child_id and activity.is_active), '[]'::jsonb),
      journey.next_day_index) returning * into snap;
  end if;
  if p_slot_type='bonus' and not settings.bonus_enabled then raise exception 'bonus_locked'; end if;
  select public.thinking_game_resolve_age_track_for_child(target_child_id, family) into selected_track;
  if selected_track = 'age_track_unavailable' then raise exception 'age_track_unavailable'; end if;
  select * into c from public.thinking_game_content
    where content_version=p_content_version
      and day_index=snap.journey_day_index
      and slot_type=p_slot_type and thinking_game_content.age_track=selected_track and locale='vi'
      and (status='approved' or (status='design_only'
        and (current_user='service_role'
          or current_setting('request.jwt.claim.role', true)='service_role')))
    order by md5(target_child_id::text || ':' || server_day::text || ':' || p_slot_type || ':' || content_version || ':' || id)
    limit 1;
  if not found then raise exception 'content_unavailable'; end if;
  if e.id is not null then
    update public.thinking_game_entitlements
      set state='started', content_id=c.id, content_version=c.content_version,
        command_id=thinking_game_parent_start_as.command_id, updated_at=now()
      where id=e.id returning * into e;
  else
    insert into public.thinking_game_entitlements(child_id,family_id,local_day,slot_type,journey_day_index,
      content_id,content_version,state,command_id)
      values(target_child_id,family,server_day,p_slot_type,journey.next_day_index,c.id,c.content_version,'started',command_id)
      returning * into e;
  end if;
  insert into public.thinking_game_attempts(entitlement_id,child_id,family_id,state,command_id)
    values(e.id,target_child_id,family,'started',command_id) returning * into a;
  if p_slot_type='main' then update public.thinking_game_journeys
    set next_day_index=next_day_index+1,last_main_started_local_day=server_day,updated_at=now()
    where child_id=target_child_id; end if;
  return jsonb_build_object('ok',true,'status','started',
    'data',jsonb_build_object('entitlementId',e.id,'attemptId',a.id,'puzzle',c.public_payload));
end $$;

create or replace function public.thinking_game_parent_pause_as(
  actor_user_id uuid, target_child_id uuid, attempt_id uuid, command_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare family uuid; a public.thinking_game_attempts%rowtype;
begin
  perform public.act_as_user(actor_user_id); family := public.current_family_id();
  if family is null or not public.can_manage_family(family) then raise exception 'family_manage_required'; end if;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(target_child_id));
  select * into a from public.thinking_game_attempts where id=attempt_id and child_id=target_child_id and family_id=family for update;
  if not found then raise exception 'not_found'; end if;
  if a.state='finished' then raise exception 'already_finished'; end if;
  update public.thinking_game_attempts set state='paused', command_id=thinking_game_parent_pause_as.command_id where id=a.id;
  return jsonb_build_object('ok',true,'status','paused','data',jsonb_build_object('attemptId',a.id));
end $$;

create or replace function public.thinking_game_parent_finish_as(
  actor_user_id uuid, target_child_id uuid, attempt_id uuid, won boolean, answer jsonb, command_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare family uuid; settings public.thinking_game_settings%rowtype; server_day date;
  a public.thinking_game_attempts%rowtype; e public.thinking_game_entitlements%rowtype;
begin
  perform public.act_as_user(actor_user_id); family := public.current_family_id();
  if family is null or not public.can_manage_family(family) then raise exception 'family_manage_required'; end if;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(target_child_id));
  select * into a from public.thinking_game_attempts where id=attempt_id and child_id=target_child_id and family_id=family for update;
  if not found then raise exception 'not_found'; end if;
  if a.state='finished' then return jsonb_build_object('ok',true,'status','duplicate','data',a.result); end if;
  select * into e from public.thinking_game_entitlements where id=a.entitlement_id for update;
  select * into settings from public.thinking_game_settings where family_id=family;
  if settings.timezone is null then raise exception 'timezone_required'; end if;
  begin server_day := (now() at time zone settings.timezone)::date;
  exception when invalid_parameter_value then raise exception 'timezone_invalid'; end;
  perform public.thinking_game_rollover_child(target_child_id, family, server_day);
  if e.local_day <> server_day then
    update public.thinking_game_attempts set state='abandoned_rollover' where id=a.id;
    update public.thinking_game_entitlements set state='expired',updated_at=now() where id=e.id;
    return jsonb_build_object('ok',false,'code','attempt_expired','status','expired',
      'data',jsonb_build_object('attemptId',a.id,'entitlementId',e.id,'localDay',e.local_day,'serverLocalDay',server_day));
  end if;
  if not won then
    update public.thinking_game_attempts set result=jsonb_build_object('won',false,'lastAnswer',answer),
      command_id=thinking_game_parent_finish_as.command_id where id=a.id;
    return jsonb_build_object('ok',true,'status','retry','data',jsonb_build_object('attemptId',a.id,'won',false));
  end if;
  update public.thinking_game_attempts set state='finished',finished_at=now(),
    result=jsonb_build_object('won',true,'answer',answer),command_id=thinking_game_parent_finish_as.command_id where id=a.id;
  update public.thinking_game_entitlements set state='finished', updated_at=now() where id=e.id;
  return jsonb_build_object('ok',true,'status','finished','data',jsonb_build_object('attemptId',a.id,'won',true));
end $$;

create or replace function public.thinking_game_finish_verified(
  session_token_hash text, attempt_id uuid, won boolean, answer jsonb, command_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.device_sessions%rowtype; settings public.thinking_game_settings%rowtype;
  server_day date; a public.thinking_game_attempts%rowtype; e public.thinking_game_entitlements%rowtype;
begin
  select * into s from public.device_sessions where token_hash=session_token_hash and revoked_at is null
    and expires_at > now() and 'child:read'=any(capabilities);
  if not found then raise exception 'session_invalid'; end if;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(s.child_id));
  select * into a from public.thinking_game_attempts where id=attempt_id and child_id=s.child_id for update;
  if not found then raise exception 'not_found'; end if;
  if a.state='finished' then return jsonb_build_object('ok',true,'status','duplicate','data',a.result); end if;
  select * into e from public.thinking_game_entitlements where id=a.entitlement_id for update;
  select * into settings from public.thinking_game_settings where family_id=s.family_id;
  if settings.timezone is null then raise exception 'timezone_required'; end if;
  begin server_day := (now() at time zone settings.timezone)::date;
  exception when invalid_parameter_value then raise exception 'timezone_invalid'; end;
  perform public.thinking_game_rollover_child(s.child_id, s.family_id, server_day);
  if e.local_day <> server_day then
    update public.thinking_game_attempts
      set state='abandoned_rollover', finished_at=null
      where id=a.id and state in ('started','paused');
    update public.thinking_game_entitlements set state='expired',updated_at=now() where id=e.id;
    return jsonb_build_object('ok',false,'code','attempt_expired','status','expired',
      'data',jsonb_build_object('attemptId',a.id,'entitlementId',e.id,'localDay',e.local_day,'serverLocalDay',server_day));
  end if;
  if not won then
    update public.thinking_game_attempts set result=jsonb_build_object('won',false,'lastAnswer',answer),
      command_id=thinking_game_finish_verified.command_id where id=a.id;
    return jsonb_build_object('ok',true,'status','retry','data',jsonb_build_object('attemptId',a.id,'won',false));
  end if;
  update public.thinking_game_attempts set state='finished',finished_at=now(),
    result=jsonb_build_object('won',true,'answer',answer),command_id=thinking_game_finish_verified.command_id where id=a.id;
  update public.thinking_game_entitlements set state='finished',updated_at=now() where id=e.id;
  return jsonb_build_object('ok',true,'status','finished','data',jsonb_build_object('attemptId',a.id,'won',true));
end $$;

create or replace function public.thinking_game_preview_day(actor_user_id uuid, target_child_id uuid, target_local_day date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare family uuid; snap public.thinking_game_day_snapshots%rowtype; g public.thinking_game_settings%rowtype;
begin
  perform public.act_as_user(actor_user_id);
  family := public.current_family_id();
  if family is null or not public.can_manage_family(family) then raise exception 'family_manage_required'; end if;
  select * into g from public.thinking_game_settings where family_id=family;
  select * into snap from public.thinking_game_day_snapshots
    where child_id=target_child_id and family_id=family and local_day=target_local_day;
  if not found then return jsonb_build_object('status','not_snapshotted','localDay',target_local_day); end if;
  return jsonb_build_object('status','preview','localDay',snap.local_day,'childId',snap.child_id,
    'enabled',snap.enabled,'timezone',snap.timezone,'cutoffAt',snap.cutoff_at,
    'bedtimeStartAt',snap.bedtime_start_at,'bedtimeEndAt',snap.bedtime_end_at,
    'journeyDayIndex',snap.journey_day_index,'mandatoryTasks',snap.mandatory_tasks,
    'settingsVersion',snap.settings_version,'currentSettingsVersion',g.settings_version);
end $$;

create or replace function public.thinking_game_bonus_for_child(target_child_id uuid, target_local_day date)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(target_child_id));
  return public.sync_thinking_game_bonus_for_child(target_child_id, target_local_day);
end $$;

create or replace function public.thinking_game_update_settings_as(
  actor_user_id uuid, target_family_id uuid, new_enabled boolean, new_bonus_enabled boolean,
  new_timezone text, new_cutoff_local time, new_bedtime_start_local time,
  new_bedtime_end_local time, new_age_track_override text, command_id uuid
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare today date; next_day date; current_settings public.thinking_game_settings%rowtype;
  pending jsonb;
begin
  perform public.act_as_user(actor_user_id);
  if not public.can_manage_family(target_family_id) then raise exception 'family_manage_required'; end if;
  if new_timezone is null or new_timezone = '' then raise exception 'timezone_required'; end if;
  begin today := (now() at time zone new_timezone)::date;
  exception when invalid_parameter_value then raise exception 'timezone_invalid'; end;
  select * into current_settings from public.thinking_game_settings where family_id=target_family_id for update;
  if not found then
    insert into public.thinking_game_settings(family_id,enabled,bonus_enabled,timezone,cutoff_local,bedtime_start_local,bedtime_end_local,age_track_override,effective_from_local_day)
      values(target_family_id,new_enabled,new_bonus_enabled,new_timezone,new_cutoff_local,new_bedtime_start_local,new_bedtime_end_local,new_age_track_override,today)
      returning * into current_settings;
    return jsonb_build_object('status','updated','effectiveFromLocalDay',today,'settingsVersion',current_settings.settings_version,'commandId',command_id);
  end if;
  if not new_enabled then
    update public.thinking_game_settings set enabled=false, pending_settings=null, pending_effective_local_day=null,
      settings_version=settings_version+1, updated_at=now() where family_id=target_family_id;
    update public.thinking_game_entitlements set state='revoked_unused',updated_at=now()
      where family_id=target_family_id and state='granted' and local_day >= today;
    return jsonb_build_object('status','disabled','effectiveFromLocalDay',today,'settingsVersion',current_settings.settings_version+1,'commandId',command_id);
  end if;
  next_day := today + 1;
  pending := jsonb_build_object('enabled',new_enabled,'bonusEnabled',new_bonus_enabled,'timezone',new_timezone,
    'cutoffLocal',new_cutoff_local::text,'bedtimeStartLocal',new_bedtime_start_local::text,
    'bedtimeEndLocal',new_bedtime_end_local::text,'ageTrackOverride',new_age_track_override);
  update public.thinking_game_settings set pending_settings=pending,pending_effective_local_day=next_day,updated_at=now()
    where family_id=target_family_id;
  return jsonb_build_object('status','scheduled','effectiveFromLocalDay',next_day,
    'settingsVersion',current_settings.settings_version,'pending',pending,'commandId',command_id);
end $$;

create or replace function public.thinking_game_excuse_task_as(
  actor_user_id uuid, target_child_id uuid, target_local_day date, target_activity_id uuid,
  reason text, command_id uuid
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare family uuid; snap public.thinking_game_day_snapshots%rowtype; updated jsonb;
begin
  perform public.act_as_user(actor_user_id);
  family := public.current_family_id();
  if family is null or not public.can_manage_family(family) then raise exception 'family_manage_required'; end if;
  if nullif(trim(reason),'') is null then raise exception 'excuse_reason_required'; end if;
  select * into snap from public.thinking_game_day_snapshots
    where child_id=target_child_id and family_id=family and local_day=target_local_day for update;
  if not found then raise exception 'snapshot_not_found'; end if;
  updated := coalesce((select jsonb_agg(task) from jsonb_array_elements(snap.mandatory_tasks) task
    where (task->>'activityId')::uuid <> target_activity_id), '[]'::jsonb);
  update public.thinking_game_day_snapshots set mandatory_tasks=updated where child_id=target_child_id and local_day=target_local_day;
  insert into public.thinking_game_audit_events(family_id,child_id,event_type,command_id,payload)
    values(family,target_child_id,'task_excused',command_id,
      jsonb_build_object('activityId',target_activity_id,'localDay',target_local_day,'reason',trim(reason)));
  return jsonb_build_object('status','excused','childId',target_child_id,'localDay',target_local_day,
    'activityId',target_activity_id,'commandId',command_id);
end $$;

revoke all on function public.thinking_game_state(text,date) from public, anon, service_role;
revoke all on function public.thinking_game_start(text,text,date,uuid) from public, anon;
revoke all on function public.thinking_game_start(text,text,date,uuid,text) from public, anon;
revoke all on function public.thinking_game_pause(text,uuid,uuid), public.thinking_game_finish(text,uuid,jsonb,uuid)
  from public, anon, service_role;
revoke all on function public.thinking_game_child_settings(text), public.thinking_game_bonus_for_child(uuid,date)
  from public, anon, authenticated, service_role;
revoke all on function public.thinking_game_preview_day(uuid,uuid,date),
  public.thinking_game_update_settings_as(uuid,uuid,boolean,boolean,text,time,time,time,text,uuid),
  public.thinking_game_excuse_task_as(uuid,uuid,date,uuid,text,uuid)
  from public, anon, authenticated;
revoke all on function public.thinking_game_parent_state_as(uuid,uuid,date),
  public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid),
  public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid,text),
  public.thinking_game_parent_pause_as(uuid,uuid,uuid,uuid),
  public.thinking_game_parent_finish_as(uuid,uuid,uuid,boolean,jsonb,uuid)
  from public, anon, authenticated;
revoke all on function public.thinking_game_finish_verified(text,uuid,boolean,jsonb,uuid)
  from public, anon, authenticated;
grant execute on function public.thinking_game_child_settings(text) to anon, authenticated;
grant execute on function public.thinking_game_preview_day(uuid,uuid,date),
  public.thinking_game_update_settings_as(uuid,uuid,boolean,boolean,text,time,time,time,text,uuid),
  public.thinking_game_excuse_task_as(uuid,uuid,date,uuid,text,uuid)
  to service_role;
grant execute on function public.thinking_game_parent_state_as(uuid,uuid,date),
  public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid),
  public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid,text),
  public.thinking_game_parent_pause_as(uuid,uuid,uuid,uuid),
  public.thinking_game_parent_finish_as(uuid,uuid,uuid,boolean,jsonb,uuid) to service_role;
grant execute on function public.thinking_game_finish_verified(text,uuid,boolean,jsonb,uuid) to service_role;
grant execute on function public.thinking_game_state(text,date),
  public.thinking_game_pause(text,uuid,uuid) to anon, authenticated;
grant execute on function public.thinking_game_start(text,text,date,uuid),
  public.thinking_game_start(text,text,date,uuid,text),
  public.thinking_game_finish(text,uuid,jsonb,uuid) to service_role;

-- P04 habit integration: the authoritative command paths take the game lock
-- before any device/activity/log/profile row lock. Bonus sync is explicit so a
-- batch review performs one sync after its complete loop.
drop trigger if exists thinking_game_activity_bonus_sync_after on public.activity_logs;
drop trigger if exists thinking_game_activity_z_bonus_sync_after on public.activity_logs;

create or replace function public.complete_habit_command(
  target_activity_id uuid, target_child_id uuid, target_log_date date, command_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare fid uuid := public.current_family_id(); activity public.habit_activities%rowtype;
  awarded integer; next_status text; inserted boolean;
begin
  if fid is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(fid) then raise exception 'family_manage_required'; end if;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(target_child_id));
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
  perform public.sync_thinking_game_bonus_for_child(target_child_id,target_log_date);
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
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(s.child_id));
  if target_log_date is null or target_log_date not between current_date - 2 and current_date + 1 then raise exception 'log_date_out_of_range'; end if;
  select * into activity from public.habit_activities where id=target_activity_id and family_id=s.family_id
    and (child_id is null or child_id=s.child_id) and is_active for share;
  if not found then raise exception 'activity_not_found'; end if;
  if target_log_date < (activity.created_at at time zone 'UTC')::date - 1 then
    raise exception 'activity_not_started';
  end if;
  if not coalesce((case activity.recurrence_type when 'daily' then true when 'weekdays' then extract(dow from target_log_date)::integer between 1 and 5
    when 'weekends' then extract(dow from target_log_date)::integer in (0,6)
    when 'custom' then coalesce(activity.recurrence_days,'[]'::jsonb) @> jsonb_build_array(extract(dow from target_log_date)::integer) else false end),false)
    then raise exception 'activity_not_scheduled'; end if;
  perform 1 from public.child_profiles where id=s.child_id and family_id=s.family_id for update;
  if not found then raise exception 'child_not_found'; end if;
  next_status:=case when activity.requires_approval then 'pending_approval' else 'completed' end;
  awarded:=case when activity.requires_approval then 0 else activity.points end;
  insert into public.activity_logs(id,family_id,user_id,activity_id,child_id,log_date,status,points_awarded)
    values(command_id,s.family_id,null,activity.id,s.child_id,target_log_date,next_status,awarded)
    on conflict (activity_id,child_id,log_date) do nothing;
  if not found then return jsonb_build_object('status','duplicate'); end if;
  if awarded>0 then update public.child_profiles set points=points+awarded,total_earned=total_earned+awarded,
    level=greatest(1,floor((total_earned+awarded)/100.0)::integer+1) where id=s.child_id and family_id=s.family_id; end if;
  perform public.recompute_child_streak(s.child_id);
  perform public.sync_thinking_game_bonus_for_child(s.child_id,target_log_date);
  update public.device_sessions set last_seen_at=now() where id=s.id;
  return jsonb_build_object('status',next_status,'logId',command_id,'pointsAwarded',awarded);
end $$;

create or replace function public.undo_habit_command(target_log_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare fid uuid:=public.current_family_id(); l public.activity_logs%rowtype; c public.child_profiles%rowtype;
begin
  if fid is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(fid) then raise exception 'family_manage_required'; end if;
  select child_id into c.id from public.activity_logs where id=target_log_id and family_id=fid;
  if c.id is null then return jsonb_build_object('status','not_found'); end if;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(c.id));
  select * into l from public.activity_logs where id=target_log_id and family_id=fid for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if l.status not in ('completed','pending_approval') then return jsonb_build_object('status','not_reversible'); end if;
  select * into c from public.child_profiles where id=l.child_id and family_id=fid for update;
  if l.points_awarded>0 and c.points<l.points_awarded then return jsonb_build_object('status','points_already_spent'); end if;
  if l.points_awarded>0 then update public.child_profiles set points=points-l.points_awarded,total_earned=greatest(0,total_earned-l.points_awarded),
    level=greatest(1,floor(greatest(0,total_earned-l.points_awarded)/100.0)::integer+1) where id=l.child_id and family_id=fid; end if;
  delete from public.activity_logs where id=l.id;
  perform public.recompute_child_streak(l.child_id);
  perform public.sync_thinking_game_bonus_for_child(l.child_id,l.log_date);
  return jsonb_build_object('status','undone');
end $$;

create or replace function public.undo_child_habit_command(session_token_hash text,target_log_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.device_sessions%rowtype; l public.activity_logs%rowtype; c public.child_profiles%rowtype;
begin
  select * into s from public.device_sessions where token_hash=session_token_hash and revoked_at is null and expires_at>now() and 'child:complete'=any(capabilities)
  for update;
  if not found then return jsonb_build_object('status','session_invalid'); end if;
  select child_id into c.id from public.activity_logs where id=target_log_id and family_id=s.family_id and child_id=s.child_id;
  if c.id is null then return jsonb_build_object('status','not_found'); end if;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(s.child_id));
  select * into l from public.activity_logs where id=target_log_id and family_id=s.family_id and child_id=s.child_id for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  if l.status not in ('completed','pending_approval') then return jsonb_build_object('status','not_reversible'); end if;
  select * into c from public.child_profiles where id=s.child_id and family_id=s.family_id for update;
  if l.points_awarded>0 and c.points<l.points_awarded then return jsonb_build_object('status','points_already_spent'); end if;
  if l.points_awarded>0 then update public.child_profiles set points=greatest(0,points-l.points_awarded),total_earned=greatest(0,total_earned-l.points_awarded),
    level=greatest(1,floor(greatest(0,total_earned-l.points_awarded)/100.0)::integer+1) where id=s.child_id and family_id=s.family_id; end if;
  delete from public.activity_logs where id=l.id;
  perform public.recompute_child_streak(l.child_id);
  perform public.sync_thinking_game_bonus_for_child(s.child_id,l.log_date);
  update public.device_sessions set last_seen_at=now() where id=s.id;
  return jsonb_build_object('status','undone');
end $$;

create or replace function public.review_habit_command(target_log_id uuid, decision text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare fid uuid:=public.current_family_id(); l public.activity_logs%rowtype; award integer;
begin
  if fid is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(fid) then raise exception 'family_manage_required'; end if;
  if decision not in ('approve','reject') then raise exception 'invalid_decision'; end if;
  select child_id into l.child_id from public.activity_logs where id=target_log_id and family_id=fid;
  if l.child_id is null then raise exception 'log_not_found'; end if;
  perform pg_advisory_xact_lock(public.thinking_game_lock_key(l.child_id));
  select * into l from public.activity_logs where id=target_log_id and family_id=fid for update;
  if not found then raise exception 'log_not_found'; end if;
  if l.status <> 'pending_approval' then return jsonb_build_object('status','already_reviewed'); end if;
  perform 1 from public.child_profiles where id=l.child_id and family_id=fid for update;
  if decision='reject' then
    update public.activity_logs set status='rejected',points_awarded=0 where id=l.id;
    perform public.sync_thinking_game_bonus_for_child(l.child_id,l.log_date);
    return jsonb_build_object('status','rejected');
  else
    select points into award from public.habit_activities where id=l.activity_id and family_id=fid;
    update public.activity_logs set status='approved',points_awarded=award where id=l.id;
    update public.child_profiles set points=points+award,total_earned=total_earned+award,
      level=greatest(1,floor((total_earned+award)/100.0)::integer+1) where id=l.child_id and family_id=fid;
    perform public.recompute_child_streak(l.child_id);
    perform public.sync_thinking_game_bonus_for_child(l.child_id,l.log_date);
    return jsonb_build_object('status','approved','pointsAwarded',award);
  end if;
end $$;

create or replace function public.review_habits_command(target_log_ids uuid[], decision text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare fid uuid:=public.current_family_id(); ids uuid[]; children uuid[]; current_id uuid; l public.activity_logs%rowtype; day date;
  results jsonb:='[]'::jsonb;
begin
  if fid is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(fid) then raise exception 'family_manage_required'; end if;
  if decision not in ('approve','reject') then raise exception 'invalid_decision'; end if;
  select coalesce(array_agg(distinct x order by x),'{}') into ids from unnest(target_log_ids) x;
  if cardinality(ids)=0 then raise exception 'no_logs'; end if;
  if cardinality(ids)>50 then raise exception 'too_many_logs'; end if;
  select coalesce(array_agg(distinct child_id order by child_id),'{}') into children
    from public.activity_logs where public.activity_logs.id=any(ids) and family_id=fid;
  foreach current_id in array children loop perform pg_advisory_xact_lock(public.thinking_game_lock_key(current_id)); end loop;
  -- Row order remains log then child, but all game locks are acquired first.
  perform 1 from public.activity_logs where public.activity_logs.id=any(ids) and family_id=fid order by public.activity_logs.id for update;
  perform 1 from public.child_profiles where family_id=fid and public.child_profiles.id in (select child_id from public.activity_logs where public.activity_logs.id=any(ids) and family_id=fid) order by public.child_profiles.id for update;
  foreach current_id in array ids loop
    select * into l from public.activity_logs where activity_logs.id=current_id and family_id=fid;
    if not found then results:=results||jsonb_build_array(jsonb_build_object('logId',current_id,'status','not_found'));
    elsif l.status <> 'pending_approval' then results:=results||jsonb_build_array(jsonb_build_object('logId',current_id,'status','already_reviewed'));
    elsif decision='reject' then update public.activity_logs set status='rejected',points_awarded=0 where activity_logs.id=current_id;
      results:=results||jsonb_build_array(jsonb_build_object('logId',current_id,'status','rejected'));
    else update public.activity_logs set status='approved',points_awarded=(select points from public.habit_activities where habit_activities.id=l.activity_id) where activity_logs.id=current_id;
      update public.child_profiles set points=points+(select points from public.habit_activities where habit_activities.id=l.activity_id), total_earned=total_earned+(select points from public.habit_activities where habit_activities.id=l.activity_id)
        where child_profiles.id=l.child_id and child_profiles.family_id=fid;
      results:=results||jsonb_build_array(jsonb_build_object('logId',current_id,'status','approved','pointsAwarded',(select points from public.habit_activities where habit_activities.id=l.activity_id)));
    end if;
  end loop;
  if decision='approve' then
    foreach current_id in array children loop perform public.recompute_child_streak(current_id); end loop;
  end if;
  for current_id, day in select distinct log_row.child_id, log_row.log_date from public.activity_logs log_row
    where log_row.id=any(ids) and log_row.family_id=fid
  loop
    perform public.sync_thinking_game_bonus_for_child(current_id, day);
  end loop;
  return jsonb_build_object('status','reviewed','results',results);
end $$;

revoke all on function public.complete_habit_command(uuid,uuid,date,uuid),public.complete_child_habit_command(text,uuid,date,uuid),
  public.undo_habit_command(uuid),public.undo_child_habit_command(text,uuid),public.review_habit_command(uuid,text),
  public.review_habits_command(uuid[],text) from public,anon,service_role;
grant execute on function public.complete_habit_command(uuid,uuid,date,uuid),public.undo_habit_command(uuid),
  public.review_habit_command(uuid,text),public.review_habits_command(uuid[],text) to authenticated;
grant execute on function public.complete_child_habit_command(text,uuid,date,uuid),public.undo_child_habit_command(text,uuid) to anon,authenticated;

commit;
