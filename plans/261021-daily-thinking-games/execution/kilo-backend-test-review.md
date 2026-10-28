# Kilo — Independent Backend / Test Review (READ ONLY)

**Role:** independent backend + test reviewer (Kilo). **Scope:** read-only audit of the
daily-thinking-games backend surface + test/verification strategy.
**Dispatch:** `task_62e996a76c43` / `ctx_80970244d703` (fresh dispatch; previous `ctx_f2fb7d4780d1` revoked).
**Model:** `kilo/minimax/minimax-m3.1-flash:free`.
**Date:** 2026-10-21. **Workspace:** `/home/opc/orca/goodhabittracking`.
**Includes:** an independent review of the P01 contracts that landed mid-review (§7) with a **REWORK**
verdict and 12 cited defect items (§7.3).

**Read:** `.omx/plans/daily-thinking-games-365/plan.md`, `test-spec.md`, `phases/P01–P04`, `handoffs/`,
`plans/261021-daily-thinking-games/execution/*`, `docs/research/2026-10-17-daily-thinking-games-365.csv`,
and — after they landed mid-review — `plans/261021-daily-thinking-games/contracts.md` (649 lines),
`decisions.md` (47), `plan.md` (209), `prd.md` (145), `test-spec.md` (126) and
`execution/contracts-handoff.md` (61), which were reviewed independently against the platform source
(§7).
**Written (this file only):** `plans/261021-daily-thinking-games/execution/kilo-backend-test-review.md`.
**Not modified:** any implementation, test, contract, migration, or plan file. No dependency added, nothing
committed, pushed, or deployed. No credential or secret value is reproduced in this report.

---

## 0. Headline

The plan's backend gate (AC04: *"RLS/RPC kiểm tra bằng PostgreSQL thật"*) **cannot be satisfied by the
repository's current test infrastructure**, and four of the plan's own product decisions (server-decided
local day, `received_at` vs `reviewed_at`, undo that keeps an audit trail, game-only revoke) have **no
database representation today**. These are not implementation gaps in the games lane — they are missing
primitives in the *existing* platform that the games lane must be allowed to add, and they must be named in
the P01 contract or the games migration will have to invent them ad hoc.

Nine findings below, each with a `path:line` citation and a concrete test shape. Nothing here depends on
the un-ratified OpenCode contracts; the recommendations are structural and hold either way.

---

## 1. Measured catalog facts (reproduced locally, not inherited)

Command (read-only, from repo root):

```bash
python3 - <<'PY'
import csv
rows=list(csv.DictReader(open('docs/research/2026-10-17-daily-thinking-games-365.csv',encoding='utf-8')))
eq=sum(1 for r in rows if r['main_skill']==r['bonus_skill'])
diff=sum(1 for r in rows if r['main_skill']!=r['bonus_skill'])
print(len(rows), eq, diff)
PY
```

| Fact | Value |
| --- | --- |
| CSV rows | 365 |
| `main_skill == bonus_skill` (equal count) | **0** |
| `main_skill != bonus_skill` (different count) | **365** |
| `main_type_id == bonus_type_id` | 0 |
| distinct `main_type_id` | **24** |
| distinct `type_id + rule_variant` pairs (main ∪ bonus) | **96** (48 main + 48 bonus) |
| distinct `main_type_id + rule_variant` | 96 |
| unique slot ids (`main_id` ∪ `bonus_id`) | 730 |
| `main_game == bonus_game` | 0 |
| `main_status` / `bonus_status` | all `design_only` |
| `main_target_seconds` / `bonus_target_seconds` | all `60–120` |

**Interpretation required by the brief:** *24 typeIDs vs 96 variant pairs is a **different-count** pair of
measurements, not an equal pair.* "24 vs 96" is **not** an equality violation; it is the type-level /
variant-level decomposition. The equality check that matters for AC08 is skill-level and it is **clean:
equal = 0, different = 365** — every day pairs two different thinking skills. The previously retracted
Cline claim (recorded in `plans/261021-daily-thinking-games/execution/execution-status.json:157-160`) is
independently confirmed **as a retraction**: the CSV is correct and must not be edited.

**Residual content risk (not a test-shape problem, a catalog problem):** every row is `design_only`. No row
is playable, so the 730-slot catalog is a syllabus. A validator that only checks `main_skill != bonus_skill`
will pass on a file with zero playable payloads. The catalog test must therefore assert on
`status`/`payload` **and** on the skill relation, as two independent assertions.

---

## 2. Current platform reality map (what the games lane will actually build on)

### 2.1 Command surface

| Concern | Location | Note |
| --- | --- | --- |
| Parent command Zod union | `src/lib/domain/commands.ts:7-40` | 7 command types; `MAX_BATCH_REVIEW = 50` at `:5` |
| Child command Zod union | `src/lib/domain/commands.ts:44-57` | 3 types; **no `childId` field** — identity is server-derived |
| Parent route | `src/app/api/domain/commands/route.ts:64-97` | cross-site reject `:65`; `getParentContext` `:68`; PIN gate list `:81`; `callParentRpc` for PIN commands `:88-90` |
| Child route | `src/app/api/child/commands/route.ts:44-92` | cross-site reject `:45`; cookie → `sha256Hex` `:57,:66`; **no `childId` accepted from the browser** |
| Response status mapping | `src/lib/api/command-error-status.ts:7-9` | DB error → 409, missing error → **503** (client must not mint a new command id) |
| Client envelope parse | `src/lib/store/domain-command-client.ts:14-43` | closed status enum; unknown status ⇒ **invalid response** |
| Child session route | `src/app/api/child/session/route.ts:9-77` | `get_child_session` `:18`, `touch_child_session` `:32`, `get_child_family_pause_state` `:37`, `revoke_child_session` `:69` |

