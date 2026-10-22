# SQL Brief — Poolside Reader (actual25: authority-races on real PostgreSQL)

## 1. Proof (actual run, no source edits)
- Command (env as specified):
  `SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:55432/postgres node tests/integration/migrations/thinking-games-authority-races-runtime.mjs`
- Node: v26.11.1 via `PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH` (psql/pg_isready not on PATH; the suite uses the node `pg` client and creates its own disposable `kidhabit_test_*` DB — the root `postgres` DB and all other DBs are untouched).
- Real PostgreSQL 18.4 on `127.0.0.1:55432` (loopback only — accepted by the harness).
- Exit code: 1
- Verdict: FAIL — **23 PASS / 2 FAIL / 0 BLOCKED** (25 total): AR-07, AR-20.
- Unpiped stdout captured to `/tmp/goodhabit-sql-brief-poolside-reader-stdout.log` (3617 bytes); stderr empty (per-case PL/pgSQL errors are caught by the suite and recorded as case `detail`, not emitted to stderr).
- SQL SHA-256 (before) == (after): `a0c1145ab501a94414188b25c9827f99e8fae48c7f83bf24960d02f1bd84e499` (stable across this run).

## 2. Writer liveness (do NOT stop/pause)
Source owner ctx6d5163923070 (keyclime-sql-poolside) is STILL active, so the SQL SHA is INTERIM. The SHA drifted between this reader's two actual runs of the same suite:
- Run 1 — SHA `cfb1c29f178c1adb2264b7b8831ba14e060e30dc70794e79ad869f869e8d729b`, exit 1, 23/25: AR-20 failed with `duplicate key value violates unique constraint "thinking_game_attempts_entitlement_id_key"`.
- Run 2 — SHA `a0c1145ab501a94414188b25c9827f99e8fae48c7f83bf24960d02f1bd84e499` (stable before==after), exit 1, 23/25: AR-20 fails with `column reference "command_id" is ambiguous`.

Both runs are green except AR-07 + AR-20. No stop/pause was issued to the writer; the drift is the reason the reported SHA must be treated as interim.

## 3. Remaining failures — minimal cause + remediation (source-owner only; NOT applied)

### AR-07 — Undo after a bonus attempt started must revoke as `revoked_after_use` (GWT-18 / GWT-20 / contracts §7.2)
- Actual repro: `after.state` = `revoked_unused`, expected `revoked_after_use`; the prior bonus attempt row is still present.
- Minimal cause (stable across SHAs): `sync_thinking_game_bonus_for_child` (migration lines 158-174). For an in-flight bonus (`existing_bonus.state in ('granted','started')`) that loses a completing mandatory task, lines 171-173 set `state = 'revoked_unused'` unconditionally. It never inspects `public.thinking_game_attempts`, so it cannot tell whether the bonus was already started/used. In AR-07 the bonus was started in AR-05 (`thinking_game_start('bonus')` → an attempt exists), so the undo must yield `revoked_after_use` and preserve the attempt in history.
- Remediation: at line 171, gate the revoke state on attempt existence:
  `set state = case when exists (select 1 from public.thinking_game_attempts where entitlement_id = existing_bonus.id and state in ('started','finished')) then 'revoked_after_use' else 'revoked_unused' end`.
  No attempt insert/delete is required — the unique `thinking_game_attempts_entitlement_id_key` already enforces one attempt per entitlement and keeps it.

### AR-20 — Re-serve of a stale/foreign age-track entitlement must re-point the SAME row in place and serve the contract age track (contracts §10 / GWT-22-24 / T23 / T38)
- Test setup (stable): AR-17 plants a foreign entitlement for `CHILD.age` (born 2017 → server resolves age_9_12 in 2026) with `content_id='kilo-internal-d1-main-age_6_8'` (age_6_8 = stale), `state='started'`, plus a foreign attempt keyed on that entitlement. AR-20 then calls `thinking_game_start(CHILD.age,'main')` and asserts the served puzzle carries `ageTrack=age_9_12`, and that an unknown-age child raises `age_track_unavailable`.
- Minimal cause (current disk, SHA a0c1145): the in-place re-point block of `thinking_game_start` (lines 427-529). The matched foreign entitlement is re-pointed via the UPDATE at lines 509-513, but line 511 reads `command_id=thinking_game_start.command_id`. In PL/pgSQL a function parameter is referenced by its bare name (`command_id`); `thinking_game_start.command_id` is not a valid qualifier. With the `e` (entitlements) and `attempt` (attempts) %rowtype records both in scope — each carrying a `command_id` column — the reference is ambiguous, raising `column reference "command_id" is ambiguous`. The INSERT path at line 516 already uses bare `command_id` correctly, proving the parameter name resolves fine there; the UPDATE must match. (At the prior interim SHA cfb1c29f the same re-point block instead fired the `thinking_game_attempts_entitlement_id_key` insert conflict — the writer's edit moved the failure onto this ambiguous `command_id` UPDATE.)
- Remediation: in the UPDATE at lines 509-513, reference the parameter cleanly (e.g. `command_id = command_id` is ambiguous in UPDATE context too; disambiguate by aliasing the parameter, e.g. assign `command_id := p_command_id` via a distinctly-named local, or compute the SET values from the bare parameter where PG resolves it unambiguously) so it matches the working INSERT path (line 516). Independently of that syntax fix, verify the re-point path loads the matched entitlement's attempt at line 431 and updates it in place at line 521 (the `if attempt.id is null then ... else update ... end if` guard) so a re-serve never inserts a second attempt for an entitlement that already owns one — this prevents the duplicate-attempt-key class from resurfacing once the ambiguous column is resolved.

## 4. Out of scope / not done by this reader
- No app/SQL/test source edits; no commit/push/deploy.
- Did not stop or pause the still-live writer (ctx6d5163923070).
- Did not touch the 3 other SQL runtime files owned by ctxe208080560bf.
- Did not run unit/e2e/tsc or any orca/ORCACI tooling (out of SQL-25 scope).

## 5. Artifacts produced by this reader
- `/tmp/goodhabit-sql-brief-poolside-reader-stdout.log` — unpiped actual stdout (run 2, SHA a0c1145), 3617 bytes.
- `/tmp/goodhabit-sql-brief-poolside-reader-stderr.log` — empty.
- `/tmp/goodhabit-sql-brief-poolside-reader-exit.txt` — `EXIT=1`.
- `/tmp/goodhabit-sql-brief-poolside-reader-sha-before.txt` / `-sha-after.txt` — both `a0c1145...==a0c1145`.
- This report: `/home/opc/orca/goodhabittracking/execution/cline-sql-brief-poolside-reader.md`.
- Aggregates: `/tmp/goodhabit-sql-brief-reader-aggregate.json`, `/tmp/goodhabit-games-cline-sql-brief-poolside-reader-result.json`.
- The suite self-writes per-run evidence to `/tmp/goodhabit-games-authority-races-evidence/authority-races-{latest}.json`.

## 6. Recommended next step
Let the still-live SQL writer (ctx6d5163923070) complete the AR-20 re-point edit (resolve the `command_id` reference at line 511 and confirm the in-place attempt update), then re-run the identical command. AR-07 can be closed independently with the `revoked_unused`→`revoked_after_use` attempt-existence gate. Re-run the suite and reconfirm 25/25 green before declaring done.
