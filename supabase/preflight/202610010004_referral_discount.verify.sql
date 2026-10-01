do $$
declare
  settings public.affiliate_settings%rowtype;
begin
  select * into settings from public.affiliate_settings where singleton;
  if not found or settings.referred_discount_bps <> 1000 then
    raise exception 'The default referred-family discount must be 10 percent';
  end if;
  if pg_catalog.has_function_privilege('authenticated', 'public.referral_discount_bps(uuid)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.referral_discount_bps(uuid)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('service_role', 'public.referral_discount_bps(uuid)', 'EXECUTE') then
    raise exception 'referral_discount_bps must be callable by the service role only';
  end if;
end
$$;
