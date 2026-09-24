begin;

create or replace function public.choose_child_wishlist(
  session_token_hash text,
  target_reward_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
  selected_wishlist public.child_wishlists%rowtype;
  changed boolean;
begin
  select * into child_session
  from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  perform 1 from public.rewards reward
  where reward.id = target_reward_id
    and reward.family_id = child_session.family_id
    and reward.is_active
  for share;
  if not found then return jsonb_build_object('status', 'reward_unavailable'); end if;

  insert into public.child_wishlists (family_id, child_id, reward_id, chosen_at, updated_at)
  values (child_session.family_id, child_session.child_id, target_reward_id, now(), now())
  on conflict (child_id) do update
    set reward_id = excluded.reward_id,
        chosen_at = excluded.chosen_at,
        updated_at = excluded.updated_at
    where child_wishlists.reward_id is distinct from excluded.reward_id
  returning * into selected_wishlist;
  changed := found;

  if not changed then
    select * into selected_wishlist from public.child_wishlists
    where child_id = child_session.child_id and family_id = child_session.family_id;
  end if;

  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'saved', 'wishlist', to_jsonb(selected_wishlist), 'changed', changed);
end
$$;

create or replace function public.choose_parent_wishlist(
  target_family_id uuid,
  target_child_id uuid,
  target_reward_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_wishlist public.child_wishlists%rowtype;
  changed boolean;
begin
  if auth.uid() is null or not public.can_manage_family(target_family_id) then
    return jsonb_build_object('status', 'session_invalid');
  end if;

  perform 1 from public.child_profiles child
  where child.id = target_child_id and child.family_id = target_family_id
  for share;
  if not found then return jsonb_build_object('status', 'child_unavailable'); end if;

  perform 1 from public.rewards reward
  where reward.id = target_reward_id
    and reward.family_id = target_family_id
    and reward.is_active
  for share;
  if not found then return jsonb_build_object('status', 'reward_unavailable'); end if;

  insert into public.child_wishlists (family_id, child_id, reward_id, chosen_at, updated_at)
  values (target_family_id, target_child_id, target_reward_id, now(), now())
  on conflict (child_id) do update
    set reward_id = excluded.reward_id,
        chosen_at = excluded.chosen_at,
        updated_at = excluded.updated_at
    where child_wishlists.reward_id is distinct from excluded.reward_id
  returning * into selected_wishlist;
  changed := found;

  if not changed then
    select * into selected_wishlist from public.child_wishlists
    where child_id = target_child_id and family_id = target_family_id;
  end if;

  return jsonb_build_object('status', 'saved', 'wishlist', to_jsonb(selected_wishlist), 'changed', changed);
end
$$;

revoke all on function public.choose_child_wishlist(text, uuid) from public, anon, authenticated;
grant execute on function public.choose_child_wishlist(text, uuid) to anon, authenticated;
revoke all on function public.choose_parent_wishlist(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.choose_parent_wishlist(uuid, uuid, uuid) to authenticated;

commit;
