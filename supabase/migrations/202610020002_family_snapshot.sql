begin;

-- The whole family in one round trip. The app used to read the caller's membership and then twenty tables, which
-- cost two sequential round trips to the database from every browser after every change. This runs as the caller
-- (security invoker), so row level security and column grants decide what comes back exactly as they did for
-- the separate queries; nothing here widens access.
create or replace function public.family_snapshot(
  include_experience boolean default true,
  include_journal boolean default true,
  include_city boolean default true
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  membership record;
  fid uuid;
begin
  select m.family_id, m.role into membership
  from public.family_memberships m
  where m.user_id = auth.uid()
  order by m.created_at asc
  limit 1;
  if not found then return null; end if;
  fid := membership.family_id;

  return jsonb_build_object(
    'familyId', fid,
    'familyRole', membership.role,
    'profiles', coalesce((select jsonb_agg(to_jsonb(t)) from public.child_profiles t where t.family_id = fid), '[]'::jsonb),
    'activities', coalesce((select jsonb_agg(to_jsonb(t)) from public.habit_activities t where t.family_id = fid), '[]'::jsonb),
    'logs', coalesce((select jsonb_agg(to_jsonb(t)) from public.activity_logs t where t.family_id = fid), '[]'::jsonb),
    'rewards', coalesce((select jsonb_agg(to_jsonb(t)) from public.rewards t where t.family_id = fid), '[]'::jsonb),
    'redemptions', coalesce((select jsonb_agg(to_jsonb(t)) from public.redemptions t where t.family_id = fid), '[]'::jsonb),
    'childBadges', coalesce((select jsonb_agg(to_jsonb(t)) from public.child_badges t where t.family_id = fid), '[]'::jsonb),
    'kudos', coalesce((
      select jsonb_agg(to_jsonb(k))
      from (select * from public.kudos where family_id = fid order by sent_at desc limit 50) k
    ), '[]'::jsonb),
    'groups', coalesce((select jsonb_agg(to_jsonb(t)) from public.group_teams t where t.family_id = fid), '[]'::jsonb),
    'groupMembers', coalesce((
      select jsonb_agg(jsonb_build_object('group_id', t.group_id, 'child_id', t.child_id))
      from public.group_members t where t.family_id = fid
    ), '[]'::jsonb),
    'subscription', (
      select jsonb_build_object(
        'plan', s.plan,
        'status', s.status,
        'trial_ends_at', s.trial_ends_at,
        'subscription_ends_at', s.subscription_ends_at
      )
      from public.user_subscriptions s where s.family_id = fid limit 1
    ),
    'experience', jsonb_build_object(
      'children', case when include_experience
        then coalesce((select jsonb_agg(to_jsonb(t)) from public.child_engagement_profiles t where t.family_id = fid), '[]'::jsonb)
        else '[]'::jsonb end,
      'settings', case when include_experience
        then (select to_jsonb(t) from public.family_engagement_settings t where t.family_id = fid limit 1)
        else null end,
      'letters', case when include_experience
        then coalesce((select jsonb_agg(to_jsonb(t)) from public.daily_mascot_letters t where t.family_id = fid), '[]'::jsonb)
        else '[]'::jsonb end,
      'quests', case when include_experience
        then coalesce((select jsonb_agg(to_jsonb(t)) from public.secret_quests t where t.family_id = fid), '[]'::jsonb)
        else '[]'::jsonb end,
      'wishlists', coalesce((select jsonb_agg(to_jsonb(t)) from public.child_wishlists t where t.family_id = fid), '[]'::jsonb),
      'deferredTasks', coalesce((select jsonb_agg(to_jsonb(t)) from public.child_task_deferrals t where t.family_id = fid), '[]'::jsonb),
      'supportObservations', coalesce((select jsonb_agg(to_jsonb(t)) from public.habit_support_observations t where t.family_id = fid), '[]'::jsonb),
      'cuePlans', coalesce((select jsonb_agg(to_jsonb(t)) from public.habit_cue_plans t where t.family_id = fid), '[]'::jsonb),
      'journalEntries', case when include_journal
        then coalesce((select jsonb_agg(to_jsonb(t)) from public.child_journal_entries t where t.family_id = fid), '[]'::jsonb)
        else '[]'::jsonb end,
      'cityPurchases', case when include_city
        then coalesce((select jsonb_agg(to_jsonb(t)) from public.child_city_purchases t where t.family_id = fid), '[]'::jsonb)
        else '[]'::jsonb end
    )
  );
end
$$;

revoke all on function public.family_snapshot(boolean, boolean, boolean) from public, anon;
grant execute on function public.family_snapshot(boolean, boolean, boolean) to authenticated;

commit;
