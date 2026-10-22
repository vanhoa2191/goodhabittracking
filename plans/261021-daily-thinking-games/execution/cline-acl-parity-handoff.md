# ACL + Parity Fix Handoff — 202610210001_thinking_games.sql

**Migration SHA-256:** `b258f7c39ce4c53363a115dbaddeb4b25ab8e75720eb0fc64df48cad7036a289`

**Date:** 2026-10-22  
**Author:** Cline (sole writer of migration, preflight, rollback, fixture, integration tests)

---

## Summary

Two production regressions fixed in the thinking-games migration before it goes to production:

1. **ACL Regression (SECURITY)** — The migration's trailing `revoke/grant` block re-opened the PIN bypass for `review_habit_command`/`review_habits_command` and stripped `service_role` from the four habit RPCs that should retain it.

2. **Batch Approve Level Regression** — The `review_habits_command` batch loop updated `points` and `total_earned` but NOT `level`, diverging from production `review_habit_command` which computes `level = greatest(1, floor((total_earned+award)/100.0)::integer+1)`.

Both fixes verified on **PostgreSQL 18.4 (port 55432)** and **PostgreSQL 17.11 (port 55417)** — all integration suites exit 0.

---

## 1. ACL Regression Fix

### Production ACL Baseline (after 202610050002_close_pin_gated_originals.sql)

| Function | postgres (owner) | service_role | authenticated | anon |
|---|:---:|:---:|:---:|:---:|
| `review_habit_command(uuid,text)` | ✅ | ❌ | ❌ | ❌ |
| `review_habits_command(uuid[],text)` | ✅ | ❌ | ❌ | ❌ |
| `complete_habit_command(uuid,uuid,date,uuid)` | ✅ | ✅ | ✅ | ❌ |
| `undo_habit_command(uuid)` | ✅ | ✅ | ✅ | ❌ |
| `complete_child_habit_command(text,uuid,date,uuid)` | ✅ | ✅ | ✅ | ✅ |
| `undo_child_habit_command(text,uuid)` | ✅ | ✅ | ✅ | ✅ |

**Access to `review_*` is via `review_habit_command_as`/`review_habits_command_as` (granted to `service_role` only).**

### Migration's Original Trailing Block (REGRESSION)

```sql
revoke all on function public.complete_habit_command(...), ... from public, anon, service_role;
grant execute on function public.complete_habit_command(...), public.undo_habit_command(...),
  public.review_habit_command(...), public.review_habits_command(...) to authenticated;
grant execute on function public.complete_child_habit_command(...), public.undo_child_habit_command(...) to anon, authenticated;
```

**Problems:**
- Re-granted `review_habit_command`/`review_habits_command` to `authenticated` → **PIN bypass re-opened**
- Revoked `service_role` from all six → **service_role lost access to complete_/undo_**

### Fix Applied

**Removed the entire revoke/grant block.** `CREATE OR REPLACE FUNCTION` preserves existing privileges, so production ACLs stay exactly as above.

**Rollback likewise omits any ACL changes** for these six functions.

### Fixture Establishes Production ACLs

`scripts/thinking-games-sql-fixture.mjs` now seeds the exact production ACLs before the migration runs:

```sql
-- review_*: ONLY postgres (owner) directly; _as wrappers for service_role
revoke all on function public.review_habit_command(uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.review_habits_command(uuid[], text) from public, anon, authenticated, service_role;
grant execute on function public.review_habit_command_as(uuid, uuid, text) to service_role;
grant execute on function public.review_habits_command_as(uuid, uuid[], text) to service_role;

-- complete_/undo_habit_command: postgres, authenticated, service_role
revoke all on function public.complete_habit_command(uuid,uuid,date,uuid) from public, anon;
revoke all on function public.undo_habit_command(uuid) from public, anon;
grant execute on function public.complete_habit_command(uuid,uuid,date,uuid) to authenticated, service_role;
grant execute on function public.undo_habit_command(uuid) to authenticated, service_role;

-- complete_/undo_child_habit_command: postgres, anon, authenticated, service_role
revoke all on function public.complete_child_habit_command(text,uuid,date,uuid) from public;
revoke all on function public.undo_child_habit_command(text,uuid) from public;
grant execute on function public.complete_child_habit_command(text,uuid,date,uuid) to anon, authenticated, service_role;
grant execute on function public.undo_child_habit_command(text,uuid) to anon, authenticated, service_role;
```

