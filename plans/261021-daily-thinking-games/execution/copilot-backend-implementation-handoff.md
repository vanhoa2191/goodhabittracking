# Copilot backend implementation handoff

## Scope completed

Implemented the additive backend foundation for P04:

- `supabase/migrations/202610210001_thinking_games.sql`
  - settings with fail-closed timezone/feature defaults;
  - per-child journey cursor and immutable local-day snapshot;
  - versioned content catalog with public/grading payload separation;
  - unique child/day/slot entitlement ledger and attempt history;
  - immutable game-owned habit receipt and audit tables;
  - RLS read policies and closed direct-write ACLs;
  - exact namespaced child advisory lock key;
  - server-local-day state/start RPCs;
  - separate before-row advisory-lock triggers and after-row server receipt/review timestamps;
  - receipt audit identity survives legacy hard-delete undo (no live-log FK);
  - pause, rollover-expiring finish, and fail-closed finish RPCs;
  - atomic habit-trigger bonus sync with mandatory snapshot task/receipt/cutoff checks;
  - legacy activity-log deletes preserve game receipt history.
- `supabase/preflight/202610210001_thinking_games.verify.sql`
- `supabase/rollbacks/202610210001_thinking_games.rollback.sql`
- `src/lib/thinking-games/server/{response,rpc-error}.ts`
- `src/app/api/child/thinking-games/{state,start}/route.ts`
- server-only pilot/bonus/serve-pilot flags in `src/lib/server-features.ts`.
- `tests/integration/migrations/thinking-games-runtime.mjs`
  - reproduces feature-off and feature-enabled completion, review receipt update, receipt retention after delete, and rollback.

The canonical contract review received a current-input SHA-256 addendum. The decisions hash changed only in the accepted summary wording to include D30; no locked decision body was changed.

## Evidence

| Check | Result |
| --- | --- |
| `npm run typecheck` | FAIL, exit 2 (pre-existing shared-engine unit test readonly/type-shape errors in `tests/unit/thinking-games/schema.test.ts`) |
| direct-path `npx eslint` on changed TS | PASS, exit 0 |
| `node` `@libpg-query/parser` migration parse | PASS |
| `git diff --check` | PASS |
| disposable PostgreSQL 18.4-style baseline: apply migration | PASS |
| disposable PostgreSQL baseline: apply preflight | PASS |
| `tests/integration/migrations/thinking-games-runtime.mjs` | PASS, real PostgreSQL; feature-off/enabled receipt regression, review, delete retention, rollback |

The disposable DB command used `SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:55432/postgres` and `BASELINE_SCHEMA_SQL`; no production database was queried.

## Remaining gates / limitations

The migration and child route foundation is implemented, but this bounded lane does not claim full release readiness. Parent settings/preview/excuse/PIN routes and exact source-level six-RPC integration remain NOT-RUN; the trigger preserves the required lock-before-row-write ordering and synchronizes bonus once per activity mutation, but this does not replace auditing each existing RPC's batch lock order. Finish remains fail-closed until the reviewed engine checker is wired to server grading data; no client `won` value is trusted. Real 20-way concurrency, two-family non-superuser RLS, PIN/session revocation, review/undo races, and API tests remain NOT-RUN; approved content rows are intentionally not seeded.
