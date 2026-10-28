# SQL Calendar QA Handoff — 2026-10-22

- Reader report run (full, inner): `run_6149b435d3ef`
- Outer root run (concise/ordinary): `run_d2b1a0cf783f`
- This worker's task: `task_d27b401a0386` (dispatch `ctx_e208080560bf`)

## Environment
- Node: `v26.11.1` — `/home/opc/.nvm/versions/node/v26.11.1/bin/node`
- PostgreSQL: `18.4 (Debian 18.4-1.pgdg13+1, aarch64, 64-bit)` — loopback `127.0.0.1:55432`
- Conn (`SQL_TEST_DATABASE_URL`): `postgresql://postgres:local-only@127.0.0.1:55432/postgres`
- Sibling SQL writer dispatch `ctx_6d5163923070` (`/tmp/goodhabit-games-cline-sql-poolside-process.json`):
  `state=exited, exitCode=0` at handoff → **SQL is frozen** (no further mutations).

## Commands & unpipelined exits
```sh
export PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH
export SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:55432/postgres
node tests/integration/migrations/thinking-games-day-gates-runtime.mjs        # EXIT=0 PASS
node tests/integration/migrations/thinking-games-catalog-runtime.mjs        # EXIT=0 PASS
node tests/integration/migrations/thinking-games-admission-security-runtime.mjs # EXIT=0 PASS
```
Run twice (once during reproduction, once as the post-SQL-freeze final re-run). Both green; exits are direct (unpiped).

## Reproduction (pre-fix, original fixtures)
| Suite | Failure | SQL site | Root cause | Fix owner |
|---|---|---|---|---|
| day-gates | `day_changed` RAISE | `thinking_game_start` day-gate (line 406) | `current_date` (session UTC = Oct 21) ≠ `server_day=(now() at time zone 'Asia/Ho_Chi_Minh')::date` (Oct 22) | fixture |
| catalog | `bedtime` RAISE | `thinking_game_start` bedtime gate (line 422) | defaults 21:00-07:00 UTC; live clock ~23:4x UTC is inside the night blackout | fixture |
| admission-security | `bedtime` RAISE | `thinking_game_start` bedtime gate (line 422) | same as catalog | fixture |

## Source-bug classification: NONE (this pass)
- `day_changed` is a *correct* freshness guard: `expected_local_day <> server_day`. The SQL is right; the test passed the wrong day.
- `bedtime` is a *correct* gate. The SQL is right; the test ran during the night window.
- `thinking_game_finish` for an expired (rolled-over) attempt **RETURNS** a persisted-cleanup envelope `jsonb_build_object('ok',false,'code','attempt_expired',...)` rather than RAISE-ing (line 572). This is the intended `Typedexp...` contract (SQL persists cleanup → external API 409). The old day-gates assertion expected a RAISE and was therefore wrong; per guidance tests may assert the failure envelope so long as DB-state / no-advance / no-slot assertions still hold. No SQL edit made.

## Fixture changes (owned scope only)
1. `scripts/thinking-games-sql-fixture.mjs` — added calendar helper:
   `familyClock(timezone)` → `{ localDay, localYear }` from the **real DB clock**
   `(now() at time zone <family IANA tz>)`, never the Node/browser UTC date.
2. `tests/.../thinking-games-day-gates-runtime.mjs`:
   - `today`/`currentYear` from `familyClock('Asia/Ho_Chi_Minh')`.
   - all four `current_date` → `'${today}'::date` so `expected_local_day` always equals `server_day`.
   - `new Date().getFullYear()` → DB-derived `currentYear`.
   - kept relative `now() - 1` "yesterday" rollover and DB-clock-relative bedtime-block window.
   - rewrote rollover-finish-expired case: assert the `attempt_expired` envelope **and** persisted cleanup (entitlement=expired, attempt=abandoned_rollover; no advance, no new slot) — stronger, not weaker.
3. `tests/.../thinking-games-catalog-runtime.mjs`:
   - `day` from `familyClock('UTC')` (was `new Date().toISOString()`).
   - pinned bedtime to a past-relative DB-clock window so the family is always "awake"
     (`bedtime not asserted` in this suite).
4. `tests/.../thinking-games-admission-security-runtime.mjs`:
   - `day` from `familyClock('UTC')` (was `new Date().toISOString()`).
   - pinned bedtime to the same past-relative DB-clock window.

## Preserved (no skips / no weaken / no false-green)
Age boundary table (5,6,8,9,12,13 → unavailable / 6-8 / 9-12 / unavailable), pause-block,
bedtime-block, master-disable, rollover-abandon, claim-forgery-denied (`timezone`-fail-closed control),
direct-start ACL, deterministic same-attempt restart, service-role-only design_only admission,
negative stale wrong-day rollover. No `skip`, no `catch`-all, no weakened role/claim/tenant/lock/RLS
assertions. Did **not** alter system/PG global time, production clock, or add any browser override.

## Not touched (out of owned scope)
- `supabase/migrations/202610210001_thinking_games.sql` — **not edited** (per "don't edit SQL").
- No production API/UI/engine/candidate/unit/adversarial/golden writes.
- No commit / push / deploy / new deps / source-ownership expansion.

## SHA256 (final, post-SQL-freeze; identical before vs after the final rerun)
```
a0c1145ab501a94414188b25c9827f99e8fae48c7f83bf24960e02f1bd84e499  supabase/migrations/202610210001_thinking_games.sql
90ba4004bb443038f37402a5524568e2d57fffa006c6524c7b8a1cc0e95e6a6f  tests/integration/migrations/thinking-games-day-gates-runtime.mjs
9fd78836517314084c80a8824d44fe9a0e0f16f8d1865b73107cd9a3f426db6e  tests/integration/migrations/thinking-games-catalog-runtime.mjs
2921da781e3ac91af50e5b4f0088211ddd321f92be757c87fb879a313f0015e9  tests/integration/migrations/thinking-games-admission-security-runtime.mjs
a6f13e2b5bd52dff99b7304d96c9813324779b135b191158668b1bd61d3e87c1  scripts/thinking-games-sql-fixture.mjs
```
Note: the SQL SHA drifted during this pass (`3721b9c4…` captured at first inspection → `a0c1145a…` now)
because the sibling SQL writer (`ctx_6d5163923070`) was still mutating at start; it then exited
(frozen). The final re-run above confirms all three suites green against the frozen `a0c1145a…` SQL.

## Result
Own three runtime suites: **genuine green** (PASS, exit 0, real PostgreSQL 18.4, Node 26).
No source bug to escalate to the SQL writer / reader this pass.
