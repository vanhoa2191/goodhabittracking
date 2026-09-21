begin;

create table if not exists public.family_consents (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('privacy', 'child_data', 'leaderboard')),
  policy_version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (family_id, user_id, consent_type, policy_version)
);

alter table public.family_consents enable row level security;
create policy family_consents_select on public.family_consents for select to authenticated
  using (public.is_family_member(family_id));
create policy family_consents_insert on public.family_consents for insert to authenticated
  with check (user_id = auth.uid() and public.is_family_member(family_id));
create policy family_consents_update on public.family_consents for update to authenticated
  using (user_id = auth.uid() and public.is_family_member(family_id))
  with check (user_id = auth.uid() and public.is_family_member(family_id));

create or replace function public.delete_owned_family(confirmation text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_family_id uuid;
begin
  if confirmation <> 'DELETE FAMILY' then raise exception 'confirmation_required'; end if;
  select family.id into target_family_id
  from public.families family
  where family.created_by = actor_id
  limit 1;
  if target_family_id is null then raise exception 'owned_family_not_found'; end if;

  delete from public.families where id = target_family_id and created_by = actor_id;
  delete from public.parent_profiles where user_id = actor_id;
  return true;
end
$$;

revoke all on function public.delete_owned_family(text) from public;
grant execute on function public.delete_owned_family(text) to authenticated;

commit;
