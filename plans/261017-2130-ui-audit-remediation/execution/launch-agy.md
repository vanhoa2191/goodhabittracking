# Review: child points/reward write path (lane agy, read-only)

Scope: uncommitted diff of src/lib/store.tsx, store/domain-command-client.ts, habit-actions.ts, reward-actions.ts + unit tests.
Checked against routes (src/app/api/{domain,child}/commands/route.ts) and RPC SQL (202610090030_family_operations_hardening.sql).
Unit tests: domain-command-client / habit-actions / reward-actions = 100/100 pass.

Verdict: PASS with one MEDIUM risk to decide on (no confirmed blocker). Idempotency design is sound; the one real gap is the 409 -> "refused" classification.

## Findings (ranked)

### 1. MEDIUM - HTTP 409 is treated as proof of non-commit, but both routes emit 409 for ANY rpc error
- domain-command-client.ts:98, :127 (`[400,401,403,409,429]` => outcome 'refused'); routes domain/commands/route.ts:91-92, child/commands/route.ts (error branch, status 409).
- The routes map every `supabase.rpc` `error` to 409 "could not be saved". That includes transport failures between the Next route and Supabase (fetch failed / timeout / connection reset after the DB committed), where commit state is unknown. Real RPC rollbacks (reward_not_found etc.) are also 409, so the status alone cannot distinguish them.
- Failure scenario (reward): child taps redeem; DB commits, route-to-Supabase response is lost -> 409. reward-actions.ts:313 sets `operation.phase='settled'` with no reconcile. Next tap (claimReward) creates a NEW commandId (the `else` branch), server sees no row with that id -> second redemption, points debited twice, stock decremented twice.
- Habit complete is safe (settled+refused op is reused with the SAME commandId, and SQL `on conflict do nothing` => 'duplicate'). Undo is safe (logId-based). Parent transitions/review return 'failed'/null without reconcile: UI stale but not double-applied.
- Fix options: (a) for reward claim, on 'refused' still reconcile and only settle if no row, or keep the same commandId when status===409; (b) have routes return distinct status/code for post-execution/transport errors (e.g. 502/503) vs known RPC exceptions, and keep 409 only for exception-coded errors.  Confirm supabase-js behaviour: rpc returns `{error}` (does not throw) on fetch failure, so it lands in this branch.

### 2. LOW - Scope reset discards retry ids if identity flags flip mid-flight
- store.tsx:494 `childOperations` memo keyed on user.id, familyId, isFamilyConnected, isDemoSession, epoch. If familyId/isFamilyConnected change while a claim/complete is uncertain (e.g. identity hydration after a paired-session refresh), a new empty ChildOperationState is created; the in-flight call sees `current()===false` and returns false, the retry id is lost, and the next tap mints a fresh commandId.
- Habit: harmless (unique (activity,child,date) -> 'duplicate'). Reward: can double-redeem if the first committed. Likely rare; only matters if those flags can flip without a real session change - worth one test.

### 3. LOW - Accepted-but-unsynced op swallows the next tap
- habit-actions.ts (recovery block, phase==='accepted' -> `return true`) and reward-actions.ts (phase accepted -> `return true`). After a server ACK whose reload failed, the next tap (even a deliberate undo, or a deliberate second reward purchase) only retries the reload and reports success. No double-apply, but the child's intent is dropped silently; the UI relies on `getToggleOutcome().stale` to explain. Acceptable by design; flagging for UX copy.

### 4. LOW - undo with no log id sends `logId: undefined`
- habit-actions.ts:236 `operation.logId!`. If the UI passes completing=false while no log row exists (stale card), the command has no logId; server answers 400 => 'refused' (safe), but the non-null assertion hides it. Guard locally and return `failedWith('not-found')`.

### 5. LOW - claimReward pre-check can short-circuit recovery
- reward-actions.ts: `child.points < reward.costPoints` returns false before the recovery block. After a committed-but-unacked redeem, if the reload failed, local points are still the old value so recovery still runs (OK); if a reload succeeded the row is already present. No bug found; noting the ordering is load-bearing.

## Verified OK (no finding)
- Double-apply guard: `busy` is set synchronously before the first await in both fresh and recovery paths; no await between `get(key)` and `busy=true`.
- Lost commit then undo: uncertain complete + tap => reconcile first; row present => settled, no undo sent; sync failure => 'recovery-required' (no blind retry). Uncertain undo + absent row => 'undone'.
- Command-id reuse: complete reuses SAME commandId on fresh absence; redeem 'duplicate' and the `row.id===commandId` recovery check match SQL (redemption id = command_id; log id = command_id).
- 200-with-error: `success:false` at 200 is NOT in the refused list => 'unknown' => reconcile (correct, conservative). Contradictory envelopes (`z.never()` on opposite field), malformed/non-JSON bodies (`.json().catch(()=>null)`), and 5xx all classify 'unknown'.
- 403: only the bare `{error, code:parent_pin_*}` body is 'refused'; any other 403 body is 'unknown' (conservative). 401 session_invalid is 'refused' (nothing executed).
- Stale state: sync/getters read a layout-effect snapshot ref with synchronous publish; child switch / connect / disconnect invalidate ops (`active=false`) so a late response never writes into a different child/session.
- Parent review/transition: busy/blocked sets block re-entry until a successful sync; reviewHabits per-ID ack rejects duplicates/foreign IDs; replays are idempotent server-side (already_reviewed / invalid_transition).

## Residual
- Module-level `lastToggleFailure` (habit-actions.ts) is still a global; not a correctness issue for the write path.
- No test covers 409-after-commit for redeem (finding 1) or scope-memo flip (finding 2).