**Game commands must be added to three separate unions** (`domainCommandSchema`, `childDomainCommandSchema`,
and the two routes' `rpcFor` switches) or they will be rejected at the schema boundary before any RPC runs.
A game command that the *child* issues must not carry `childId` — the repo's existing rule is that child
identity comes from the session row, never from the browser.

### 2.2 SQL command layer (latest definitions)

| Function | Latest definition | Auth | Lock order | Delete? |
| --- | --- | --- | --- | --- |
| `complete_habit_command` | `supabase/migrations/202610090030_family_operations_hardening.sql:209-269` | `current_family_id()` + `can_manage_family()` | logs → `child_profiles` | — |
| `complete_child_habit_command` | `…202610090030…:271-355` | `device_sessions` token hash (`:289-296`) | `device_sessions` → `child_profiles` | — |
| `undo_habit_command` | `…202610090030…:359-397` | `current_family_id()` + `can_manage_family()` | logs → `child_profiles` | **hard `delete` at `:393`** |
| `undo_child_habit_command` | `…202610090030…:399-455` | session token hash | `device_sessions` → logs → `child_profiles` | **hard `delete` at `:450`** |
| `review_habit_command` | `…202610090030…:457-493` | `current_family_id()` + `can_manage_family()` | logs → `child_profiles` | — |
| `review_habits_command(uuid[], text)` | `supabase/migrations/202610040001_review_habits_batch.sql:8-51` | same | logs (`:30-32`) → profiles (`:33-36`), both `order by id` | — |
| `revoke_child_session(text)` | `supabase/migrations/202609190002_secure_pairing.sql:370-406` | token hash only | `device_sessions` | — (sets `revoked_at` `:388-390`, writes `device_audit_log` `:392-402`) |
| `revoke_device_session(uuid)` | `supabase/migrations/202609190002_secure_pairing.sql:102-140` | `can_manage_family` | `device_sessions` | — (closed to all roles at `202610050002_close_pin_gated_originals.sql:11`) |
| `act_as_user(uuid)` | `supabase/migrations/202610050001_pin_gated_server_wrappers.sql:14` | service-role only (`:171`) | — | — |

**PIN boundary (important, asymmetric today):**
`review_habit_command` / `review_habits_command` are **revoked from all roles** at
`supabase/migrations/202610050002_close_pin_gated_originals.sql:7-8` and are reachable only via the
service-role wrappers `review_habit_command_as` (`202610050001…:33-43`) and `review_habits_command_as`
(`…:45-55`), which call `act_as_user` then the original.
`undo_habit_command` / `undo_child_habit_command` were **never added to that close list** — they are still
directly executable by `authenticated` / `anon` respectively. So the single most destructive path in the
platform (a hard delete that erases the audit row) has the *weakest* authorization of the three. Any game
feature that introduces a revoke must not copy that asymmetry.

### 2.3 RLS, tenancy, child sessions

* RLS enable + **force**: `supabase/migrations/202609190001_family_tenancy.sql:363-376`.
* Policies are generated in a `DO` loop for a table list including `child_profiles` and `activity_logs`
  (`:400-425`): `<table>_select_family` (`is_family_member`), `<table>_insert_family` /
  `<table>_update_family` / `<table>_delete_family` (`can_manage_family`).
* `current_family_id()` — `202609190001_family_tenancy.sql:101-113`; `is_family_member()` — `:115-127`;
  `can_manage_family()` — `:129-142`.
* `public.current_child_id()` **does not exist** anywhere in the repo. Child identity is always resolved
  from `device_sessions.child_id` inside the SECURITY DEFINER functions.
* Child session table is `public.device_sessions` — `202609190001_family_tenancy.sql:277-286`:
  `family_id`, `child_id`, `token_hash` (unique), `capabilities text[]` (default `['child:read','child:complete']`),
  `expires_at`, `revoked_at`; later added `device_label`, `last_seen_at` (`202609190002_secure_pairing.sql:24-25`).
* `activity_logs` is a **legacy table not created by any repo migration**; only `family_id` was added
  (`202609190001_family_tenancy.sql:165`). Browser writes were revoked at
  `202609190004_authoritative_domain.sql:3`.

### 2.4 Pause and timezone — the two places the plan's decisions cannot land today

**Pause** lives in `public.family_engagement_settings` (`202609230001_experience_foundation.sql:13-18`:
`paused_at`, `pause_reason`, `updated_at`; `pause_periods jsonb` added at
`202609240004_family_pause_history.sql:3-4`). Read helpers: `get_child_family_pause(text)` at
`202609240003_child_family_pause.sql:3-19` and `get_child_family_pause_state(text)` at
`202609240004_family_pause_history.sql:63-82`.
**No command function reads pause.** A paused family can still complete, undo, review and redeem. Pause is
enforced **only in the UI** (`src/app/api/child/session/route.ts:37,49`; `src/lib/habit-fire.ts:18-40`
`isFamilyPausedOn`; `src/lib/habit-programs/opportunities.ts:99,124`; `src/lib/habit-programs/rhythm.ts:26`).

**Timezone** is not stored at all. The comment is explicit, in the SQL:

```
-- supabase/migrations/202610090030_family_operations_hardening.sql:309
-- No family/device timezone is stored. A local day may be the UTC date minus one
-- anywhere in UTC-12..+14; reject only dates earlier than that earliest local day.
```

`target_log_date` is **client-supplied** and only range-checked against server `current_date`:
`…202610090030…:298` child / `:229` parent (`not between current_date - 2 and current_date + 1`).
`src/lib/domain/local-date.ts:1-10` has a correct IANA helper `getLocalDateKey(date, timeZone)`, but it is
referenced **only by `tests/unit/domain-rules.test.ts:4,10,11`** — no production code path uses it.
`src/lib/local-day.ts:2-7` `localDayKey()` is the *device* calendar day, explicitly documented as
"Days a family sees must never come from the UTC date", and it is what the client sends.

### 2.5 Timestamps

`activity_logs` columns in use: `id, family_id, user_id, activity_id, child_id, log_date, status,
points_awarded, completed_at, proof_note` (`src/lib/supabase/mappers.ts:132-143`; status enum
`src/types/index.ts:25`).
**There is no `received_at` and no `reviewed_at` column anywhere in the repository** (repo-wide search:
zero hits in SQL, TS, migrations, preflight). `complete_child_habit_command` inserts
`(id, family_id, user_id, activity_id, child_id, log_date, status, points_awarded)` and **never writes
`completed_at`** (`…202610090030…:332-337`); `review_habit_command` only flips `status` and `points_awarded`
(`…:478`, `…:484`). `undo_*` deletes the row outright.

### 2.6 Demo / cloud split

`isDemoSession` is the switch (`src/app/page.tsx:87-93`; `src/lib/store.tsx:314-318` sets
`sessionStorage['kidhabit_demo_session']`). Two parallel implementations of the *same* semantics exist:

| Operation | Cloud | Demo/local |
| --- | --- | --- |
| complete/undo | `src/lib/store/habit-actions.ts:183-293` (RPC + reconcile + `commandId` reuse) | `src/lib/store/habit-actions.ts:295-331` → `toggleLocalHabit` |
| single review | `habit-actions.ts:145-163` → `requestDomainCommand({type:'reviewHabit'})` | `habit-actions.ts:333-350` → `approvePendingLog` |
| batch review | `habit-actions.ts:389-411` → `requestDomainCommand({type:'reviewHabits'})` | `habit-actions.ts:354-373` (per-id loop) |

The demo path never talks to a server, so **any game rule enforced only in SQL is unenforced in demo**.
The local demo store is `localStorage` under the `kidhabit_` prefix with a family-scoped key list
(`src/lib/store/local-family-persistence.ts:20-45`); cloud is Supabase via
`src/lib/store/cloud-family-sync.ts`.

---

## 3. Findings (severity-ranked) with evidence

### F-B1 — HIGH — There is no local real-PostgreSQL RLS harness; the "integration" tests are static text assertions

`tests/integration/migrations/review-habits-batch.test.ts`, `…/child-task-deferrals.test.ts` and
`…/family-tenancy.test.ts` **do not connect to any database.** They `readFileSync` the migration SQL and
assert on substrings (e.g. `review-habits-batch.test.ts:6-7` read, `:11-12` `parse(...)` via
`@libpg-query/parser`). They prove *textual* presence of a function, never its *behaviour*.
The real DB harnesses are `.mjs` files that **vitest never collects** (`vitest.config.mts:17`
`include: ['tests/**/*.test.ts']`), and they are driven only by `npm run test:sql`
(`package.json:40`):
`scripts/verify-local-billing.mjs`, `scripts/verify-local-affiliate.mjs`,
`tests/integration/migrations/family-operations-runtime.mjs`.
Consequence: **AC04 as written ("RLS/RPC kiểm tra bằng PostgreSQL thật") is not currently satisfiable, and
any report that says "integration tests pass" for the games feature is MOCK-ONLY unless it names a
`.mjs`-style DB harness.**

### F-B2 — HIGH — The family-ops harness hardcodes `current_family_id()`, so cross-family isolation is locally unprovable

`tests/integration/migrations/family-operations-runtime.mjs:39-43` creates:

```js
create schema auth; create schema extensions;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql as $$ select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),'<user>')::uuid $$;
create function public.current_family_id() returns uuid language sql as $$ select '<family>'::uuid $$;
create function public.can_manage_family(uuid) returns boolean language sql as $$ select $1 = '<family>'::uuid $$;
```

A literal-constant `current_family_id()` means **RLS cannot discriminate two tenants**: the only
cross-family check in that harness is a *command-level* one (`family-operations-runtime.mjs:145-154`,
"other-family profile excluded"), which is a different property.
Real cross-family RLS is proven **only against live production**
(`scripts/verify-live-family-boundaries.mjs:51-55`, two synthetic accounts `rls-a-*` / `rls-b-*`).
There is **no** `create policy` / `enable row level security` anywhere under `tests/` or `scripts/`
(repo-wide search, zero hits), and **no** `auth.role()` / `request.jwt.claims` (JSON) simulation — only
`request.jwt.claim.sub` (singular) via `set_config`
(`tests/integration/migrations/pro-plus-and-addons.scenarios.sql:105-111`, `:428-446`).

**This is the single biggest QA risk for the games feature: a mock RLS proof is explicitly out of scope for
this task, and the repo has no local substitute.**

### F-B3 — HIGH — No `received_at` / `reviewed_at`; the plan's "server received_at vs reviewed_at" split has no column

Plan decision #7 (`plan.md:41`) and T06/T07 (`test-spec.md:15-16`) require timeliness to be decided by a
**server** timestamp and approval to be recorded separately. Today there is no column for either
(§2.5). The closest server-side fact is `activity_logs.completed_at`, which the authoritative insert path
**does not set** (`…202610090030…:332-337`) — and whose value the client also writes locally
(`src/lib/store/habit-actions.ts:254-255` sets `completedAt: new Date().toISOString()`), i.e. it is
**device time, not server time**. A games table that reuses `completed_at` as "received" would inherit a
client-clock value and re-open exactly the backdating hole the plan closes (`plan.md:43`).
**Requirement: the games ledger must own `received_at timestamptz not null default now()` and a separate
`reviewed_at timestamptz`, both written only by the database.**

### F-B4 — HIGH — Undo is a hard `DELETE` with no audit trail, and it is the only irreversible path that is *not* PIN-gated

`undo_habit_command` → `delete from public.activity_logs where id = log_row.id;`
(`…202610090030…:393`), and `undo_child_habit_command` → same at `:450`. No tombstone, no `undone_at`, no
`undone_by`, no audit row. `review_habit_command` only flips `status` (`:478`, `:484`).
Plan decision #8 (`plan.md:42`) demands: *"Sau khi đã start/finish: giữ audit, không xóa lịch sử hoặc phạt
trẻ"* — keep the audit, do not delete history.
Today, "undo a habit" **deletes the history** and, because it is not in
`202610050002_close_pin_gated_originals.sql:7-15`, it is directly callable by `authenticated` (parent) and
`anon` (child session) without the parent PIN that the *review* path demands.
**Requirement: game undo must be a status transition on a game-ledger row with an explicit `undone_at`
column, not a `DELETE`; and it must sit behind the same PIN boundary as review if the games surface allows
parent-initiated undo.**

### F-B5 — HIGH — A "game-only revoke" has no primitive; the only revoke revokes the whole device session

Plan decision #8 requires a revoke that "khóa quyền chưa dùng" (locks unused entitlement) and, after
start/finish, must "giữ audit" and "chặn cấp tiếp" — i.e. **revoke the game entitlement, not the child's
device**. The repo's only two revoke primitives both act on `device_sessions`:
`revoke_child_session(text)` (`202609190002_secure_pairing.sql:370-406`, callable by **anon**, token-hash
only, no PIN) and `revoke_device_session(uuid)` (`:102-140`, PIN-gated via wrapper
`202610050001_pin_gated_server_wrappers.sql:87-97`).
There is **no** per-feature / per-entitlement revoke anywhere.
**Requirement: the games lane needs a `revoked_at` / `revoked_reason` on the game entitlement row and a
game-scoped revoke function; it must not reuse `revoke_child_session`, which would log the child out of the
entire app.**

### F-B6 — MEDIUM-HIGH — "Two admission slots per local day" collides with the existing one-row-per-day PK precedent

The nearest existing day-scoped table is `public.secret_quests`
(`202609230001_experience_foundation.sql:32-46`) with **`primary key (child_id, local_date)`** — exactly one
row per child per local day. `public.daily_mascot_letters` uses the same shape
(`202609230001_experience_foundation.sql:20-28`), and `public.child_task_deferrals` uses
`primary key (child_id, activity_id, local_date)` (`202609250001_child_task_deferrals.sql:3-11`).
A games ledger with **two** slots per day therefore **cannot** copy the `secret_quests` PK; it needs
`primary key (child_id, local_date, slot)` with `slot in ('main','bonus')` (or a unique index on
`(child_id, local_date, slot)`), plus a `check` that a slot is never `NULL`.
The unique index is what makes AC01 ("20 concurrent start requests ⇒ one entitlement") a *database*
guarantee rather than an application race — see §4.1.

### F-B7 — MEDIUM-HIGH — No stored family timezone ⇒ the server cannot own "today"

`…202610090030…:309` says it in a comment; §2.4 confirms no `timezone` column in any migration and no
`timezone` field in `src/lib`. Plan decision #2 (`plan.md:36`) and decision #12 (`plan.md:46`) require the
server to decide the valid local day, and AC05/T09 require that changing client clock/date/timezone does
not change entitlement.
With `target_log_date` client-supplied and range-checked only against server `current_date`
(`…:298`), a child can post a game completion for a day that is not "today" in the family's zone.
**Requirement: the games feature must persist the family's IANA zone (e.g. on `parent_settings` or a new
`family_game_settings` row), and the server must derive `local_date` itself** — never accept it from the
browser. `getLocalDateKey` (`src/lib/domain/local-date.ts:1-10`) is the ready-made helper and is currently
only exercised by a unit test.

