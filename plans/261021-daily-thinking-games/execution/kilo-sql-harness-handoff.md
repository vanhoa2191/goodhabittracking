# Kilo SQL harness handoff — daily thinking games (P04 preparation)

**Author:** Kilo test-engineer
**Date:** 2026-10-21
**Task:** `task_d5d723a3bac4` / dispatch `ctx_ef14f98bcc1a`
**Status:** HARNESS READY AND SELF-VERIFIED. Game SQL proofs: **NOT RUN** (no game SQL exists).
**Scope of this document:** harness preparation only. No source app, game migration,
game API/engine/UI, `package.json`, shared script or `thinking-games-runtime.mjs`
was modified. No dependency was added, no commit, push or deploy was made.

---

## 1. What was delivered

| File | Purpose |
| --- | --- |
| `scripts/thinking-games-sql-fixture.mjs` | Reusable real-PostgreSQL fixture adapter: dynamic auth context, RLS-shaped schema, seeded identities. |
| `tests/integration/migrations/thinking-games-harness-smoke.mjs` | Smoke runner that proves **the harness itself** against real PostgreSQL. |

Both are new files. Nothing else in the repository was touched.

### 1.1 Fixture adapter exports

| Export | Meaning |
| --- | --- |
| `HARNESS_SCHEMA_SQL` | Small, explicitly labelled **harness fixture** (`families`, `family_memberships`, `child_profiles`, `device_sessions` + production-shaped RLS policies). Marked `==== HARNESS FIXTURE (test-only projection of the production schema) ====`. |
| `BASELINE_SCHEMA_SQL` | **Minimum baseline** the future thinking-games migration must integrate with: harness schema **plus** `parent_profiles`, `parent_settings`, `habit_activities`, `activity_logs`, `child_task_deferrals`. |
| `THINKING_GAMES_IDENTITIES` | 2 tenants, 2 children, 4 users (owner/guardian/caregiver/beta owner), 3 device sessions (live, revoked, other tenant). |
| `createThinkingGamesFixture({ schema, label })` | Creates a disposable per-test database via the existing `scripts/sql-test-database.mjs` helper, applies the schema, seeds identities, returns the adapter. |
| `applyAuthContext(client, { role, claims })` | Sets `request.jwt.claims` / `request.jwt.claim.sub` / `request.jwt.claim.role` and optionally `SET ROLE`. |
| `clearClaims(client)` | Empties the claim GUCs (role untouched) so no tenant can be reused. |
| `resetAuthContext(client)` | `RESET ROLE` + clear claims — the between-cases reset. |
| `buildClaims(userId, { role, email, extra })` | Builds a PostgREST-shaped claim set. |
| `databaseExists(name)` | Checks the control database for a `kidhabit_test_*` database (used to prove the disposable DB is dropped). |

### 1.2 Example import (for the P04 backend owner)

```js
import {
  BASELINE_SCHEMA_SQL,
  THINKING_GAMES_IDENTITIES,
  buildClaims,
  createThinkingGamesFixture,
} from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL });
try {
  // Apply the real game migration on top of the baseline:
  // await fixture.exec(readFileSync('supabase/migrations/<game>.sql', 'utf8'));

  // Act as a parent of tenant A under a NON-superuser role.
  await fixture.applyAuthContext({
    role: 'authenticated',
    claims: buildClaims(THINKING_GAMES_IDENTITIES.users.parentAlpha, { role: 'authenticated' }),
  });

  const rows = await fixture.rows('select id from public.child_profiles');
} finally {
  await fixture.close();
}
```

`createThinkingGamesFixture()` reuses the existing `scripts/sql-test-database.mjs`
helper, so it creates and drops **only** its own `kidhabit_test_*` database. The
root `postgres` database and every other database on the server are untouched.

---

## 2. What was exercised (actual verdicts)

**Command (exact):**

```bash
SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' \
  node tests/integration/migrations/thinking-games-harness-smoke.mjs
```

- Node `v26.11.1` (package `engines.node >= 24`; `.nvmrc` pins `24`, which is not
  installed on this host — `v26.11.1` is the installed runtime that satisfies
  `engines`. No tool was installed.)
- PostgreSQL **18.4** (Debian 18.4-1.pgdg13+1), disposable container `omp-pg-probe`
  on `127.0.0.1:55432` (not stopped, not modified).
- Canonical run: started `2026-10-21T09:35:31.937Z`, finished `2026-10-21T09:35:32.181Z`,
  **exit code 0**.
- Evidence: `/tmp/goodhabit-games-sql-harness-evidence/canonical-run.log` and
  `/tmp/goodhabit-games-sql-harness-evidence/thinking-games-harness-smoke-2026-10-21T09-35-31-937Z.log`.

