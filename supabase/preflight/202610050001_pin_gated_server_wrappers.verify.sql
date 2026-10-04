do $$
declare
  wrapper text;
begin
  if pg_catalog.has_function_privilege('anon', 'public.act_as_user(uuid)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.act_as_user(uuid)', 'EXECUTE')
    or pg_catalog.has_function_privilege('service_role', 'public.act_as_user(uuid)', 'EXECUTE') then
    raise exception 'act_as_user must not be callable by any API role';
  end if;

  foreach wrapper in array array[
    'public.review_habit_command_as(uuid,uuid,text)',
    'public.review_habits_command_as(uuid,uuid[],text)',
    'public.transition_redemption_command_as(uuid,uuid,text)',
    'public.adjust_child_points_command_as(uuid,uuid,integer,text,uuid)',
    'public.revoke_device_session_as(uuid,uuid)',
    'public.ensure_pairing_credential_as(uuid,uuid,uuid,text,text,text)',
    'public.rotate_pairing_credential_as(uuid,uuid,uuid,text,text,text)',
    'public.delete_owned_family_as(uuid,text)',
    'public.consume_ai_quota_as(uuid,integer,integer,integer)'
  ] loop
    if pg_catalog.has_function_privilege('anon', wrapper, 'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated', wrapper, 'EXECUTE')
      or not pg_catalog.has_function_privilege('service_role', wrapper, 'EXECUTE') then
      raise exception 'The wrapper % must be callable by the service role only', wrapper;
    end if;
  end loop;

  -- The wrapper really makes the database see the named parent: for a parent with manage rights and a log that
  -- does not exist the answer is "log_not_found", not a refusal for lack of a family. Nothing is changed.
  if exists (select 1 from public.family_memberships where role in ('owner', 'parent', 'guardian')) then
    begin
      perform public.review_habit_command_as(
        (select user_id from public.family_memberships where role in ('owner', 'parent', 'guardian') order by created_at limit 1),
        gen_random_uuid(),
        'approve'
      );
      raise exception 'The review wrapper accepted a log that does not exist';
    exception when others then
      if sqlerrm <> 'log_not_found' then
        raise exception 'The review wrapper did not act as the named parent (%)', sqlerrm;
      end if;
    end;
  end if;
end
$$;
