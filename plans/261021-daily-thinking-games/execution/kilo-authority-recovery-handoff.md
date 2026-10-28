# Kilo — Authority + Races independent verification (RECOVERY handoff)

**Status:** IN PROGRESS — checkpoint written first per dispatch instruction; the missing
actual matrix is being resumed in this same dispatch.
**Task:** `task_4fbf4eafa878` · **Dispatch:** `ctx_255185e9c083`
**Terminal:** `term_38e898da-7a1e-4af4-99e2-d3125daf27ff`
**Workspace:** `/home/opc/orca/goodhabittracking`
**Role:** independent verifier / test-engineer. Test files only. No app source edits, no
SQL edits, no dependency changes, no commits, no deploys, no native agents.

---

## 0. Recovery context — what happened to the previous run

The previous Kilo dispatch (`ctx_25edc3dbe50a`) did **not** fail on a test or a code
error. Its last act was an in-flight edit to
`tests/integration/migrations/thinking-games-authority-races-runtime.mjs`, and the
transcript ends with the provider error:

```
Error: Too Many Requests: Model usage limit reached. Please try again later.
```

i.e. an upstream **model/provider context limit**, not a defect in the work and not a
failed assertion. The completed work was preserved, not rebuilt:

* `tests/integration/migrations/thinking-games-authority-races-runtime.mjs` already exists
  with **25 cases `AR-00` … `AR-24`** fully authored (87 KB).
* The previous session's last edit (a `makePool` / `raceOn` / `serialOn` refactor so the
  latency measurement excludes connection setup) **is present on disk** and was kept.
* A real PostgreSQL 18.4 run had already been executed against the current source.

### Current source hashes (the run target)

| Artifact | SHA-256 |
|---|---|
| `supabase/migrations/202610210001_thinking_games.sql` | `fb6af27a3f3e98bb1eec033b449bf6e7485dbe302883edf5f93fb6739c889d99` |
| `supabase/schema.sql` | `f075ffe306e2bf27117761f3a4b791ed7cc72cfa02106ab5efb7f852789514fe` |
| `scripts/thinking-games-sql-fixture.mjs` | `586e7681974335b410a5bc24e3c5a95d1f7405fd230d8013f555629755f0583c` |
| `tests/integration/migrations/thinking-games-authority-races-runtime.mjs` (pre-fix) | `edc26cd77b09a1acf85cd2ad5fd30ca9f222b021c042e952d6c0c88332b0099f` |
| git HEAD | `9db0c946c9a23d2069d71ba7878bd3079af149ff` |

The SQL is **frozen** (per the dispatch: Copilot E2 `task_f0bctx7924` closed the SQL
writer). Everything below was produced against the hashes above.

---

## 1. Historical evidence (labelled historical — NOT a current claim)

`/tmp/goodhabit-games-authority-races-evidence/` holds three prior runs. The oldest two
(`10-55-55Z`, `11-12-04Z`) predate the current source and are **historical only**.

The most recent run — `authority-races-2026-10-21T13-20-02-967Z` — **is** against the
current source hash above and is the baseline this recovery continues from:

```
verdict FAIL   counts {pass: 5, fail: 20, blocked: 0, total: 25}
database       kidhabit_test_80755955f03c4d1f8a59d5ae4f79e1f0
postgres       PostgreSQL 18.4 (Debian 18.4-1.pgdg13+1) on aarch64-unknown-linux-gnu
node           v26.11.1
```

PASS: `AR-00`, `AR-01`, `AR-02`, `AR-03`, `AR-21`.
FAIL: `AR-04`…`AR-20` (except those above), `AR-22`, `AR-23`, `AR-24`.

**A raw "20 FAIL" number is misleading here.** The 20 failures are **not** 20 product
bugs. They decompose into (a) three genuine contract violations in the frozen SQL,
(b) one measured serialization defect, (c) a set of harness defects in my own test file,
and (d) a handful of cases still awaiting triage. Section 2 is that triage.

---

## 2. Triage of the 20 failures

### 2.1 REAL product defects in the frozen SQL (route to the Copilot owner via OMP)

