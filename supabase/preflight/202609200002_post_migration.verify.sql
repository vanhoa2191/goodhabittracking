begin transaction read only;
set local role postgres;

select current_database() as database_name, now() as verified_at;

with expected_tables(table_name) as (
  values
    ('families'), ('family_memberships'), ('parent_profiles'), ('parent_settings'),
    ('child_profiles'), ('habit_activities'), ('activity_logs'), ('rewards'),
    ('redemptions'), ('child_badges'), ('group_teams'), ('group_members'),
    ('kudos'), ('device_sessions'), ('pairing_challenges'), ('pairing_rate_limits'),
    ('device_audit_log'), ('user_subscriptions'), ('payment_orders'),
    ('billing_webhook_events'), ('family_consents')
)
select expected.table_name, to_regclass(format('public.%I', expected.table_name)) is not null as relation_exists
from expected_tables expected
order by expected.table_name;

select
  (select count(*) from auth.users) as auth_users,
  (select count(distinct user_id) from public.family_memberships) as users_with_membership,
  (select count(*) from public.families) as families,
  (select count(*) from public.migration_quarantine) as quarantined_rows;

select class.relname as table_name, class.relrowsecurity, class.relforcerowsecurity
from pg_class class
join pg_namespace namespace on namespace.oid = class.relnamespace
where namespace.nspname = 'public'
  and class.relkind = 'r'
  and class.relname in (
    'families', 'family_memberships', 'parent_profiles', 'parent_settings',
    'child_profiles', 'habit_activities', 'activity_logs', 'rewards',
    'redemptions', 'child_badges', 'group_teams', 'group_members', 'kudos',
    'device_sessions', 'pairing_challenges', 'pairing_rate_limits',
    'device_audit_log', 'user_subscriptions', 'payment_orders',
    'billing_webhook_events', 'family_consents'
  )
  and (not class.relrowsecurity or not class.relforcerowsecurity)
order by class.relname;

select tablename, policyname, qual, with_check
from pg_policies
where schemaname = 'public'
  and (
    coalesce(qual, '') ~* 'auth\.uid\(\)\s+is\s+null'
    or coalesce(with_check, '') ~* 'auth\.uid\(\)\s+is\s+null'
  )
order by tablename, policyname;

commit;
