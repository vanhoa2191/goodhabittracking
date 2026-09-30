do $$
begin
  if not pg_catalog.has_function_privilege('authenticated', 'public.adjust_child_points_command(uuid,integer,text,uuid)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.adjust_child_points_command(uuid,integer,text,uuid)', 'EXECUTE') then
    raise exception 'Point adjustment must be callable by signed-in parents only';
  end if;
  if pg_catalog.has_table_privilege('authenticated', 'public.child_point_adjustments', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.child_point_adjustments', 'INSERT') then
    raise exception 'Point adjustment history must be private';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_class relation
    where relation.oid = 'public.child_point_adjustments'::regclass and relation.relforcerowsecurity
  ) then
    raise exception 'Row-level security must be forced on point adjustments';
  end if;
end $$;
