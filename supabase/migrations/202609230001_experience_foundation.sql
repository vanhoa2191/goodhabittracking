begin;

create table if not exists public.child_engagement_profiles (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid primary key,
  mascot_selected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint child_engagement_profiles_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade
);

create table if not exists public.family_engagement_settings (
  family_id uuid primary key references public.families(id) on delete cascade,
  paused_at timestamptz,
  pause_reason text,
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_mascot_letters (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  local_date date not null,
  template_key text not null check (template_key ~ '^[a-z0-9_-]{1,80}$'),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (child_id, local_date),
  constraint daily_mascot_letters_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade
);

create table if not exists public.secret_quests (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  local_date date not null,
  quest_key text not null check (quest_key ~ '^[a-z0-9_-]{1,80}$'),
  unlocked_at timestamptz not null,
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (child_id, local_date),
  check (expires_at > unlocked_at),
  check (completed_at is null or completed_at <= expires_at),
  constraint secret_quests_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade
);

create table if not exists public.child_wishlists (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid primary key,
  reward_id uuid not null,
  chosen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint child_wishlists_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint child_wishlists_reward_family_fk foreign key (reward_id, family_id)
    references public.rewards(id, family_id) on delete cascade
);

create index if not exists daily_mascot_letters_family_child_idx on public.daily_mascot_letters (family_id, child_id, local_date desc);
create index if not exists secret_quests_family_child_idx on public.secret_quests (family_id, child_id, local_date desc);
create index if not exists child_wishlists_family_idx on public.child_wishlists (family_id);

alter table public.child_engagement_profiles enable row level security;
alter table public.child_engagement_profiles force row level security;
alter table public.family_engagement_settings enable row level security;
alter table public.family_engagement_settings force row level security;
alter table public.daily_mascot_letters enable row level security;
alter table public.daily_mascot_letters force row level security;
alter table public.secret_quests enable row level security;
alter table public.secret_quests force row level security;
alter table public.child_wishlists enable row level security;
alter table public.child_wishlists force row level security;

revoke all on public.child_engagement_profiles, public.family_engagement_settings,
  public.daily_mascot_letters, public.secret_quests, public.child_wishlists
  from public, anon, authenticated;

create policy child_engagement_profiles_read on public.child_engagement_profiles for select to authenticated using (public.is_family_member(family_id));
create policy child_engagement_profiles_write on public.child_engagement_profiles for all to authenticated using (public.can_manage_family(family_id)) with check (public.can_manage_family(family_id));
create policy family_engagement_settings_read on public.family_engagement_settings for select to authenticated using (public.is_family_member(family_id));
create policy family_engagement_settings_write on public.family_engagement_settings for all to authenticated using (public.can_manage_family(family_id)) with check (public.can_manage_family(family_id));
create policy daily_mascot_letters_read on public.daily_mascot_letters for select to authenticated using (public.is_family_member(family_id));
create policy secret_quests_read on public.secret_quests for select to authenticated using (public.is_family_member(family_id));
create policy child_wishlists_read on public.child_wishlists for select to authenticated using (public.is_family_member(family_id));
create policy child_wishlists_write on public.child_wishlists for all to authenticated using (public.can_manage_family(family_id)) with check (public.can_manage_family(family_id));

grant select, insert, update on public.child_engagement_profiles, public.family_engagement_settings, public.child_wishlists to authenticated;
grant select on public.daily_mascot_letters, public.secret_quests to authenticated;

commit;
