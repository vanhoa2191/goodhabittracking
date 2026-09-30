begin;

-- Parents can add or take away points by hand. On a cloud family that change must be stored,
-- with its reason, instead of living only in the browser that made it.

create table if not exists public.child_point_adjustments (
  id uuid primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  requested_amount integer not null check (requested_amount between -1000 and 1000 and requested_amount <> 0),
  applied_amount integer not null,
  reason text not null default '' check (char_length(reason) <= 120),
  created_at timestamptz not null default now()
);
create index if not exists child_point_adjustments_child_idx on public.child_point_adjustments (child_id, created_at desc);
create index if not exists child_point_adjustments_family_idx on public.child_point_adjustments (family_id);
alter table public.child_point_adjustments enable row level security;
alter table public.child_point_adjustments force row level security;
revoke all on public.child_point_adjustments from public, anon, authenticated;

create or replace function public.adjust_child_points_command(
  target_child_id uuid,
  amount integer,
  reason text,
  command_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_family_id uuid := public.current_family_id();
  child public.child_profiles%rowtype;
  next_points integer;
  applied integer;
  next_total integer;
begin
  if actor_family_id is null then raise exception 'family_membership_required'; end if;
  if not public.can_manage_family(actor_family_id) then raise exception 'family_manage_required'; end if;
  if amount is null or amount = 0 or amount not between -1000 and 1000 then raise exception 'invalid_amount'; end if;

  select * into child from public.child_profiles
  where id = target_child_id and family_id = actor_family_id for update;
  if not found then raise exception 'child_not_found'; end if;

  if exists (select 1 from public.child_point_adjustments adjustment where adjustment.id = command_id) then
    return jsonb_build_object('status', 'duplicate', 'points', child.points);
  end if;

  next_points := greatest(0, child.points + amount);
  applied := next_points - child.points;
  next_total := child.total_earned + greatest(0, applied);

  update public.child_profiles
  set points = next_points,
      total_earned = next_total,
      level = greatest(1, floor(next_total / 100.0)::integer + 1)
  where id = child.id;

  insert into public.child_point_adjustments (id, family_id, child_id, user_id, requested_amount, applied_amount, reason)
  values (command_id, actor_family_id, child.id, auth.uid(), amount, applied, left(coalesce(trim(reason), ''), 120));

  return jsonb_build_object('status', 'adjusted', 'points', next_points, 'appliedAmount', applied);
end
$$;

revoke all on function public.adjust_child_points_command(uuid, integer, text, uuid) from public, anon;
grant execute on function public.adjust_child_points_command(uuid, integer, text, uuid) to authenticated;

commit;
