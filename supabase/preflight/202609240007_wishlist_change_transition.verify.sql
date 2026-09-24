do $$
declare
  child_function oid := to_regprocedure('public.choose_child_wishlist(text,uuid)');
  parent_function oid := to_regprocedure('public.choose_parent_wishlist(uuid,uuid,uuid)');
begin
  if child_function is null or parent_function is null then
    raise exception 'Wishlist change functions are missing';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_proc function_row
    where function_row.oid in (child_function, parent_function)
      and function_row.prosecdef
      and 'search_path=""' = any(function_row.proconfig)
      and pg_catalog.pg_get_functiondef(function_row.oid) like '%is distinct from excluded.reward_id%'
      and pg_catalog.pg_get_functiondef(function_row.oid) like '%changed := found;%'
      and pg_catalog.pg_get_functiondef(function_row.oid) like '%if not changed then%'
      and pg_catalog.pg_get_functiondef(function_row.oid) like '%''changed'', changed%'
    group by function_row.prosecdef
    having count(*) = 2
  ) then
    raise exception 'Wishlist change functions are missing atomic change detection or safe settings';
  end if;

  if not pg_catalog.has_function_privilege('anon', parent_function, 'EXECUTE')
    and pg_catalog.has_function_privilege('authenticated', parent_function, 'EXECUTE')
    and pg_catalog.has_function_privilege('anon', child_function, 'EXECUTE')
    and pg_catalog.has_function_privilege('authenticated', child_function, 'EXECUTE') then
    return;
  end if;
  raise exception 'Wishlist function execution grants are incorrect';
end $$;
