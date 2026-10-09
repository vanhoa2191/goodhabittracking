do $$
declare
  body text;
  function_name text;
begin
  if pg_catalog.has_table_privilege('authenticated', 'public.habit_activities', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.habit_activities', 'UPDATE')
    or pg_catalog.has_table_privilege('authenticated', 'public.habit_activities', 'DELETE') then
    raise exception 'Activity writes must go through the unlocked server route';
  end if;
  foreach function_name in array array['complete_habit_command', 'complete_child_habit_command',
    'undo_habit_command', 'undo_child_habit_command', 'review_habit_command'] loop
    select pg_catalog.pg_get_functiondef(oid) into body from pg_catalog.pg_proc
    where pronamespace = 'public'::regnamespace and proname = function_name;
    if body not like '%recompute_child_streak%' then raise exception 'Missing streak recomputation: %', function_name; end if;
  end loop;
  body := pg_catalog.pg_get_functiondef('public.complete_child_habit_command(text,uuid,date,uuid)'::regprocedure);
  if body not like '%activity_not_scheduled%' or body not like '%@> jsonb_build_array(extract(dow from target_log_date)::integer)%'
    or body like '%any(activity.recurrence_days)%'
    or body not like '%activity_not_started%' then
    raise exception 'Child completion must enforce recurrence';
  end if;
  if pg_catalog.has_function_privilege('authenticated', 'public.mutate_child_profile_command(jsonb)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.mutate_child_profile_command(jsonb)', 'EXECUTE')
    or pg_catalog.has_function_privilege('service_role', 'public.mutate_child_profile_command(jsonb)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.mutate_child_profile_command_as(uuid,jsonb)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.mutate_child_profile_command_as(uuid,jsonb)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.mutate_child_profile_command_as(uuid,jsonb)', 'EXECUTE') then
    raise exception 'Profile mutations must go through the unlocked service wrapper';
  end if;
  body := pg_catalog.pg_get_functiondef('public.mutate_child_profile_command(jsonb)'::regprocedure);
  if body not like '%not between 0 and 10000%' or body not like '%not in (0, 20)%'
    or body not like '%can_manage_family%' then raise exception 'Profile award limits and family authorization required'; end if;
  body := pg_catalog.pg_get_functiondef('public.get_child_session(text)'::regprocedure);
  if body like '%update public.%' or body like '%insert into public.%' then raise exception 'Child GET must be read-only'; end if;
  body := pg_catalog.pg_get_functiondef('public.get_parent_pin_status(uuid)'::regprocedure);
  if body like '%insert into%' or body like '%update public.%' then raise exception 'PIN status must be read-only'; end if;
  body := pg_catalog.pg_get_functiondef('public.open_daily_mascot_letter(uuid,date,boolean,text)'::regprocedure);
  if body not like '%if not mark_read then%return jsonb_build_object%end if;%insert into%' then
    raise exception 'Letter preview must return before writes';
  end if;
  body := pg_catalog.pg_get_functiondef('public.verify_parent_pin(uuid,text)'::regprocedure);
  if body not like '%verified%version%settings.parent_pin_configured_at%' then raise exception 'Verify must return the locked PIN version'; end if;
  body := pg_catalog.pg_get_functiondef('public.set_parent_pin(uuid,text,text)'::regprocedure);
  if body not like '%returning * into settings%' or body not like '%updated%version%' then raise exception 'Set must return its own PIN version'; end if;
  body := pg_catalog.pg_get_functiondef('public.transition_redemption_command(uuid,text)'::regprocedure);
  if body not like '%redemption.stock_reserved%stock = stock + 1%' then raise exception 'Reject must restore reserved stock'; end if;
  if pg_catalog.has_function_privilege('authenticated', 'public.transition_redemption_command(uuid,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.transition_redemption_command(uuid,text)', 'EXECUTE') then
    raise exception 'PIN-gated original command must remain closed';
  end if;
  if not exists (select 1 from pg_catalog.pg_trigger where tgrelid = 'public.rewards'::regclass and tgname = 'refund_deleted_reward' and not tgisinternal) then
    raise exception 'Reward deletion must refund and audit unsettled requests';
  end if;
  if not exists (select 1 from pg_catalog.pg_class where oid = 'public.reward_refund_events'::regclass and relrowsecurity and relforcerowsecurity) then
    raise exception 'Refund audit must have forced RLS';
  end if;
  body := pg_catalog.pg_get_functiondef('public.claim_lifecycle_messages(integer)'::regprocedure);
  if body not like '%status = ''suppressed''%message.status = ''processing''%email_suppressions%' then
    raise exception 'Suppression and consent must cover stale processing';
  end if;
  if pg_catalog.has_function_privilege('anon', 'public.recompute_child_streak(uuid)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.recompute_child_streak(uuid)', 'EXECUTE') then
    raise exception 'Streak cache helper must be internal';
  end if;
end
$$;
