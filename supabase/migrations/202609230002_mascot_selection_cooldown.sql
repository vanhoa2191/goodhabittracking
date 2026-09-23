begin;

revoke insert, update, delete on public.child_engagement_profiles from authenticated;

create or replace function public.record_mascot_selection()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_selected_at timestamptz;
  selected_at timestamptz := now();
  new_mascot_id text;
  old_mascot_id text;
begin
  if new.avatar is null or new.avatar not in (
      'mascot:leo', 'mascot:bunny', 'mascot:panda',
      'mascot:fox', 'mascot:turtle', 'mascot:bee',
      '🦁', '🐰', '🐼', '🦊', '🐢', '🐝'
    ) then
    return new;
  end if;

  new_mascot_id := case new.avatar
    when '🦁' then 'mascot:leo'
    when '🐰' then 'mascot:bunny'
    when '🐼' then 'mascot:panda'
    when '🦊' then 'mascot:fox'
    when '🐢' then 'mascot:turtle'
    when '🐝' then 'mascot:bee'
    else new.avatar
  end;

  if tg_op = 'INSERT' then
    if new_mascot_id = 'mascot:leo' then return new; end if;
  else
    old_mascot_id := case old.avatar
      when '🦁' then 'mascot:leo'
      when '🐰' then 'mascot:bunny'
      when '🐼' then 'mascot:panda'
      when '🦊' then 'mascot:fox'
      when '🐢' then 'mascot:turtle'
      when '🐝' then 'mascot:bee'
      else old.avatar
    end;
    if new_mascot_id = old_mascot_id then return new; end if;

    select mascot_selected_at into last_selected_at
    from public.child_engagement_profiles
    where child_id = new.id and family_id = new.family_id
    for update;

    if last_selected_at is not null
      and selected_at < last_selected_at + interval '168 hours' then
      raise exception 'mascot_change_cooldown' using errcode = 'P0001';
    end if;
  end if;

  insert into public.child_engagement_profiles (
    family_id, child_id, mascot_selected_at, updated_at
  ) values (
    new.family_id, new.id, selected_at, selected_at
  )
  on conflict (child_id) do update
    set mascot_selected_at = excluded.mascot_selected_at,
        updated_at = excluded.updated_at;

  return new;
end
$$;

revoke all on function public.record_mascot_selection() from public, anon, authenticated;

drop trigger if exists child_profile_mascot_selection on public.child_profiles;
drop trigger if exists child_profile_initial_mascot_selection on public.child_profiles;
create trigger child_profile_initial_mascot_selection
  after insert on public.child_profiles
  for each row execute function public.record_mascot_selection();
create trigger child_profile_mascot_selection
  after update of avatar on public.child_profiles
  for each row execute function public.record_mascot_selection();

create or replace function public.read_child_mascot_selection(session_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
  selected_at timestamptz;
begin
  select * into child_session
  from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:read' = any(device.capabilities);
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  select mascot_selected_at into selected_at
  from public.child_engagement_profiles
  where family_id = child_session.family_id and child_id = child_session.child_id;

  return jsonb_build_object('status', 'ready', 'mascot_selected_at', selected_at);
end
$$;

create or replace function public.update_child_mascot_command(
  session_token_hash text,
  target_avatar text,
  target_theme_color text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
begin
  if target_avatar is null or target_theme_color is null or target_avatar not in (
    'mascot:leo', 'mascot:bunny', 'mascot:panda',
    'mascot:fox', 'mascot:turtle', 'mascot:bee'
  ) or target_theme_color !~ '^#[0-9a-fA-F]{6}$' then
    raise exception 'invalid_mascot_selection';
  end if;

  select * into child_session
  from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  update public.child_profiles
  set avatar = target_avatar, theme_color = target_theme_color
  where id = child_session.child_id and family_id = child_session.family_id;
  if not found then raise exception 'child_not_found'; end if;

  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'saved');
end
$$;

revoke all on function public.read_child_mascot_selection(text) from public, anon, authenticated;
revoke all on function public.update_child_mascot_command(text, text, text) from public, anon, authenticated;
grant execute on function public.read_child_mascot_selection(text) to anon, authenticated;
grant execute on function public.update_child_mascot_command(text, text, text) to anon, authenticated;

commit;