#### D1 — advisory lock key is not the contract formula (`AR-23` FAIL)

Contract, `plans/261021-daily-thinking-games/contracts.md:268` (binding, and
`decisions.md` D33 says *"exact `thinking_game_lock_key(uuid)`"*):

```sql
select ('x' || substr(md5('thinking_games:' || p_child_id::text), 1, 16))::bit(64)::bigint
```

Implementation, `supabase/migrations/202610210001_thinking_games.sql:244`:

```sql
select hashtextextended('thinking-games:' || target_child_id::text, 0)
```

Three separate deviations: the salt string (`thinking_games:` vs `thinking-games:`),
the digest algorithm (MD5-truncated vs `hashtextextended`), and therefore the resulting
64-bit value. The function is still a stable per-child key, so the lock itself still
serialises correctly per child — but the value is not the contract value, so any tool,
migration-drift check, or second implementation that computes the contract key will not
match the deployed key. Reproduced at runtime: the two bigints differ.

#### D2 — age track is never computed from the server-known age (`AR-20` FAIL)

Contract `contracts.md:298-303`:

* age 6–8 inclusive → `age_6_8`;
* age 9–12 inclusive → `age_9_12`;
* any other / unknown age → `age_track_unavailable`;
* a parent override wins over the computed age;
* *"No silent fallback to another track."*

Implementation, migration line 536 (and the same shape in the child start path):

```sql
select coalesce(settings.age_track_override,'age_6_8') into selected_track;
```

There is **no age computation at all**: a child with no parent override always gets
`age_6_8`. Reproduced: a child born in **2017** (age 9 in 2026) was served
`age_6_8` instead of `age_9_12`. Two contract clauses are broken at once — the
9–12 band is unreachable by automatic resolution, and the unknown-age case silently
falls back to `age_6_8` instead of returning `age_track_unavailable`.

#### D3 — every child's game start serialises on the family settings row (`AR-22` FAIL)

`thinking_game_apply_pending_settings()` takes the family settings row with
**`for update`** *before* it checks whether anything is pending:

```sql
select * into s from public.thinking_game_settings where family_id=target_family_id for update;
if not found or s.pending_settings is null ... then return; end if;
```

Every `thinking_game_start` / `thinking_game_parent_start_as` calls this helper, so all
children of one family queue behind a single exclusive row lock. The contract's
serialisation model is **per child** (`pg_advisory_xact_lock(thinking_game_lock_key(child_id))`,
`contracts.md:248`), and `contracts.md:279` requires the added locking to be measured
against the AC13 performance budget. The measurement in §2.3 shows the family row, not
the advisory lock, is what serialises unrelated children.

### 2.2 Harness defects in my own test file (mine to fix — not product defects)

| Case | Symptom | Why it is a harness bug |
|---|---|---|
| `AR-08`, `AR-11`, `AR-12` | `permission denied for function thinking_game_parent_start_as` / `thinking_game_update_settings_as` | Migration lines 720-735 grant these `_as` wrappers to **`service_role` only** and revoke them from `public/anon/authenticated`. The test called them with `authenticated` claims. "Permission denied" is the **correct** security posture; the harness must present `service_role` claims the way the API route does. |
| `AR-24` | "child points must be back at the seeded 120 after the undo, got 0" | The harness seeds its own children with `points = 0` (line 328). The undo path (`migration:846`) correctly subtracts the awarded points, so the correct post-undo value is the seeded value `0`. The assertion hard-coded `120`. The **undo behaviour is correct**; the expectation was wrong. |
| `AR-13` | `Cannot read properties of undefined (reading 'present')` | The pause-state probe dereferenced a column that the schema does not have. The case already has a `blocked()` branch for "the schema has no pause state"; the probe crashed before it could reach it. |
| `AR-16` | `inconsistent types deduced for parameter $3` | A parameter-type bug in the harness's own SQL, not a server rejection of the case. |
| `AR-04` | `unexpected error: activity_not_found` | The harness pointed the command at an activity/child pair that does not exist in its own seed. |
| `AR-22` (measurement) | `speedup 0.17x (single median 2.20ms, parallel median 263.50ms)` | Apples-to-oranges: the 5 "single" samples all hit the **same child on the same day**, so 4 of the 5 measured the cheap idempotent-replay path, while the parallel samples measured 20 **real** creations. The metric must compare like with like. (The underlying serialization in D3 is still real and is separately reported.) |
| `AR-09`, `AR-10` | "the mixed/batch race produced unexpected errors" | The race participants call the same `_as` wrappers; needs the same `service_role` claim correction, then re-triage. |

