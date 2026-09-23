begin;

create or replace function public.open_daily_mascot_letter(
  target_child_id uuid,
  target_local_date date,
  mark_read boolean,
  session_token_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_row public.child_profiles%rowtype;
  child_session public.device_sessions%rowtype;
  mascot_name text;
  letter_key text;
  letter_read_at timestamptz;
begin
  if target_child_id is null or target_local_date is null or mark_read is null
    or target_local_date < (now() at time zone 'UTC')::date - 1
    or target_local_date > (now() at time zone 'UTC')::date + 1 then
    raise exception 'invalid_letter_date';
  end if;

  select * into child_row from public.child_profiles
  where id = target_child_id;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  if session_token_hash is not null then
    select * into child_session from public.device_sessions session_row
    where session_row.token_hash = session_token_hash
      and session_row.child_id = target_child_id
      and session_row.family_id = child_row.family_id
      and session_row.revoked_at is null
      and session_row.expires_at > now()
      and 'child:read' = any(session_row.capabilities)
      and (not mark_read or 'child:complete' = any(session_row.capabilities));
    if not found then return jsonb_build_object('status', 'session_invalid'); end if;
  elsif auth.uid() is null or not public.can_manage_family(child_row.family_id) then
    return jsonb_build_object('status', 'session_invalid');
  end if;

  mascot_name := case child_row.avatar
    when 'mascot:bunny' then 'bunny' when '🐰' then 'bunny'
    when 'mascot:panda' then 'panda' when '🐼' then 'panda'
    when 'mascot:fox' then 'fox' when '🦊' then 'fox'
    when 'mascot:turtle' then 'turtle' when '🐢' then 'turtle'
    when 'mascot:bee' then 'bee' when '🐝' then 'bee'
    else 'leo'
  end;
  letter_key := mascot_name || '_' || ((target_local_date - date '1970-01-01') % 3)::text;

  insert into public.daily_mascot_letters (
    family_id, child_id, local_date, template_key, read_at
  ) values (
    child_row.family_id, child_row.id, target_local_date, letter_key,
    case when mark_read then now() else null end
  )
  on conflict (child_id, local_date) do nothing;

  if mark_read then
    update public.daily_mascot_letters
    set read_at = coalesce(read_at, now())
    where child_id = target_child_id and local_date = target_local_date;
  end if;

  select template_key, read_at into letter_key, letter_read_at
  from public.daily_mascot_letters
  where child_id = target_child_id and local_date = target_local_date;

  return jsonb_build_object(
    'status', 'ready',
    'template_key', letter_key,
    'read_at', letter_read_at
  );
end
$$;

revoke all on function public.open_daily_mascot_letter(uuid, date, boolean, text) from public, anon, authenticated;
grant execute on function public.open_daily_mascot_letter(uuid, date, boolean, text) to anon, authenticated;

commit;
