begin;

create or replace function public.mutate_child_profile_command(mutation_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  actor_id uuid := auth.uid();
  mutation_type text := mutation_input->>'type';
  profile_input jsonb := mutation_input->'profile';
  updates_input jsonb := mutation_input->'updates';
  target_profile_id uuid;
  affected_rows integer;
begin
  if actor_id is null or actor_family_id is null
    or not public.can_manage_family(actor_family_id) then
    raise exception 'profile_access_denied';
  end if;

  if mutation_type = 'create' then
    target_profile_id := (profile_input->>'id')::uuid;
    if nullif(trim(profile_input->>'name'), '') is null then
      raise exception 'profile_name_required';
    end if;
    if (profile_input->>'points')::integer not in (0, 20)
      or (profile_input->>'totalEarned')::integer <> (profile_input->>'points')::integer
      or (profile_input->>'level')::integer <> 1
      or (profile_input->>'streak')::integer not in (0, 1) then
      raise exception 'invalid_initial_progress';
    end if;
    if jsonb_typeof(coalesce(mutation_input->'starterActivities', '[]'::jsonb)) <> 'array'
      or jsonb_array_length(coalesce(mutation_input->'starterActivities', '[]'::jsonb)) > 50 then
      raise exception 'invalid_starter_activities';
    end if;
    if exists (
      select 1
      from jsonb_array_elements(coalesce(mutation_input->'starterActivities', '[]'::jsonb)) activity
      where (activity->>'childId')::uuid <> target_profile_id
    ) then
      raise exception 'starter_activity_child_mismatch';
    end if;

    insert into public.child_profiles (
      id, family_id, user_id, name, nickname, show_real_name_on_leaderboard,
      is_public_on_leaderboard, avatar, theme_color, points, total_earned,
      level, streak, birth_year, age_stage, league_tier, created_at
    ) values (
      target_profile_id, actor_family_id, actor_id, trim(profile_input->>'name'),
      nullif(trim(profile_input->>'nickname'), ''),
      coalesce((profile_input->>'showRealNameOnLeaderboard')::boolean, false),
      coalesce((profile_input->>'isPublicOnLeaderboard')::boolean, false),
      profile_input->>'avatar', profile_input->>'themeColor',
      (profile_input->>'points')::integer, (profile_input->>'totalEarned')::integer,
      (profile_input->>'level')::integer, (profile_input->>'streak')::integer,
      (profile_input->>'birthYear')::integer, profile_input->>'ageStage',
      coalesce(profile_input->>'leagueTier', 'bronze'),
      (profile_input->>'createdAt')::timestamptz
    );

    insert into public.habit_activities (
      id, family_id, user_id, child_id, title, description, icon, category, points,
      recurrence_type, recurrence_days, time_of_day, duration_minutes,
      requires_approval, is_active, target_age_stage, is_parent_role,
      portrait16_key, bo_thi7_key, created_at
    )
    select
      activity."id", actor_family_id, actor_id, activity."childId", activity."title",
      activity."description", activity."icon", activity."category", activity."points",
      activity."recurrenceType", activity."recurrenceDays", activity."timeOfDay",
      activity."durationMinutes", activity."requiresApproval", activity."isActive",
      coalesce(activity."targetAgeStage", 'all'), coalesce(activity."isParentRole", false),
      activity."portrait16Key", activity."boThi7Key", activity."createdAt"
    from jsonb_to_recordset(coalesce(mutation_input->'starterActivities', '[]'::jsonb)) as activity(
      "id" uuid, "childId" uuid, "title" text, "description" text, "icon" text,
      "category" text, "points" integer, "recurrenceType" text,
      "recurrenceDays" integer[], "timeOfDay" text, "durationMinutes" integer,
      "requiresApproval" boolean, "isActive" boolean, "targetAgeStage" text,
      "isParentRole" boolean, "portrait16Key" text, "boThi7Key" text,
      "createdAt" timestamptz
    );
  elsif mutation_type = 'update' then
    target_profile_id := (mutation_input->>'profileId')::uuid;
    if updates_input ? 'name' and nullif(trim(updates_input->>'name'), '') is null then
      raise exception 'profile_name_required';
    end if;
    update public.child_profiles
    set
      name = case when updates_input ? 'name' then trim(updates_input->>'name') else name end,
      nickname = case when updates_input ? 'nickname' then nullif(trim(updates_input->>'nickname'), '') else nickname end,
      show_real_name_on_leaderboard = case when updates_input ? 'showRealNameOnLeaderboard' then (updates_input->>'showRealNameOnLeaderboard')::boolean else show_real_name_on_leaderboard end,
      is_public_on_leaderboard = case when updates_input ? 'isPublicOnLeaderboard' then (updates_input->>'isPublicOnLeaderboard')::boolean else is_public_on_leaderboard end,
      avatar = case when updates_input ? 'avatar' then updates_input->>'avatar' else avatar end,
      theme_color = case when updates_input ? 'themeColor' then updates_input->>'themeColor' else theme_color end,
      birth_year = case when updates_input ? 'birthYear' then (updates_input->>'birthYear')::integer else birth_year end,
      age_stage = case when updates_input ? 'ageStage' then updates_input->>'ageStage' else age_stage end,
      league_tier = case when updates_input ? 'leagueTier' then updates_input->>'leagueTier' else league_tier end
    where id = target_profile_id and family_id = actor_family_id;
    get diagnostics affected_rows = row_count;
    if affected_rows <> 1 then raise exception 'profile_not_found'; end if;
  elsif mutation_type = 'delete' then
    target_profile_id := (mutation_input->>'profileId')::uuid;
    delete from public.child_profiles
    where id = target_profile_id and family_id = actor_family_id;
    get diagnostics affected_rows = row_count;
    if affected_rows <> 1 then raise exception 'profile_not_found'; end if;
  else
    raise exception 'invalid_profile_mutation';
  end if;

  return jsonb_build_object('profileId', target_profile_id);
end
$$;

revoke all on function public.mutate_child_profile_command(jsonb) from public;
grant execute on function public.mutate_child_profile_command(jsonb) to authenticated;

commit;