### Integration Assertion Added

`tests/integration/migrations/thinking-games-security-runtime.mjs` — new case `legacy-habit-rpc-acl-parity`:

```javascript
const acl = await fixture.query(`
  select
    has_function_privilege('authenticated','public.review_habit_command(uuid,text)','execute') as auth_review_habit,
    has_function_privilege('authenticated','public.review_habits_command(uuid[],text)','execute') as auth_review_habits,
    has_function_privilege('service_role','public.complete_habit_command(uuid,uuid,date,uuid)','execute') as svc_complete_habit,
    has_function_privilege('service_role','public.undo_habit_command(uuid)','execute') as svc_undo_habit,
    has_function_privilege('anon','public.complete_child_habit_command(text,uuid,date,uuid)','execute') as anon_complete_child,
    has_function_privilege('anon','public.undo_child_habit_command(text,uuid)','execute') as anon_undo_child
`);
if (acl.rows[0].auth_review_habit) throw new Error('authenticated must NOT execute review_habit_command directly (PIN bypass)');
if (acl.rows[0].auth_review_habits) throw new Error('authenticated must NOT execute review_habits_command directly (PIN bypass)');
if (!acl.rows[0].svc_complete_habit) throw new Error('service_role must execute complete_habit_command');
if (!acl.rows[0].svc_undo_habit) throw new Error('service_role must execute undo_habit_command');
if (!acl.rows[0].anon_complete_child) throw new Error('anon must execute complete_child_habit_command');
if (!acl.rows[0].anon_undo_child) throw new Error('anon must execute undo_child_habit_command');
```

### Tests Updated to Use `_as` Wrappers

| Test File | Change |
|---|---|
| `thinking-games-habit-parity-runtime.mjs` | `review_habit_command` → `review_habit_command_as`; `review_habits_command` → `review_habits_command_as`; called via `resetAuthContext()` (superuser) with `actor_user_id` |
| `thinking-games-habit-integration-runtime.mjs` | Same |
| `thinking-games-authority-races-runtime.mjs` | All `review_habit_command`/`review_habits_command` calls now use `_as` wrappers via `service_role` clients; mixed-race and batch-race logic updated |

---

## 2. Batch Approve Level Regression Fix

### Production Behavior (`review_habit_command`)

```sql
update public.child_profiles
set points = points + award,
    total_earned = total_earned + award,
    level = greatest(1, floor((total_earned + award) / 100.0)::integer + 1)
where id = l.child_id and family_id = fid;
```

### Migration's Original Batch Loop (REGRESSION)

```sql
-- Inside review_habits_command loop:
update public.activity_logs set status='approved', points_awarded=... where activity_logs.id=current_id;
update public.child_profiles set points=points+..., total_earned=total_earned+... where child_profiles.id=l.child_id;
-- ❌ level NOT updated
```

### Fix Applied

**Delegate per-log to `review_habit_command`** (same as production `202610040001_review_habits_batch.sql`):

```sql
foreach current_id in array ids loop
  select * into l from public.activity_logs where activity_logs.id=current_id and family_id=fid;
  if not found then results:=results||jsonb_build_array(jsonb_build_object('logId',current_id,'status','not_found'));
  elsif l.status <> 'pending_approval' then results:=results||jsonb_build_array(jsonb_build_object('logId',current_id,'status','already_reviewed'));
  else
    -- Delegate to review_habit_command for consistent level calculation and audit trail
    perform public.review_habit_command(current_id, decision);
    select status, points_awarded into l_status, l_points from public.activity_logs where id=current_id;
    results:=results||jsonb_build_array(jsonb_build_object('logId',current_id,'status',l_status,'pointsAwarded',l_points));
  end if;
end loop;
```

