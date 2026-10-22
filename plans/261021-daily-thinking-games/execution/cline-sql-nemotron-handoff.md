# Cline SQL Nemotron Handoff — 2026-10-21 Daily Thinking Games

## Summary
Implemented minimal fixes for two authoritative defects in `supabase/migrations/202610210001_thinking_games.sql`:

| Issue | Function | Fix |
|-------|----------|-----|
| **AR-07** | `sync_thinking_game_bonus_for_child` | Revoke logic now gates `revoked_after_use` vs `revoked_unused` on existence of ANY immutable attempt (`started`/`finished`/`abandoned_rollover`) for the entitlement, not stale entitlement state. |
| **AR-20** | `thinking_game_start` (idempotent/re-serve path) | Resolved `command_id` column/parameter ambiguity by qualifying all parameter references with `thinking_game_start.command_id` in UPDATE/INSERT statements (lines 516, 521, 524, 526). No public signature change. |

## Changes Made

### AR-07: `sync_thinking_game_bonus_for_child` (lines 171-178)
```sql
-- Before
set state = 'revoked_unused', updated_at = now()

-- After
set state = case when exists (
  select 1 from public.thinking_game_attempts
  where entitlement_id = existing_bonus.id
    and state in ('started','finished','abandoned_rollover')
) then 'revoked_after_use' else 'revoked_unused' end,
    updated_at = now()
```
Preserves eligibility/restore/no-extraslots/legacy-habit-points gates.

### AR-20: `thinking_game_start` (lines 516, 521, 524, 526)
```sql
-- Before (ambiguous command_id)
values(..., command_id)
update ... set command_id=command_id

-- After (explicit qualification)
values(..., thinking_game_start.command_id)
update ... set command_id=thinking_game_start.command_id
```
Affected statements: entitlement UPDATE (re-serve), entitlement INSERT (new grant), attempt INSERT, attempt UPDATE. Returns original pinned public_puzzle/content_id/version/age; no new attempt/slot/index/seed created.

## Test Execution
- **Command**: `SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH node tests/integration/migrations/thinking-games-authority-races-runtime.mjs`
- **Environment**: PostgreSQL 18.4, disposable per-run database, real migration, RLS forced, non-superuser role
- **Result**: 11/25 PASS, 14/25 FAIL
- **Blocker**: Test harness runs at UTC 00:42 → local 02:42 (Etc/GMT-2), inside bedtime window (21:00–07:00). All `thinking_game_start` calls raise `bedtime` before reaching test logic.
- **Unaffected passing cases**: AR-00, AR-10, AR-11, AR-13, AR-14, AR-15, AR-16, AR-17, AR-19, AR-23, AR-24 (do not call `thinking_game_start` or explicitly test bedtime).

## Verification Status
- **AR-07 fix**: Logic correct per contract §7.2 / GWT-18,20; cannot verify at runtime due to bedtime blocking AR-05 (bonus grant/start prerequisite).
- **AR-20 fix**: Syntax correct; ambiguity resolved per PL/pgSQL rules; cannot verify at runtime due to bedtime blocking AR-20 (age-track resolution test calls `thinking_game_start`).
- **Prior fixes preserved**: AR-06/AR-15 (typed expiry), AR-22 (non-blocking) remain intact.

## SQL SHA-256
- **Before (checkpoint)**: `a0c1145ab501a94414188b25c9827f99e8fae48c7f83bf24960e02f1bd84e499`
- **After**: `783fd5a62c027f4871109316ecbc9f2357ab4800bd7cec32320be7a85a475425`

## Files Modified
- `supabase/migrations/202610210001_thinking_games.sql` (two functions only)

## Remaining Work
- Runtime validation requires test execution outside bedtime window (e.g., CI schedule or manual time adjustment).
- No further SQL changes needed for AR-07/AR-20 per current scope.