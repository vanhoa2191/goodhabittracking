# Copilot habit integration batch handoff

## Scope

This batch wires the six authoritative habit RPC overrides in
`supabase/migrations/202610210001_thinking_games.sql`: parent and child
complete, parent and child undo, single review, and batch review. The
overrides acquire the namespaced per-child advisory lock before activity/log
and child row locks, preserve existing response statuses and idempotency, and
sync game bonus state after authoritative habit mutations. Batch review
acquires child locks in sorted order and performs bonus synchronization after
the review loop.

## Evidence

| Check | Result |
| --- | --- |
| SQL parser | PASS |
| Disposable PostgreSQL 18.4 migration + preflight | PASS |
| `tests/integration/migrations/thinking-games-habit-integration-runtime.mjs` | PASS (real PostgreSQL) |
| Runtime cases | parent complete/idempotency/undo; child complete/undo; single review; receipt timestamps; anon execute ACL |
| `node --check` and `git diff --check` | PASS |

The runtime adds only test-local compatibility columns for the owned fixture's
reduced `child_profiles` shape and a test-local receipt inspection function;
production schema and the shared fixture were not changed. The preflight now
also verifies all six authoritative habit function names exist.

## Remaining P04 gaps

This is not a whole-P04 completion claim. Full 20-way concurrent start/race
coverage, two-child batch review/deadlock evidence, revoked/expired and
foreign-family mutation matrices, lock-latency measurements, engine-backed
finish grading, parent play-mode integration, and broader six-habit production
fixture coverage remain for the coordinator/other batches.
