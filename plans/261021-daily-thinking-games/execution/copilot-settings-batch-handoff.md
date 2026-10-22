# Copilot settings batch handoff

## Implemented checklist

1. **Five RPCs**
   - `thinking_game_preview_day(actor_user_id, target_child_id, target_local_day)`: parent-family authorization, frozen snapshot preview, effective/current settings versions.
   - `thinking_game_bonus_for_child(target_child_id, target_local_day)`: child advisory lock then shared bonus sync helper.
   - `thinking_game_child_settings(session_token_hash)`: paired child-session authorization and parent-only-field redaction.
   - `thinking_game_update_settings_as(actor_user_id, target_family_id, ...)`: parent-family authorization, immediate disable, next-local-day pending settings, timezone validation.
   - `thinking_game_excuse_task_as(actor_user_id, target_child_id, target_local_day, target_activity_id, reason, command_id)`: snapshot-only task removal plus game audit event; no habit status/points mutation.

2. **Routes**
   - Parent `GET/PUT /api/domain/thinking-games/settings`, `GET/POST /api/domain/thinking-games/preview`, `POST /api/domain/thinking-games/excuse`.
   - Child `GET /api/child/thinking-games/settings`.
   - Parent routes use real parent context, same-origin checks for writes, parent-unlock/PIN enforcement, and service-role `*_as` boundary; child route uses the paired-session cookie and server RPC.

3. **Client parser/wrappers**
   - Added `src/lib/store/thinking-games-client.ts` with strict v1 game-envelope parsing, typed state/start/pause/finish/settings/preview/excuse wrappers, and refused-vs-unknown network error classification.
   - Existing closed habit command schema remains untouched.

4. **Migration/preflight/rollback**
   - Added pending settings columns and lazy server application at local-day boundary.
   - Added forced-RLS preflight assertions for all seven game tables and required settings RPC existence.
   - Rollback removes settings RPCs/triggers/functions before game tables.

## Evidence

| Command | Result |
| --- | --- |
| `npm test -- --run tests/api/thinking-games-settings.test.ts` | PASS, 4 tests |
| `SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:55432/postgres node tests/integration/migrations/thinking-games-runtime.mjs` | PASS, real PostgreSQL receipt regression + feature-off/enabled + rollback |
| Same URL + `thinking-games-settings-runtime.mjs` | PASS, real PostgreSQL next-day settings, child redaction, preview, excuse audit, cross-family RLS |
| `npx eslint ...changed paths...` | PASS |
| `npm run typecheck` | PASS |
| `git diff --check` | PASS |

The runtime tests use the existing disposable fixture and its dynamic auth/RLS setup; the settings test adds only a test-local `act_as_user` bridge because the owned fixture intentionally omits the production PIN-wrapper migration. No production database was queried.

## Remaining broader P04 scope

This batch does not claim the whole P04 gate. Exact source-level integration of all six legacy habit RPCs and sorted batch lock/performance evidence, reviewed engine-backed grading/finish behavior, parent browser/API integration with live PIN cookie issuance, 20-way concurrency, and the broader two-family session/PIN race matrix remain outside this small batch or not yet run.
