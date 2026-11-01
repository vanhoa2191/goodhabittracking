-- "Không gian của bé": a daily feelings check-in and quick notes a child keeps for themselves.
-- Moods are visible to the family's managers (trend + gentle alert); notes stay private unless the child shares them.
begin;

create table if not exists public.child_space_moods (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  local_date date not null,
  mood text not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (child_id, local_date),
  constraint child_space_moods_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint child_space_moods_mood_check check (mood in ('happy', 'calm', 'tired', 'worried', 'sad', 'angry')),
  constraint child_space_moods_reason_check check (reason is null or reason in ('friends', 'school', 'family', 'body', 'other'))
);
create index if not exists child_space_moods_family_date_idx on public.child_space_moods (family_id, local_date desc);

create table if not exists public.child_space_notes (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  local_date date not null,
  kind text not null,
  note_text text not null,
  shared_with_parent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (child_id, local_date, kind),
  constraint child_space_notes_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint child_space_notes_kind_check check (kind in ('learned', 'grateful', 'proud')),
  constraint child_space_notes_text_check check (
    char_length(note_text) between 1 and 140
    and note_text = btrim(note_text)
    and note_text !~ E'[\\r\\n]'
  )
);
create index if not exists child_space_notes_family_date_idx on public.child_space_notes (family_id, local_date desc);

-- Both tables are reachable only through the commands below.
alter table public.child_space_moods enable row level security;
alter table public.child_space_moods force row level security;
alter table public.child_space_notes enable row level security;
alter table public.child_space_notes force row level security;
revoke all on public.child_space_moods from public, anon, authenticated;
revoke all on public.child_space_notes from public, anon, authenticated;

create or replace function public.save_child_space_mood(
  session_token_hash text, target_local_date date, target_mood text, target_reason text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare child_session public.device_sessions%rowtype; saved public.child_space_moods%rowtype;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash and device.revoked_at is null and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;
  if target_local_date < current_date - 1 or target_local_date > current_date + 1 then
    return jsonb_build_object('status', 'date_unavailable');
  end if;
  if target_mood is null or target_mood not in ('happy', 'calm', 'tired', 'worried', 'sad', 'angry')
    or (target_reason is not null and target_reason not in ('friends', 'school', 'family', 'body', 'other'))
  then return jsonb_build_object('status', 'input_invalid'); end if;
  insert into public.child_space_moods (family_id, child_id, local_date, mood, reason)
  values (child_session.family_id, child_session.child_id, target_local_date, target_mood, target_reason)
  on conflict (child_id, local_date) do update
    set mood = excluded.mood, reason = excluded.reason, updated_at = now()
  returning * into saved;
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'saved', 'mood', to_jsonb(saved));
end $$;

create or replace function public.save_child_space_note(
  session_token_hash text, target_local_date date, target_kind text, target_text text, target_shared boolean default false
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare child_session public.device_sessions%rowtype; saved public.child_space_notes%rowtype;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash and device.revoked_at is null and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;
  if target_local_date < current_date - 1 or target_local_date > current_date + 1 then
    return jsonb_build_object('status', 'date_unavailable');
  end if;
  if target_kind is null or target_kind not in ('learned', 'grateful', 'proud')
    or target_text is null or char_length(target_text) < 1 or char_length(target_text) > 140
    or target_text <> btrim(target_text) or target_text ~ E'[\\r\\n]'
  then return jsonb_build_object('status', 'input_invalid'); end if;
  insert into public.child_space_notes (family_id, child_id, local_date, kind, note_text, shared_with_parent)
  values (child_session.family_id, child_session.child_id, target_local_date, target_kind, target_text, coalesce(target_shared, false))
  on conflict (child_id, local_date, kind) do update
    set note_text = excluded.note_text, shared_with_parent = excluded.shared_with_parent, updated_at = now()
  returning * into saved;
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'saved', 'note', to_jsonb(saved));
end $$;

create or replace function public.delete_child_space_note(
  session_token_hash text, target_local_date date, target_kind text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare child_session public.device_sessions%rowtype;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash and device.revoked_at is null and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;
  delete from public.child_space_notes
  where child_id = child_session.child_id and local_date = target_local_date and kind = target_kind;
  return jsonb_build_object('status', 'deleted');
end $$;

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
        and n.local_date >= current_date - 60), '[]'::jsonb));
end $$;

-- A family manager sees the mood trend and only the notes the child chose to share.
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
        and n.local_date >= current_date - 30), '[]'::jsonb));
end $$;

revoke all on function public.save_child_space_mood(text, date, text, text) from public, anon, authenticated;
revoke all on function public.save_child_space_note(text, date, text, text, boolean) from public, anon, authenticated;
revoke all on function public.delete_child_space_note(text, date, text) from public, anon, authenticated;
revoke all on function public.read_child_space(text) from public, anon, authenticated;
revoke all on function public.read_parent_child_space(uuid, uuid) from public, anon, authenticated;
grant execute on function public.save_child_space_mood(text, date, text, text) to anon, authenticated;
grant execute on function public.save_child_space_note(text, date, text, text, boolean) to anon, authenticated;
grant execute on function public.delete_child_space_note(text, date, text) to anon, authenticated;
grant execute on function public.read_child_space(text) to anon, authenticated;
grant execute on function public.read_parent_child_space(uuid, uuid) to authenticated;

commit;
