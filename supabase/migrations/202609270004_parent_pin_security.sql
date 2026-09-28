begin;

alter table public.parent_settings
  add column if not exists parent_pin_hash text,
  add column if not exists parent_pin_configured_at timestamptz,
  add column if not exists parent_pin_failed_attempts integer not null default 0,
  add column if not exists parent_pin_locked_until timestamptz;

alter table public.parent_settings
  drop constraint if exists parent_settings_pin_failed_attempts_nonnegative;
alter table public.parent_settings
  add constraint parent_settings_pin_failed_attempts_nonnegative
  check (parent_pin_failed_attempts >= 0);

create or replace function public.get_parent_pin_status(target_family_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.parent_settings%rowtype;
begin
  if not public.can_manage_family(target_family_id) then
    raise exception 'Family management is required' using errcode = '42501';
  end if;

  insert into public.parent_settings (family_id)
  values (target_family_id)
  on conflict (family_id) do nothing;

  select * into settings
  from public.parent_settings
  where family_id = target_family_id;

  return jsonb_build_object(
    'configured', settings.parent_pin_hash is not null,
    'lockedUntil', case
      when settings.parent_pin_locked_until > clock_timestamp() then settings.parent_pin_locked_until
      else null
    end
  );
end;
$$;

create or replace function public.verify_parent_pin(target_family_id uuid, candidate_pin text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.parent_settings%rowtype;
  next_failed_attempts integer;
  lock_until timestamptz;
begin
  if not public.can_manage_family(target_family_id) then
    raise exception 'Family management is required' using errcode = '42501';
  end if;
  if candidate_pin !~ '^[0-9]{4}$' then
    return jsonb_build_object('status', 'invalid');
  end if;

  insert into public.parent_settings (family_id)
  values (target_family_id)
  on conflict (family_id) do nothing;

  select * into settings
  from public.parent_settings
  where family_id = target_family_id
  for update;

  if settings.parent_pin_hash is null then
    return jsonb_build_object('status', 'setup_required');
  end if;
  if settings.parent_pin_locked_until > clock_timestamp() then
    return jsonb_build_object(
      'status', 'locked',
      'retryAfterSeconds', greatest(1, ceil(extract(epoch from settings.parent_pin_locked_until - clock_timestamp())))::integer
    );
  end if;

  if extensions.crypt(candidate_pin, settings.parent_pin_hash) = settings.parent_pin_hash then
    update public.parent_settings
    set parent_pin_failed_attempts = 0,
        parent_pin_locked_until = null,
        updated_at = clock_timestamp()
    where family_id = target_family_id;
    return jsonb_build_object('status', 'verified');
  end if;

  next_failed_attempts := settings.parent_pin_failed_attempts + 1;
  if settings.parent_pin_failed_attempts >= 4 then
    lock_until := clock_timestamp() + interval '15 minutes';
    update public.parent_settings
    set parent_pin_failed_attempts = 0,
        parent_pin_locked_until = lock_until,
        updated_at = clock_timestamp()
    where family_id = target_family_id;
    return jsonb_build_object('status', 'locked', 'retryAfterSeconds', 900);
  end if;

  update public.parent_settings
  set parent_pin_failed_attempts = next_failed_attempts,
      parent_pin_locked_until = null,
      updated_at = clock_timestamp()
  where family_id = target_family_id;
  return jsonb_build_object('status', 'invalid', 'attemptsRemaining', 5 - next_failed_attempts);
end;
$$;

create or replace function public.set_parent_pin(target_family_id uuid, current_pin text, new_pin text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.parent_settings%rowtype;
  next_failed_attempts integer;
  lock_until timestamptz;
begin
  if not public.can_manage_family(target_family_id) then
    raise exception 'Family management is required' using errcode = '42501';
  end if;
  if new_pin !~ '^[0-9]{4}$' then
    return jsonb_build_object('status', 'invalid_format');
  end if;

  insert into public.parent_settings (family_id)
  values (target_family_id)
  on conflict (family_id) do nothing;

  select * into settings
  from public.parent_settings
  where family_id = target_family_id
  for update;

  if settings.parent_pin_hash is not null then
    if settings.parent_pin_locked_until > clock_timestamp() then
      return jsonb_build_object(
        'status', 'locked',
        'retryAfterSeconds', greatest(1, ceil(extract(epoch from settings.parent_pin_locked_until - clock_timestamp())))::integer
      );
    end if;
    if current_pin is null or extensions.crypt(current_pin, settings.parent_pin_hash) <> settings.parent_pin_hash then
      next_failed_attempts := settings.parent_pin_failed_attempts + 1;
      if settings.parent_pin_failed_attempts >= 4 then
        lock_until := clock_timestamp() + interval '15 minutes';
        update public.parent_settings
        set parent_pin_failed_attempts = 0,
            parent_pin_locked_until = lock_until,
            updated_at = clock_timestamp()
        where family_id = target_family_id;
        return jsonb_build_object('status', 'locked', 'retryAfterSeconds', 900);
      end if;
      update public.parent_settings
      set parent_pin_failed_attempts = next_failed_attempts,
          updated_at = clock_timestamp()
      where family_id = target_family_id;
      return jsonb_build_object('status', 'invalid_current', 'attemptsRemaining', 5 - next_failed_attempts);
    end if;
  end if;

  update public.parent_settings
  set parent_pin_hash = extensions.crypt(new_pin, extensions.gen_salt('bf', 10)),
      parent_pin_configured_at = clock_timestamp(),
      parent_pin_failed_attempts = 0,
      parent_pin_locked_until = null,
      updated_at = clock_timestamp()
  where family_id = target_family_id;

  return jsonb_build_object('status', 'updated');
end;
$$;

revoke all on function public.get_parent_pin_status(uuid) from public, anon;
revoke all on function public.verify_parent_pin(uuid, text) from public, anon;
revoke all on function public.set_parent_pin(uuid, text, text) from public, anon;
grant execute on function public.get_parent_pin_status(uuid) to authenticated;
grant execute on function public.verify_parent_pin(uuid, text) to authenticated;
grant execute on function public.set_parent_pin(uuid, text, text) to authenticated;

commit;
