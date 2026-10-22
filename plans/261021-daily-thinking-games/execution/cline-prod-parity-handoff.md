# Production Parity Fix for 202610210001_thinking_games.sql

**Migration SHA-256:** `b88c5b242ccbd0bc39e5ffeed0f6cd054e76c49ad009f4bdcc409157a82afa67`

**Tested on:** PostgreSQL 18.6 (port 55432) and PostgreSQL 17.11 (port 55418)
**All tests pass:** 25/25 authority races + all thinking-games-* + family-operations-runtime

---

## Per-Function Before/After Parity Table

### 1. `complete_habit_command`

| Aspect | Production (202610090030) | Migration (Before Fix) | Migration (After Fix) | Status |
|--------|---------------------------|------------------------|------------------------|--------|
| **INSERT columns** | `id, family_id, user_id, activity_id, child_id, log_date, status, points_awarded` | Missing `user_id` | `user_id = auth.uid()` added | ✅ RESTORED |
| **Advisory lock** | None | `pg_advisory_xact_lock(thinking_game_lock_key(child_id))` first | Kept (game lock before row locks) | ✅ NEW |
| **Bonus sync** | None | `sync_thinking_game_bonus_for_child(child_id, log_date)` | Kept | ✅ NEW |
| **Return payload** | `{status, logId, pointsAwarded}` | Same | Same | ✅ PARITY |
| **Error codes** | `family_membership_required`, `family_manage_required`, `log_date_out_of_range`, `activity_not_found`, `activity_child_mismatch`, `child_not_found`, `duplicate` | Same | Same | ✅ PARITY |

### 2. `complete_child_habit_command`

| Aspect | Production (202610090030) | Migration (Before Fix) | Migration (After Fix) | Status |
|--------|---------------------------|------------------------|------------------------|--------|
| **device_sessions lock** | `SELECT ... FOR UPDATE` | Missing `FOR UPDATE` | `FOR UPDATE` added | ✅ RESTORED |
| **INSERT user_id** | Explicit `NULL` | Missing column | `user_id = NULL` explicit | ✅ RESTORED |
| **Advisory lock** | None | `pg_advisory_xact_lock(thinking_game_lock_key(child_id))` first | Kept (game lock before row locks) | ✅ NEW |
| **Bonus sync** | None | `sync_thinking_game_bonus_for_child(child_id, log_date)` | Kept | ✅ NEW |
| **Return payload** | `{status, logId, pointsAwarded}` | Same | Same | ✅ PARITY |
| **Error codes** | `session_invalid`, `log_date_out_of_range`, `activity_not_found`, `activity_not_started`, `activity_not_scheduled`, `child_not_found`, `duplicate` | Same | Same | ✅ PARITY |

### 3. `undo_habit_command`

| Aspect | Production (202610090030) | Migration (Before Fix) | Migration (After Fix) | Status |
|--------|---------------------------|------------------------|------------------------|--------|
| **Lock order** | activity_logs FOR UPDATE → child_profiles FOR UPDATE | Advisory lock first → activity_logs FOR UPDATE → child_profiles FOR UPDATE | Same (game advisory lock before row locks) | ✅ CORRECT ORDER |
| **Bonus sync** | None | `sync_thinking_game_bonus_for_child(child_id, log_date)` | Kept | ✅ NEW |
| **Return payload** | `{status: 'undone'}` / `{status: 'not_found'}` / `{status: 'not_reversible'}` / `{status: 'points_already_spent'}` | Same | Same | ✅ PARITY |
| **Streak recompute** | `recompute_child_streak(child_id)` | Kept | Kept | ✅ PARITY |

### 4. `undo_child_habit_command`

| Aspect | Production (202610090030) | Migration (Before Fix) | Migration (After Fix) | Status |
|--------|---------------------------|------------------------|------------------------|--------|
| **device_sessions lock** | `SELECT ... FOR UPDATE` | Missing `FOR UPDATE` | `FOR UPDATE` added | ✅ RESTORED |
| **Lock order** | device_sessions FOR UPDATE → activity_logs FOR UPDATE → child_profiles FOR UPDATE | Advisory lock first → device_sessions FOR UPDATE → activity_logs FOR UPDATE → child_profiles FOR UPDATE | Same (game advisory lock before row locks) | ✅ CORRECT ORDER |
| **Bonus sync** | None | `sync_thinking_game_bonus_for_child(child_id, log_date)` | Kept | ✅ NEW |
| **Return payload** | `{status: 'undone'}` / `{status: 'not_found'}` / `{status: 'not_reversible'}` / `{status: 'points_already_spent'}` / `{status: 'session_invalid'}` | Same | Same | ✅ PARITY |
| **Streak recompute** | `recompute_child_streak(child_id)` | Kept | Kept | ✅ PARITY |

### 5. `review_habit_command`

