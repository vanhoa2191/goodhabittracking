begin;

create extension if not exists pgcrypto;

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  order_code bigint unique not null,
  user_id uuid references auth.users(id) on delete set null,
  plan_id text not null,
  amount integer not null,
  description text,
  status text not null default 'PENDING',
  payment_url text,
  qr_code text,
  paid_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Gia đình Siêu Nhân',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_memberships (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'parent', 'guardian')),
  created_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create unique index if not exists family_memberships_one_owner_per_family
  on public.family_memberships (family_id) where role = 'owner';
create index if not exists family_memberships_user_idx
  on public.family_memberships (user_id, family_id);

create table if not exists public.parent_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  caregiver_role text not null default 'guardian'
    check (caregiver_role in ('father', 'mother', 'grandparent', 'guardian')),
  phone_or_email text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.migration_quarantine (
  id bigint generated always as identity primary key,
  migration_key text not null,
  source_table text not null,
  source_id text,
  reason text not null,
  payload jsonb not null,
  quarantined_at timestamptz not null default now()
);
alter table public.migration_quarantine enable row level security;
revoke all on public.migration_quarantine from anon, authenticated;

insert into public.families (name, created_by)
select 'Gia đình Siêu Nhân', legacy.user_id
from (
  select id as user_id from auth.users
  union select user_id from public.child_profiles where user_id is not null
  union select user_id from public.habit_activities where user_id is not null
  union select user_id from public.activity_logs where user_id is not null
  union select user_id from public.rewards where user_id is not null
  union select user_id from public.redemptions where user_id is not null
  union select user_id from public.child_badges where user_id is not null
  union select user_id from public.user_subscriptions where user_id is not null
  union select user_id from public.payment_orders where user_id is not null
) legacy
where not exists (
  select 1 from public.family_memberships membership where membership.user_id = legacy.user_id
);

insert into public.family_memberships (family_id, user_id, role)
select family.id, family.created_by, 'owner'
from public.families family
where not exists (
  select 1 from public.family_memberships membership
  where membership.family_id = family.id and membership.user_id = family.created_by
)
on conflict do nothing;

create or replace function public.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select membership.family_id
  from public.family_memberships membership
  where membership.user_id = auth.uid()
  order by membership.created_at
  limit 1
$$;

create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.family_memberships membership
    where membership.family_id = target_family_id
      and membership.user_id = auth.uid()
  )
$$;

create or replace function public.can_manage_family(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.family_memberships membership
    where membership.family_id = target_family_id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'parent', 'guardian')
  )
$$;

revoke all on function public.current_family_id() from public;
revoke all on function public.is_family_member(uuid) from public;
revoke all on function public.can_manage_family(uuid) from public;
grant execute on function public.current_family_id() to authenticated;
grant execute on function public.is_family_member(uuid) to authenticated;
grant execute on function public.can_manage_family(uuid) to authenticated;

alter table public.child_profiles add column if not exists family_id uuid references public.families(id) on delete cascade;
alter table public.child_profiles add column if not exists birth_year integer;
alter table public.child_profiles add column if not exists age_stage text check (age_stage in ('0-3', '3-6', '6-12', '12-18'));
alter table public.child_profiles add column if not exists league_tier text default 'bronze'
  check (league_tier in ('bronze', 'silver', 'gold', 'diamond'));

alter table public.habit_activities add column if not exists family_id uuid references public.families(id) on delete cascade;
alter table public.habit_activities add column if not exists target_age_stage text default 'all'
  check (target_age_stage in ('0-3', '3-6', '6-12', '12-18', 'all'));
alter table public.habit_activities add column if not exists is_parent_role boolean not null default false;
alter table public.habit_activities add column if not exists portrait16_key text;
alter table public.habit_activities add column if not exists bo_thi7_key text
  check (bo_thi7_key in ('nhan', 'nhan_mat', 'ngon', 'tam', 'phong', 'than', 'toa'));

alter table public.activity_logs add column if not exists family_id uuid references public.families(id) on delete cascade;
alter table public.rewards add column if not exists family_id uuid references public.families(id) on delete cascade;
alter table public.redemptions add column if not exists family_id uuid references public.families(id) on delete cascade;
alter table public.child_badges add column if not exists family_id uuid references public.families(id) on delete cascade;
alter table public.user_subscriptions add column if not exists family_id uuid references public.families(id) on delete cascade;
alter table public.payment_orders add column if not exists family_id uuid references public.families(id) on delete set null;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'child_profiles', 'habit_activities', 'activity_logs', 'rewards',
    'redemptions', 'child_badges', 'user_subscriptions', 'payment_orders'
  ] loop
    execute format(
      'update public.%I row set family_id = membership.family_id from public.family_memberships membership where row.family_id is null and row.user_id = membership.user_id',
      table_name
    );
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'activity_logs', 'redemptions', 'child_badges', 'habit_activities',
    'rewards', 'child_profiles', 'user_subscriptions', 'payment_orders'
  ] loop
    execute format(
      'insert into public.migration_quarantine (migration_key, source_table, source_id, reason, payload)
       select %L, %L, id::text, %L, to_jsonb(row)
       from public.%I row where family_id is null
       and not exists (
         select 1 from public.migration_quarantine q
         where q.migration_key = %L and q.source_table = %L and q.source_id = row.id::text
       )',
      '202609190001_family_tenancy', table_name, 'missing authenticated owner', table_name,
      '202609190001_family_tenancy', table_name
    );
    execute format('delete from public.%I where family_id is null', table_name);
  end loop;
