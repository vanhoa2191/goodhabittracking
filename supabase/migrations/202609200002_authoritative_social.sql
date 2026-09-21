begin;

create or replace function public.mutate_social_command(mutation_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  actor_id uuid := auth.uid();
  mutation_type text := mutation_input->>'type';
  group_input jsonb := mutation_input->'group';
  target_id uuid;
  child_id uuid;
  recipient_id uuid;
  invite_code text;
  affected_rows integer;
begin
  if actor_id is null or actor_family_id is null
    or not public.can_manage_family(actor_family_id) then
    raise exception 'social_access_denied';
  end if;

  if mutation_type = 'createGroup' then
    child_id := nullif(group_input->>'createdByChildId', '')::uuid;
    if child_id is not null and not exists (
      select 1 from public.child_profiles
      where id = child_id and family_id = actor_family_id
    ) then
      raise exception 'social_child_not_found';
    end if;
    target_id := pg_catalog.gen_random_uuid();
    loop
      invite_code := upper(substr(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 10));
      begin
        insert into public.group_teams (
          id, family_id, name, invite_code, icon, created_by_child_id,
          weekly_target_points, reward_type, custom_reward_text
        ) values (
          target_id, actor_family_id, trim(group_input->>'name'), invite_code,
          group_input->>'icon', child_id,
          (group_input->>'weeklyTargetPoints')::integer,
          group_input->>'rewardType', nullif(trim(group_input->>'customRewardText'), '')
        );
        exit;
      exception when unique_violation then
        null;
      end;
    end loop;
    if child_id is not null then
      insert into public.group_members (group_id, child_id, family_id)
      values (target_id, child_id, actor_family_id);
    end if;
  elsif mutation_type = 'joinGroup' then
    child_id := (mutation_input->>'childId')::uuid;
    select id into target_id
    from public.group_teams
    where family_id = actor_family_id
      and invite_code = upper(trim(mutation_input->>'inviteCode'));
    if target_id is null then raise exception 'social_group_not_found'; end if;
    if not exists (
      select 1 from public.child_profiles
      where id = child_id and family_id = actor_family_id
    ) then
      raise exception 'social_child_not_found';
    end if;
    insert into public.group_members (group_id, child_id, family_id)
    values (target_id, child_id, actor_family_id)
    on conflict (group_id, child_id) do nothing;
  elsif mutation_type = 'updateGroupReward' then
    target_id := (mutation_input->>'groupId')::uuid;
    update public.group_teams
    set reward_type = mutation_input->>'rewardType',
        custom_reward_text = nullif(trim(mutation_input->>'customRewardText'), '')
    where id = target_id and family_id = actor_family_id;
    get diagnostics affected_rows = row_count;
    if affected_rows <> 1 then raise exception 'social_group_not_found'; end if;
  elsif mutation_type = 'sendKudo' then
    child_id := (mutation_input->>'fromChildId')::uuid;
    recipient_id := (mutation_input->>'toChildId')::uuid;
    if child_id = recipient_id then raise exception 'social_self_kudo_denied'; end if;
    target_id := pg_catalog.gen_random_uuid();
    insert into public.kudos (
      id, family_id, from_child_id, to_child_id, emoji
    ) values (
      target_id, actor_family_id, child_id, recipient_id, mutation_input->>'emoji'
    );
  else
    raise exception 'invalid_social_mutation';
  end if;

  return jsonb_build_object('entityId', target_id);
end
$$;

revoke all on function public.mutate_social_command(jsonb) from public;
grant execute on function public.mutate_social_command(jsonb) to authenticated;

commit;
