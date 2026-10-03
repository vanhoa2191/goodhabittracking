do $$
declare
  signature regprocedure := 'public.review_habits_command(uuid[], text)'::regprocedure;
  definition text := pg_catalog.pg_get_functiondef('public.review_habits_command(uuid[], text)'::regprocedure);
begin
  if not exists (
    select 1 from pg_catalog.pg_proc
    where oid = signature and prosecdef and proconfig @> array['search_path=""']
  ) then
    raise exception 'review_habits_command must be a definer with an empty search_path';
  end if;

  if not pg_catalog.has_function_privilege('authenticated', signature, 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', signature, 'EXECUTE')
    or pg_catalog.has_function_privilege('service_role', signature, 'EXECUTE') then
    raise exception 'review_habits_command must be executable by signed-in parents only';
  end if;

  if definition not like '%public.can_manage_family(actor_family_id)%'
    or definition not like '%too_many_logs%'
    or definition not like '%public.review_habit_command(current_id, decision)%' then
    raise exception 'review_habits_command must check manage rights, cap the batch and reuse review_habit_command';
  end if;
end
$$;
