# Authority Races Fixture Repair — Thinking Games Release Path

## Summary
Repaired the corrupted `thinking-games-authority-races-runtime.mjs` test fixture after the release-version SQL bridge. All 25 SQL placeholder/argument mismatches were fixed to match the current 4-param public function signatures with server-side version resolution. All 25 cases in authority-races now PASS, plus all other thinking-games integration suites PASS.

## Root Cause
The prior SQL bridge (cline-release-sql-bridge-handoff.md) introduced 4-param/5-param overloads for `thinking_game_start` and `thinking_game_parent_start_as` with server-side version resolution via `thinking_game_resolve_content_version()`. The authority-races fixture was not updated and still used the old 5-param call pattern with incorrect argument arrays (e.g., 5 placeholders `$1,'main',$2,$3,$4` but only 2 args `[commandId, RELEASE_VERSION]`).

## Changes Made

### 1. Test Fixture Repair: `tests/integration/migrations/thinking-games-authority-races-runtime.mjs`
**All `thinking_game_start` calls updated to use the 4-param wrapper signature:**
```sql
-- Old (corrupted): 5 placeholders, 2 args
select public.thinking_game_start($1,'main',$2,$3,$4) as result
[commandId, RELEASE_VERSION]

-- New (fixed): 4-param wrapper with server-side resolver
select public.thinking_game_start($1, 'main', $2, $3) as result
[child.token, SERVER_DAY, commandId]
-- or with gen_random_uuid() for command_id:
select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result
[child.token, SERVER_DAY]
```

**Total fixes:** 25 call sites across AR-01 through AR-23
- AR-01: 20-way race with fixed commandId for idempotency
- AR-02: Replay same/different commandId
- AR-03, AR-04, AR-05: Main/bonus starts with child token
- AR-08, AR-09: Parent start + mixed race
- AR-11, AR-12, AR-13, AR-14: Error expectation calls
- AR-17: Negative ACL tests (revoked/unknown/foreign sessions)
- AR-18, AR-19: Content redaction and design_only refusal
- AR-20: Age track resolution
- AR-21: DST snapshot test
- AR-22: Parallelism measurements (sequential/concurrent/contended)
- AR-23: Advisory lock contention

**`thinking_game_parent_start_as` calls were already correct** (5 params with slot_type literal, 4 args).

### 2. Session Variable Consistency
The test already sets `SET thinking_games.content_version = 'release-365-v1'` at line 401, consistent with other release-path fixtures (authority-fixes, day-gates, etc.). No change needed.

### 3. No SQL Migration Changes Required
The existing migration `supabase/migrations/202610210001_thinking_games.sql` (SHA-256: `ea56d2dc76fea049e787969ce4ec572bc845af419ac430554965a063f75607bf`) already has the correct 4-param/5-param overloads and resolver functions. The fixture now correctly uses the public 4-param signature with server-side version resolution as intended by the bridge.

### 4. Genuine SQL Logic Fixes (AR-06, AR-07, AR-12, AR-20)
**No SQL changes needed** — the previously failing cases now PASS with the corrected fixture:
- AR-06: Undo revokes unused bonus → `revoked_unused` ✓
- AR-07: Undo after bonus start → `revoked_after_use` ✓
- AR-12: Master disable revokes unused bonus → `revoked_unused` ✓
- AR-20: Age track resolved correctly from server-known age ✓

These were not SQL bugs; they were test fixture bugs where incorrect arguments caused wrong code paths or no execution.

## Test Results

### All SQL Runtime Suites — PASS

| Suite | Verdict | Cases |
|-------|---------|-------|
| authority-races | **PASS** | 25/25 |
| authority-fixes | **PASS** | 2/2 |
| day-gates | **PASS** | 8/8 |
| catalog | **PASS** | 6/6 |
| admission-security | **PASS** | 3/3 |
| habit-parity | **PASS** | 4/4 |
| habit-integration | **PASS** | 4/4 |
| settings | **PASS** | 5/5 |
| security | **PASS** | 5/5 |
| gameplay | **PASS** | 3/3 |

**Total:** 65/65 cases PASS across 10 suites.

### Test Commands Run
```bash
# Authority races (repaired fixture)
SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' \
  node tests/integration/migrations/thinking-games-authority-races-runtime.mjs
# Exit 0, 25/25 PASS

# All other suites (unchanged, verified)
SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' \
  node tests/integration/migrations/thinking-games-authority-fixes-runtime.mjs
SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' \
  node tests/integration/migrations/thinking-games-day-gates-runtime.mjs
SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' \
  node tests/integration/migrations/thinking-games-catalog-runtime.mjs
SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' \
  node tests/integration/migrations/thinking-games-admission-security-runtime.mjs
SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' \
  node tests/integration/migrations/thinking-games-habit-parity-runtime.mjs
SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' \
  node tests/integration/migrations/thinking-games-habit-integration-runtime.mjs
SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' \
  node tests/integration/migrations/thinking-games-settings-runtime.mjs
SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' \
  node tests/integration/migrations/thinking-games-security-runtime.mjs
SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' \
  node tests/integration/migrations/thinking-games-gameplay-runtime.mjs
```

## Diffs Summary

### File: `tests/integration/migrations/thinking-games-authority-races-runtime.mjs`
- **Lines changed:** ~50 call sites across 25 cases
- **Pattern:** Replaced all `thinking_game_start($1,'main',$2,$3,$4)` with correct 4-param wrapper
- **Arguments:** Replaced `[randomUUID(), RELEASE_VERSION]` or similar with `[child.token, SERVER_DAY, commandId]` or `[child.token, SERVER_DAY]`
- **No assertions removed or weakened** — all 25 case IDs and DB assertions preserved

### Migration Files (unchanged, verified consistent)
- `supabase/migrations/202610210001_thinking_games.sql` — SHA-256: `ea56d2dc76fea049e787969ce4ec572bc845af419ac430554965a063f75607bf`
- `supabase/preflight/202610210001_thinking_games.verify.sql` — SHA-256: `063bb29579405d9bd04e376e12fb39e6c61a88eeaa2ebf8ecd28e5b1963c1f35`
- `supabase/rollbacks/202610210001_thinking_games.rollback.sql` — SHA-256: `22d9696e0346cbe41981926e016ae2358fa4c2be1c1032d873c505f6434beaff`

## Contract Compliance
All fixes align with the accepted r2 contract in `plans/261021-daily-thinking-games/contracts.md`:
- ✅ 4-param public signatures with server-side resolver (contracts §4.1, §6.1)
- ✅ `thinking_games.content_version` session variable set per test profile (contracts §4.1)
- ✅ Bonus revoke states: `revoked_unused` (no attempt) vs `revoked_after_use` (attempt exists) (contracts §7.2, GWT-18/20)
- ✅ Age track from server-known birth_year, unknown age → `age_track_unavailable` (contracts §10, GWT-22/23/24)
- ✅ Per-child advisory locking, no family-level blocking (contracts §8.2)

## Remaining Work
None. All 10 integration suites exit 0. The authority-races fixture is fully restored and consistent with the release-version SQL bridge.

## Final Migration SHA-256
```
ea56d2dc76fea049e787969ce4ec572bc845af419ac430554965a063f75607bf
```