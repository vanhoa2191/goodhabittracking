# Copilot security and registration handoff

## Completed

- Added `thinking_game_journeys` to the game security perimeter with enabled
  and forced RLS plus a family-membership read policy.
- Strengthened executable preflight to require all eight game tables,
  enabled/forced RLS, the journeys policy, security-definer `search_path=""`,
  and denial of protected parent/verified-finish RPC execution for anon and
  authenticated roles.
- Registered
  `202610210001_thinking_games.sql` in `supabase/schema.sql`; migration
  manifest tests pass without changing historical migration expectations.
- Registered the guarded security runtime in `package.json`'s `test:sql`
  script. The runner uses only the disposable loopback PostgreSQL URL.

## Real PostgreSQL evidence

`tests/integration/migrations/thinking-games-security-runtime.mjs` passed on
PostgreSQL 18.4 and covers all game tables RLS/force-RLS, own-family journey
visibility versus foreign-family denial, non-permissive policies, protected
RPC ACLs, intentional unsafe-schema preflight rejection, and rollback
preserving `activity_logs`.

Additional verified runners:

| Runner/check | Result |
| --- | --- |
| Safe migration + preflight | PASS |
| Prior gameplay runtime | PASS |
| Settings runtime | PASS |
| Habit integration runtime | PASS |
| Parent gameplay runtime | PASS |
| Migration registration Vitest | PASS (25 tests) |
| `npm run test:sql` with loopback `SQL_TEST_DATABASE_URL` | PASS |
| SQL parser + `git diff --check` | PASS |

An initial `npm run test:sql` without `SQL_TEST_DATABASE_URL` exited 1 as
expected because the fixture requires an explicit disposable database URL; the
guarded rerun with the mandated loopback URL passed.

## Remaining gates

This batch does not claim AC04 or whole P04 completion. Twenty-way
concurrency/performance evidence, full gameplay race matrices, release-profile
catalog rollout, and broader product/UI gates remain independent work.