**Bonus sync still runs once per (child, day) after the loop** — no deadlock with AR races.

### Regression Test

`thinking-games-habit-parity-runtime.mjs` — batch approve a log worth enough points to cross 100 `total_earned` → level increments; result payload per log unchanged (`{logId,status,pointsAwarded}`).

---

## 3. Test Results — PostgreSQL 18.4 (port 55432)

| Suite | Exit | Cases |
|---|---:|---|
| `thinking-games-security-runtime.mjs` | 0 | 6 (incl. `legacy-habit-rpc-acl-parity`) |
| `thinking-games-habit-parity-runtime.mjs` | 0 | 12 |
| `thinking-games-habit-integration-runtime.mjs` | 0 | 4 |
| `thinking-games-authority-races-runtime.mjs` | 0 | 25/25 |
| `npm run test:sql` (full suite) | 0 | All billing, affiliate, family-ops, security |

## 4. Test Results — PostgreSQL 17.11 (port 55417)

| Suite | Exit | Cases |
|---|---:|---|
| `thinking-games-security-runtime.mjs` | 0 | 6 (incl. `legacy-habit-rpc-acl-parity`) |
| `thinking-games-habit-parity-runtime.mjs` | 0 | 12 |
| `thinking-games-habit-integration-runtime.mjs` | 0 | 4 |
| `thinking-games-authority-races-runtime.mjs` | 0 | 25/25 |
| `npm run test:sql` (full suite) | 0 | All billing, affiliate, family-ops, security |

## 5. Files Modified

| File | Change Type |
|---|---|
| `supabase/migrations/202610210001_thinking_games.sql` | Removed trailing revoke/grant block; fixed `review_habits_command` batch loop to delegate to `review_habit_command`; added `l_status`, `l_points` variables |
| `supabase/rollbacks/202610210001_thinking_games.rollback.sql` | Removed revoke/grant block; fixed `review_habits_command` to delegate to `review_habit_command` |
| `scripts/thinking-games-sql-fixture.mjs` | Added six legacy habit RPCs + `_as` wrappers + production ACLs (revokes + grants) |
| `tests/integration/migrations/thinking-games-security-runtime.mjs` | Added `legacy-habit-rpc-acl-parity` assertion |
| `tests/integration/migrations/thinking-games-habit-parity-runtime.mjs` | Updated review tests to use `_as` wrappers; added `resetAuthContext`/`applyAuthContext` sequencing |
| `tests/integration/migrations/thinking-games-habit-integration-runtime.mjs` | Updated review test to use `_as` wrapper |
| `tests/integration/migrations/thinking-games-authority-races-runtime.mjs` | Updated all review calls to use `_as` wrappers via `service_role`; fixed mixed-race and batch-race logic |

## 6. Verification Checklist

- [x] `review_habit_command`/`review_habits_command` NOT executable by `authenticated` (PIN bypass closed)
- [x] `review_habit_command_as`/`review_habits_command_as` executable by `service_role` only
- [x] `complete_habit_command`/`undo_habit_command` executable by `service_role`, `authenticated`
- [x] `complete_child_habit_command`/`undo_child_habit_command` executable by `service_role`, `authenticated`, `anon`
- [x] Batch approve updates `level` identically to single approve (crosses 100 `total_earned` → level increments)
- [x] Bonus sync runs once per (child, day) after batch loop
- [x] All integration suites exit 0 on PG 18.4 and PG 17
- [x] `npm run test:sql` passes on both PG versions
- [x] No git operations performed (another lane owns git)

## 7. Rollback Safety

The rollback file restores the six habit RPCs to their pre-thinking-games definitions (from `202610090030_family_operations_hardening.sql`) **without changing ACLs**. The `CREATE OR REPLACE` in rollback preserves the production ACLs established by `202610050002_close_pin_gated_originals.sql`.

---

**All checks pass. Migration ready for production.**
