do $$
begin
  if pg_catalog.has_function_privilege('anon', 'public.family_snapshot(boolean,boolean,boolean)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.family_snapshot(boolean,boolean,boolean)', 'EXECUTE') then
    raise exception 'family_snapshot must be callable by signed-in users only';
  end if;
  if (select prosecdef from pg_catalog.pg_proc where oid = 'public.family_snapshot(boolean,boolean,boolean)'::regprocedure) then
    raise exception 'family_snapshot must run as the caller so row level security still applies';
  end if;
end
$$;