### F-B8 — MEDIUM — Pause gates no command, so a paused family can still be granted and spend game slots

§2.4. `family_engagement_settings.paused_at` is written by `set_family_pause_state`
(`202609240004_family_pause_history.sql:12-58`) and read by two helpers, but **no command function consults
it**. Plan decision #6 (`plan.md:40`) says a rest/pause day may still show content but issuance policy is
parent-controlled. If the games grant function does not read the pause state, "paused ⇒ no new main slot"
is a UI fiction.
**Requirement: the games grant path must read pause state server-side** and return an explicit
`paused` status — and the demo path must mirror it, or demo and cloud will disagree (§2.6).

### F-B9 — MEDIUM — "Common lock order" is an existing convention that the games lane must not break

The convention is visible and documented in the batch-review migration itself
(`202610040001_review_habits_batch.sql:4-7`): *"Locks are always taken logs first, then the children's
profiles, each in id order, which is the order a single review takes them too, so reviews running at the
same time cannot wait on each other in a circle."*
Implementation: logs `for update` at `:30-32` (with `order by id`), profiles `for update` at `:33-36`
(with `order by id`). The child path extends the order to
`device_sessions → activity_logs → child_profiles` (`…202610090030…:413-420`, `:373-378`).
`review_habits_command` also de-duplicates and sorts ids before locking
(`:26-27` `array_agg(id order by id)`), and caps the batch at 50 (`:28`, matching
`MAX_BATCH_REVIEW = 50` at `src/lib/domain/commands.ts:5`).
**Requirement: any new game RPC that touches more than one row must take locks in the same global order and
must sort ids before locking.** A game function that locks a game row *then* an `activity_logs` row while
another path locks `activity_logs` then a game row is a deadlock; this is testable, not hypothetical — see
§4.7.

### F-B10 — MEDIUM — The demo path can never prove a server rule

§2.6. `isDemoSession` selects an entirely separate implementation of complete/undo/review/batch-review
(`src/lib/store/habit-actions.ts:183-331` cloud vs `:295-331`/`:333-430` local). The demo path never calls
a server, so the two-slot admission cap, the cutoff, the `received_at` rule and the revoke rule are
**structurally untestable in demo**.
**Requirement: every games rule must have a cloud-side authoritative implementation, and the demo path must
be labelled `MOCK-ONLY` in the evidence contract (`test-spec.md:69`) rather than counted as a pass.**

---

## 4. Integration requirements and meaningful test shapes (the eight requested areas)

Each area states (a) the **integration requirement** the implementation must satisfy, (b) the **test
shape** that proves it, and (c) where the test must live so the verdict is not MOCK-ONLY.

### 4.1 Game admission — two slots per local day (AC01, T01, T02)

