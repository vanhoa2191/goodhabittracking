begin;

-- Serve release-365-v3 (all four age tracks). The v3 content rows are imported first (ids use the F prefix so they
-- coexist with v1 and v2) and the application pins the matching manifest digest. This switches the age resolver to
-- all four tracks and flips the one trusted version that start, bonus-grant and sync resolve. No stored child
-- progress is rewritten.
do $$
begin
  if to_regprocedure('public.thinking_game_resolve_trusted_release_version()') is null then
    raise exception 'thinking_game_trusted_release_version_required';
  end if;
  if to_regprocedure('public.thinking_game_resolve_age_track_for_child(uuid,uuid)') is null then
    raise exception 'thinking_game_age_track_resolver_required';
  end if;
end $$;

create or replace function public.thinking_game_resolve_age_track_for_child(target_child_id uuid, target_family_id uuid default null)
returns text language sql stable strict set search_path = '' as $$
  with child_record as (
    select cp.family_id, cp.birth_year,
      coalesce((select gs.age_track_override from public.thinking_game_settings gs where gs.family_id = coalesce(target_family_id, cp.family_id)), null) as override,
      (select gs.timezone from public.thinking_game_settings gs where gs.family_id = coalesce(target_family_id, cp.family_id)) as timezone
    from public.child_profiles cp
    where cp.id = target_child_id
  ),
  age_years as (
    select
      birth_year,
      timezone,
      case
        when birth_year is null or birth_year <= 0 or timezone is null then null
        else extract(year from age((now() at time zone timezone)::date, make_date(birth_year, 1, 1)))
      end as age_value
    from child_record
  )
  select coalesce(
    (select override from child_record where override is not null),
    case
      when (select birth_year from child_record) is null then 'age_track_unavailable'
      when (select age_value from age_years) between 3 and 5 then 'age_3_5'
      when (select age_value from age_years) between 6 and 8 then 'age_6_8'
      when (select age_value from age_years) between 9 and 12 then 'age_9_12'
      when (select age_value from age_years) >= 13 then 'age_13_plus'
      else 'age_track_unavailable'
    end
  );
$$;
revoke all on function public.thinking_game_resolve_age_track_for_child(uuid,uuid) from public, anon, authenticated;

create or replace function public.thinking_game_resolve_trusted_release_version()
returns text language sql stable strict set search_path = '' as $$
  select 'release-365-v3'::text;
$$;
revoke all on function public.thinking_game_resolve_trusted_release_version() from public, anon;
grant execute on function public.thinking_game_resolve_trusted_release_version() to authenticated, service_role;

commit;
