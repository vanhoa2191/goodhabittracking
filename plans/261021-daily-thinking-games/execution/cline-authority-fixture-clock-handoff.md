# Cline Authority Fixture Clock Handoff

**Date:** 2026-10-22  
**Task:** Fix clock-dependent positive fixtures in `tests/integration/migrations/thinking-games-authority-fixes-runtime.mjs`  
**Agent:** Cline (external, root-coordinated)

---

## Summary

Fixed the `thinking-games-authority-fixes-runtime.mjs` test which was failing due to hardcoded UTC timezone with bedtime window (21:00-07:00) that accidentally caught the current UTC time (01:02 UTC). The test now uses the same `pickAwakeZone` pattern verified in `authority-races` (AR20) to dynamically select an IANA timezone where the database clock's local time falls in the awake window (07:00-20:00), and derives the family-local day from the DB clock via the existing `familyClock` helper.

---

## Changes Made

### File Modified: `tests/integration/migrations/thinking-games-authority-fixes-runtime.mjs`

**Before:**
- Hardcoded `'UTC'` timezone in `thinking_game_settings`
- Used `current_date` in `thinking_game_start` call
- Failed when UTC time was in bedtime window (21:00-07:00)

**After:**
- Added `AWAKE_ZONES` array (25 fixed-offset IANA zones covering all 24 offsets)
- Added `pickAwakeZone(db)` function that queries the DB clock (`now()`) for each zone and returns the first where local hour ∈ [7, 20]
- Uses `fixture.familyClock(TZ)` to derive `localDay` (family-local date) from the DB clock + chosen IANA zone
- Passes the derived `SERVER_DAY` to `thinking_game_start` instead of `current_date`
- Settings now use the dynamically chosen awake timezone

**Pattern Reuse:**
- `AWAKE_ZONES` and `pickAwakeZone` mirrored from `thinking-games-authority-races-runtime.mjs` (AR20, already verified)
- `familyClock` helper from `scripts/thinking-games-sql-fixture.mjs` reused (no shared helper edit needed)

---

## Verification

### Authority-fixes test (fixed)
```bash
SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:55432/postgres \
  node tests/integration/migrations/thinking-games-authority-fixes-runtime.mjs
```
**Result:** PASS — `{"verdict":"PASS","evidence":"real-postgresql","cases":["age-track-payload","main-start"]}`

### Related negative-assertion tests (all preserved)
| Test | Cases Verified | Result |
|------|----------------|--------|
| `thinking-games-day-gates-runtime.mjs` | pause-block, bedtime-block, master-disable, rollover-abandon, rollover-finish-expired | PASS |
| `thinking-games-authority-races-runtime.mjs` | AR-14 bedtime-block, AR-13 pause-block, AR-12 master-disable, AR-17 ACL negatives | PASS (24/25, AR-06 pre-existing unrelated failure) |
| `thinking-games-harness-smoke.mjs` | H1-H7 auth/RLS harness | PASS |
| `thinking-games-admission-security-runtime.mjs` | service-without-marker-denied, claim-forgery-denied | PASS |
| `thinking-games-catalog-runtime.mjs` | direct-start-acl, design-only denial | PASS |
| `thinking-games-settings-runtime.mjs` | cross-family-rls, audited-excuse | PASS |
| `thinking-games-gameplay-runtime.mjs` | foreign-family-denial, parent-rpc-acl | PASS |
| `thinking-games-habit-integration-runtime.mjs` | anon-acl | PASS |
| `thinking-games-security-runtime.mjs` | protected-rpc-acl, unsafe-preflight-rejection | PASS |
| `thinking-games-runtime.mjs` | feature-off-completion, rollback | PASS |

All negative assertions (bedtime/pause/age/ACL/cutoff/state/pin/noextraslot) remain intact and passing.

---

## Key Principles Followed

1. **DB clock + IANA only** — No `Date.now()`, no `current_date` literal, no system clock mock
2. **Derive, don't bump** — Family local day computed from `now() at time zone <chosen IANA>` via `familyClock`
3. **Reuse verified pattern** — `pickAwakeZone` from AR20, `familyClock` from shared fixture
4. **Preserve negatives** — No weakening of bedtime-block, pause-block, ACL, age, cutoff, state, pin assertions
5. **Minimal test-only pattern** — `pickAwakeZone` kept in test file (not promoted to shared helper)
6. **No quiet/UTC masking** — UTC preserved only where intentionally tested; neutral positive fixtures now awake

---

## Evidence

- **Before fix:** `error: bedtime` at `thinking_game_start` line 31 (UTC 01:02 in 21:00-07:00 window)
- **After fix:** PASS with dynamically chosen awake zone (e.g., `Etc/GMT-7` → local 08:02)
- **Database:** Real PostgreSQL 18.4, disposable `kidhabit_test_*` per run
- **Node:** v22.22.0 (Node 26 path prefix via `SQL_TEST_DATABASE_URL` env)

---

## Files Modified

- `tests/integration/migrations/thinking-games-authority-fixes-runtime.mjs` (only file changed)

## Files NOT Modified

- `scripts/thinking-games-sql-fixture.mjs` (shared helper unchanged — `familyClock` sufficient)
- `supabase/migrations/202610210001_thinking_games.sql` (production SQL readonly)
- All other golden test files (authority-races, day-gates, etc. readonly)

---

## Remaining

- AR-06 failure in authority-races is a pre-existing source bug (bonus revocation logic) — out of scope for this fixture fix
- No other clock-dependent positive fixtures identified in the authority-fixes suite