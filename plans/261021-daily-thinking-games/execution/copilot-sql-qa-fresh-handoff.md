# Fresh SQL QA checkpoint

## Scope

Finish only the real-SQL fixture and authority-matrix/catalog runtime work for
the frozen migration `supabase/migrations/202610210001_thinking_games.sql`.
This worker owns the fixture, runtime test files, and execution evidence; no
production SQL, UI, API, content, or existing unit-test edits.

## Plan

1. Inspect the tracked production DDL and existing fixture/runtime tests,
   preserving the 36 previously green external/unit cases.
2. Repair only fixture validity/roles/signatures and add the missing
   `public.family_engagement_settings` baseline from the actual tracked DDL.
3. Run the complete runtime suite, then execute and document the 25-case
   authority matrix plus catalog runtime with persistent-connection race and
   latency evidence.
4. Record exact commands, versions, SQL hash, literal pass/fail counts, and
   any genuine counterexamples; report completion through the required Orca
   lifecycle message.

## Execution evidence (2026-10-21)

- SQL source hash: `a26f1113796b4f8c3116ea080df2d453caf7250adf75554c173a01adae8e4787`
- Runtime: PostgreSQL 18.4 on loopback `127.0.0.1:55432`, disposable
  `kidhabit_test_*` databases, Node 22.22.0, `pg` 8.23.1.
- Baseline correction: added the tracked `public.family_engagement_settings`
  table exactly as defined by `202609230001_experience_foundation.sql`, with
  forced RLS, family read/manage policies, and authenticated grant.
- Catalog runtime: PASS, 6/6 cases, exit 0.
- Authority matrix after fixture/test corrections: 18 PASS, 7 FAIL, 0 BLOCKED
  of 25, exit 1. AR-13 now executes against the actual
  `family_engagement_settings.paused_at` table; AR-17 now uses a genuinely
  foreign same-family child attempt and passes.
- Other runtime suites: settings 5/5 PASS, security 5/5 PASS, gameplay 3/3
  PASS, habit integration 4/4 PASS, habit parity 4/4 PASS, admission security
  3/3 PASS. Day-gates exited 1 because its fixed-time start hit the current
  bedtime window before it could emit its summary.

### Genuine SQL counterexamples (not fixture skips)

AR-05/06/07 bonus state transitions, AR-08 parent snapshot task freezing,
AR-11 service settings update authorization, AR-15 rollover finish closure,
and AR-20 age/content payload remain failing against the frozen migration.
AR-22 persistent-connection race evidence passes (same-family overlap 5.91x,
different-family overlap 7.12x; local measurements only). No production SQL was
changed, and no existing green unit/external tests were edited.
