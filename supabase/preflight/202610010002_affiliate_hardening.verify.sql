do $$
begin
  if pg_catalog.has_function_privilege('authenticated', 'public.request_affiliate_payout(uuid)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.affiliate_save_payout_details(uuid,text,text,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.request_affiliate_payout(uuid)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.request_affiliate_payout(uuid)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.affiliate_save_payout_details(uuid,text,text,text)', 'EXECUTE') then
    raise exception 'Payout functions must be callable by the service role only';
  end if;
  if exists (
    select 1 from pg_catalog.pg_proc procedure
    where procedure.pronamespace = 'public'::regnamespace
      and procedure.proname in ('request_affiliate_payout', 'affiliate_save_payout_details')
      and pg_catalog.pg_get_function_identity_arguments(procedure.oid) in ('', 'bank text, account_number text, account_name text')
  ) then
    raise exception 'The old payout functions callable with the caller session must be gone';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'affiliate_accounts' and column_name = 'payout_details_changed_at'
  ) then
    raise exception 'affiliate_accounts.payout_details_changed_at is missing';
  end if;
end
$$;
