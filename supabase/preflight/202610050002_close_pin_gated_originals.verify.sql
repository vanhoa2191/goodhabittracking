do $$
declare
  original text;
begin
  foreach original in array array[
    'public.review_habit_command(uuid,text)',
    'public.review_habits_command(uuid[],text)',
    'public.transition_redemption_command(uuid,text)',
    'public.adjust_child_points_command(uuid,integer,text,uuid)',
    'public.revoke_device_session(uuid)',
    'public.ensure_pairing_credential(uuid,uuid,text,text,text)',
    'public.rotate_pairing_credential(uuid,uuid,text,text,text)',
    'public.delete_owned_family(text)',
    'public.consume_ai_quota(integer,integer,integer)'
  ] loop
    if pg_catalog.has_function_privilege('anon', original, 'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated', original, 'EXECUTE')
      or pg_catalog.has_function_privilege('service_role', original, 'EXECUTE') then
      raise exception 'The PIN-gated function % must not be callable by any API role; only its server-only wrapper may run it', original;
    end if;
  end loop;

  -- The wrappers still work: for a parent with manage rights and a log that does not exist the answer is
  -- "log_not_found", which proves the wrapper reaches the original even though no API role can call it.
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
        raise exception 'The review wrapper can no longer reach the original function (%)', sqlerrm;
      end if;
    end;
  end if;
end
$$;