**Requirement.**
A single games-entitlement table, e.g. `public.child_game_slots`, with
`family_id, child_id, local_date date, slot text check (slot in ('main','bonus')), game_day_index int,
content_version text, attempt_id uuid, state text, received_at timestamptz, started_at timestamptz,
finished_at timestamptz, reviewed_at timestamptz, revoked_at timestamptz, revoked_reason text`,
`primary key (child_id, local_date, slot)` (F-B6), plus
`unique (child_id, local_date, slot)`-equivalent and a `command_id uuid` unique index for idempotency
(mirroring `activity_logs` `on conflict (activity_id, child_id, log_date) do nothing` at
`…202610090030…:337`).
The grant must be **one transaction** that: derives `local_date` server-side from the stored family zone
(F-B7), checks the parent play window (cutoff) server-side, checks pause (F-B8), inserts the main slot
unconditionally (main does not depend on task completion — plan decision #1, `plan.md:35`), and inserts
the bonus slot **only if** the task snapshot + `received_at` + approval conditions hold (plan decision #5,
`plan.md:39`).

**Test shape.**
1. *Unit/contract* — the grant function's decision table is a pure function of
   `(local_date, cutoff_local, tasks_snapshot, approval_state, received_at, now)`. Extract it and test all
   12 cells of the matrix {main slot, bonus slot} × {tasks done before cutoff, not done, deferred,
   approved late, approved next day, no tasks that day, paused day, empty day}.
2. *Real SQL* — 20 concurrent `start` calls on one connection pool (see §5) produce **exactly one** row per
   `(child_id, local_date, slot)`; the other 19 observe either the existing row or a `duplicate` status.
   Assert on the row count, not on the number of 200-OK responses.
3. *Real SQL* — the same `command_id` replayed 20× yields one row and one attempt; the response of a
   *later* replay must not overwrite a *newer* state (out-of-order response test, T03).
4. *Cross-tab* — two browser contexts on the same family see the same slot; a second tab's "start" is a
   resume of the same `attempt_id`, not a second attempt (T16, real shared context, not two isolated mocks).

**Verdict rule.** Only a real-PostgreSQL test may claim AC01. A Zod unit test of the request schema is
MOCK-ONLY for this AC.

### 4.2 Snapshot task cutoff (AC03, T05, T06, T10)

**Requirement.**
"Đủ nhiệm vụ bắt buộc trong snapshot lịch có hiệu lực khi mở ngày" (`plan.md:39`) means the bonus
eligibility must be computed against an **immutable snapshot of the day's task list as of the moment the
day opened**, not against the live `habit_activities` rows at review time.
Concretely: the grant/review path must read from a snapshot (a `child_game_task_snapshots` row written when
the day opened, or a materialized copy) and must not re-derive eligibility from
`public.habit_activities` at review time. A parent who adds or removes a task mid-day must not silently
change that day's promise (`plan.md:39`; T10 `test-spec.md:18`).
A deferral is **not** a completion — `child_task_deferrals` rows must not count toward the snapshot
(`test-spec.md:14` T05; deferral table at `202609250001_child_task_deferrals.sql:3-11`).

**Test shape.**
*Real SQL, deterministic clock.* In the test fixture, write the snapshot with a fixed `local_date` and a
fixed task set; then, **inside the same test**, mutate the live `habit_activities` (delete one required
task, add one new one, defer one). Assert the bonus verdict is **unchanged** by the mutation and that it
still matches the snapshot. Then mutate the *snapshot's* `effective_at` and assert the verdict changes.
This is the only way to prove "snapshot, not live read" — asserting on a static fixture proves nothing.

### 4.3 Timestamps: `received_at` vs `reviewed_at` (AC03, T06, T07)

**Requirement.**
Three distinct server timestamps, all written by the database, never by the client:
* `received_at` — when the server accepted the completion (authority for "was it in time?");
* `reviewed_at` — when the parent approved/rejected (authority for "when did the family see it?");
* `started_at` / `finished_at` — the game attempt envelope.
Timeliness must be decided by `received_at` vs the cutoff, **never** by `reviewed_at` and **never** by a
client clock (plan decision #7 `plan.md:41`; decision #9 `plan.md:43`).

**Test shape.**
*Real SQL.* Three cases in one fixture, all with the same `local_date`:
(a) received before cutoff, reviewed after cutoff *same day* ⇒ **bonus unlocks** (T06) and timeliness is
judged on `received_at`;
(b) received before cutoff, reviewed on the *next* local day ⇒ **no backdated extra slot**, and the review
must be refused or recorded against the original day without granting a third day (T07);
(c) `received_at` supplied by a client field ⇒ **rejected** — the grant function must ignore any
client-supplied timestamp (a test that posts a `receivedAt` two hours in the past and asserts the stored
value is `>= now()` at insert time is the actual proof).
Also assert: review *after* the play window closes must not mint a new slot, and no "catch-up bonus" path
exists (plan decision #7, second sentence).

### 4.4 Undo — the `DELETE` question (AC01, T08, T26)

**Requirement.**
Game undo must be a **state transition**, not a `DELETE`. The row must remain, with `state='undone'`,
`undone_at`, and the attempt's `started_at`/`finished_at`/`received_at` intact, so the journey counter
cannot be re-advanced and the audit survives (F-B4). If the games implementation reuses
`undo_habit_command` as a template, it inherits a hard delete at
`…202610090030…:393` / `:450` and an un-PIN-gated grant.

**Test shape.**
*Real SQL.* Undo a finished game, then assert:
1. the row still exists (count unchanged) — this single assertion is what distinguishes the required design
   from today's `DELETE`;
2. `undone_at is not null` and `received_at` is unchanged;
3. the journey/day index did **not** decrement (query the index column directly — a UI assertion would be
   MOCK-ONLY);
4. a second undo of the same row is a no-op, not an error and not a second decrement;
5. an undo of a row already in a terminal `revoked` state returns the documented refusal code.
*Command-envelope test.* The response status must be added to the closed enum in
`src/lib/store/domain-command-client.ts:16-34`; assert the enum rejects an unknown status, and that a
`503` (DB reply lost, `src/lib/api/command-error-status.ts:7-9`) is treated as *unknown outcome*, so the
client reconciles instead of re-issuing a new `commandId`.

### 4.5 Single review **and** batch review (AC03, T08, T31)

**Requirement.**
Both shapes must exist and must share one implementation, exactly as
`review_habit_command` (`…202610090030…:457-493`) and `review_habits_command`
(`202610040001_review_habits_batch.sql:8-51`) do: the batch function delegates each log to the single
function (`:44`) so stars/level/streak are credited exactly once, and the batch function's own contract
adds (i) de-dup + `order by id` (`:26-27`), (ii) a hard cap of 50 (`:28`, matching
`MAX_BATCH_REVIEW` at `src/lib/domain/commands.ts:5`), and (iii) a **per-log result array** so the UI can
report per-ID outcomes rather than an aggregate (`:42`, `:45`; consumed at
`src/lib/store/habit-actions.ts:391-406` → `acknowledgedIds` / `unresolvedIds`).
Game review must follow the same pattern; the review of a *game* result is what unlocks the bonus slot, so a
partial batch result must leave per-slot state consistent.

**Test shape.**
*Real SQL.*
1. Single review of a pending game log → bonus slot transitions to `unlocked`, `reviewed_at` set.
2. Batch of 50 → all 50 processed, `results` array length 50.
3. Batch of 51 → `too_many_logs` raised, **no** row changed (assert the table is untouched, not just the
   error).
4. Batch containing a mix of `pending_approval`, already-reviewed and unknown IDs → per-ID statuses
   `approved` / `already_reviewed` / `not_found`; the unknown ID must not abort the batch.
5. **Concurrency**: two batch reviews over **overlapping** id sets, run on two real connections, must not
   deadlock and must not double-credit points. This is the test that proves the "logs then profiles, each
   `order by id`" lock order (F-B9) is real, and it needs a real DB — a mock cannot deadlock.
6. Single review and batch review of the *same* log, concurrently → the second observes
   `already_reviewed`; points credited exactly once. Assert on `child_profiles.points` / `total_earned`
   deltas, not on the return value.

### 4.6 Revoke — game-only (AC03, T08, T14)

**Requirement.**
Revoke must be scoped to the game entitlement and must not end the child's device session
(F-B5). It must (a) be refused after the slot is used/started in a way that preserves the audit, (b) block
further issuance, and (c) leave the attempt and its timestamps readable.
Because the platform's own precedent is that the *review* path is PIN-gated and the *undo* path is not
(`202610050002_close_pin_gated_originals.sql:7-8` vs. the absence of undo from that list), the games revoke
must make an explicit, documented choice — and the preflight verify file must assert it (see §6).

**Test shape.**
*Real SQL.*
1. Revoke an unused game slot → `revoked_at` set, slot no longer startable, **no** `device_sessions` row
   changed (assert `device_sessions.revoked_at is null` for the child — this is what proves "game-only").
2. Revoke a started/finished slot → the row and its attempt survive; issuance is blocked; a documented
   refusal code is returned.
3. Revoke from family B against family A's slot → refused and no information leaked (see §4.8).
4. Revoke via the parent route **without** parent unlock → refused *before* any DB call, exactly as
   `reviewHabit`/`reviewHabits` are refused at `src/app/api/domain/commands/route.ts:81-85`.
5. After a revoke, the child's day index must not advance and a new slot must not be issued for that day.

### 4.7 Common lock order (AC01, T08)

**Requirement.**
Every multi-row games function must lock in the **same global order** the platform already uses:
`device_sessions → activity_logs → child_profiles` (child path,
`…202610090030…:413-420`, `:373-378`) or `activity_logs → child_profiles` (parent path), always
`order by id` within a table, with ids de-duplicated and sorted before locking
(`202610040001_review_habits_batch.sql:26-36`).
A games function that locks the game-slot row first and then `child_profiles` is safe **only if** every
other function also takes game slots before profiles. The convention must be stated once, in the contract,
and asserted by a preflight verify file (the repo's existing mechanism —
`supabase/preflight/202610040001_review_habits_batch.verify.sql` asserts `prosecdef`,
`search_path=""`, and the exact privilege set).

**Test shape.**
*Real SQL, two connections.* The `waitForLock` helper already exists in the repo —
`scripts/verify-local-billing.mjs:12-21` polls `pg_stat_activity.wait_event_type = 'Lock'` and a second
connection comes from `db.connect()` (`scripts/sql-test-database.mjs:41-45`). Reuse it verbatim.
1. Transaction A: grant a game slot (locks game rows). Transaction B (second connection): review a habit
   (locks logs then profiles). Assert B **blocks** on a lock, then completes after A commits — i.e. no
   deadlock, no "lock order inversion" error (40P01).
2. The inverse order (A holds profiles, B wants game rows) — assert the same blocking-and-settling
   behaviour, not a deadlock.
3. N-way (10 connections) soak of mixed grant/review/undo — assert zero `40P01` and zero `40001` in
   `pg_stat_activity` / server logs during the run.
4. A static assertion in the games contract test that every new games function's body contains
   `order by id` in each `for update` clause — cheap, and it catches the common regression (a new function
   written without the sort).

### 4.8 Actual family isolation (AC04, T13, T14)

**Requirement.**
The games surface must be family-scoped in the database, with the same two mechanisms the platform uses:
RLS policies (`is_family_member` for read, `can_manage_family` for write —
`202609190001_family_tenancy.sql:400-425`) and, for child traffic, `SECURITY DEFINER` functions that
resolve the family from the session row (`device_sessions.family_id`) rather than from a parameter
(`…202610090030…:422-427`).
**Critically: an `authenticated` parent's RPC must never accept a `child_id` or `family_id` that is not
resolved from `current_family_id()`** — the same rule the existing commands follow
(`…:366-371`).

**Test shape — and this is the part that must not be mocked.**
Today the local harness **cannot** do this (F-B2): `current_family_id()` is a literal
(`family-operations-runtime.mjs:42`). The minimum honest local proof requires a fixture that:
1. creates two real families (`families` + `family_memberships`), two parents, two children;
2. installs a **real** `current_family_id()` reading `request.jwt.claim.sub` (not a literal);
3. `enable row level security` + `force row level security` on the games tables and creates the four
   `<table>_*_family` policies;
4. sets `set local role authenticated` and `set_config('request.jwt.claim.sub', …, true)` to switch the
   acting parent — the pattern already proven in
   `tests/integration/migrations/pro-plus-and-addons.scenarios.sql:105-111` and
   `…/affiliate-account-privacy-freeze.scenarios.sql:11,83-84`;
5. asserts, as parent A: `select count(*) from public.child_game_slots` returns **only family A's rows**;
   as parent B: only family B's rows; and an `insert`/`update` of a family-B row by parent A raises a
   policy violation;
6. asserts the child path: a session token hash for family A's child cannot read/start/finish a slot owned
   by family B's child (the token check at `…202610090030…:413-420` scoped by
   `family_id = child_session.family_id and child_id = child_session.child_id` at `:422-427`);
7. asserts a revoked/expired session returns `session_invalid` (`:420`) and a cross-site request is rejected
   at the route (`src/app/api/child/commands/route.ts:45-47`).
**Until such a fixture exists, any "family isolation: PASS" claim for the games feature is MOCK-ONLY and
must be recorded as such per the evidence contract (`test-spec.md:69`).** The live fallback
(`scripts/verify-live-family-boundaries.mjs`) proves the *platform's* isolation but not the *games'*.

---

## 5. Local real-PostgreSQL runner: prerequisites and exact invocation

### 5.1 What the repo already gives you

| Asset | Location | Use |
| --- | --- | --- |
| Disposable-database factory | `scripts/sql-test-database.mjs:12-51` | creates a per-test DB, drops it with `with (force)` (`:46-49`); second connection via `connect()` (`:41-45`) |
| Loopback-only guard | `scripts/sql-test-database.mjs:26` | refuses non-loopback hosts |
| Role bootstrap | `scripts/sql-test-database.mjs:31` | creates `anon`, `authenticated`, `service_role` if absent (cluster-wide) |
| Embedded-Postgres bootstrap | `scripts/sql-test-database.mjs:16-23` | `EMBEDDED_POSTGRES_MODULE_PATH`, port 55439, temp dir |
| Lock-wait helper | `scripts/verify-local-billing.mjs:12-21` | `waitForLock` polling `pg_stat_activity.wait_event_type` |
| Migration manifest | `supabase/schema.sql` (72 × `\ir`) | psql-only; **never executed by any test** |
| Preflight verify pattern | `supabase/preflight/<ts>.<name>.verify.sql` | asserts `prosecdef`, `search_path=""`, privilege set via `pg_catalog` |
| Rollback pattern | `supabase/rollbacks/<ts>.<name>.rollback.sql` (16 files) | per-migration rollback |
| `pg` client | `package.json:69` — `"pg": "8.23.1"` (devDependencies) | installed |
| CI PostgreSQL | `.github/workflows/ci.yml:27-40` | `postgres:18.4` service; `SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:5432/postgres`; runs `npm run test:sql` at `:48` |

**Gaps that must be closed for a games DB harness (and that are *not* optional):**
1. **No shared "apply all migrations in filename order" helper.** `supabase/schema.sql` is `\ir`-based
   (psql only) and is never executed by tests. A games harness needs either a psql-driven apply, or a
   Node helper that reads `supabase/migrations/*.sql`, sorts, and executes each file in order
   (`family-operations-runtime.mjs:9` already does the read+sort, but only for *extracting* baseline
   definitions, not for applying).
2. **No `auth.role()` / `request.jwt.claims` (JSON) simulation** — only `request.jwt.claim.sub` (singular).
3. **No harness enables RLS or creates policies** (repo-wide search under `tests/` and `scripts/`: zero
   hits for `create policy` / `enable row level security`).
4. **`embedded-postgres` is not installed** in the repo (not in `node_modules`, not in `package-lock.json`,
   not in `package.json`); it is an optional out-of-repo package.
5. `tests/integration/migrations/family-operations-runtime.mjs:105` calls `createSqlTestDatabase()`
   **outside** its `try/catch` (`:104-109`), so a missing database URL is an unhandled rejection, not a
   clean skip. A games harness must **skip with an explicit `BLOCKED` verdict**, not crash.

### 5.2 Prerequisites (two supported routes)

**Route A — a local PostgreSQL server (recommended, matches CI):**

```bash
# prerequisite: a loopback PostgreSQL 18.4+ reachable as postgres/local-only
export SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:5432/postgres
```

**Route B — embedded PostgreSQL, installed outside the repo (no repo dependency added):**

```bash
npm install --prefix /tmp/kidhabit-sql-runtime --no-save embedded-postgres@18.4.0-beta.17
export EMBEDDED_POSTGRES_MODULE_PATH=/tmp/kidhabit-sql-runtime/node_modules/embedded-postgres/dist/index.js
```

Both routes are documented in `docs/deployment.md:236-249` and are the repo's established convention.
Note: `embedded-postgres` is **not** a repo dependency and must not be added to `package.json` under this
assignment.

### 5.3 Exact test invocation (games lane)

The new games SQL harness must follow the repo's existing convention: a `.mjs` file under
`tests/integration/migrations/` (not a `.test.ts`, so vitest does not double-collect it), wired into
`npm run test:sql` (`package.json:40`) or into a new `test:sql:games` script that the CI `sql` job also
runs. Proposed:

```bash
# 1) static contract tests (no DB needed) — run these first, they are fast
npx vitest run tests/integration/migrations/thinking-games-contract.test.ts
npx vitest run tests/integration/migrations/thinking-games-catalog.test.ts

# 2) the real-PostgreSQL games harness (loopback only)
SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:5432/postgres \
  node tests/integration/migrations/thinking-games-runtime.mjs

# 3) the whole SQL gate, as CI runs it
SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:5432/postgres npm run test:sql

# 4) embedded variant when no server is present
EMBEDDED_POSTGRES_MODULE_PATH=/tmp/kidhabit-sql-runtime/node_modules/embedded-postgres/dist/index.js \
  npm run test:sql
```

The harness must print, per case, the evidence-contract fields required by `test-spec.md:69`:
**verdict (PASS / FAIL / MOCK-ONLY / NOT-RUN / BLOCKED), command, exit code, timestamp,
environment/DB version, commit/catalog/schema versions, report path** — and must distinguish
`mock` from `real-db` explicitly. A case that cannot reach a database must report `BLOCKED`, never `PASS`.

**Isolation rule:** do not run the games harness concurrently with any other task that writes
`.next`, a manifest, database fixtures, or a port/browser context (`test-spec.md:63`).

---

## 6. Proposed test file plan (owner: Kilo; none written under this read-only assignment)

| File | Layer | Verdict class | Covers |
| --- | --- | --- | --- |
| `tests/integration/migrations/thinking-games-contract.test.ts` | static SQL text (parser) | real (contract only) | `security definer` + `search_path=""`, exact `revoke`/`grant` set, `order by id` in every `for update`, the presence of `act_as_user` wrappers, presence of `received_at`/`reviewed_at`/`revoked_at` columns, that **no** games function contains `delete from` (F-B4) |
| `tests/integration/migrations/thinking-games-catalog.test.ts` | pure unit | real | 365 rows; `main_skill != bonus_skill` for all 365 (equal = 0, different = 365); 24 distinct `type_id`; 96 distinct `type_id+rule_variant`; 730 unique slot ids; every row has a **playable** status and payload (fails today — all `design_only`); pilot-fixture exemption must be explicit and must not apply to the full-year file (§1) |
| `tests/integration/migrations/thinking-games-runtime.mjs` | **real PostgreSQL** | real | §4.1–§4.8: admission cap, snapshot, timestamps, undo-not-delete, single + batch review, game-only revoke, lock order, family isolation |
| `tests/api/thinking-games.test.ts` | API (vitest) | mock-RPC | route wiring only: schema rejection, PIN gate, cross-site rejection, `409` vs `503` mapping, `session_invalid` → cookie delete (`src/app/api/child/commands/route.ts:82-89`) |
| `tests/unit/thinking-games/*.test.ts` | unit | real | grant decision table, cutoff/timezone math via `getLocalDateKey`, content-version/fingerprint checks, i18n surface scan |
| `tests/e2e/thinking-games.spec.ts` | Playwright | real browser | start → resume → finish → bonus, midnight rollover, two-tab shared state, offline-then-reconcile |

**Precedence rule to state in the report:** the API unit tests are **MOCK-ONLY for AC01/AC03/AC04**. The
*only* admissible evidence for those ACs is `thinking-games-runtime.mjs` against a real PostgreSQL.

**Per-migration artifacts the games migration must also ship (repo convention, `CONTRIBUTING.md:19`):**
a line in `supabase/schema.sql`; the migration name in
`tests/integration/migrations/family-tenancy.test.ts`'s manifest; a
`supabase/preflight/<ts>_<name>.verify.sql`; a `supabase/rollbacks/<ts>_<name>.rollback.sql`; and a
contract test. The preflight must assert, at minimum: definer + empty `search_path`; `authenticated`
cannot execute the PIN-gated games functions; the games tables have RLS enabled **and forced**; and the
four `<table>_*_family` policies exist.

---

## 7. Concurrent lane state + independent review of the P01 contracts

**Timeline of this audit.** At 09:10Z the P01 contracts did not exist. They landed at 09:15Z
(`plans/261021-daily-thinking-games/execution/contracts-handoff.md`, mtime 16:15 local) while this review
was in progress, so they **were** reviewed — independently, against the platform source, not against the
handoff's own claims. §7.1 records the outcome.

### 7.1 Contract artefacts reviewed

| File | Lines | Status claimed |
| --- | --- | --- |
| `plans/261021-daily-thinking-games/contracts.md` | 649 | "READY FOR INDEPENDENT REVIEW. Not accepted. Not implemented." |
| `plans/261021-daily-thinking-games/decisions.md` | 47 | D01–D24 LOCKED, D25–D26 PENDING, D27 PROPOSED, D28–D29 DEFERRED, D30 LOCKED (none) |
| `plans/261021-daily-thinking-games/execution/contracts-handoff.md` | 61 | version `p01-2026-10-21`, base SHA `9db0c946c9a23d2069d71ba7878bd3079af149ff` |
| `plans/261021-daily-thinking-games/plan.md` / `prd.md` / `test-spec.md` | 209 / 145 / 126 | T01–T45, GWT-01…38 |

Still true at review time: **no `src/lib/thinking-games/**` and no versioned contract module exist**; no
implementation, migration or test was written by any lane. Gate **B3 `P01-contracts-acceptance`** is still
`blocked` in `plans/261021-daily-thinking-games/execution/execution-status.json`.

### 7.2 What the contracts get RIGHT (this closes 6 of my 10 findings)

| My finding | Contract response | Verdict |
| --- | --- | --- |
| F-B3 no `received_at`/`reviewed_at` | `contracts.md:172-174` — `received_at` is the server commit time, `reviewed_at` is added by P04 to `activity_logs` and set by the review RPCs; timeliness never uses `reviewed_at` | **Accepted in direction** — but see R1 |
| F-B5 no game-only revoke | `contracts.md:127-142` (state machine `revoked_unused` / `revoked_after_use`), `:184-186` (separate ledgers), GWT-17/18/20 `:523-541` | **Accepted** — closes the gap |
| F-B6 two-slot key collides with the existing one-row-per-day PK | `contracts.md:125` — unique key `(child_id, local_day, slot_type)` | **Accepted** — matches my proposal exactly |
| F-B7 no stored timezone | `contracts.md:65-76` — `thinking_game_settings.timezone`, no guessed default, `timezone_required`/`timezone_invalid`, DST via IANA, `expectedLocalDay` as an optimistic token (`:72`) | **Accepted** — but see R2 |
| F-B8 pause gates nothing | `contracts.md:191` — "A paused family or paused day does not grant bonus" | **Accepted** — but see R10 (main slot unstated) |
| F-B9 lock order | `contracts.md:215-237` — advisory lock first, then `device_sessions → habit_activities → activity_logs → child_profiles → settings → snapshot → entitlement → attempt`; `:231-234` names the current inversions and forbids enabling bonus on a function that cannot follow the order | **Accepted** — stricter than the repo's current order, and honest about the gap |

The contract also correctly refuses the two cheap answers the plan invited: it keeps the game ledger
**separate** from `activity_logs` (D11, `decisions.md:18`) so a game revoke cannot rewrite habit points,
and it makes the pilot manifest a **separate file with an explicit spacing exception that the production
validator must reject** (D19/D20, `decisions.md:26-27`; GWT-25/26 `contracts.md:565-573`) — which is the
right answer to the AGY finding that a 14-slot pilot cannot satisfy 7-day spacing.

### 7.3 REWORK items — contract defects that will produce wrong code if implemented as written

**R1 — HIGH — `received_at` is defined by an assertion the repository does not support.**
`contracts.md:172` states `received_at` "is the existing server-set `activity_logs.completed_at`; clients
never supply it." The authoritative insert path does **not** set that column:
`complete_child_habit_command` inserts only `(id, family_id, user_id, activity_id, child_id, log_date,
status, points_awarded)` (`supabase/migrations/202610090030_family_operations_hardening.sql:332-337`;
the parent path is the same shape at `:247-252`). `activity_logs` is a **legacy table that no repo
migration creates** — only `family_id` was added (`supabase/migrations/202609190001_family_tenancy.sql:165`)
— so whether `completed_at` carries a `default now()` is **not verifiable in this repository**. The
demo/local path *does* write a device clock (`src/lib/store/habit-actions.ts:254-255`,
`completedAt: new Date().toISOString()`), and the mapper types the column as non-nullable
(`src/lib/supabase/mappers.ts:141`, `completed_at: z.string()`), so a missing default would break mapping
*and* silently accept a client value.
**Fix:** the contract must not assert the fact. It must require P04 to *make* it true —
`alter table public.activity_logs alter column completed_at set default now()` plus `set not null`, both
insert paths writing it explicitly — and add a preflight assertion that `completed_at is not null` and
equals the commit instant. Until then "server-set" is an assumption, not a contract, and GWT-10/GWT-12
(`contracts.md:488-501`) rest on it.

**R2 — HIGH — `getLocalDateKey` is a TypeScript helper; the contract needs an explicit SQL rule.**
`contracts.md:69-70` says the server computes `local_day = getLocalDateKey(now(), timezone)` "using the
existing `src/lib/domain/local-date.ts` semantics". That file is a client-side `Intl.DateTimeFormat`
helper (`src/lib/domain/local-date.ts:1-10`) used **only** by a unit test
(`tests/unit/domain-rules.test.ts:4,10,11`). If the day is computed in TS, the day decision moves to the
app layer and contradicts `contracts.md:71` ("Client date, device clock, browser timezone and
`Date.now()` are never authority"), and — worse — the snapshot uniqueness key
(`(child_id, local_day)`) and the two-slot key live in SQL, so an app-computed day cannot be enforced
by the database at all.
**Fix:** state the PL/pgSQL implementation explicitly — `(now() at time zone tz)::date` — and note that
`now()` is the transaction start instant (deterministic, therefore correct) versus `clock_timestamp()`;
add that an invalid zone raises, so `timezone_invalid` (`contracts.md:414`) must map that error rather than
fall through to `internal` (`:433`); and require the TS helper to be used for display parity only.

**R3 — HIGH — The advisory lock scope is unspecified, and it changes the deadlock analysis.**
`contracts.md:219` puts `pg_advisory_xact_lock(thinking_game_lock_key(child_id))` first for "all habit and
game mutations that can touch bonus", and `:231-233` requires `review_habit_command`,
`undo_habit_command` and both `complete_*` to be rewritten. If that lock is taken **unconditionally**,
every habit completion in **every** family — including families that never enabled games — now serialises
on a per-child advisory lock on the hottest write path in the product. If it is taken **conditionally**,
the lock is not held by a transaction that decided not to take it, and two transactions touching the same
child through different code paths can still invert. The contract's "ascending `child_id` order" (`:219`)
mitigates the batch case but does not answer this.
**Fix:** state explicitly whether the advisory lock is unconditional or games-only; if unconditional, add a
performance budget check (AC13 `plan.md:147`) to §16; if conditional, specify the single place that
decides, and require that the decision and the lock be taken in the same statement scope so no path can
skip it.

**R4 — MEDIUM-HIGH — The habit-log hard DELETE and the undo/review PIN asymmetry are silently retained.**
`contracts.md:205-206` keeps "After the log delete" in the habit-undo integration, and `:183` accepts the
current reversibility rule. Today the undo RPCs **physically delete** the row
(`supabase/migrations/202610090030_family_operations_hardening.sql:393` and `:450`) with no tombstone and
no audit row. The game side is handled correctly (`:184-186`, GWT-17/18/20), but the *habit* history —
"this task was completed and then undone" — is erased, and it is erased precisely in the table the bonus
condition is computed from (`:162-166`). Separately, `undo_habit_command` /
`undo_child_habit_command` are the only irreversible paths that are **not** PIN-gated: the review
functions are revoked from all roles at
`supabase/migrations/202610050002_close_pin_gated_originals.sql:7-8` and are reachable only through
service-role wrappers (`supabase/migrations/202610050001_pin_gated_server_wrappers.sql:33-55`), while the
undo functions are absent from that close list and remain executable by `authenticated` / `anon`.
**Fix:** the contract must state whether the habit-log tombstone is in scope. If out of scope, record it
as an **accepted residual** with the entitlement revocation (`:184-185`) named as the compensating
control, and say so in the handoff rather than leaving it as an omission. If in scope, `undo_*` becomes a
status transition. Either way it is a decision a reviewer must accept explicitly, not a silence. The same
paragraph should state the intended PIN boundary for game revoke/undo.

**R5 — MEDIUM — The contract contradicts itself about what the bonus sync may read.**
`contracts.md:211` says the helper "only reads/writes game tables", but `:162-166` requires it to evaluate
"every mandatory task in the snapshot" against `activity_logs` status and receipt time. As written, a P04
implementer following `:211` literally would build a helper that cannot satisfy `:162-166`.
**Fix:** change `:211` to "reads habit rows and writes only game tables".

**R6 — MEDIUM — The four HTTP-200 bonus codes will be rejected by the repo's closed response envelope.**
`contracts.md:420-423` defines `bonus_locked`, `bonus_not_eligible`, `bonus_pending_approval` and
`bonus_quiet_hours` as **HTTP 200 with a code in the body**. The client parses server results against a
**closed** Zod enum: `domainCommandResultSchema` at
`src/lib/store/domain-command-client.ts:16-34` admits a fixed `status` list and
`results[].status ∈ {approved, rejected, already_reviewed, not_found}`. A `bonus_locked` body fails
`domainCommandResponseSchema.safeParse` and raises *"The server returned an invalid command response."*
(`src/lib/store/domain-command-client.ts:88-90`) — a 200 that the client treats as a hard failure.
**Fix:** the contract must state the envelope: either a **new** `thinkingGameResultSchema` for the new
`/api/child/thinking-games/*` routes (preferred — it leaves the habit envelope closed), or an explicit
extension of the existing enum with a version bump and a migration of every consumer. As written, an
implementer who reuses `requestDomainCommand` will ship a client that rejects every bonus-locked response.
This is a high-probability, high-impact defect.

**R7 — MEDIUM — The pause rule for the `main` slot is not stated.**
`contracts.md:191` says a paused family or paused day "does not grant **bonus**". The `main` eligibility
list at `contracts.md:146` contains *feature enabled, timezone valid, age track resolved, approved content
exists, outside bedtime blackout* — **pause is not in it**. So under the contract as written a paused
family still receives a `main` entitlement every day. The plan decision this derives from is ambiguous
(`.omx/plans/daily-thinking-games-365/plan.md:40`: a paused day may still show content, but issuance is
parent-controlled), so this must be decided, not inherited.
**Fix:** add pause to the `main` eligibility list, or state explicitly that `main` continues during a pause
and that only `bonus` is withheld. Either answer is defensible; the contract must carry one.

**R8 — MEDIUM — Which index a `main` start consumes is not stated.**
`contracts.md:82` says the index "advances only on a successful `main` start for a local day later than
`lastMainStartedLocalDay`", `:84` says a child returning after a break "continues from `nextDayIndex`",
and `:107` says the bonus uses `nextDayIndex` at grant time. None of these says **which** index value a
given `main` start consumes when the cursor is behind (e.g. the child never plays on day N, then plays on
day N+1 — is that index N or N+1?). Left open, the same puzzle content can be served on two different
local days, or a day can be silently skipped.
**Fix:** state it — a `main` start consumes the current `nextDayIndex` and then increments it, and
`nextDayIndex` is the count of main starts, not a calendar mapping.

**R9 — LOW-MEDIUM — §16 does not gate on the real-DB harness, so GWT-15/16/31 could be "passed" with mocks.**
`contracts.md:235` already requires "The P04 SQL concurrency suite must prove no deadlock and one
entitlement under 20 concurrent starts/reviews/undos", and `:647` says SQL evidence is "NOT RUN". But the
repository has no such harness today: the `tests/integration/migrations/*.test.ts` files are **static SQL
text assertions** (no database), the real DB harnesses are `.mjs` files vitest never collects
(`vitest.config.mts:17`), and `tests/integration/migrations/family-operations-runtime.mjs:42` hardcodes
`current_family_id()` so two tenants cannot be distinguished. See F-B1/F-B2 and §4.8.
**Fix:** add to §16 a gate on a **real-PostgreSQL** harness that satisfies the five-point minimum in
§4.8, and state that GWT-15/GWT-16/GWT-31 are MOCK-ONLY without it.

**R10 — LOW-MEDIUM — The four flags are not assigned to a registry, and one of them lands on a shared, locked file.**
`contracts.md:340-345` defines `dailyThinkingGames`, `thinkingGamesPilot`, `thinkingGamesBonus`,
`thinkingGamesServePilotContent`. The repo's client flag registry is
`src/lib/experience-flags.ts:4-20` (`defaultExperienceFlags` + a Zod-validated
`experienceFlagOverridesSchema`), driven by `NEXT_PUBLIC_*` env vars; the server pattern is
`src/lib/server-features.ts`. `contracts.md:349` mixes the two ("Absence of a flag, a malformed flag or a
missing DB setting is off"). `src/lib/experience-flags.ts` is on the plan's shared-file lock list
(`.omx/plans/daily-thinking-games-365/plan.md:61`), so this needs an explicit owner and lock order, and
the master flag needs a clear home because the *card must not render* when it is off.
**Fix:** name the registry per flag and the file owner; keep the master flag on the client registry (so
the card cannot render) and the bonus/serve-pilot flags server-side.

**R11 — LOW — Two small inconsistencies in the error table.**
`contracts.md:426` (`attempt_not_found` → "Return day state") and `:431` (`family_mismatch` → 404) return
different 404 bodies; a client that branches on the body could learn that an id exists in another family,
which `:395` and `:435` forbid. Also there is no code for "the journey is complete" (§5.1:85, index > 365)
and no rate-limit design behind `rate_limited` (`:432`).
**Fix:** fold `attempt_not_found` and `family_mismatch` into one indistinguishable response; add a
`journey_complete` code; specify the rate-limit rule or drop the code.

**R12 — LOW — The contract does not say where the child game routes live.**
`contracts.md:364-368` names `GET/POST /api/child/thinking-games/state|start|finish|pause|excuse` and
`:374-377` names `/api/parent/thinking-games/*`. The repo's child route family is
`/api/child/*` (`src/app/api/child/commands`, `/session`, `/task-deferrals`, `/journal`, `/mascot`,
`/wishlist`, `/focus`, `/habit-programs`, `/city`) and the parent surface is `/api/domain/*`
(`src/app/api/domain/commands`, `/activities`, `/rewards`, `/journal`, `/profiles`, `/social`,
`/experience`). A new `/api/parent/*` family is a new convention.
**Fix:** confirm the route prefixes against the existing convention, or state that the new prefixes are
deliberate.

### 7.4 Verdict on the contracts

**REWORK** — not a rejection. The contract is materially better than the plan it derives from: it fixes
the two-slot key, the separate game ledger, the game-only revoke, the fail-closed timezone, the pause rule
for bonus, and a stricter lock order than the platform currently uses, and it honestly reports
`P01 independent review: PENDING` and `SQL/concurrency/browser/pilot evidence: NOT RUN`
(`contracts.md:637-649`).
But **R1 (received_at), R2 (server day in SQL), R3 (advisory-lock scope) and R6 (response envelope) are
defects that would produce wrong code if implemented literally**, and **R4, R7 and R8 leave product
behaviour undecided** where the plan and the contract together are ambiguous. R1, R2 and R6 are the three
I would block on: each one silently changes what the server actually guarantees.

This review does not accept the contracts, does not modify them, and does not implement against them.
Per `contracts-handoff.md:54-59` the receipt is the reviewer's to return; this is the reviewer's finding
set, and the decision to accept or rework belongs to the coordinator.

### 7.5 Still pending (not in the contract, and not invented by this review)

* the concrete Zod puzzle schema and `CatalogValidationOptions` — the contract specifies the *shape*
  (`contracts.md:264-298` `content-schema-v1`) but no TS module exists, so the harness fixture loader in
  §6 must be written against the schema when it lands;
* the real-DB harness and the migration — §8.2 requires P04 to change six existing RPCs' lock order, which
  needs a migration, a preflight, a rollback and the §5.2 prerequisites;
* the `received_at` / `reviewed_at` column set and the `thinking_game_*` table DDL — this report proposes
  rather than ratifies them (§4.1);
* human pilot and content semantic/age approval — D25/D26, explicitly PENDING and not substitutable.

---

## 8. Evidence appendix — commands run and what they returned

All read-only. No file outside this report was created or modified.

| # | Command (from repo root) | Result |
| --- | --- | --- |
| 1 | `python3` CSV check on `docs/research/2026-10-17-daily-thinking-games-365.csv` | 365 rows; skill equal **0**, different **365**; 24 `type_id`; 96 `type_id+rule_variant`; 730 slot ids; all `design_only` |
| 2 | `git log --oneline -15` / `git status --short` | HEAD `9db0c94`; working tree has only untracked `plans/261019-2200-marketing-20-10/`, `plans/261021-daily-thinking-games/`, `plans/261017-2130-ui-audit-remediation/execution/ai-*.md` — none authored by this task |
| 3 | `ls supabase/migrations` (72 files) | no games migration exists |
| 4 | repo-wide search `thinking-game*` | only research + plan artifacts (§7) |
| 5 | repo-wide search `reviewed_at` / `received_at` | **zero hits** in SQL, TS, migrations, preflight |
| 6 | repo-wide search `timezone` in `supabase/migrations` + `src/lib` | only `timezone('utc'::text, now())` defaults and the `…202610090030…:309` comment |
| 7 | repo-wide search `create policy` / `enable row level security` under `tests/`, `scripts/` | **zero hits** |
| 8 | repo-wide search `current_child_id` | **zero hits** |
| 9 | `ls node_modules/embedded-postgres` | absent; `pg@8.23.1` present (`package.json:69`) |
| 10 | `find src tests supabase -newermt "2026-10-21 09:00"` | no new implementation/contract files from the live lanes at the time of writing |
| 11 | re-read `plans/261021-daily-thinking-games/execution/execution-status.json` (`updatedAt` 09:08:00Z) | 4 lanes live; `plan-contracts` + `copilot-backend` reportReceived=false; B3 still `blocked` (§7) |
| 12 | `orca-ide orchestration send --help` | confirms the `--to run:<id> --type status --body --json` invocation used for the OMP delivery |
| 13 | `ls -la plans/261021-daily-thinking-games/execution/` (re-run ~09:16Z) | `contracts-handoff.md` appeared (mtime 16:15) — the contracts landed mid-review and were reviewed (§7) |
| 14 | `wc -l plans/261021-daily-thinking-games/*.md` | contracts 649, decisions 47, plan 209, prd 145, test-spec 126 |
| 15 | `read` of `contracts.md` §4–§8, §12–§16 and `decisions.md` | the 12 REWORK items in §7.3, each with a `contracts.md:line` + a source `path:line` citation |

**Not run (and why):** no test suite, no lint, no typecheck, no build, no migration apply. The assignment
is read-only, the games implementation does not exist, and running the platform's suites would produce
evidence about the *existing* platform rather than about the games feature. `npm run test:sql` was **not**
run because it needs a loopback PostgreSQL that this environment does not expose, and `docs/deployment.md:247`
documents the out-of-repo `embedded-postgres` install that this assignment forbids (no new dependencies).
Any statement in this report about the DB harnesses is therefore a **static reading of the harness source**,
not an execution result — and it is cited as such throughout. The same applies to the §7.3 contract review:
every R-item is a **source-level contradiction with a cited line**, not an executed test.

---

## 9. Summary for the coordinator

1. **Do not let the games lane claim AC04 from the existing integration tests** — they are static SQL-text
   assertions; the real DB harnesses are `.mjs` files vitest never collects, and the family-ops harness
   hardcodes `current_family_id()` so cross-family isolation is locally unprovable. A new real-PostgreSQL
   games harness is a prerequisite, not a nice-to-have.
2. **Four plan decisions have no database representation today**: server-decided local day (no timezone is
   stored anywhere), `received_at` vs `reviewed_at` (neither column exists; the insert path never writes
   `completed_at` and the client writes its own device clock), undo that keeps an audit trail (today's undo
   is a hard `DELETE`, and the only irreversible path is the one that is *not* PIN-gated), and a game-only
   revoke (the only revokes in the platform end the child's whole device session).
3. **The lock-order convention already exists and is documented in-repo** (logs → child_profiles, each
   `order by id`; child path adds `device_sessions` first) — the games functions must adopt it and the
   two-connection `waitForLock` helper in `scripts/verify-local-billing.mjs:12-21` makes the deadlock test
   cheap. Same for the shared batch-review contract (cap 50, de-dup + sort, per-ID result array).
4. **Catalog facts re-verified and clean**: main/bonus skill equal = **0**, different = **365**; 24 distinct
   typeIDs; 96 distinct typeID+rule-variant pairs; 730 unique slot ids. The "24 vs 96" comparison is a
   *different-count* pair, not an equality violation. The residual risk is that all 730 rows are
   `design_only`, so the catalog validator must assert payload/playability independently of the skill rule.
5. **The P01 contracts landed mid-review and were reviewed against the platform source: verdict REWORK.**
   `plans/261021-daily-thinking-games/contracts.md` (649 lines) + `decisions.md` (47) close **6 of my 10
   findings** in the right direction: the two-slot key `(child_id, local_day, slot_type)` (`contracts.md:125`),
   a separate game ledger with `revoked_unused`/`revoked_after_use` (`:127-142`, `:184-186`), fail-closed
   timezone with no guessed default (`:65-76`), a pause rule for bonus (`:191`), a stricter common lock order
   with an advisory lock first (`:215-237`), and `reviewed_at` added by P04 (`:173`).
   **12 REWORK items** are in §7.3. The three I would block on, because each silently changes what the
   server actually guarantees: **R1** — `contracts.md:172` defines `received_at` as "the existing server-set
   `activity_logs.completed_at`", but the authoritative insert path never writes that column
   (`202610090030…:332-337`) and the table is legacy with no repo migration, so the fact is unverifiable
   (and the demo path writes a *device* clock, `habit-actions.ts:254-255`); **R2** — `contracts.md:69-70`
   computes the local day with the **TypeScript** `getLocalDateKey`, which is used by nothing but a unit
   test, so the day decision would leave the database, contradicting `:71` and the SQL uniqueness keys;
   **R6** — `contracts.md:420-423` returns four **HTTP-200** bonus codes that the repo's **closed** response
   enum (`domain-command-client.ts:16-34`) would reject, so a client reusing `requestDomainCommand` breaks
   on every bonus-locked response. **R3** (advisory-lock scope: unconditional puts a per-child lock on the
   hottest write path for every family; conditional changes the deadlock analysis) must also be decided.
   R4 (habit-log hard DELETE + the undo-vs-review PIN asymmetry are silently retained), R7 (pause is not in
   the `main` eligibility list), R8 (which journey index a `main` start consumes) are undecided product
   behaviour, and R9–R12 are smaller. §7.5 lists what is still pending: the TS schema module, the real-DB
   harness, the table DDL, and human pilot/content approval (D25/D26).
