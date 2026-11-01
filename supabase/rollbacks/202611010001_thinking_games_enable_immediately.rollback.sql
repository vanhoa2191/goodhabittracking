begin;

-- Restore the original behaviour: every enablement applies from the next local day. Rows already released stay released.
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
revoke all on function public.thinking_game_update_settings_as(uuid,uuid,boolean,boolean,text,time,time,time,text,uuid) from public, anon, authenticated;
grant execute on function public.thinking_game_update_settings_as(uuid,uuid,boolean,boolean,text,time,time,time,text,uuid) to service_role;

commit;