end $$;

alter table public.child_profiles alter column family_id set default public.current_family_id();
alter table public.habit_activities alter column family_id set default public.current_family_id();
alter table public.activity_logs alter column family_id set default public.current_family_id();
alter table public.rewards alter column family_id set default public.current_family_id();
alter table public.redemptions alter column family_id set default public.current_family_id();
alter table public.child_badges alter column family_id set default public.current_family_id();
alter table public.user_subscriptions alter column family_id set default public.current_family_id();

alter table public.child_profiles alter column family_id set not null;
alter table public.habit_activities alter column family_id set not null;
alter table public.activity_logs alter column family_id set not null;
alter table public.rewards alter column family_id set not null;
alter table public.redemptions alter column family_id set not null;
alter table public.child_badges alter column family_id set not null;
alter table public.user_subscriptions alter column family_id set not null;

insert into public.parent_profiles (user_id, display_name)
select membership.user_id, coalesce(auth_user.raw_user_meta_data ->> 'full_name', '')
from public.family_memberships membership
join auth.users auth_user on auth_user.id = membership.user_id
on conflict (user_id) do nothing;

create table if not exists public.parent_settings (
  family_id uuid primary key references public.families(id) on delete cascade default public.current_family_id(),
  family_title text not null default 'Gia đình Siêu Nhân',
  is_public_leaderboard boolean not null default false,
  locale text not null default 'vi',
  appearance jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.parent_settings (family_id, family_title)
select family.id, family.name
from public.families family
on conflict (family_id) do nothing;

create table if not exists public.group_teams (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade default public.current_family_id(),
  name text not null,
  invite_code text not null unique,
  icon text not null default '👥',
  created_by_child_id uuid references public.child_profiles(id) on delete set null,
  weekly_target_points integer not null default 0 check (weekly_target_points >= 0),
  reward_type text not null default 'badge' check (reward_type in ('badge', 'stars', 'mystery_box', 'custom')),
  custom_reward_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.group_teams(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade default public.current_family_id(),
  joined_at timestamptz not null default now(),
  primary key (group_id, child_id)
);

create table if not exists public.kudos (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade default public.current_family_id(),
  from_child_id uuid not null references public.child_profiles(id) on delete cascade,
  to_child_id uuid not null references public.child_profiles(id) on delete cascade,
  emoji text not null,
  sent_at timestamptz not null default now(),
  check (from_child_id <> to_child_id)
);

create table if not exists public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  token_hash text not null unique,
  capabilities text[] not null default array['child:read', 'child:complete'],
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists child_profiles_id_family_key
  on public.child_profiles(id, family_id);
create unique index if not exists habit_activities_id_family_key
  on public.habit_activities(id, family_id);
create unique index if not exists rewards_id_family_key
  on public.rewards(id, family_id);
create unique index if not exists group_teams_id_family_key
  on public.group_teams(id, family_id);

alter table public.habit_activities
  add constraint habit_activities_child_family_fk
  foreign key (child_id, family_id) references public.child_profiles(id, family_id) on delete cascade;
alter table public.activity_logs
  add constraint activity_logs_activity_family_fk
  foreign key (activity_id, family_id) references public.habit_activities(id, family_id) on delete cascade;
alter table public.activity_logs
  add constraint activity_logs_child_family_fk
  foreign key (child_id, family_id) references public.child_profiles(id, family_id) on delete cascade;
alter table public.redemptions
  add constraint redemptions_reward_family_fk
  foreign key (reward_id, family_id) references public.rewards(id, family_id) on delete cascade;
alter table public.redemptions
  add constraint redemptions_child_family_fk
  foreign key (child_id, family_id) references public.child_profiles(id, family_id) on delete cascade;
alter table public.child_badges
  add constraint child_badges_child_family_fk
  foreign key (child_id, family_id) references public.child_profiles(id, family_id) on delete cascade;
alter table public.group_teams
  add constraint group_teams_creator_family_fk
  foreign key (created_by_child_id, family_id) references public.child_profiles(id, family_id)
  on delete set null (created_by_child_id);
alter table public.group_members
  add constraint group_members_group_family_fk
  foreign key (group_id, family_id) references public.group_teams(id, family_id) on delete cascade;
alter table public.group_members
  add constraint group_members_child_family_fk
  foreign key (child_id, family_id) references public.child_profiles(id, family_id) on delete cascade;
alter table public.kudos
  add constraint kudos_sender_family_fk
  foreign key (from_child_id, family_id) references public.child_profiles(id, family_id) on delete cascade;
alter table public.kudos
  add constraint kudos_recipient_family_fk
  foreign key (to_child_id, family_id) references public.child_profiles(id, family_id) on delete cascade;
alter table public.device_sessions
  add constraint device_sessions_child_family_fk
  foreign key (child_id, family_id) references public.child_profiles(id, family_id) on delete cascade;

create index if not exists child_profiles_family_idx on public.child_profiles(family_id);
create index if not exists habit_activities_family_idx on public.habit_activities(family_id);
create index if not exists activity_logs_family_date_idx on public.activity_logs(family_id, log_date);
create index if not exists rewards_family_idx on public.rewards(family_id);
create index if not exists redemptions_family_idx on public.redemptions(family_id);
create index if not exists group_teams_family_idx on public.group_teams(family_id);
create index if not exists kudos_family_sent_idx on public.kudos(family_id, sent_at desc);
create index if not exists device_sessions_scope_idx on public.device_sessions(family_id, child_id, expires_at);

do $$
declare
  policy record;
begin
  for policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'families', 'family_memberships', 'parent_profiles', 'parent_settings',
        'child_profiles', 'habit_activities', 'activity_logs', 'rewards',
        'redemptions', 'child_badges', 'group_teams', 'group_members', 'kudos',
        'device_sessions', 'user_subscriptions', 'payment_orders', 'family_access_codes'
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
    'families', 'family_memberships', 'parent_profiles', 'parent_settings',
    'child_profiles', 'habit_activities', 'activity_logs', 'rewards',
    'redemptions', 'child_badges', 'group_teams', 'group_members', 'kudos',
    'device_sessions', 'user_subscriptions', 'payment_orders'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end $$;

create policy families_select_member on public.families for select to authenticated
  using (public.is_family_member(id));
create policy families_insert_owner on public.families for insert to authenticated
  with check (created_by = auth.uid());
create policy families_update_owner on public.families for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy memberships_select_family on public.family_memberships for select to authenticated
  using (public.is_family_member(family_id));
create policy memberships_manage_owner on public.family_memberships for all to authenticated
  using (exists (
    select 1 from public.families family
    where family.id = family_id and family.created_by = auth.uid()
  ))
  with check (exists (
    select 1 from public.families family
    where family.id = family_id and family.created_by = auth.uid()
  ));

create policy parent_profiles_self on public.parent_profiles for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'parent_settings', 'child_profiles', 'habit_activities', 'activity_logs',
    'rewards', 'redemptions', 'child_badges', 'group_teams', 'group_members', 'kudos'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_family_member(family_id))',
      table_name || '_select_family', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.can_manage_family(family_id))',
      table_name || '_insert_family', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.can_manage_family(family_id)) with check (public.can_manage_family(family_id))',
      table_name || '_update_family', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.can_manage_family(family_id))',
      table_name || '_delete_family', table_name
    );
  end loop;
