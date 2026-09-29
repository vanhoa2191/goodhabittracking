begin;

create table public.habit_cue_plans (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  activity_id uuid not null,
  cue_kind text not null check (cue_kind in ('event', 'time')),
  cue_text text not null check (char_length(btrim(cue_text)) between 1 and 200),
  cue_time time,
  place_text text check (place_text is null or char_length(place_text) <= 120),
  weekend_variant_text text check (weekend_variant_text is null or char_length(weekend_variant_text) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (child_id, activity_id),
  constraint habit_cue_plans_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint habit_cue_plans_activity_family_fk foreign key (activity_id, family_id)
    references public.habit_activities(id, family_id) on delete cascade,
  constraint habit_cue_plans_time_matches_kind check (
    (cue_kind = 'time' and cue_time is not null) or (cue_kind = 'event' and cue_time is null)
  )
);

create index habit_cue_plans_family_idx on public.habit_cue_plans (family_id);

create table public.habit_support_observations (
  log_id uuid primary key references public.activity_logs(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  activity_id uuid not null,
  support_level text not null check (support_level in ('alone', 'prompted', 'together')),
  recorded_by text not null check (recorded_by in ('parent', 'child')),
  recorded_at timestamptz not null default now(),
  constraint habit_support_observations_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint habit_support_observations_activity_family_fk foreign key (activity_id, family_id)
    references public.habit_activities(id, family_id) on delete cascade
);

create index habit_support_observations_child_idx
  on public.habit_support_observations (family_id, child_id, recorded_at desc);

alter table public.habit_cue_plans enable row level security;
alter table public.habit_cue_plans force row level security;
alter table public.habit_support_observations enable row level security;
alter table public.habit_support_observations force row level security;
revoke all on public.habit_cue_plans, public.habit_support_observations from public, anon, authenticated;

create policy habit_cue_plans_read on public.habit_cue_plans
  for select to authenticated using (public.is_family_member(family_id));
create policy habit_support_observations_read on public.habit_support_observations
  for select to authenticated using (public.is_family_member(family_id));
grant select on public.habit_cue_plans, public.habit_support_observations to authenticated;

create function public.record_habit_support_internal(
  target_family_id uuid,
  target_child_id uuid,
  target_log_id uuid,
  target_level text,
  recorder text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  log_row public.activity_logs%rowtype;
  changed_count integer;
  saved public.habit_support_observations%rowtype;
begin
  if target_level not in ('alone', 'prompted', 'together') or recorder not in ('parent', 'child') then
    return jsonb_build_object('status', 'invalid_request');
  end if;

  select * into log_row from public.activity_logs log
  where log.id = target_log_id
    and log.family_id = target_family_id
    and (target_child_id is null or log.child_id = target_child_id)
    and log.status in ('completed', 'approved')
  for share;
  if not found then return jsonb_build_object('status', 'log_unavailable'); end if;

  insert into public.habit_support_observations (
    log_id, family_id, child_id, activity_id, support_level, recorded_by
  ) values (
    log_row.id, log_row.family_id, log_row.child_id, log_row.activity_id, target_level, recorder
  )
  on conflict (log_id) do update
    set support_level = excluded.support_level,
        recorded_by = excluded.recorded_by,
        recorded_at = now()
    where public.habit_support_observations.support_level is distinct from excluded.support_level
       or public.habit_support_observations.recorded_by is distinct from excluded.recorded_by;
  get diagnostics changed_count = row_count;

  select * into saved from public.habit_support_observations observation
  where observation.log_id = target_log_id;
  return jsonb_build_object('status', 'saved', 'changed', changed_count > 0, 'observation', to_jsonb(saved));
end
$$;

create function public.set_parent_habit_support(
  target_family_id uuid,
  target_log_id uuid,
  target_level text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_family(target_family_id) then
    return jsonb_build_object('status', 'session_invalid');
  end if;
  return public.record_habit_support_internal(target_family_id, null, target_log_id, target_level, 'parent');
end
$$;

create function public.set_child_habit_support(
  session_token_hash text,
  target_log_id uuid,
  target_level text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
  result jsonb;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  result := public.record_habit_support_internal(
    child_session.family_id, child_session.child_id, target_log_id, target_level, 'child'
  );
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return result;
end
$$;

create function public.save_parent_habit_cue_plan(
  target_family_id uuid,
  target_child_id uuid,
  target_activity_id uuid,
  target_cue_kind text,
  target_cue_text text,
  target_cue_time time,
  target_place_text text,
  target_weekend_variant_text text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.habit_cue_plans%rowtype;
begin
  if not public.can_manage_family(target_family_id) then
    return jsonb_build_object('status', 'session_invalid');
  end if;

  perform 1 from public.child_profiles child
  where child.id = target_child_id and child.family_id = target_family_id
  for share;
  if not found then return jsonb_build_object('status', 'plan_unavailable'); end if;

  perform 1 from public.habit_activities activity
  where activity.id = target_activity_id
    and activity.family_id = target_family_id
    and (activity.child_id is null or activity.child_id = target_child_id)
    and activity.is_active
  for share;
  if not found then return jsonb_build_object('status', 'plan_unavailable'); end if;

  insert into public.habit_cue_plans (
    family_id, child_id, activity_id, cue_kind, cue_text, cue_time, place_text, weekend_variant_text
  ) values (
    target_family_id, target_child_id, target_activity_id, target_cue_kind, btrim(target_cue_text),
    target_cue_time, nullif(btrim(target_place_text), ''), nullif(btrim(target_weekend_variant_text), '')
  )
  on conflict (child_id, activity_id) do update
    set cue_kind = excluded.cue_kind,
        cue_text = excluded.cue_text,
        cue_time = excluded.cue_time,
        place_text = excluded.place_text,
        weekend_variant_text = excluded.weekend_variant_text,
        updated_at = now()
  returning * into saved;
  return jsonb_build_object('status', 'saved', 'cuePlan', to_jsonb(saved));
end
$$;

create function public.read_child_habit_programs(session_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:read' = any(device.capabilities);
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  return jsonb_build_object(
    'status', 'ready',
    'supportObservations', coalesce((
      select jsonb_agg(to_jsonb(observation) order by observation.recorded_at desc)
      from public.habit_support_observations observation
      where observation.family_id = child_session.family_id
        and observation.child_id = child_session.child_id
    ), '[]'::jsonb),
    'cuePlans', coalesce((
      select jsonb_agg(to_jsonb(plan) order by plan.updated_at desc)
      from public.habit_cue_plans plan
      where plan.family_id = child_session.family_id
        and plan.child_id = child_session.child_id
    ), '[]'::jsonb)
  );
end
$$;

revoke all on function public.record_habit_support_internal(uuid, uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.set_parent_habit_support(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.set_child_habit_support(text, uuid, text)
  from public, anon, authenticated;
revoke all on function public.save_parent_habit_cue_plan(uuid, uuid, uuid, text, text, time, text, text)
  from public, anon, authenticated;
revoke all on function public.read_child_habit_programs(text)
  from public, anon, authenticated;
grant execute on function public.set_parent_habit_support(uuid, uuid, text) to authenticated;
grant execute on function public.set_child_habit_support(text, uuid, text) to anon, authenticated;
grant execute on function public.save_parent_habit_cue_plan(uuid, uuid, uuid, text, text, time, text, text)
  to authenticated;
grant execute on function public.read_child_habit_programs(text) to anon, authenticated;

commit;
