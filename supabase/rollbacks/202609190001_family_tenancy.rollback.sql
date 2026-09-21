begin;

do $$
declare
  policy record;
begin
  for policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'child_profiles', 'habit_activities', 'activity_logs', 'rewards',
        'redemptions', 'child_badges', 'user_subscriptions', 'payment_orders'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', policy.policyname, policy.schemaname, policy.tablename);
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'child_profiles', 'habit_activities', 'activity_logs', 'rewards',
    'redemptions', 'child_badges'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = auth.uid())',
      table_name || '_rollback_select_owner', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid())',
      table_name || '_rollback_insert_owner', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      table_name || '_rollback_update_owner', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = auth.uid())',
      table_name || '_rollback_delete_owner', table_name
    );
  end loop;
end $$;

create policy subscriptions_rollback_select_owner on public.user_subscriptions
  for select to authenticated using (user_id = auth.uid());
create policy payment_orders_rollback_select_owner on public.payment_orders
  for select to authenticated using (user_id = auth.uid());

revoke all on public.family_access_codes from anon, authenticated;
revoke all on public.device_sessions from anon, authenticated;

commit;
