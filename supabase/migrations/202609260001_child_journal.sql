begin;

create table public.child_journal_entries (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  local_date date not null,
  entry_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (child_id, local_date),
  constraint child_journal_entries_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint child_journal_entries_text_check check (
    char_length(entry_text) between 1 and 280
    and entry_text = btrim(entry_text)
    and entry_text !~ E'[\\r\\n]'
  )
);

create index child_journal_entries_family_date_idx
  on public.child_journal_entries (family_id, local_date desc);

alter table public.child_journal_entries enable row level security;
alter table public.child_journal_entries force row level security;
revoke all on public.child_journal_entries from public, anon, authenticated;
create policy child_journal_entries_read on public.child_journal_entries
  for select to authenticated using (public.is_family_member(family_id));
grant select on public.child_journal_entries to authenticated;

create function public.save_child_journal_internal(
  target_family_id uuid,
  target_child_id uuid,
  target_local_date date,
  target_entry_text text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_entry public.child_journal_entries%rowtype;
begin
  if target_local_date < current_date - 1 or target_local_date > current_date + 1 then
    return jsonb_build_object('status', 'date_unavailable');
  end if;
  if target_entry_text is null
    or char_length(target_entry_text) < 1
    or char_length(target_entry_text) > 280
    or target_entry_text <> btrim(target_entry_text)
    or target_entry_text ~ E'[\\r\\n]'
  then
    return jsonb_build_object('status', 'text_invalid');
  end if;

  perform 1 from public.child_profiles child
  where child.id = target_child_id and child.family_id = target_family_id
  for share;
  if not found then return jsonb_build_object('status', 'child_unavailable'); end if;

  insert into public.child_journal_entries (
    family_id, child_id, local_date, entry_text, created_at, updated_at
  ) values (
    target_family_id, target_child_id, target_local_date, target_entry_text, now(), now()
  )
  on conflict (child_id, local_date) do update
    set entry_text = excluded.entry_text,
        updated_at = excluded.updated_at
  returning * into saved_entry;

  return jsonb_build_object('status', 'saved', 'entry', to_jsonb(saved_entry));
end
$$;

create function public.save_parent_child_journal(
  target_family_id uuid,
  target_child_id uuid,
  target_local_date date,
  target_entry_text text
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
  return public.save_child_journal_internal(
    target_family_id, target_child_id, target_local_date, target_entry_text
  );
end
$$;

create function public.read_child_journal(session_token_hash text)
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

  return jsonb_build_object('status', 'ready', 'entries', coalesce((
    select jsonb_agg(to_jsonb(entry) order by entry.local_date desc)
    from public.child_journal_entries entry
    where entry.family_id = child_session.family_id
      and entry.child_id = child_session.child_id
  ), '[]'::jsonb));
end
$$;

create function public.save_child_journal(
  session_token_hash text,
  target_local_date date,
  target_entry_text text
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

  result := public.save_child_journal_internal(
    child_session.family_id, child_session.child_id, target_local_date, target_entry_text
  );
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return result;
end
$$;

revoke all on function public.save_child_journal_internal(uuid, uuid, date, text)
  from public, anon, authenticated;
revoke all on function public.save_parent_child_journal(uuid, uuid, date, text)
  from public, anon, authenticated;
revoke all on function public.read_child_journal(text)
  from public, anon, authenticated;
revoke all on function public.save_child_journal(text, date, text)
  from public, anon, authenticated;
grant execute on function public.save_parent_child_journal(uuid, uuid, date, text)
  to authenticated;
grant execute on function public.read_child_journal(text)
  to anon, authenticated;
grant execute on function public.save_child_journal(text, date, text)
  to anon, authenticated;

commit;
