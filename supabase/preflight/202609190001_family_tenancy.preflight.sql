begin;
set local role postgres;

select current_database() as database_name, now() as inspected_at;

select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

create temporary table migration_preflight_row_counts (
  table_name text primary key,
  relation_exists boolean not null,
  rows bigint not null,
  unowned bigint not null
) on commit drop;

do $$
declare
  inspected_table text;
begin
  foreach inspected_table in array array[
    'child_profiles', 'habit_activities', 'activity_logs', 'rewards',
    'redemptions', 'child_badges', 'user_subscriptions', 'payment_orders'
  ] loop
    if to_regclass(format('public.%I', inspected_table)) is null then
      insert into migration_preflight_row_counts values (inspected_table, false, 0, 0);
    else
      execute format(
        'insert into migration_preflight_row_counts
         select %L, true, count(*), count(*) filter (where user_id is null)
         from public.%I',
        inspected_table,
        inspected_table
      );
    end if;
  end loop;
end $$;

select table_name, relation_exists, rows, unowned
from migration_preflight_row_counts
order by table_name;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

commit;
