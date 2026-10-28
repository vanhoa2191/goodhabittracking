# Habit parity regression handoff

## Scope and snapshot

The authoritative `202610210001_thinking_games.sql` definitions for all six habit command paths were read before editing. The pre-edit migration snapshot is `/tmp/goodhabit-habit-parity/202610210001_thinking_games.sql.before-parity` with SHA-256 `fb6af27a3f1d213509492006da2b521995a9eca739aff3feb8572bdb666202e`.

## Genuine regressions fixed

- `complete_child_habit_command` now preserves the authoritative activity-created-date guard (`activity_not_started`) before accepting a local day.
- `undo_child_habit_command` now preserves the authoritative `points_already_spent` refusal, recomputes the child streak after deletion, and retains game bonus synchronization.
- `review_habits_command` now avoids PL/pgSQL variable/column ambiguity that made the real batch path fail, acquires qualified rows deterministically, and preserves single-review response fields (`logId`, `status`, and `pointsAwarded`) in batch results.

No habit points, total-earned, level, approval, reject, idempotency, PIN/session, ACL, or audit behavior was otherwise replaced. Feature-off behavior remains in the same authoritative functions with only the narrow game lock/receipt synchronization additions.

## Real PostgreSQL evidence

All runs used disposable PostgreSQL 18.4 at `127.0.0.1:55432`; no production database was touched.

| Runtime | Result |
| --- | --- |
| `thinking-games-habit-parity-runtime.mjs` | PASS: parent old-date guard, batch response, child completion points, child undo spent-points guard |
| `thinking-games-habit-integration-runtime.mjs` | PASS: parent complete/idempotency/undo, child complete/undo, single review receipt, anon ACL |
| `thinking-games-runtime.mjs` | PASS: feature-off/on completion, receipt audit/retention, rollback |
| `thinking-games-settings-runtime.mjs` | PASS |
| `thinking-games-gameplay-runtime.mjs` | PASS |
| `thinking-games-security-runtime.mjs` | PASS |
| `thinking-games-catalog-runtime.mjs` | PASS: 28 real design-only payloads under internal pilot |

Final migration SHA-256: `198fee8535fa81b18b8a012678421d1c685b7cb6e70e39ed23380b5daf6812bb`.

The independent authority-races runner was attempted but its own disposable database run terminated an active connection with PostgreSQL administrator command before producing a valid verdict; therefore no concurrency PASS is claimed.
