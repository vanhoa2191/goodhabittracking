# Lane B — Backend daily living habits

Status: **lane B complete**. Final lint, typecheck, 524 API/unit/migration/ID tests, and disposable PostgreSQL checks pass. Remaining cross-lane integration observations are listed separately below.

## Scope and decisions

- Read `AGENTS.md`, `plan.md` section 10, `execution-plan.md` section 3, mandatory `execution/contracts.md`, and installed Next 16.4.2 route-handler documentation before changing the boundary.
- No dependencies, historical migration edits, UI edits, commits, pushes, merges, provider calls, or production SQL.
- Existing mapper, backup serializer/parser, and pairing-client already preserve arbitrary string `legacyTemplateId`; regression tests cover the full mapper → backup → child pairing path without production changes to those files.
- New migration widens the existing CHECK only. Rollback takes an exclusive table lock before checking for DLY rows and refuses rollback while any remain; it never deletes or rewrites rows. Preflight verifies the validated constraint and reports when rollback is blocked.
- `create` and `createMany` preserve the existing success response. Only `23505` with every request activity in DLY and every supplied ID matching the shared helper for the authenticated family/child/template can reach readback. Readback selects IDs with both authenticated `family_id` and requested `id in (...)`; every unique requested ID must be present before confirming success. Other conflicts and readback errors remain 409. No upsert, overwrite, missing-row insertion or retry is introduced.
- Full hidden-file repository search for `NUT.*GIV.*VIR` found the active Zod regex, legacy-catalog test regex, and historical migration. Active regexes are synchronized; historical migration remains immutable and rollback intentionally restores the old allowlist. Plans describe both versions.

## Verification observed so far

1. BEFORE implementation: `npx vitest run tests/api/activity-mutations.test.ts` — PASS, 23/23. Added baseline tests proving all eight old WIT namespaces accepted, DLY rejected with 400, and duplicate-key errors remained 409 for both create forms. The DLY expectation was then changed to acceptance with the namespace change.
2. BEFORE route changes: `npx vitest run tests/api/activity-mutations.test.ts tests/unit/legacy-template-identity.test.ts` — expected RED: 8 failures / 46 passes. Failures prove absent idempotent success and absent scoped readback; roundtrip tests passed. UUID test data were independently generated using Python standard-library `uuid.uuid5`, rather than a duplicated implementation.
3. `npx vitest run tests/api/activity-mutations.test.ts tests/integration/migrations/daily-living-template-refs.test.ts` before adding final idempotency tests — PASS, 26/26. PostgreSQL parser accepts migration/preflight/rollback; guarded rollback and narrow scope assertions pass. The initial parser-test invocation preceded creation of the SQL files and the command wrapper rejected the missing-path setup; it was rerun successfully once the files existed.
4. `SQL_TEST_DATABASE_URL=postgresql://postgres:local-only@127.0.0.1:32768/postgres node tests/integration/migrations/daily-living-template-refs-runtime.mjs` — PASS on real PostgreSQL 18.4: old namespaces/null valid and DLY rejected before migration; repeat migration/preflight preserve ACL/RLS; DLY-01..10 valid; malformed refs and foreign child rejected; duplicate and bundle insert atomicity; authenticated foreign-family reads/writes denied; rollback blocked with DLY rows and succeeds after fixture cleanup. Added a real two-connection concurrent insert test, then reran successfully with seven case groups and database `kidhabit_test_b57a97161b9d42ba889c07efde10b770`; all fixture databases were removed by the harness.
5. Same loopback URL, `npm run test:sql` — PASS, exit 0. Existing billing, affiliate, family operations (`FIXED: 0 failures`), thinking-games security, and settings-read runtime checks all passed. Every harness uses a newly created disposable database.

