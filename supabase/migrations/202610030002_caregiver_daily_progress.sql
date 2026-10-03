begin;

-- Caregivers also see how the last seven days went, still without any per-habit log. The projection adds one
-- completed-or-approved count per child per day, plus the recurrence fields of each active habit so the browser
-- can work out which days a habit was due with the same rule the rest of the app uses.
--
-- The argument is optional: a call without it (an older browser) returns exactly the previous shape, so the
-- strict parser in a cached build keeps working. Adding an argument cannot be done with create or replace, and
-- keeping the zero-argument function beside the new one would make a call without arguments ambiguous.
drop function if exists public.caregiver_progress_snapshot();

create or replace function public.caregiver_progress_snapshot(local_today date default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  membership public.family_memberships%rowtype;
  window_end date;
  window_start date;
  result jsonb;
begin
  select member.* into membership
  from public.family_memberships member
  where member.user_id = auth.uid();
  if membership.family_id is null or membership.role <> 'caregiver' then
    return null;
  end if;

  -- Name each display field; completed/approved logs leave the database only as per-child counts.
  result := jsonb_build_object(
    'familyId', membership.family_id,
    'familyRole', membership.role,
    'profiles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', child.id, 'name', child.name, 'avatar', child.avatar, 'theme_color', child.theme_color
      ) order by child.created_at, child.id)
      from public.child_profiles child where child.family_id = membership.family_id
    ), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', activity.id, 'child_id', activity.child_id,
          'title', activity.title, 'description', activity.description
        ) || case when local_today is null then '{}'::jsonb else jsonb_build_object(
          'recurrence_type', activity.recurrence_type,
          'recurrence_days', activity.recurrence_days,
          'created_at', activity.created_at
        ) end
        order by activity.created_at, activity.id
      )
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

  if local_today is null then
    return result;
  end if;

  -- The browser's calendar day decides which day is "today", but never by more than a day from the server's,
  -- so a wrong clock cannot widen or shift the window.
  window_end := case
    when local_today between current_date - 1 and current_date + 1 then local_today
    else current_date
  end;
  window_start := window_end - 6;

  -- Days with no completion are left out; the browser fills them with zero. Logs of habits that were switched
  -- off are not counted, because those habits are not listed or due any more.
  return result || jsonb_build_object('daily', jsonb_build_object(
    'from', window_start,
    'to', window_end,
    'counts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'child_id', day_count.child_id, 'day', day_count.log_date, 'count', day_count.total
      ) order by day_count.child_id, day_count.log_date)
      from (
        select log.child_id, log.log_date, count(*) as total
        from public.activity_logs log
        join public.habit_activities activity
          on activity.id = log.activity_id and activity.family_id = membership.family_id and activity.is_active
          and (activity.child_id is null or activity.child_id = log.child_id)
        where log.family_id = membership.family_id
          and log.status in ('completed', 'approved')
          and log.log_date between window_start and window_end
          -- DOW of a date is the UTC weekday of the same YYYY-MM-DD string in isActivityDueOn (Sunday = 0).
          and case activity.recurrence_type
            when 'weekdays' then extract(dow from log.log_date) between 1 and 5
            when 'weekends' then extract(dow from log.log_date) in (0, 6)
            when 'custom' then coalesce(to_jsonb(activity.recurrence_days), '[]'::jsonb)
              @> jsonb_build_array(extract(dow from log.log_date)::integer)
            when 'daily' then true
            else true
          end
        group by log.child_id, log.log_date
      ) day_count
    ), '[]'::jsonb)
  ));
end;
$$;

revoke all on function public.caregiver_progress_snapshot(date) from public, anon, service_role;
grant execute on function public.caregiver_progress_snapshot(date) to authenticated;

commit;
