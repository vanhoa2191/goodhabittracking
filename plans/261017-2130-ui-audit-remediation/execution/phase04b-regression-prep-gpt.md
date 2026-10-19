# Phase04b regression preparation

Status: **ready-for-review**; regression preparation complete, awaiting coordinator review. No Phase04b implementation or whole-phase acceptance. Stop after this report; wrapper owns lifecycle.

## Pre-edit cleanup and regression plan

1. Read coordinator decisions, phase04/test-spec, accepted00/02a/03 and partial04a handoffs, current store factories/callers/command clients, and existing unit fixture patterns read-only.
2. Add only `tests/unit/ui-audit-child-store-truth.test.ts`: six essential scenarios for held nonapproval completion, actual pending acknowledgement, accepted acknowledgement with stale refresh, unexpected/unknown response, uncertain committed completion retry, and uncertain committed reward retry. Use actual command clients and validated HTTP envelopes; dynamic state getters model rerenders. Verify demo authority preservation using existing tests rather than duplicating them.
3. Lock approved semantics before any future source correction. Expected assertion reds are evidence, not permission to weaken tests. No source cleanup in this lane; reuse factory/setter patterns and keep fixture local to the new file.
4. Run focused Vitest, targeted ESLint, and full typecheck under per-command Node26 PATH through RTK. Report assertion failures separately from type/mock errors. No build/dev/E2E/visual/detector runs or lifecycle messages.
5. Fill this report ready-for-review and stop. Parent owner retains entire store/action files and existing tests. Coordinator controls acceptance and subsequent implementation authorization.

Session UUID: `01a15195-fd11-7f73-b7ec-bbf1e9794822` (CODEX_SESSION_ID/CODEX_THREAD_ID).

## Delivered scope

Only authored this report and `tests/unit/ui-audit-child-store-truth.test.ts`. No existing file intentionally edited. Shared `.gitignore`, `.impeccable`, DESIGN/PRODUCT, docs/research, parent store/actions/tests and all other workers' files preserved. No agents, commits, deployments, dependencies, global settings, server start/build, detector, suppressions, browser captures or lifecycle messages.

Read actual AGENTS.md plus supplied workspace operating contract and RTK.md; phase04, test-spec, coordinator00 decisions, accepted00/02a/03 and partial04a reviews, child recovery preparation, PRODUCT/DESIGN and accepted child surface brief. Inspected habit/reward factories, store provider construction, child completion/claim callers, real command schemas/clients, existing habit/reward unit patterns and latest SQL completion/redemption functions. Installed Next16.3.8 `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md` read. No UI edits, so craft-floor/visual-verdict were not invoked. Memory registry quick search had no relevant entries; no memory-derived facts used.

Simplification: one file-local typed fixture, shared setter and HTTP server helper; six essential scenario definitions expanded across cloud-parent and paired-child branches (12 executable tests). No whole-suite duplication, snapshots, class-string assertions, skips, conditional pass paths or modified existing expectations. Soft assertions intentionally collect related safety violations without making a failing case pass. The only conditional throws in server handlers reject an unexpected mutation rather than silently accepting it.

## Fixed behavioral expectations and observed evidence

| Scenario (both branches) | Semantically fixed expectation | Final observed result |
|---|---|---|
| Held nonapproval completion | Before ACK: no log, unchanged full profile including points/earned/streak, no first-task badge or task-success sound; no premature refresh. After accepted ACK, boolean remains accepted. | **2 expected reds:** invented completed log, 40→50 points/earned, streak1, first badge and success sound before ACK. |
| Actual pending ACK with locally nonapproval metadata | Server acknowledgement wins over stale activity metadata. Pending row/zero awarded points, unchanged profile/badges and no verified-success sound even while refresh returns false. | **2 expected reds:** server log ID substituted but guessed completed/10-point row/profile/badge/sound retained. Refresh attempted once. |
| Accepted completion and reward ACK, refresh false | Completion `completed` and claim `pending` remain accepted; failed snapshot refresh must not become a retryable command failure or automatically replay either command. | **2 passes:** both return true; exactly completeHabit then redeemReward, two refresh attempts, no fabricated local redemption. This does not certify truthful stale/pending UI. |
| Unexpected/unknown status | Valid client status `adjusted` is unexpected for either action and must not mean success. Unknown HTTP status string must be rejected by the actual client. No invented verified credit. | **2 expected reds:** `adjusted` returns true for both actions and task feedback/credit is guessed. Unknown wire status is correctly rejected; those false/rollback assertions pass inside the red cases. |
| Committed completion, response lost, explicit retry with refresh unavailable | First request may have committed despite transport failure. No automatic command replay; explicit retry must retain operation identity or safely reconcile, never send undoHabit. SQL duplicate does not prove a fresh completed result. | **2 expected reds:** retry sends a new command ID. No undo observed in this fixture. SQL-style second response is exactly `{status:'duplicate'}`, without fabricated logId/points. |
| Committed reward, response lost, explicit retry with refresh unavailable | Preserve original command ID unless authoritative reconciliation proves the prior result; a new redemption must not be created or debit points twice. | **2 expected reds:** two committed redemption IDs, simulated server balance40→10 instead of25. Client balance remains40 after first transport failure. |

