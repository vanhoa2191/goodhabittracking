begin;

create or replace function public.read_child_wishlist(session_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
  selected_wishlist public.child_wishlists%rowtype;
begin
  select * into child_session
  from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:read' = any(device.capabilities);
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  select wish.* into selected_wishlist
  from public.child_wishlists wish
  join public.rewards reward on reward.id = wish.reward_id
    and reward.family_id = wish.family_id and reward.is_active
  where wish.family_id = child_session.family_id and wish.child_id = child_session.child_id;

  return jsonb_build_object('status', 'ready', 'wishlist',
    case when found then to_jsonb(selected_wishlist) else null end);
end
$$;

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
  returning * into selected_wishlist;

  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return jsonb_build_object('status', 'saved', 'wishlist', to_jsonb(selected_wishlist));
end
$$;

revoke all on function public.read_child_wishlist(text) from public, anon, authenticated;
revoke all on function public.choose_child_wishlist(text, uuid) from public, anon, authenticated;
grant execute on function public.read_child_wishlist(text) to anon, authenticated;
grant execute on function public.choose_child_wishlist(text, uuid) to anon, authenticated;

commit;
