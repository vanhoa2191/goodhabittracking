-- "Không gian của bé" phase 2: a weekly intention the child sets for themselves, and a short letter to parents.
-- Weekly goals are private to the child. Letters are ALWAYS shared with the family's managers, who may mark them read
-- and answer with a heart. Nothing else private becomes visible to parents.
begin;

create table if not exists public.child_space_weekly_goals (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  week_start date not null,
  goal_text text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (child_id, week_start),
  constraint child_space_goals_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint child_space_goals_monday_check check (extract(isodow from week_start) = 1),
  constraint child_space_goals_status_check check (status in ('open', 'done', 'not_yet')),
  constraint child_space_goals_text_check check (
    char_length(goal_text) between 1 and 60
    and goal_text = btrim(goal_text)
    and goal_text !~ E'[\\r\\n]'
  )
);
create index if not exists child_space_goals_family_week_idx on public.child_space_weekly_goals (family_id, week_start desc);

create table if not exists public.child_space_letters (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  local_date date not null,
  letter_text text not null,
  read_at timestamptz,
  parent_heart boolean not null default false,
  created_at timestamptz not null default now(),
  constraint child_space_letters_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint child_space_letters_text_check check (
    char_length(letter_text) between 1 and 300
    and letter_text = btrim(letter_text)
    and letter_text !~ E'\\r'
  )
);
create index if not exists child_space_letters_child_created_idx on public.child_space_letters (child_id, created_at desc);
create index if not exists child_space_letters_family_created_idx on public.child_space_letters (family_id, created_at desc);

alter table public.child_space_weekly_goals enable row level security;
alter table public.child_space_weekly_goals force row level security;
alter table public.child_space_letters enable row level security;
alter table public.child_space_letters force row level security;
revoke all on public.child_space_weekly_goals from public, anon, authenticated;
revoke all on public.child_space_letters from public, anon, authenticated;

-- The goal may only be set for the current Monday-based week. Marking the result is allowed for this and last week.
create or replace function public.save_child_space_goal(session_token_hash text, target_week_start date, target_text text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare child_session public.device_sessions%rowtype; saved public.child_space_weekly_goals%rowtype;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash and device.revoked_at is null and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;
  if target_week_start is null or target_week_start <> date_trunc('week', current_date)::date then
    return jsonb_build_object('status', 'date_unavailable');
  end if;
  if target_text is null or char_length(target_text) < 1 or char_length(target_text) > 60
    or target_text <> btrim(target_text) or target_text ~ E'[\\r\\n]'
  then return jsonb_build_object('status', 'input_invalid'); end if;
  insert into public.child_space_weekly_goals (family_id, child_id, week_start, goal_text)
  values (child_session.family_id, child_session.child_id, target_week_start, target_text)
  on conflict (child_id, week_start) do update
    set goal_text = excluded.goal_text, status = 'open', updated_at = now()
  returning * into saved;
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'saved', 'goal', to_jsonb(saved));
end $$;

create or replace function public.mark_child_space_goal(session_token_hash text, target_week_start date, target_status text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare child_session public.device_sessions%rowtype; saved public.child_space_weekly_goals%rowtype;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash and device.revoked_at is null and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;
  if target_week_start is null or target_week_start < date_trunc('week', current_date)::date - 7
    or target_week_start > date_trunc('week', current_date)::date
  then return jsonb_build_object('status', 'date_unavailable'); end if;
  if target_status is null or target_status not in ('open', 'done', 'not_yet') then
    return jsonb_build_object('status', 'input_invalid');
  end if;
  update public.child_space_weekly_goals
  set status = target_status, updated_at = now()
  where child_id = child_session.child_id and family_id = child_session.family_id and week_start = target_week_start
  returning * into saved;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'saved', 'goal', to_jsonb(saved));
end $$;

-- A letter is always visible to the family's managers. At most five a day keeps it a letter, not a chat.
create or replace function public.send_child_space_letter(session_token_hash text, target_local_date date, target_text text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare child_session public.device_sessions%rowtype; saved public.child_space_letters%rowtype;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash and device.revoked_at is null and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;
  if target_local_date is null or target_local_date < current_date - 1 or target_local_date > current_date + 1 then
    return jsonb_build_object('status', 'date_unavailable');
  end if;
  if target_text is null or char_length(target_text) < 1 or char_length(target_text) > 300
    or target_text <> btrim(target_text) or target_text ~ E'\\r'
  then return jsonb_build_object('status', 'input_invalid'); end if;
  if (select count(*) from public.child_space_letters l
      where l.child_id = child_session.child_id and l.local_date = target_local_date) >= 5
  then return jsonb_build_object('status', 'limit_reached'); end if;
  insert into public.child_space_letters (family_id, child_id, local_date, letter_text)
  values (child_session.family_id, child_session.child_id, target_local_date, target_text)
  returning * into saved;
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'saved', 'letter', to_jsonb(saved));
end $$;

