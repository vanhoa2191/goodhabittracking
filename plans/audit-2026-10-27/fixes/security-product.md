# Security + product audit fixes

## SEC-AUTH-01 — PIN gate for reward management

- **Status:** Confirmed and fixed in source; migration not applied.
- `POST /api/domain/rewards` now checks `requireParentUnlock` before its create, update, or delete mutation. It uses the authenticated parent's family and user values, then performs the write through the server-only admin client after the PIN check.
- Added `202610120001_reward_pin_security.sql` to revoke `INSERT`, `UPDATE`, and `DELETE` from `authenticated` on `public.rewards`, with a rollback that restores those grants, and added the migration to `supabase/schema.sql`.
- **Tests:** API regression coverage for all three locked mutations; migration and rollback parse/grant assertions. Results: pending final rerun.
- **Remaining risk:** The migration must be applied and the role grants verified in a separately authorized database change. No DB was contacted.

## SEC-AUTH-02 — Parent lock confirmation

- **Status:** Confirmed and fixed in source.
- Lock now waits for the `DELETE /api/parent-pin` response and requires `response.ok` before switching to kid mode. Pending state blocks the parent dashboard controls; a failed response leaves parent mode active, displays a localized retry message, and lets the parent retry. The onboarding handoff waits for lock success before continuing.
- **Tests:** `parent-lock.test.ts` covers success, 403, 503, and network rejection; existing `parent-pin-unlock.test.ts` covers cookie clearing. Results: pending final rerun.
- **Remaining risk:** No browser handoff test was run. A lost response remains safe for handoff because the UI does not switch to kid mode.

## PROD-LOGIC-01 — Parent-role habits do not earn child progress

- **Status:** Confirmed and fixed in source; migration not applied.
- Local habit toggles now leave logs, points, streaks, and badges unchanged for parent-role habits. Cloud habit actions reject new parent-role completions locally while still allowing an old erroneous log to be undone.
- Added `202610120002_parent_role_activity_guard.sql` to make both authoritative parent and child completion RPCs return `parent_role_activity` before inserting a log or awarding points. Added a rollback restoring the previous function definitions and added the migration to `supabase/schema.sql`.
- **Tests:** Local transition and cloud action regression tests; migration and rollback parse/guard assertions. Results: pending final rerun.
- **Remaining risk:** Previously earned points or historical logs are not rewritten. The migration has not been applied or exercised against PostgreSQL.

## PROD-LOGIC-02 — Maintain phase regression window

- **Status:** Confirmed and fixed in source.
- Maintain now requires a full cadence-sized set of opportunities within the current phase before it can regress to fade, preventing earlier fade opportunities from influencing the first maintain evaluation.
- **Tests:** Added daily and weekly cadence cases covering pre-window hold and full-window regression. Results: pending final rerun.

## Verification summary

- Earlier targeted run: **90 tests passed** across 8 files before the final authoritative parent-role migration tests were added.
- Typecheck: **passed** before the final parent-role cloud guard and migration were added; rerun pending.
- ESLint: **passed** before the final parent-role cloud guard and migration were added; rerun pending.
- No migration, database, production, or provider operation was performed.

## Kết quả kiểm chứng cuối (coordinator)
Chạy toàn cây sau khi cả 4 lane sửa: tsc 0 lỗi, ESLint sạch, vitest 3418/3418 pass (đã bump `EXPECTED_SCHEMA_VERSION` trong src/lib/schema-version.ts lên 202610270001 theo migration mới nhất). Migration 202610120001/202610120002/202610270001 chỉ parse, chưa áp lên DB.