6. After C's ID helper arrived: `npx vitest run tests/api/activity-mutations.test.ts tests/unit/legacy-template-identity.test.ts tests/integration/migrations/daily-living-template-refs.test.ts` — PASS, 57/57. Eight previously red tests now pass. Coverage includes shared/child deterministic retries, random/wrong-template/wrong-child/other-family IDs, mixed bundles, absent/partial/duplicate/error readback, malformed UUID/template IDs, and old behavior.
7. Final chained gate: `npm run lint && npm run typecheck && npx vitest run tests/api tests/unit/legacy-template-identity.test.ts tests/integration/migrations/daily-living-template-refs.test.ts` — lint PASS; typecheck FAIL with `src/lib/daily-living-habits.ts(241,54): TS2345`, because `DailyLivingTemplate` lacks `HabitTemplate.pack`. That C-owned file was not edited. Consequently the chain stopped before Vitest; the exact Vitest command was started separately. The latest API test also proves stale retry payloads cannot overwrite the original title/points; its modified file passed `npx eslint tests/api/activity-mutations.test.ts`.
8. `npx vitest run tests/api tests/unit/legacy-template-identity.test.ts tests/integration/migrations/daily-living-template-refs.test.ts` — PASS, **54 files / 512 tests**, exit 0, 22.39 seconds. This includes the final stale-payload no-overwrite tests. `git diff --check` also PASS.
9. After observing C's type-error repair, reran `npm run typecheck`: original TS2345 resolved, but C's newly added `src/lib/i18n/daily-living-copy.ts:168-175` reports eight TS2322 errors (English fallback literals assigned to the exact Vietnamese literal-object type). Reported to reader; waiting for C ready status before the next full typecheck.
10. After C's copy-type repair, `npm run typecheck` — PASS, exit 0. Rechecking current full lint and API/unit/migration tests plus C's ID-helper unit tests before lane completion.
11. Final revalidation: `npm run lint` — PASS, exit 0; `npx vitest run tests/api tests/unit/legacy-template-identity.test.ts tests/integration/migrations/daily-living-template-refs.test.ts tests/unit/daily-living-habits-id.test.ts` — PASS, **55 files / 524 tests**, exit 0, 26.67 seconds. Final `git diff --check` PASS. No production code or tests changed after these checks; only this report was finalized.

Dedicated temporary container: `daily-living-lane-b-pg`, image `postgres:18.4`, loopback-only random host port 32768. No existing PostgreSQL instance was reused. `docker stop daily-living-lane-b-pg` completed successfully; `--rm` removed the container. To reproduce, run a new isolated `postgres:18.4` container with a loopback-only random port, set `SQL_TEST_DATABASE_URL` to that port, then run both SQL commands above. Port 32768 is no longer active for this test container.

## Changed files (lane B only)

- `src/lib/domain/activity-mutations.ts`
- `src/app/api/domain/activities/route.ts`
- `supabase/migrations/202610250001_daily_living_template_refs.sql`
- `supabase/preflight/202610250001_daily_living_template_refs.verify.sql`
- `supabase/rollbacks/202610250001_daily_living_template_refs.rollback.sql`
- `tests/api/activity-mutations.test.ts`
- `tests/unit/legacy-template-identity.test.ts`
- `tests/integration/migrations/daily-living-template-refs.test.ts`
- `tests/integration/migrations/daily-living-template-refs-runtime.mjs`
- `plans/261024-daily-living-habits/execution/B-report.md`

## Remaining integration follow-ups (outside lane B)

- The new standalone SQL runtime file is run explicitly; adding it to the package-level CI SQL chain would require a coordinator-owned `package.json` edit.
- C's legacy matching observation below remains assigned to C/coordinator; B has preserved file ownership and has no remaining implementation work.

## Simplifications

- Reused C's browser/Node/Worker-compatible ID helper; no duplicate UUID algorithm or new dependency.
- Kept the existing insert and response paths; the new branch only confirms a previously committed insert after a proven scoped readback.
- Existing mapper, backup and pairing code needed no changes; regression coverage proves DLY preservation instead of adding new mapping layers.
- Database change only widens one CHECK; no new table, RPC, advisory lock, index or policy.

## Cross-lane findings

C's exported `TEST_VECTOR.expected` initially disagreed with Python standard-library `uuid.uuid5(UUID('6f1d5b2e-8a47-4c3e-9b0a-2d7e41c9a8f5'), '11111111-1111-4111-8111-111111111111|22222222-2222-4222-8222-222222222222|WIT-DLY-01')`: the correct value is `99b8edd0-9b83-588b-b4f8-9b5ae8cba9ec`. Reported to reader/coordinator; C has now corrected its exported fixture, independently observed in the file. The actual ID algorithm passes B's independently generated fixed vectors. C's typecheck errors are now repaired. Also reported that C's synthesized legacy matcher drops the original `durationMinutes` (WIT-NUT-01 has duration 1) and uses display description instead of legacy signature, which can miss old assignments without `legacyTemplateId`; resolving the original WIT template avoids this. No C-owned code was changed by B.

## Risks / limits

- API tests use Supabase mocks; database behavior is independently covered by disposable PostgreSQL tests, not live Supabase acceptance.
- A mixed existing/missing createMany insert remains atomic and returns 409 when readback cannot confirm all requested rows; no partial insertion or overwrite is attempted, as required by the contract.
- DLY template regex admits exactly two digits; catalog membership remains lane C's responsibility. Malformed activity UUIDs are 400; otherwise-valid random/cross-family IDs are never treated as idempotent after collisions.
