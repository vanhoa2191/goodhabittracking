# Copilot authority source-fixes checkpoint

**Dispatch:** `task_f5e47f649ea7` / `ctx_db497f09a880`

Fresh QA authority is `/home/opc/orca/goodhabittracking/261021-daily-thinking-games/execution/copilot-sql-qa-fresh-handoff.md`.
The seven genuine source counterexamples are:

| Case | Contract query/role | Observed defect |
|---|---|---|
| AR-05 | service-role `thinking_game_start(token,'bonus',day,command)` after completed mandatory task | granted bonus cannot be started / bonus state transition fails |
| AR-06 | service-role bonus grant followed by parent/service undo before bonus start | expected `revoked_unused` transition fails |
| AR-07 | service-role bonus grant, bonus start, then undo | expected `revoked_after_use` transition fails |
| AR-08 | service-role `thinking_game_parent_start_as(parent,child,'main',day,command)` plus frozen snapshot and later bonus | parent start changes/poisons snapshot task state |
| AR-11 | service-role `thinking_game_update_settings_as(...)` followed by settings/start probes | settings update authorization/semantics fail |
| AR-15 | service-role finish of prior-local-day attempt | expected `attempt_expired`, `abandoned_rollover`, and entitlement expiry closure fail |
| AR-20 | service-role start for child birth year 2017 and unknown-age child | age track/payload resolution falls back to `age_6_8` instead of `age_9_12` or `age_track_unavailable` |

Baseline migration SHA-256: `a26f1113796b4f8c3116ea080df2d453caf7250adf75554c173a01adae8e4787`.
Baseline fresh run: 25 authority cases, 18 PASS / 7 FAIL / 0 BLOCKED; catalog 6/6 PASS.
AR-22 persistent-connection race evidence passed (same-family overlap 5.91x, different-family overlap 7.12x), so no concurrency fix is included in this checkpoint.

Planned owned changes are limited to the migration, its preflight/rollback, and a new
golden runtime test file. Existing authority/race and support suites remain read-only.
