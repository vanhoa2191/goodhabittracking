do $$
begin
  if to_regclass('public.child_task_deferrals') is null then
    raise exception 'Child task deferrals are missing';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_trigger trigger_row
    where trigger_row.tgrelid = 'public.activity_logs'::regclass
      and trigger_row.tgname = 'clear_task_deferral_on_completion'
      and not trigger_row.tgisinternal
      and (trigger_row.tgtype & 4) = 4
      and (trigger_row.tgtype & 2) = 0
      and (trigger_row.tgtype & 1) = 1
  ) then
    raise exception 'Completion cleanup trigger is missing';
  end if;

  if exists (
    select 1 from public.child_task_deferrals task
    join public.activity_logs log
      on log.family_id = task.family_id
      and log.child_id = task.child_id
      and log.activity_id = task.activity_id
      and log.log_date = task.local_date
    where log.status in ('completed', 'pending_approval', 'approved')
  ) then
    raise exception 'A task is both deferred and completed';
  end if;

  if pg_catalog.has_function_privilege('anon', 'public.set_parent_task_deferral(uuid,uuid,uuid,date,boolean)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.set_parent_task_deferral(uuid,uuid,uuid,date,boolean)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('anon', 'public.set_child_task_deferral(text,uuid,date,boolean)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.set_child_task_deferral(text,uuid,date,boolean)', 'EXECUTE') then
    raise exception 'Task deferral execution grants are incorrect';
  end if;
end $$;
