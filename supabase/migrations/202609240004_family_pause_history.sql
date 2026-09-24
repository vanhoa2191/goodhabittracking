begin;

alter table public.family_engagement_settings
  add column if not exists pause_periods jsonb not null default '[]'::jsonb;

update public.family_engagement_settings
set pause_periods = jsonb_build_array(jsonb_build_object('startedAt', paused_at, 'endedAt', null))
where paused_at is not null and pause_periods = '[]'::jsonb;

revoke insert, update on public.family_engagement_settings from authenticated;

create or replace function public.set_family_pause_state(target_family_id uuid, should_pause boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_pause timestamptz;
  periods jsonb;
  last_period jsonb;
  event_time timestamptz;
begin
  if not public.can_manage_family(target_family_id) then
    raise exception 'Family management is required' using errcode = '42501';
  end if;

  insert into public.family_engagement_settings (family_id)
  values (target_family_id)
  on conflict (family_id) do nothing;

  select paused_at, pause_periods into current_pause, periods
  from public.family_engagement_settings
  where family_id = target_family_id
  for update;
  event_time := clock_timestamp();

  if should_pause and current_pause is null then
    update public.family_engagement_settings
    set paused_at = event_time,
        pause_periods = periods || jsonb_build_array(jsonb_build_object('startedAt', event_time, 'endedAt', null)),
        updated_at = event_time
    where family_id = target_family_id;
  elsif not should_pause and current_pause is not null then
    last_period := periods -> (jsonb_array_length(periods) - 1);
    update public.family_engagement_settings
    set paused_at = null,
        pause_periods = case
          when last_period ->> 'endedAt' is null and last_period ->> 'startedAt' is not null then
            jsonb_set(periods, array[(jsonb_array_length(periods) - 1)::text, 'endedAt'], to_jsonb(event_time))
          else
            periods || jsonb_build_array(jsonb_build_object('startedAt', current_pause, 'endedAt', event_time))
        end,
        updated_at = event_time
    where family_id = target_family_id;
  end if;
end;
$$;

revoke all on function public.set_family_pause_state(uuid, boolean) from public, anon;
grant execute on function public.set_family_pause_state(uuid, boolean) to authenticated;

create or replace function public.get_child_family_pause_state(session_token_hash text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'pausedAt', settings.paused_at,
    'pausePeriods', coalesce(settings.pause_periods, '[]'::jsonb)
  )
  from public.device_sessions session
  left join public.family_engagement_settings settings
    on settings.family_id = session.family_id
  where session.token_hash = session_token_hash
    and session.revoked_at is null
    and session.expires_at > now()
    and 'child:read' = any(session.capabilities)
  limit 1;
$$;

revoke all on function public.get_child_family_pause_state(text) from public;
grant execute on function public.get_child_family_pause_state(text) to anon, authenticated;

commit;
