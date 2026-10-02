do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'child_journal_entries', 'child_wishlists', 'habit_support_observations', 'habit_cue_plans',
    'family_engagement_settings', 'child_engagement_profiles', 'daily_mascot_letters', 'secret_quests',
    'child_task_deferrals', 'child_city_purchases', 'payment_orders', 'device_sessions', 'device_audit_log',
    'pairing_challenges'
  ] loop
    if exists (
      select 1 from pg_catalog.pg_policies policy
      where policy.schemaname = 'public' and policy.tablename = table_name
        and policy.cmd in ('SELECT', 'ALL') and policy.qual not like '%can_manage_family%'
    ) then
      raise exception '% is still readable by every family member', table_name;
    end if;
  end loop;

  if not exists (
    select 1 from pg_catalog.pg_indexes
    where schemaname = 'public' and indexname = 'family_memberships_one_family_per_user'
  ) then
    raise exception 'an account can still belong to more than one family';
  end if;

  if (select prosecdef from pg_catalog.pg_proc where oid = 'public.family_snapshot(boolean,boolean,boolean)'::regprocedure)
    or (select prosrc from pg_catalog.pg_proc where oid = 'public.family_snapshot(boolean,boolean,boolean)'::regprocedure) like '%to_jsonb(%' then
    raise exception 'family_snapshot must run as the caller and name every column it returns';
  end if;

  if pg_catalog.has_function_privilege('anon', 'public.exchange_pairing_credential(text,text,text,text,text,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.exchange_pairing_credential(text,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'exchange_pairing_credential must stay service-role only';
  end if;
end
$$;
