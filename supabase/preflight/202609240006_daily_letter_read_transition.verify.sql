do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_proc as function_row
    where function_row.oid = 'public.open_daily_mascot_letter(uuid,date,boolean,text)'::regprocedure
      and function_row.prosecdef
      and 'search_path=""' = any(function_row.proconfig)
      and pg_catalog.pg_get_functiondef(function_row.oid) like '%''newly_read''%'
      and pg_catalog.pg_get_functiondef(function_row.oid) like '%read_at is null%'
  ) then
    raise exception 'Daily letter read transition is missing or unsafe';
  end if;
end $$;
