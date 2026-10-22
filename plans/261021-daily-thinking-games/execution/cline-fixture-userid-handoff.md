# Cline Fixture user_id Fix Handoff

## Summary
Fixed the missing `user_id` column in the `activity_logs` table within `scripts/thinking-games-sql-fixture.mjs`. The production schema includes `user_id uuid NULL DEFAULT auth.uid()`, but the test fixture lacked this column, causing `thinking-games-habit-integration-runtime.mjs` to fail with `column "user_id" of relation "activity_logs" does not exist` on both PG 18.4 and PG 17.

## Change Made
**File:** `scripts/thinking-games-sql-fixture.mjs` (line 320)

Added `user_id uuid default auth.uid()` to the `public.activity_logs` table definition in the `BASELINE_SCHEMA_SQL`. The `auth.uid()` function is defined in `AUTH_SCHEMA_SQL` which is included before the `activity_logs` table creation, so the default is valid.

```sql
create table if not exists public.activity_logs (
  id uuid primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid default auth.uid(),  -- ADDED
  child_id uuid not null,
  activity_id uuid not null,
  log_date date not null,
  status text not null,
  points_awarded integer not null default 0,
  completed_at timestamptz,
  proof_note text,
  unique (activity_id, child_id, log_date),
  constraint activity_logs_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint activity_logs_activity_family_fk foreign key (activity_id, family_id)
    references public.habit_activities(id, family_id) on delete cascade
);
```

## Consistency Check
- **Habit-parity runtime** (`thinking-games-habit-parity-runtime.mjs`): Previously added `user_id` via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS user_id uuid` (line 29). Now that the fixture includes the column with a default, the `ALTER TABLE` is a no-op and both remain consistent.
- **Family-operations runtime** (`family-operations-runtime.mjs`): Has its own independent fixture with `user_id uuid` (no default). This is a separate test harness and remains unaffected.

## Test Results

### PostgreSQL 18.4 (port 55432)
| Test Suite | Exit Code | Cases |
|------------|-----------|-------|
| thinking-games-habit-integration-runtime.mjs | 0 | 4 PASS |
| thinking-games-habit-parity-runtime.mjs | 0 | 12 PASS |
| thinking-games-runtime.mjs | 0 | 6 PASS |
| thinking-games-security-runtime.mjs | 0 | 5 PASS |
| thinking-games-gameplay-runtime.mjs | 0 | 3 PASS |
| thinking-games-day-gates-runtime.mjs | 0 | 8 PASS |
| thinking-games-catalog-runtime.mjs | 0 | 6 PASS |
| thinking-games-admission-security-runtime.mjs | 0 | 3 PASS |
| thinking-games-authority-fixes-runtime.mjs | 0 | 2 PASS |
| thinking-games-authority-races-runtime.mjs | 0 | 25 PASS |
| thinking-games-harness-smoke.mjs | 0 | 7 PASS |
| thinking-games-settings-runtime.mjs | 0 | 5 PASS |
| family-operations-runtime.mjs | 0 | 24 PASS (0 failures) |

### PostgreSQL 17.11 (port 55417, container claude-pg17-compat)
| Test Suite | Exit Code | Cases |
|------------|-----------|-------|
| thinking-games-habit-integration-runtime.mjs | 0 | 4 PASS |
| thinking-games-habit-parity-runtime.mjs | 0 | 12 PASS |
| thinking-games-runtime.mjs | 0 | 6 PASS |
| thinking-games-security-runtime.mjs | 0 | 5 PASS |
| thinking-games-gameplay-runtime.mjs | 0 | 3 PASS |
| thinking-games-day-gates-runtime.mjs | 0 | 8 PASS |
| thinking-games-catalog-runtime.mjs | 0 | 6 PASS |
| thinking-games-admission-security-runtime.mjs | 0 | 3 PASS |
| thinking-games-authority-fixes-runtime.mjs | 0 | 2 PASS |
| thinking-games-authority-races-runtime.mjs | 0 | 25 PASS |
| thinking-games-harness-smoke.mjs | 0 | 7 PASS |
| thinking-games-settings-runtime.mjs | 0 | 5 PASS |
| family-operations-runtime.mjs | 0 | 24 PASS (0 failures) |

All 13 test suites exit 0 on both PostgreSQL versions.

## Verification
- The fix aligns the fixture with production's `user_id uuid NULL DEFAULT auth.uid()` column.
- The `auth.uid()` function exists in the fixture before the table is created (via `AUTH_SCHEMA_SQL`).
- No migration changes were made; no tests were weakened.
- The habit-parity runtime's conditional `ALTER TABLE` remains compatible.
- All thinking-games integration tests and family-operations runtime tests pass on both PG 18.4 and PG 17.