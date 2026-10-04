begin;

-- Nine actions need the parent PIN in the API: reviewing a habit (one or a batch), moving a reward redemption,
-- adjusting points by hand, revoking a paired device, showing or renewing a child's pairing code, deleting the
-- family and spending the AI allowance. The PIN is checked by the API route, but these functions are also
-- callable by any signed-in user straight from the browser, which skips the route and so the PIN.
--
-- This migration only ADDS what the server needs: for each function, a wrapper that only the server (service role)
-- can call and that names the acting parent. The wrapper makes the database see that parent as the signed-in user
-- for this one transaction and then runs the very same function as before, so membership checks, locks, awards
-- and refunds are unchanged. The originals stay open here on purpose, so the code that is already deployed keeps
-- working; the next migration closes them once the new code is live.

create or replace function public.act_as_user(actor_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if actor_user_id is null then raise exception 'actor_required'; end if;
  if not exists (select 1 from auth.users where id = actor_user_id) then raise exception 'actor_not_found'; end if;
  -- `true` keeps the setting local to this transaction, so it cannot leak into another request.
  perform set_config('request.jwt.claim.sub', actor_user_id::text, true);
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', actor_user_id, 'role', 'authenticated')::text,
    true
  );
end
$$;

create or replace function public.review_habit_command_as(actor_user_id uuid, target_log_id uuid, decision text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.act_as_user(actor_user_id);
  return public.review_habit_command(target_log_id, decision);
end
$$;

create or replace function public.review_habits_command_as(actor_user_id uuid, target_log_ids uuid[], decision text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.act_as_user(actor_user_id);
  return public.review_habits_command(target_log_ids, decision);
end
$$;

create or replace function public.transition_redemption_command_as(actor_user_id uuid, target_redemption_id uuid, decision text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.act_as_user(actor_user_id);
  return public.transition_redemption_command(target_redemption_id, decision);
end
$$;

create or replace function public.adjust_child_points_command_as(
  actor_user_id uuid,
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
begin
  perform public.act_as_user(actor_user_id);
  return public.adjust_child_points_command(target_child_id, amount, reason, command_id);
end
$$;

create or replace function public.revoke_device_session_as(actor_user_id uuid, target_device_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.act_as_user(actor_user_id);
  return public.revoke_device_session(target_device_session_id);
end
$$;

create or replace function public.ensure_pairing_credential_as(
  actor_user_id uuid,
  target_child_id uuid,
  proposed_rotation_nonce uuid,
  proposed_display_code_id text,
  proposed_verifier_hash text,
  proposed_token_hash text
)
returns table (rotation_nonce uuid, rotated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.act_as_user(actor_user_id);
  return query select * from public.ensure_pairing_credential(
    target_child_id, proposed_rotation_nonce, proposed_display_code_id, proposed_verifier_hash, proposed_token_hash
  );
end
$$;

create or replace function public.rotate_pairing_credential_as(
  actor_user_id uuid,
  target_child_id uuid,
  next_rotation_nonce uuid,
  next_display_code_id text,
  next_verifier_hash text,
  next_token_hash text
)
returns table (rotation_nonce uuid, rotated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.act_as_user(actor_user_id);
  return query select * from public.rotate_pairing_credential(
    target_child_id, next_rotation_nonce, next_display_code_id, next_verifier_hash, next_token_hash
  );
end
$$;

create or replace function public.delete_owned_family_as(actor_user_id uuid, confirmation text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.act_as_user(actor_user_id);
  return public.delete_owned_family(confirmation);
end
$$;

create or replace function public.consume_ai_quota_as(
  actor_user_id uuid,
  per_day integer,
  system_per_day integer,
  min_gap_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.act_as_user(actor_user_id);
  return public.consume_ai_quota(per_day, system_per_day, min_gap_seconds);
end
$$;

-- The identity helper is reachable only from inside these wrappers; each wrapper is for the server alone.
revoke all on function public.act_as_user(uuid) from public, anon, authenticated, service_role;

revoke all on function public.review_habit_command_as(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.review_habits_command_as(uuid, uuid[], text) from public, anon, authenticated;
revoke all on function public.transition_redemption_command_as(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.adjust_child_points_command_as(uuid, uuid, integer, text, uuid) from public, anon, authenticated;
revoke all on function public.revoke_device_session_as(uuid, uuid) from public, anon, authenticated;
revoke all on function public.ensure_pairing_credential_as(uuid, uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.rotate_pairing_credential_as(uuid, uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.delete_owned_family_as(uuid, text) from public, anon, authenticated;
revoke all on function public.consume_ai_quota_as(uuid, integer, integer, integer) from public, anon, authenticated;

grant execute on function public.review_habit_command_as(uuid, uuid, text) to service_role;
grant execute on function public.review_habits_command_as(uuid, uuid[], text) to service_role;
grant execute on function public.transition_redemption_command_as(uuid, uuid, text) to service_role;
grant execute on function public.adjust_child_points_command_as(uuid, uuid, integer, text, uuid) to service_role;
grant execute on function public.revoke_device_session_as(uuid, uuid) to service_role;
grant execute on function public.ensure_pairing_credential_as(uuid, uuid, uuid, text, text, text) to service_role;
grant execute on function public.rotate_pairing_credential_as(uuid, uuid, uuid, text, text, text) to service_role;
grant execute on function public.delete_owned_family_as(uuid, text) to service_role;
grant execute on function public.consume_ai_quota_as(uuid, integer, integer, integer) to service_role;

commit;