HTTP boundary remains real: `requestDomainCommand` / `requestChildDomainCommand` are **not mocked**. Only global fetch, sounds and canvas-confetti are substituted. Outgoing strict schemas validate UUIDs, target/date/command ID and parent-versus-child shape; endpoint and POST method are asserted. `Result` is inferred from actual client return type. Only the deliberately malformed unknown wire envelope bypasses that typed result helper, to test actual response validation. Typed `adjusted` is legal in the shared result union but inappropriate for completion/claim, which exposes the missing per-command status check.

Retry fixture mirrors the relevant SQL distinction: completion is unique by activity/child/date (a second complete returns only duplicate, regardless of new ID), while redemption deduplicates by command ID and accepts a new claim with a new ID when points/stock permit it. Completion test counts attempted operation IDs, **not fabricated extra SQL completion rows**. Reward fixture has40points/15cost/stock3, so a second distinct request can actually debit again. It is a bounded unit model, not live SQL or authorization verification.

## Verification

Environment: Node26.11.1, Vitest4.1.11, existing dependency installation; base `83b118367fead8a79f7918c928e4f92dbdd0590e`, shared dirty checkout. Every command below ran through `rtk proxy bash -c` with `export PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH`. No persistent logs were added outside the two allowed files; output is in this Codex session's tool results.

| Exact inner command | Actual result |
|---|---|
| `node --version; npx vitest run tests/unit/ui-audit-child-store-truth.test.ts --reporter=verbose` | Initial exit1:10 failed/2passed,1.45s. All failure causes are genuine assertions, no import/mock/type/unhandled failure. |
| `npx vitest run tests/unit/ui-audit-child-store-truth.test.ts --reporter=verbose` | Final exit1:10 failed/2passed,924ms; start07:38:07 local19Oct2026. Final retry fixture corrected to actual SQL duplicate shape; no expectation weakened. |
| `npx eslint tests/unit/ui-audit-child-store-truth.test.ts --max-warnings=0` | Exit0 before and after final fixture correction. |
| `npm run typecheck` | Full `tsc --noEmit`, exit0. Ran before the final response-only fixture correction, which adds no declarations or type changes. |
| `npx vitest run tests/unit/habit-actions.test.ts tests/unit/reward-actions.test.ts --testNamePattern="completes a local habit and awards points\|enforces demo stock\|claims a local reward with one points and redemption transition" --reporter=verbose` | Exit0:8selected demo-preservation tests pass,2files,1.43s.46other existing tests excluded by name filter; no test source skips added. Existing tests read/run only. |
| `git diff --check` | Exit0. New untracked file checked by targeted ESLint; repository diff check covers tracked concurrent changes only. |

The test-name regex above contains literal pipe alternation in the executed shell argument (no backslashes before pipes); Markdown escaping is only for this table. Test tool output includes expected app console errors for malformed HTTP envelopes and deliberately lost responses; these are exercised failure paths, not harness errors. No new tests were skipped, marked expected-fail, or wrapped to return early.

## Minimal contract needed for implementation, and gaps

Boolean alone cannot tell the child caller whether true means actual completed versus pending (caller currently derives praise/point burst from stale `activity.requiresApproval`), distinguish accepted-but-stale from uncertain transport failure, or tell an explicit completion retry from an ordinary undo tap after reconciliation. The approved correction permits a minimal compatible typed last-outcome getter or narrow typed result when necessary. It must expose actual acknowledged completion/pending/undo versus unknown/failure plus refresh freshness/retry safety, keyed to the operation so an unrelated action cannot overwrite recovery. Preserve existing boolean callers where possible; no schema/RPC/new store architecture is proposed here. Merely returning false after an accepted command would create unsafe replay; merely returning true for unknown/duplicate would falsely claim verification.

Stable retry identity must survive the provider rebuilding action factories on rerender; storing it only in a single factory closure is insufficient in the real app. These tests use live getters with one action instance and verify unavailable-refresh recovery. They do **not** prove persistence across factory recreation, retry after successful authoritative reconciliation has installed a completed row, duplicate-only outcome feedback, refresh throwing instead of resolving false, simultaneous callers, or same-reward intentional later claims. Those remain implementation/integration verification gaps; do not equate a green run here with all04b safety. No new API was invented to pretend these unimplemented distinctions can already be tested.

Existing demo local actions remain authoritative and were independently exercised by8selected existing tests. Full existing unit suites, full lint/static gates, E2E and browser/physical-device behavior were not rerun. Coordinator's prior12pass/1store-red child-recovery result is context only, not a run by this lane. Coordinator owns localhost3107, final captures/build and phase acceptance; no server process touched. Phase01 source ownership remains exclusive until coordinator release.

## Identity and handoff

Final new test SHA256: `d37084e783e091b6e365f6569840f37ca2be8b7bdfb0be2b5001f09fe27b7cf0`.

Read-only source fingerprints stable across final verification:

- `src/lib/store/habit-actions.ts`: `0338217dbd27a4190ea0cbb3342df030535cd4cd064d883211a1b8db8cb8cbae`
- `src/lib/store/reward-actions.ts`: `6e0dd814b97bd0ba4773d90c92049d2ee65821315ab5bd495c2a2b93dbb3b600`

Released the two new artifacts for coordinator review. Ready-for-review is limited to regression preparation; **04b not implemented, 01 not accepted by this worker, whole04 not accepted**. Resume this exact session UUID above only after coordinator dispatch/release. Rollback is removal of only the two new files, preserving every unrelated change. No worker_done/heartbeat sent manually.