| Case | Assertion exercised | Verdict |
| --- | --- | --- |
| H1 | `auth.uid()`, `auth.role()`, `auth.jwt()`, `public.current_family_id()` follow the request claims; switching claims switches the tenant (a constant `current_family_id()` fails this); `auth.role()` reads the JWT role claim independently of the session role. | **PASS** |
| H2 | The asserting role is `rolsuper = false` and `rolbypassrls = false`; `relrowsecurity` and `relforcerowsecurity` are both true on `child_profiles`; the alpha parent sees exactly `[child alpha]`; the login role sees both children (positive control that the rows exist). | **PASS** |
| H3 | Cross-tenant read of `child_profiles` returns 0 rows and the only visible membership family is the caller's; a cross-tenant insert is rejected with SQLSTATE **42501** / "new row violates row-level security policy"; the rejected write left nothing behind; the same role **can** write into its own tenant (positive control). | **PASS** |
| H4 | After `clearClaims()`: `auth.uid()`, `auth.role()`, `auth.jwt()->>'sub'` and `current_family_id()` are all null, zero rows are visible, and an insert into the previously allowed tenant is rejected with 42501. | **PASS** |
| H5 | The between-cases guard asserts `current_user = session_user` and `auth.uid() IS NULL` before every case; the login role sees both tenants again; re-applying the non-superuser role restores the restriction. | **PASS** |
| H6 | Live child session resolves to its child; the **revoked** session resolves to null; an unknown token resolves to null; another tenant's token resolves to its own child (bearer secret, not the caller's tenant); `device_sessions` rows stay tenant-scoped under RLS for both parents. | **PASS** |
| H7 | The fixture database is named `kidhabit_test_*`, is not `postgres`, exists while open, and is **dropped** on close (verified against the control database). | **PASS** |

**Summary line of the canonical run:** `PASS 7  FAIL 0  BLOCKED 0`, exit code `0`.

### 2.1 BLOCKED verdicts (non-success, no crash)

| Scenario | Command variant | Verdict | Exit |
| --- | --- | --- | --- |
| No database configured | `env -u SQL_TEST_DATABASE_URL -u EMBEDDED_POSTGRES_MODULE_PATH node …` | `BLOCKED H0 environment: Neither SQL_TEST_DATABASE_URL nor EMBEDDED_POSTGRES_MODULE_PATH is set, so no disposable PostgreSQL is available.` | **2** |
| Database unreachable | `SQL_TEST_DATABASE_URL=postgresql://postgres:***@127.0.0.1:55499/postgres node …` | `BLOCKED H0 database: the disposable PostgreSQL could not be prepared: connect ECONNREFUSED 127.0.0.1:55499` | **2** |

