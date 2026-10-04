import { createAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * Runs a database function that needs the parent PIN. The PIN is checked by the route before this is called; the
 * function itself is callable by the server only, so a signed-in browser cannot reach it without going through the
 * route. The server passes the verified parent as `actor_user_id` and the database acts as that parent for the call
 * (see `act_as_user`), then runs the same function as before.
 */
export function callParentRpc(
  actorUserId: string,
  name: string,
  args: Record<string, unknown>,
  admin: Pick<ReturnType<typeof createAdminSupabaseClient>, 'rpc'> = createAdminSupabaseClient(),
) {
  return admin.rpc(`${name}_as`, { actor_user_id: actorUserId, ...args });
}