end $$;

create policy subscriptions_select_family on public.user_subscriptions for select to authenticated
  using (public.is_family_member(family_id));
create policy payment_orders_select_family on public.payment_orders for select to authenticated
  using (family_id is not null and public.is_family_member(family_id));

revoke all on public.device_sessions from anon, authenticated;

do $$
begin
  if to_regclass('public.family_access_codes') is not null then
    execute 'alter table public.family_access_codes enable row level security';
    execute 'revoke all on public.family_access_codes from anon, authenticated';
  end if;
end $$;

drop view if exists public.public_leaderboard;
create or replace function public.get_public_leaderboard(result_limit integer default 100)
returns table (
  child_id uuid,
  nickname text,
  avatar text,
  theme_color text,
  points integer,
  streak integer,
  level integer,
  league_tier text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    child.id,
    case
      when child.show_real_name_on_leaderboard then child.name
      when nullif(trim(child.nickname), '') is not null then trim(child.nickname)
      else 'Bé Siêu Nhân'
    end,
    child.avatar,
    child.theme_color,
    child.points,
    child.streak,
    child.level,
    child.league_tier
  from public.child_profiles child
  join public.parent_settings settings on settings.family_id = child.family_id
  where settings.is_public_leaderboard
    and child.is_public_on_leaderboard
  order by child.points desc, child.created_at asc
  limit least(greatest(result_limit, 1), 100)
$$;

revoke all on function public.get_public_leaderboard(integer) from public;
grant execute on function public.get_public_leaderboard(integer) to anon, authenticated;

create or replace function public.bootstrap_new_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_family_id uuid;
begin
  insert into public.families (name, created_by)
  values ('Gia đình Siêu Nhân', new.id)
  returning id into created_family_id;

  insert into public.family_memberships (family_id, user_id, role)
  values (created_family_id, new.id, 'owner');

  insert into public.parent_profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  insert into public.parent_settings (family_id)
  values (created_family_id);

  return new;
end
$$;

drop trigger if exists on_auth_user_created_bootstrap_family on auth.users;
create trigger on_auth_user_created_bootstrap_family
  after insert on auth.users
  for each row execute procedure public.bootstrap_new_parent();

commit;