| Aspect | Production (202610090030) | Migration (Before Fix) | Migration (After Fix) | Status |
|--------|---------------------------|------------------------|------------------------|--------|
| **Reject behavior** | Returns `{status: 'rejected'}` WITHOUT recomputing streak | Recomputed streak on reject | **Fixed**: No streak recompute on reject; only calls `sync_thinking_game_bonus_for_child` | ✅ RESTORED |
| **Approve behavior** | Awards points, updates child, recomputes streak | Same + bonus sync | Same + bonus sync | ✅ PARITY +
| **Lock order** | activity_logs FOR UPDATE → child_profiles FOR UPDATE | Advisory lock first → activity_logs FOR UPDATE → child_profiles FOR UPDATE | Same (game advisory lock before row locks) | ✅ CORRECT ORDER |
| **Return payload (approve)** | `{status: 'approved', pointsAwarded}` | Same | Same | ✅ PARITY |
| **Return payload (reject)** | `{status: 'rejected'}` (no pointsAwarded) | Had pointsAwarded | **Fixed**: No pointsAwarded on reject | ✅ RESTORED |

### 6. `review_habits_command`

| Aspect | Production (202610040001) | Migration (Before Fix) | Migration (After Fix) | Status |
|--------|---------------------------|------------------------|------------------------|--------|
| **Lock order** | activity_logs FOR UPDATE (by id) → child_profiles FOR UPDATE (by id) | Advisory locks on all children FIRST (sorted) → activity_logs FOR UPDATE → child_profiles FOR UPDATE | Same (game advisory locks before row locks) | ✅ CORRECT ORDER |
| **Streak recompute** | Via `review_habit_command` per log (only on approve) | Recomputed for ALL children unconditionally | **Fixed**: Only on `decision = 'approve'` | ✅ RESTORED |
| **Bonus sync** | None | After loop for all distinct (child_id, log_date) | Kept (after loop, per distinct child/day) | ✅ NEW |
| **Return payload** | `{status: 'reviewed', results: [{logId, status, pointsAwarded?}]}` | Same | Same | ✅ PARITY |
| **Batch atomicity** | Single transaction, all-or-nothing | Same | Same | ✅ PARITY |

---

## Lock Ordering Contract

All six functions now follow the **game advisory lock before row locks** ordering:

```
1. pg_advisory_xact_lock(thinking_game_lock_key(child_id))  -- FIRST
2. Row-level FOR UPDATE locks (activity_logs, device_sessions, child_profiles)
```

This prevents deadlocks between habit operations and thinking-game operations on the same child.

---

## Files Modified

1. `supabase/migrations/202610210001_thinking_games.sql` - Fixed 6 habit RPCs
2. `supabase/preflight/202610210001_thinking_games.verify.sql` - Added parity checks
3. `supabase/rollbacks/202610210001_thinking_games.rollback.sql` - Restores pre-migration RPCs
4. `tests/integration/migrations/thinking-games-habit-parity-runtime.mjs` - Added 8 regression cases
5. `tests/integration/migrations/thinking-games-authority-races-runtime.mjs` - Added user_id column to BRIDGE_SQL

---

## Test Results Summary

| Test File | PostgreSQL 18.6 | PostgreSQL 17.11 |
|-----------|-----------------|------------------|
| thinking-games-habit-parity-runtime.mjs | ✅ PASS | ✅ PASS |
| thinking-games-authority-races-runtime.mjs | ✅ 25/25 PASS | ✅ 25/25 PASS |
| family-operations-runtime.mjs | ✅ 25/25 PASS | ✅ 25/25 PASS |
| thinking-games-runtime.mjs | ✅ PASS | ✅ PASS |
| thinking-games-settings-runtime.mjs | ✅ PASS | ✅ PASS |
| thinking-games-security-runtime.mjs | ✅ PASS | ✅ PASS |
| thinking-games-day-gates-runtime.mjs | ✅ PASS | ✅ PASS |
| thinking-games-authority-fixes-runtime.mjs | ✅ PASS | ✅ PASS |
| thinking-games-catalog-runtime.mjs | ✅ PASS | ✅ PASS |
| thinking-games-admission-security-runtime.mjs | ✅ PASS | ✅ PASS |

---

## Regression Test Cases Added

1. **parent-completion-user_id** - Parent completion stores `user_id = auth.uid()`
2. **child-completion-user_id-null** - Child completion stores `user_id = NULL`
3. **duplicate-completion** - Duplicate returns `{status: 'duplicate'}`
4. **parent-undo-not_found** - Parent undo on already-undone returns `not_found`
5. **child-undo-not_found** - Child undo on already-undone returns `not_found`
6. **review-approve-payload** - Approve returns `{status: 'approved', pointsAwarded}`
7. **review-reject-payload** - Reject returns `{status: 'rejected'}` (no pointsAwarded)
8. **batch-review-shape** - Batch review returns `{status: 'reviewed', results: [...]}` with correct item shape

