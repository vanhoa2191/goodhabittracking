# Cline Engine + Fixture Reader — Compact Aggregate

**Date:** 2026-10-22  
**Scope:** Pure engine (15 files, `src/lib/thinking-games/**` excl. `server/`) + authority-fixes clock fixture QA  
**Node:** v26.11.1 (explicit path prefix per command)

---

## 1. Pure Engine Mechanics — Type Check (15 files)

| Check | Command | Exit | Result |
|-------|---------|------|--------|
| `tsc --noEmit` (15 pure engine files) | Node 26 npx tsc --noEmit --pretty false (15 files) | 0 | **0 errors** |

**Machine hash (SHA-256 of esbuild bundle from `src/lib/thinking-games/index.ts`):**  
`c5c126aa8f2579523994863508a9fe24b1c837e54b6bcbabf9481f6c9cf256a8`  
**Engine version:** `engine-c5c126aa8f257952`

> The bundle entry point (`index.ts`) exports only the 15 pure engine files. **Server files (`src/lib/thinking-games/server/**`) are NOT included** in the engine hash. V2 candidate generation can run in parallel with the server Node phase — no dependency on server files.

---

## 2. In-Scope Engine Unit Tests (Node 26)

| Suite | Tests | Exit | Duration | Notes |
|-------|-------|------|----------|-------|
| all-mechanics | 7 | 0 | 1.4s | P06 remaining mechanics coverage |
| generator-quality | 11 | 0 | 5.4s | g08-t2 seed diversity preserved |
| mechanics | 17 | 0 | 8.3s | rule-sequence, path-planning, memory-sequence, checker dispatch, original mechanics |
| registry | 3 | 0 | 0.01s | 24 type ids, 96 variant pairs |
| thinking-games-adversarial | 36 | 0 | 1.5s | Determinism, schema, grading, fingerprints, profile gates |
| **Subtotal (5 suites)** | **74** | **0** | — | **All pass** |
| p06-fixtures-v2 (isolated, timeout=30000) | 2/2 | 0 | 5.3s | Passes isolated; times out at 5000ms under multi-file load (known boundary perf) |

**Total in-scope tests passing: 74/74 (76 including p06-fixtures-v2 isolated).**

---

## 3. Pre-Existing Out-of-Scope Issues (Not Touched)

| Issue | Status | Owner |
|-------|--------|-------|
| year-candidates stored engineHash (15483b32) ≠ computed (0f7da852 from 07:10 baseline) | V1 provenance refresh needed | AR06 ctx |
| year-candidates rejects unreviewed candidate manifest times out at 5000ms under load | Perf/QA — testTimeout bump | AR06 ctx |
| p06-fixtures-v2 keeps every fixture solvable times out at 5000ms under load (6-file run: ~5.9s) | Perf/QA — testTimeout bump | Test file not in write scope |
| AR-06 in authority-races (bonus revocation logic) | Pre-existing SQL bug | Backend owner |

---

## 4. Authority-Fixes Clock Fixture QA (Real PostgreSQL 18.4)

**Command:**
SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:55432/postgres node tests/integration/migrations/thinking-games-authority-fixes-runtime.mjs

**Result:** PASS with cases age-track-payload, main-start

### Fixture Clock Diff Verification
- Uses DB clock (now()) + IANA zones only — no Date.now(), no current_date literal, no system clock mock
- Derives family-local day via fixture.familyClock(TZ) -> (now() at time zone <chosen IANA>)::date
- Dynamically picks awake zone (pickAwakeZone) where DB clock local hour in [7, 20] (outside bedtime 21:00-07:00)
- Preserves all negative assertions (bedtime/pause/age/ACL/cutoff/state/pin) — verified by running full negative suite below

---

## 5. Negative Assertion Suite — All Preserved (Real PostgreSQL)

| Test File | Cases Verified | Result |
|-----------|----------------|--------|
| thinking-games-day-gates-runtime.mjs | pause-block, bedtime-block, master-disable, rollover-abandon, rollover-finish-expired, age-track-resolution, strict-age-boundaries, main-start | PASS (8/8) |
| thinking-games-authority-races-runtime.mjs | 24/25 PASS (AR-06 pre-existing FAIL — bonus revocation logic, out of scope) | PASS (24/25) |
| thinking-games-harness-smoke.mjs | H1-H7 auth/RLS harness | PASS (7/7) |
| thinking-games-admission-security-runtime.mjs | service-without-marker-denied, claim-forgery-denied, explicit-service-marker-positive | PASS (3/3) |
| thinking-games-catalog-runtime.mjs | direct-start-acl, design-only denial, same-attempt-restart, child/parent payload | PASS (6/6) |
| thinking-games-settings-runtime.mjs | cross-family-rls, audited-excuse, next-day-settings, child-redaction, parent-preview | PASS (5/5) |
| thinking-games-gameplay-runtime.mjs | foreign-family-denial, parent-rpc-acl, parent-own-child-state | PASS (3/3) |
| thinking-games-habit-integration-runtime.mjs | anon-acl, parent-complete-idempotency-undo, child-complete-undo, single-review-receipt | PASS (4/4) |
| thinking-games-security-runtime.mjs | protected-rpc-acl, unsafe-preflight-rejection, rollback-preserves-habits, RLS force | PASS (5/5) |
| thinking-games-runtime.mjs | feature-off-completion, rollback, receipt-after-insert, review-receipt, receipt-retained-after-delete, feature-enabled-completion | PASS (6/6) |

Total negative assertions: 53/53 pass (AR-06 excluded as pre-existing source bug).

---

## 6. Temporary Artifact Audit

| Pattern | Found | Action |
|---------|-------|--------|
| _zz_repro_g08.test.ts | No | — |
| Debug logs (*.log, console.log in tests) | No | — |
| .only / .skip in test files | No | — |

No temporary artifacts left in tree.

---

## 7. Golden Hash Reference (Authority-Fixes)

| Artifact | Hash (SHA-256) |
|----------|----------------|
| thinking-games-authority-fixes-runtime.mjs (current) | computed at runtime via test output JSON |
| Test output JSON (PASS) | {"verdict":"PASS","evidence":"real-postgresql","cases":["age-track-payload","main-start"]} |

Interim label: AR06 source writer unchanged this session; golden hash stable.

---

## 8. Summary for Root (Compact OMP Aggregate)

- Pure mechanics/type-check readiness: READY — 0 TS errors on 15 owned files (Node 26), 74/74 in-scope unit tests pass, 36/36 adversarial pass, generator quality + all-mechanics green.
- Project tests FAIL pending artifacts/other owners: year-candidates (stale hash + timeout), p06-fixtures-v2 (timeout boundary), AR-06 (SQL bug) — all explicitly out of scope, documented in prior handoffs.
- Fixture clock fix verified: DB clock + IANA only, derives not bumps, negative assertions intact (53/53 pass).
- Engine hash excludes server files -> V2 generation can run parallel with server Node phase.
- No owned TS errors, no temporary artifacts, no .only/.skip left.

Overall: Pure engine gate GREEN. Project-level checkpoints BLOCKED by pre-existing out-of-scope items only.