-- A parent marks a letter read and/or answers with a heart. Only a manager of the letter's own family can do so.
create or replace function public.respond_child_space_letter(target_family_id uuid, target_letter_id uuid, target_heart boolean default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare saved public.child_space_letters%rowtype;
begin
  if not public.can_manage_family(target_family_id) then return jsonb_build_object('status', 'session_invalid'); end if;
  update public.child_space_letters
  set read_at = coalesce(read_at, now()), parent_heart = coalesce(target_heart, parent_heart)
  where id = target_letter_id and family_id = target_family_id
  returning * into saved;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  return jsonb_build_object('status', 'saved', 'letter', to_jsonb(saved));
end $$;

-- The child's own view now also carries this month's goals and the letters they sent (with read/heart state).
create or replace function public.read_child_space(session_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare child_session public.device_sessions%rowtype;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash and device.revoked_at is null and device.expires_at > now()
    and 'child:read' = any(device.capabilities);
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;
  return jsonb_build_object('status', 'ready',
    'moods', coalesce((select jsonb_agg(to_jsonb(m) order by m.local_date desc) from public.child_space_moods m
      where m.child_id = child_session.child_id and m.family_id = child_session.family_id
        and m.local_date >= current_date - 60), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(to_jsonb(n) order by n.local_date desc, n.kind) from public.child_space_notes n
      where n.child_id = child_session.child_id and n.family_id = child_session.family_id
        and n.local_date >= current_date - 60), '[]'::jsonb),
    'goals', coalesce((select jsonb_agg(jsonb_build_object('week_start', g.week_start, 'goal_text', g.goal_text, 'status', g.status)
        order by g.week_start desc) from public.child_space_weekly_goals g
      where g.child_id = child_session.child_id and g.family_id = child_session.family_id
        and g.week_start >= current_date - 60), '[]'::jsonb),
    'letters', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'local_date', l.local_date, 'letter_text', l.letter_text,
        'read', l.read_at is not null, 'parent_heart', l.parent_heart) order by l.created_at desc) from public.child_space_letters l
      where l.child_id = child_session.child_id and l.family_id = child_session.family_id
        and l.local_date >= current_date - 60), '[]'::jsonb));
end $$;

-- A family manager additionally sees the letters (never the weekly goals, which stay with the child).
create or replace function public.read_parent_child_space(target_family_id uuid, target_child_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_manage_family(target_family_id) then return jsonb_build_object('status', 'session_invalid'); end if;
  perform 1 from public.child_profiles child where child.id = target_child_id and child.family_id = target_family_id;
  if not found then return jsonb_build_object('status', 'child_unavailable'); end if;
  return jsonb_build_object('status', 'ready',
    'moods', coalesce((select jsonb_agg(to_jsonb(m) order by m.local_date desc) from public.child_space_moods m
      where m.child_id = target_child_id and m.family_id = target_family_id
        and m.local_date >= current_date - 30), '[]'::jsonb),
    'notes', coalesce((select jsonb_agg(to_jsonb(n) order by n.local_date desc, n.kind) from public.child_space_notes n
      where n.child_id = target_child_id and n.family_id = target_family_id and n.shared_with_parent
        and n.local_date >= current_date - 30), '[]'::jsonb),
    'letters', coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'local_date', l.local_date, 'letter_text', l.letter_text,
        'read', l.read_at is not null, 'parent_heart', l.parent_heart) order by l.created_at desc) from public.child_space_letters l
      where l.child_id = target_child_id and l.family_id = target_family_id
        and l.local_date >= current_date - 60), '[]'::jsonb));
end $$;

revoke all on function public.save_child_space_goal(text, date, text) from public, anon, authenticated;
revoke all on function public.mark_child_space_goal(text, date, text) from public, anon, authenticated;
revoke all on function public.send_child_space_letter(text, date, text) from public, anon, authenticated;
revoke all on function public.respond_child_space_letter(uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function public.read_child_space(text) from public, anon, authenticated;
revoke all on function public.read_parent_child_space(uuid, uuid) from public, anon, authenticated;
grant execute on function public.save_child_space_goal(text, date, text) to anon, authenticated;
grant execute on function public.mark_child_space_goal(text, date, text) to anon, authenticated;
grant execute on function public.send_child_space_letter(text, date, text) to anon, authenticated;
grant execute on function public.respond_child_space_letter(uuid, uuid, boolean) to authenticated;
grant execute on function public.read_child_space(text) to anon, authenticated;
grant execute on function public.read_parent_child_space(uuid, uuid) to authenticated;

commit;
