do $$
declare
  accept_source text := pg_catalog.pg_get_functiondef('public.accept_caregiver_invite(text)'::regprocedure);
  delete_source text := pg_catalog.pg_get_functiondef('public.delete_owned_family(text)'::regprocedure);
  claim_source text := pg_catalog.pg_get_functiondef('public.claim_lifecycle_messages(integer)'::regprocedure);
begin
  if accept_source not like '%delete from public.families where id = own_family_id%' then
    raise exception 'An untouched automatic family must not block a caregiver invitation';
  end if;
  if delete_source not like '%minimised%' then
    raise exception 'Family deletion must minimise retained payment payloads';
  end if;
  if claim_source not like '%worker_lost%' or claim_source not like '%message.status = ''processing''%' then
    raise exception 'The outbox must recover messages stranded in processing';
  end if;
  if pg_catalog.has_function_privilege('anon', 'public.claim_lifecycle_messages(integer)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.claim_lifecycle_messages(integer)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.accept_caregiver_invite(text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.delete_owned_family(text)', 'EXECUTE') then
    raise exception 'Account lifecycle function grants are incorrect';
  end if;
end $$;
