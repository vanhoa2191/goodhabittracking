/**
 * Supabase returns an error with a database/PostgREST code when the server answered and rolled
 * the command back (safe to treat as refused). A missing code means the response never arrived
 * (fetch failed, timeout, connection reset), so the command may have committed: answer 503 so
 * clients reconcile instead of minting a new command id.
 */
export function commandErrorStatus(error: { code?: string | null }): 409 | 503 {
  return typeof error.code === 'string' && error.code.trim() !== '' ? 409 : 503;
}
