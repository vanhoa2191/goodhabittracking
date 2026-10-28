# Copilot four-case SQL handoff

- Date: 2026-10-21
- Source file: supabase/migrations/202610210001_thinking_games.sql
- Current SQL SHA-256: ea859b257444242c71701ce1b4a617cf8bf300f02396937125ba2d6badaa3edd
- Remaining runtime cases: AR-06, AR-07, AR-15, AR-20
- Working rule: fix the authoritative SQL path in the migration only, preserve the previously green 21-case matrix, and verify with the 25-case runtime matrix.

## Focus

- AR-06: undo a granted but unused bonus entitlement must transition to `revoked_unused`.
- AR-07: undo after a bonus attempt has started must transition to `revoked_after_use` without rewriting habit state.
- AR-15: previous-local-day finish must persist `abandoned_rollover` and mark the entitlement `expired` while returning the `attempt_expired` signal.
- AR-20: the resolved age track must decide the served content and unknown age must fail with `age_track_unavailable` rather than silently substituting another track.