### 2.3 Measured latency evidence (`AR-22`, from the 13-20-02Z run)

```
singleMedian=2.20ms   contended20=<see evidence json>   parallel20Median=263.50ms
perStart=13.18ms       sequentialEquivalent=44.00ms      speedup=0.17x
```

20 starts for 20 **different** children of one family take ~20x longer than the
sequential equivalent would predict — unrelated children do **not** overlap. Consistent
with D3 (one exclusive family-settings row lock), not with the per-child advisory lock
the contract specifies. Repeatable local measurement on this host only; **not** a
hardware-universal claim and **not** the AC13 budget verdict (AC13 is not mine to
close).

---

## 3. What the passing cases already prove (current source)

| Case | What it proves |
|---|---|
| `AR-00` | `authenticated` is `NOSUPERUSER`/`NOBYPASSRLS`; every game table has RLS **enabled and forced**. |
| `AR-01` | 20 simultaneous `start main` for one child on one server day → exactly **1 entitlement, 1 attempt, 1 journey advance, 1 snapshot**; all 20 responses carry the **same** ids. |
| `AR-02` | Start replay is idempotent — same `commandId` and a different `commandId` both return the same entitlement/attempt/content version and never advance the journey twice. |
| `AR-03` | The bonus is granted only when every non-excused mandatory task is terminal and its server receipt is at or before the cutoff. |
| `AR-21` | The local day and the snapshot cutoff are resolved with the IANA zone across **both** DST transitions; exactly one snapshot per local day. |

---

## 4. Harness / environment facts (so the numbers are reproducible)

* Real PostgreSQL **18.4** (`omp-pg-probe` container, `127.0.0.1:55432`, loopback only,
  disposable `kidhabit_test_*` database dropped on exit).
* The suite applies the **real** `supabase/migrations/202610210001_thinking_games.sql`,
  the **real** preflight, and the **real** six legacy habit RPCs.
* `authenticated` role: `rolsuper = false`, `rolbypassrls = false`, RLS **forced**.
* Content rows used by the suite are an **explicit internal test fixture**
  (`status='approved'`) so the authoritative SQL paths can run. That is **not** a human
  content approval and production content stays `design_only`/pending review.
* No production credentials, no mocked RPC, no shadow table. Exit codes: `0` all PASS,
  `1` a case FAIL, `2` BLOCKED (no database).

---

## 5. Remaining work in this dispatch

1. Fix the harness defects in §2.2 (claims, expectations, probes, measurement fairness).
2. Re-run the matrix against the same frozen source and capture the new SHA + counts.
3. Triage the still-unresolved cases (`AR-05`…`AR-07`, `AR-09`, `AR-10`, `AR-14`…`AR-20`)
   into *harness* vs *product* and finish the PASS/FAIL/BLOCKED ledger.
4. Build the contract→GWT coverage mapping (actual existing tests vs missing), with
   real assertion counts — no unverified "45 GWT covered" claim.
5. Add the HTTP-layer test `tests/api/thinking-games-authority.test.ts` (NEW file) for
   the parts of the matrix the SQL suite cannot reach.
6. Report concrete reproduced defects to the Copilot owner via the OMP inbox
   (`term_a2233000-4d64-4eae-94e8-8d0474ee4abf`) and send the lifecycle message with
   the **new** dispatch ids only.

---

*Historical note: the pre-recovery transcript is preserved verbatim at
`/tmp/goodhabit-games-kilo-authority-races-output.log` and the pre-recovery report
(`kilo-authority-races-handoff.md`) is preserved unchanged; this file is the new
recovery artifact and does not overwrite it.*
