# OpenCode R3 day-gates SQL test repair

Task: `task_9dba93095359` / dispatch `ctx_411a10d96ab5`
Worker terminal: `term_4e707565-c409-41aa-ac10-b96b3cbc6e4e`
Date: 2026-10-22 18:30Z (2026-10-23 01:30 +07)

## Scope

Test-only fix for:

- `tests/integration/migrations/thinking-games-day-gates-runtime.mjs`

Plus this report at:

- `plans/261021-daily-thinking-games/execution/opencode-r3-day-test.md`

No production, SQL migration, RPC, dependency, agent, flag, or git changes.
No other tests were modified.

## Reproduction before the fix

Both versions failed exactly as reported, at the pause assertion:

| Version | URL | Exit | Error |
|---|---|---|---|
| PostgreSQL 18.4 | `postgresql://postgres:local-only@127.0.0.1:55432/postgres` | 1 | `Error: pause gate did not block play` at line 56 |
| PostgreSQL 17.11 | `postgresql://postgres:local-only@127.0.0.1:55417/postgres` | 1 | `Error: pause gate did not block play` at line 56 |

Existing root logs: `/tmp/codex-r3-sql/{55432,55417}-thinking-games-day-gates-runtime.mjs.log`.

### Root cause confirmed with a read-only probe

The test mixed two clocks:

- `fixture.familyClock('Asia/Ho_Chi_Minh')` returned `2026-10-23`.
- The PG session timezone is `Etc/UTC`, so `current_date` returned `2026-10-22`.
- `thinking_game_start` computes `server_day = (now() at time zone settings.timezone)::date`,
  which is `2026-10-23` for the fixture (`Asia/Ho_Chi_Minh`).

The pause attempt passed `current_date` (`2026-10-22`), so the function raised
`day_changed` before reaching its `paused` check. The old `/paused/` regex did
not match, and the test collapsed that unexpected error into the generic
`pause gate did not block play`, hiding the real cause.

Probe output (`/tmp/opencode/day-gates-probe.mjs`, PG18 :55432):

```text
familyClock today 2026-10-23
db timezone Etc/UTC
current_date 2026-10-22
start {"ok":true,...,"status":"started"}
pause start error message: day_changed
```

## Fix

Small diff confined to the test file:

1. **Single family clock for day-gate calls.** Every `thinking_game_start` call
   now passes `$2::date` from the existing `today` value returned by
   `fixture.familyClock('Asia/Ho_Chi_Minh')`. Removed the mixed
   `current_date` use in the pause attempt.
2. **Stale birth-year fixture removed.** The initial
   `birth_year = 2019` was replaced with `currentYear - 7`, using the DB/family
   clock year already derived at the top of the file.
3. **Diagnostics no longer mask unexpected errors.** Added a local
   `expectGate(label, pattern, action)` helper used by pause, bedtime, and
   master-disable checks. It still requires the call to throw **and** requires
   the original expected error pattern (`/paused/`, `/bedtime/`,
   `/feature_off/`), but now reports the actual message if a different error
   (for example `day_changed`) occurs, and reports when the start unexpectedly
   succeeds. The pause/security assertions were not weakened or broadened.

Other date-sensitive code was inspected and left unchanged because it already
uses the fixture timezone consistently:

- bedtime start/end are computed with `now() at time zone 'Asia/Ho_Chi_Minh'`;
- the prior-day rollover entitlement uses
  `(now() at time zone 'Asia/Ho_Chi_Minh')::date - 1`;
- the strict age-boundary loop already uses `currentYear` from `familyClock`.

## Verification after the fix

Exact commands:

```bash
cd /home/opc/orca/goodhabittracking
PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH \
SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:55432/postgres \
node tests/integration/migrations/thinking-games-day-gates-runtime.mjs

PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH \
SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:55417/postgres \
node tests/integration/migrations/thinking-games-day-gates-runtime.mjs
```

| Version | Exit | Result |
|---|---|---|
| PostgreSQL 18.4 (`:55432`) | 0 | PASS, 8/8 cases, real PostgreSQL |
| PostgreSQL 17.11 (`:55417`) | 0 | PASS, 8/8 cases, real PostgreSQL |

PG18 output:

```json
{"verdict":"PASS","evidence":"real-postgresql","cases":["age-track-resolution","strict-age-boundaries","main-start","pause-block","bedtime-block","master-disable","rollover-abandon","rollover-finish-expired"],"database":"kidhabit_test_cb15857438214ab484f81860cd2bff99"}
```

PG17 output:

```json
{"verdict":"PASS","evidence":"real-postgresql","cases":["age-track-resolution","strict-age-boundaries","main-start","pause-block","bedtime-block","master-disable","rollover-abandon","rollover-finish-expired"],"database":"kidhabit_test_76a4e1e007b34cb594334491ca52cc32"}
```

Case count: **8/8 on each version** (`age-track-resolution`,
`strict-age-boundaries`, `main-start`, `pause-block`, `bedtime-block`,
`master-disable`, `rollover-abandon`, `rollover-finish-expired`).
Exits: **0 on both**.

## Files changed

- `tests/integration/migrations/thinking-games-day-gates-runtime.mjs`
- `plans/261021-daily-thinking-games/execution/opencode-r3-day-test.md` (this report)

## Left to root / other lanes

Day-gates is green on both local PG versions. The other runtime suites and
release/git steps remain with the root and the other workers; this lane did not
touch them.
