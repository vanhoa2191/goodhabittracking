begin;

create table public.child_task_deferrals (
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

create index child_task_deferrals_family_date_idx
  on public.child_task_deferrals (family_id, local_date desc);

alter table public.child_task_deferrals enable row level security;
alter table public.child_task_deferrals force row level security;
revoke all on public.child_task_deferrals from public, anon, authenticated;
create policy child_task_deferrals_read on public.child_task_deferrals
  for select to authenticated using (public.is_family_member(family_id));
grant select on public.child_task_deferrals to authenticated;

create function public.clear_task_deferral_on_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.child_profiles child
  where child.id = new.child_id and child.family_id = new.family_id
  for update;
  delete from public.child_task_deferrals task
  where task.family_id = new.family_id
    and task.child_id = new.child_id
    and task.activity_id = new.activity_id
    and task.local_date = new.log_date;
  return new;
end
$$;

create trigger clear_task_deferral_on_completion
after insert on public.activity_logs
for each row execute function public.clear_task_deferral_on_completion();
revoke all on function public.clear_task_deferral_on_completion() from public, anon, authenticated;

create function public.set_task_deferral_internal(
  target_family_id uuid,
  target_child_id uuid,
  target_activity_id uuid,
  target_local_date date,
  should_defer boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_count integer;
  saved_task public.child_task_deferrals%rowtype;
begin
  perform 1 from public.child_profiles child
  where child.id = target_child_id and child.family_id = target_family_id
  for update;
  if not found then return jsonb_build_object('status', 'task_unavailable'); end if;

  if not should_defer then
    delete from public.child_task_deferrals task
    where task.family_id = target_family_id
      and task.child_id = target_child_id
      and task.activity_id = target_activity_id
      and task.local_date = target_local_date;
    get diagnostics changed_count = row_count;
    return jsonb_build_object('status', 'restored', 'changed', changed_count > 0, 'deferredTask', null);
  end if;

  perform 1 from public.habit_activities activity
  where activity.id = target_activity_id
    and activity.family_id = target_family_id
    and (activity.child_id is null or activity.child_id = target_child_id)
    and activity.is_active
  for share;
  if not found then return jsonb_build_object('status', 'task_unavailable'); end if;

  perform 1 from public.activity_logs log
  where log.family_id = target_family_id
    and log.child_id = target_child_id
    and log.activity_id = target_activity_id
    and log.log_date = target_local_date
    and log.status in ('completed', 'pending_approval', 'approved');
  if found then return jsonb_build_object('status', 'already_complete'); end if;

  insert into public.child_task_deferrals (family_id, child_id, activity_id, local_date)
  values (target_family_id, target_child_id, target_activity_id, target_local_date)
  on conflict (child_id, activity_id, local_date) do nothing;
  get diagnostics changed_count = row_count;
  select * into saved_task from public.child_task_deferrals task
  where task.child_id = target_child_id
    and task.activity_id = target_activity_id
    and task.local_date = target_local_date;
  return jsonb_build_object('status', 'saved', 'changed', changed_count > 0, 'deferredTask', to_jsonb(saved_task));
end
$$;

create function public.set_parent_task_deferral(
  target_family_id uuid,
  target_child_id uuid,
  target_activity_id uuid,
  target_local_date date,
  should_defer boolean
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
  return public.set_task_deferral_internal(
    target_family_id, target_child_id, target_activity_id, target_local_date, should_defer
  );
end
$$;

create function public.read_child_task_deferrals(session_token_hash text)
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

  return jsonb_build_object('status', 'ready', 'deferredTasks', coalesce((
    select jsonb_agg(to_jsonb(task) order by task.local_date desc)
    from public.child_task_deferrals task
    where task.family_id = child_session.family_id
      and task.child_id = child_session.child_id
  ), '[]'::jsonb));
end
$$;

create function public.set_child_task_deferral(
  session_token_hash text,
  target_activity_id uuid,
  target_local_date date,
  should_defer boolean
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

  result := public.set_task_deferral_internal(
    child_session.family_id, child_session.child_id, target_activity_id, target_local_date, should_defer
  );
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return result;
end
$$;

revoke all on function public.set_task_deferral_internal(uuid, uuid, uuid, date, boolean)
  from public, anon, authenticated;
revoke all on function public.set_parent_task_deferral(uuid, uuid, uuid, date, boolean)
  from public, anon, authenticated;
revoke all on function public.read_child_task_deferrals(text)
  from public, anon, authenticated;
revoke all on function public.set_child_task_deferral(text, uuid, date, boolean)
  from public, anon, authenticated;
grant execute on function public.set_parent_task_deferral(uuid, uuid, uuid, date, boolean)
  to authenticated;
grant execute on function public.read_child_task_deferrals(text)
  to anon, authenticated;
grant execute on function public.set_child_task_deferral(text, uuid, date, boolean)
  to anon, authenticated;

commit;
