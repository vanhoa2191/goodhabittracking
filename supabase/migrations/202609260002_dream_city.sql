begin;

create table public.child_city_purchases (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  item_id text not null check (item_id in ('garden', 'library', 'bridge', 'observatory')),
  points_spent integer not null check (points_spent > 0),
  purchased_at timestamptz not null default now(),
  primary key (child_id, item_id),
  constraint child_city_purchases_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade
);

create index child_city_purchases_family_idx on public.child_city_purchases (family_id, child_id);
alter table public.child_city_purchases enable row level security;
alter table public.child_city_purchases force row level security;
revoke all on public.child_city_purchases from public, anon, authenticated;
create policy child_city_purchases_read on public.child_city_purchases
  for select to authenticated using (public.is_family_member(family_id));
grant select on public.child_city_purchases to authenticated;

create function public.purchase_city_item_internal(
  target_family_id uuid,
  target_child_id uuid,
  target_item_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item_cost integer;
  child public.child_profiles%rowtype;
  purchase public.child_city_purchases%rowtype;
begin
  item_cost := case target_item_id
    when 'garden' then 30
    when 'library' then 60
    when 'bridge' then 90
    when 'observatory' then 120
    else null
  end;
  if item_cost is null then return jsonb_build_object('status', 'item_unavailable'); end if;

  select * into child from public.child_profiles
  where id = target_child_id and family_id = target_family_id
  for update;
  if not found then return jsonb_build_object('status', 'child_unavailable'); end if;

  select * into purchase from public.child_city_purchases
  where child_id = target_child_id and item_id = target_item_id;
  if found then return jsonb_build_object('status', 'already_built', 'purchase', to_jsonb(purchase), 'remainingPoints', child.points); end if;
  if child.points < item_cost then
    return jsonb_build_object('status', 'insufficient_points', 'remainingPoints', child.points);
  end if;

  update public.child_profiles
  set points = points - item_cost
  where id = target_child_id and family_id = target_family_id;

  insert into public.child_city_purchases (family_id, child_id, item_id, points_spent)
  values (target_family_id, target_child_id, target_item_id, item_cost)
  returning * into purchase;

  return jsonb_build_object('status', 'built', 'purchase', to_jsonb(purchase), 'remainingPoints', child.points - item_cost);
end
$$;

create function public.purchase_parent_city_item(
  target_family_id uuid,
  target_child_id uuid,
  target_item_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_family(target_family_id) then
    return jsonb_build_object('status', 'session_invalid');
  end if;
  return public.purchase_city_item_internal(target_family_id, target_child_id, target_item_id);
end
$$;

create function public.read_child_city(session_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:read' = any(device.capabilities);
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  return jsonb_build_object('status', 'ready', 'purchases', coalesce((
    select jsonb_agg(to_jsonb(purchase) order by purchase.purchased_at)
    from public.child_city_purchases purchase
    where purchase.family_id = child_session.family_id
      and purchase.child_id = child_session.child_id
  ), '[]'::jsonb));
end
$$;

create function public.purchase_child_city_item(
  session_token_hash text,
  target_item_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
  result jsonb;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  result := public.purchase_city_item_internal(child_session.family_id, child_session.child_id, target_item_id);
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return result;
end
$$;

revoke all on function public.purchase_city_item_internal(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.purchase_parent_city_item(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.read_child_city(text) from public, anon, authenticated;
revoke all on function public.purchase_child_city_item(text, text) from public, anon, authenticated;
grant execute on function public.purchase_parent_city_item(uuid, uuid, text) to authenticated;
grant execute on function public.read_child_city(text) to anon, authenticated;
grant execute on function public.purchase_child_city_item(text, text) to anon, authenticated;

commit;
