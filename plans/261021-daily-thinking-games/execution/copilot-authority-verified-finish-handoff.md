# Copilot SQL execution checkpoint

- Timestamp: 2026-10-21
- Scope: SQL executor owns migration/preflight/rollback, runtime SQL goldens, and day-gate setup only.
- Database target: `SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:55432/postgres` (guarded disposable test databases only; never production).
- Initial connectivity probe: `psql` is unavailable in this environment (`command not found`); repository Node/pg probes succeeded with the explicit URL assignment.
- Required inputs before mutation: `/home/opc/orca/goodhabittracking/261021-daily-thinking-games/execution/copilot-sql-qa-fresh-handoff.md`, canonical source-fixes handoff, and current SQL/runtime files.
- Baseline authority matrix (before mutation): 18 PASS / 7 FAIL / 0 BLOCKED, exit 1, source SHA `a26f1113796b4f8c3116ea080df2d453caf7250adf75554c173a01adae8e4787`.

## Work performed

- Qualified ambiguous `command_id` references in child/parent bonus starts.
- Corrected bonus synchronization to revoke incomplete grants and re-grant a revoked entitlement when all frozen tasks are complete.
- Corrected service settings authorization for actors who manage the target family, and prevented first-enable same-day starts.
- Replaced the static authority-fixes check with a real PostgreSQL golden covering age-track resolution and payload selection.
- Made day-gate setup deterministic by using an outside-bedtime baseline and retaining a dedicated inside-window negative.

## Verification

- Golden runtime: PASS, exit 0.
- Day-gates runtime: PASS, exit 0 (8 cases).
- Final authority matrix: 21 PASS / 4 FAIL / 0 BLOCKED, exit 1. Remaining observed cases are AR-06/AR-07 bonus undo sequencing, AR-15 rollover persistence after an expected exception, and AR-20 age payload in the frozen 25-case harness. AR-22 passed (same-family overlap 5.57x, separate-family overlap 4.72x).
- Final SQL SHA-256: `ea859b257444242c71701ce1b4a617cf8bf300f02396937125ba2d6badaa3edd`.
