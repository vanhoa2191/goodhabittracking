do $$
declare
  exposed text;
begin
  select string_agg(function_row.proname, ', ') into exposed
  from pg_catalog.pg_proc function_row
  join pg_catalog.pg_namespace namespace_row on namespace_row.oid = function_row.pronamespace
  where namespace_row.nspname = 'public'
    and function_row.proname in (
      'process_payos_webhook',
      'claim_lifecycle_messages',
      'enqueue_lifecycle_message',
      'finish_lifecycle_message',
      'schedule_trial_ending_messages',
      'exchange_pairing_challenge'
    )
    and (
      pg_catalog.has_function_privilege('anon', function_row.oid, 'EXECUTE')
      or pg_catalog.has_function_privilege('authenticated', function_row.oid, 'EXECUTE')
    );

  if exposed is not null then
    raise exception 'Service-only functions are still callable by clients: %', exposed;
  end if;

  if not pg_catalog.has_function_privilege(
    'service_role',
    'public.process_payos_webhook(bigint,integer,text,text,text,jsonb)',
    'EXECUTE'
  ) then
    raise exception 'The service role must still settle payments';
  end if;
end $$;
