begin;

-- Phase 2 of closing the parent-PIN bypass. The code that calls the server-only wrappers is live, so the original
-- functions can now be closed to every API role. They stay callable by the wrappers because those run as the owner
-- of the function, which needs no grant.

revoke all on function public.review_habit_command(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.review_habits_command(uuid[], text) from public, anon, authenticated, service_role;
revoke all on function public.transition_redemption_command(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.adjust_child_points_command(uuid, integer, text, uuid) from public, anon, authenticated, service_role;
revoke all on function public.revoke_device_session(uuid) from public, anon, authenticated, service_role;
revoke all on function public.ensure_pairing_credential(uuid, uuid, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.rotate_pairing_credential(uuid, uuid, text, text, text) from public, anon, authenticated, service_role;
revoke all on function public.delete_owned_family(text) from public, anon, authenticated, service_role;
revoke all on function public.consume_ai_quota(integer, integer, integer) from public, anon, authenticated, service_role;

commit;
