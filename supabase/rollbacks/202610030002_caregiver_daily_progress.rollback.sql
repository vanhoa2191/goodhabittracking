begin;

drop function if exists public.caregiver_progress_snapshot(date);

create or replace function public.caregiver_progress_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  membership public.family_memberships%rowtype;
begin
  select member.* into membership
  from public.family_memberships member
  where member.user_id = auth.uid();
  if membership.family_id is null or membership.role <> 'caregiver' then
    return null;
  end if;

  -- Name each display field; completed/approved logs leave the database only as per-child counts.
  return jsonb_build_object(
    'familyId', membership.family_id,
    'familyRole', membership.role,
    'profiles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', child.id, 'name', child.name, 'avatar', child.avatar, 'theme_color', child.theme_color
      ) order by child.created_at, child.id)
      from public.child_profiles child where child.family_id = membership.family_id
    ), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', activity.id, 'child_id', activity.child_id,
        'title', activity.title, 'description', activity.description
      ) order by activity.created_at, activity.id)
      from public.habit_activities activity
      where activity.family_id = membership.family_id and activity.is_active
    ), '[]'::jsonb),
    'completionCounts', coalesce((
      select jsonb_agg(jsonb_build_object('child_id', child.id, 'count', (
        select count(*) from public.activity_logs log
        where log.family_id = membership.family_id and log.child_id = child.id
          and log.status in ('completed', 'approved')
      )) order by child.created_at, child.id)
      from public.child_profiles child where child.family_id = membership.family_id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.caregiver_progress_snapshot() from public, anon, service_role;
grant execute on function public.caregiver_progress_snapshot() to authenticated;

commit;
