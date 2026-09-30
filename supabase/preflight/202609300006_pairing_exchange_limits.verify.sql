do $$
declare
  source text := pg_catalog.pg_get_functiondef('public.exchange_pairing_credential(text,text,text,text,text,text)'::regprocedure);
begin
  if pg_catalog.has_function_privilege('anon', 'public.exchange_pairing_credential(text,text,text,text,text,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.exchange_pairing_credential(text,text,text,text,text,text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.exchange_pairing_credential(text,text,text,text,text,text)', 'EXECUTE') then
    raise exception 'The pairing exchange must be callable by the service role only';
  end if;
  if source not like '%global_record.attempts > 120%' or source not like '%stale.window_started_at%' then
    raise exception 'The pairing exchange must keep a global attempt budget and prune old counters';
  end if;
end $$;