Evidence: `/tmp/goodhabit-games-sql-harness-evidence/blocked-no-env.log`,
`…/blocked-unreachable-db.log` (and the runner's own timestamped logs beside them).
Exit code 2 = blocked, 1 = at least one case failed, 0 = all cases passed.

### 2.2 Honest history

The first canonical run was **not** clean: H3 and H6 failed because my *expectations*
were wrong (I expected one membership row per family — there are three alpha members —
and I wrongly expected a bearer session token to be tenant-scoped). The failures were
real signals, not flaky assertions. The expectations were corrected to the true
production semantics; the assertions themselves were **not** weakened. Those earlier
logs are kept in `/tmp/goodhabit-games-sql-harness-evidence/superseded/` for audit.

A second real defect was found and fixed during this task: the runner used a
buffered `WriteStream` and then called `process.exit()`, which truncated the evidence
file (and could drop it entirely). The runner now appends synchronously, so every
evidence file is complete.

---

## 3. Fixture assumptions and source gaps (explicit)

1. **`public.activity_logs` has no tracked DDL in this repository.** The only matches
   for `create table … activity_logs` are local test stubs
   (`scripts/verify-local-billing.mjs`, `scripts/verify-local-affiliate.mjs`,
   `tests/integration/migrations/family-operations-runtime.mjs`). The tracked
   migrations only ever `alter table public.activity_logs add column family_id`
   (`202609190001`). Therefore:
   - The baseline declares `completed_at timestamptz` with **NO default** and every
     fixture insert must supply it explicitly. The smoke/fixture never claims a
     production default.
   - `public.secret_quests` (`202609230001_experience_foundation.sql` lines 32–46) also
     declares a `completed_at timestamptz` column. It is a **different table** and is
     **not** evidence about `activity_logs`. The earlier mixed-table citation is not
     reproduced here.
   - The real production DDL (including `reviewed_at`, which contracts.md §7.1 says
     P04 adds) is **unknown** to this fixture. `reviewed_at` is deliberately *not*
     declared — it belongs to the P04 migration.
2. **Column set is a projection**, cross-checked against the tracked migrations and the
   runtime SQL casts — the same convention already used by
   `tests/integration/migrations/family-operations-runtime.mjs` (see its header comment).
3. **The `thinking_game_*` tables are intentionally absent.** They are owned by the P04
   migration; faking them in a fixture would make the tests prove the fixture, not the
   product. The baseline is the substrate the migration is applied to.
4. **Auth simulation is `current_setting` based**, matching PostgREST/Supabase:
   `auth.uid()` = `coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
   (request.jwt.claims::jsonb ->> 'sub'))::uuid`; `auth.role()` and `auth.jwt()` likewise.
   `public.current_family_id()` is derived from `auth.uid()` + `family_memberships`
   (mirroring `202609190001` lines 101–142) and is **never** a fixed constant.
5. **Policy proofs never use the superuser and never disable RLS.** All policy reads
   run after `SET ROLE authenticated` (`NOSUPERUSER`, `NOBYPASSRLS`). Seeding runs as
   the login role, which is explicitly *not* a policy proof.
6. **Grants are hardened like production** (`revoke all … from public`, explicit
   `grant execute`), and the helper functions are `security definer set search_path = ''`
   with `public.`-qualified references.
7. **Device session semantics**: a session resolves only when `revoked_at IS NULL`
   and `expires_at` is in the future, matching `202609250001` / `202609190002`.
8. **Database isolation**: only a per-test `kidhabit_test_*` database is created and
   dropped. The OMP container `omp-pg-probe` was neither stopped nor modified.

---

## 4. What is explicitly NOT proven

- **AC04 game policy proofs: NOT RUN.** No thinking-games migration, function,
  entitlement, snapshot or attempt exists in this repository
  (`supabase/migrations/` has no `*_thinking_games.sql`; no `thinking_game_*` table
  exists anywhere). The smoke proves the **harness**, not any game policy.
- The runner prints this scope notice on every run, before any case.
- The baseline was verified to apply cleanly and to enforce RLS on the habit tables
  (own-tenant `habit_activities` + `activity_logs` inserts succeed; a cross-tenant
  `activity_logs` insert is rejected with 42501). That is a **substrate** check, not a
  game-policy proof.

### 4.1 Remaining game SQL proofs the P04 owner must run once the migration exists

These are the contract items the harness is now ready for. They are listed so the
backend owner can reuse the fixture without re-deriving them:

| # | Proof | Contract reference |
| --- | --- | --- |
| 1 | `thinking_game_state` / `start` / `finish` / `pause` under a **child device session** (non-superuser role), with `current_setting` claims, including revoked/expired session denial. | contracts §13.1, §14 |
| 2 | 20 concurrent `start main` on one child/day ⇒ exactly one entitlement + one attempt, no duplicate (needs a unique key on `(child_id, local_day, slot_type)`). | contracts §6.2, GWT-15, T02 |
| 3 | Common lock order §8.2 with `pg_advisory_xact_lock(thinking_game_lock_key(child_id))`: concurrent complete / review / undo / start produce no deadlock and one deterministic bonus. | contracts §8.2, T33 |
| 4 | Batch review ⇒ `sync_thinking_game_bonus_for_child` runs **once** after the batch, no transient grant/revoke. | contracts §8.1, GWT-16, T34 |
| 5 | Bonus condition uses `activity_logs.completed_at` (received time) and **not** `reviewed_at`; late receipt at 19:05 vs cutoff 19:00 ⇒ no bonus. | contracts §7.1, GWT-10, GWT-12, T06 |
| 6 | Undo before/after bonus start ⇒ `revoked_unused` / `revoked_after_use`, attempt retained, approved habit log and points unchanged. | contracts §7.2, GWT-17, GWT-18, GWT-20, T08, T35 |
| 7 | Cross-tenant / cross-child isolation for every game table under RLS, with the game policies (not the harness policies). | contracts GWT-31, T13 |
| 8 | Local-day computation **inside SQL** `(now() at time zone p_timezone)::date`, DST spring/fall, one snapshot per local date, no duplicate/missing day. | contracts §4, §5.3, GWT-01, GWT-07, T09 |
| 9 | Snapshot immutability and next-day settings effect (enable/timezone/cutoff/bedtime/age override). | contracts §5.2, §4.8, GWT-03, GWT-04, T10 |
| 10 | `timezone_required` / `timezone_invalid` mapping from the PostgreSQL error, and `age_track_unavailable` with no silent fallback. | contracts §4.2, §4.4, §10, GWT-02, GWT-23, T37, T38 |
| 11 | Flag defaults: master off / bonus off / pilot off ⇒ no entitlement, no content request, main still works. | contracts §12, GWT-29, GWT-30, T43 |
| 12 | `idempotency`: replayed `commandId` returns the original result; a different `commandId` for a finished attempt is `already_finished`. | contracts §13.3, GWT-04, T03 |

---

## 5. Reproduction

```bash
cd /home/opc/orca/goodhabittracking
export SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres'
node tests/integration/migrations/thinking-games-harness-smoke.mjs ; echo "exit=$?"
```

Expected: `PASS 7  FAIL 0  BLOCKED 0`, `exit=0`.
Evidence is written to `/tmp/goodhabit-games-sql-harness-evidence/`
(override with `THINKING_GAMES_HARNESS_EVIDENCE_DIR`).

`npx eslint scripts/thinking-games-sql-fixture.mjs tests/integration/migrations/thinking-games-harness-smoke.mjs --max-warnings=0`
→ clean.

**Note on the harness's own limitation:** the smoke is deliberately *not* wired into
`npm run test:sql`, because that script is the project's release-grade SQL gate and
this harness is not yet game-proof. Wiring it in is a decision for the backend owner
once the game migration exists and the fixture has been promoted from harness to
baseline.
