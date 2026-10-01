do $$
begin
  if not pg_catalog.has_function_privilege('authenticated', 'public.referral_claim_state()', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.referral_claim_state()', 'EXECUTE') then
    raise exception 'referral_claim_state must be callable by signed-in users only';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_proc procedure
    where procedure.oid = 'public.referral_claim_state()'::regprocedure and procedure.prosecdef
      and procedure.proconfig::text like '%search_path=%'
  ) then
    raise exception 'referral_claim_state must be security definer with a fixed search_path';
  end if;
end
$$;
