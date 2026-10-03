begin;

-- Family membership does not grant access to domain rows: caregivers read only the progress projection.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'parent_settings', 'child_profiles', 'habit_activities', 'activity_logs',
    'rewards', 'redemptions', 'child_badges', 'group_teams', 'group_members', 'kudos'
  ] loop
    execute format(
      'alter policy %I on public.%I using (public.can_manage_family(family_id))',
      table_name || '_select_family', table_name
    );
  end loop;
end
$$;

alter policy subscriptions_select_family on public.user_subscriptions
  using (public.can_manage_family(family_id));
alter policy memberships_select_family on public.family_memberships
  using (user_id = auth.uid() or public.can_manage_family(family_id));

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

create or replace function public.sync_customer_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.parent_profiles set
    email = new.email,
    display_name = coalesce(nullif(display_name, ''), new.raw_user_meta_data ->> 'full_name', ''),
    updated_at = now()
  where user_id = new.id;
  return new;
end;
$$;

-- Deployment readiness attests the applied migration ledger without exposing it to browser clients.
create or replace function public.schema_version()
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return (select max(version)::text from supabase_migrations.schema_migrations);
end;
$$;

revoke all on function public.schema_version() from public, anon, authenticated;
grant execute on function public.schema_version() to service_role;

commit;
