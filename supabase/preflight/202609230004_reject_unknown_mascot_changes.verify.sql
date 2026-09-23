do $$
declare
  function_body text;
begin
  select pg_get_functiondef('public.record_mascot_selection()'::regprocedure)
  into function_body;

  if function_body not like '%invalid_mascot_selection%'
    or function_body not like '%new.avatar is distinct from old.avatar%' then
    raise exception 'Unknown mascot changes are not rejected';
  end if;
end
$$;
