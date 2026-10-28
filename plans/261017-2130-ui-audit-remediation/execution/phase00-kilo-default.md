# Phase00 execution — Kilo default (UI audit regression tests)

Status: executed, NOT accepted. Phase acceptance is left to the reviewer/coordinator.

## Scope owned (Kilo)
- `tests/e2e/ui-audit-regression.spec.ts` — NEW. Phase 00 regression cases for A01, A02, A04.
- `tests/e2e/ui-audit-fixture.ts` — NEW. Shared helpers: `enterDemoKid`, `enterParentApprovals`, `usableBand`, `taskTitleAndToggleBoxes`.
- `tests/e2e/cloud-family-fixture.ts` — MINIMAL backward-compatible extension only: added `logs` and `redemptions` options echoed through `**/rest/v1/**` (all UUID ids, snake_case rows matching the Supabase row schemas in `src/lib/supabase/mappers.ts`). Existing options unchanged; existing cloud tests pass.

No UI/store changes. No new dependencies. No commits, no deployment, no production calls, no other agents, no global settings. No new dev server started — tests run against the coordinator baseline server.

## Server / harness
- Coordinator server `http://localhost:3107` (Next.js production build) was already serving (HTTP 200).
- Tests run with `PLAYWRIGHT_BASE_URL=http://localhost:3107` so Playwright does not start a competing dev server (`webServer` is skipped).
- Chromium: installed browser at `~/.cache/ms-playwright/chromium-1243`.
- Command template: `PLAYWRIGHT_BASE_URL=http://localhost:3107 rtk npx playwright test tests/e2e/ui-audit-regression.spec.ts --project=chromium`

## Coverage matrix vs plan.md
| Audit item | Covered by | Notes |
|---|---|---|
| A01 task + primary button usable 375×812 | `ui-audit-regression.spec.ts` | Demo fixture reused (`/?demo=1`); "paired" has no separate fixture, so demo is the reusable paired-child equivalent. |
| A02 all-family scope labels | `ui-audit-regression.spec.ts` | Two children each with a pending task + pending reward; per-row child name; all-family count `(2)`; batch summary. |
| A04 truthful slow/fail/retry approval/reward | `ui-audit-regression.spec.ts` | Bulk approval guarded request+payload+failure alert+no fake success+retry; busy disables during flight; reward delivery request count + retry. |
| A03 contrast / A05 theme persistence / A07 44px touch targets | `tests/e2e/ui-audit-appearance.spec.ts` (existing) | Not duplicated here — existing tests cover preservation behavior. |

## Files changed
- `tests/e2e/ui-audit-regression.spec.ts` (new)
- `tests/e2e/ui-audit-fixture.ts` (new)
- `tests/e2e/cloud-family-fixture.ts` (modified — logs/redemptions options only)

## Verification commands run
Lint: `rtk npx eslint tests/e2e/ui-audit-regression.spec.ts tests/e2e/ui-audit-fixture.ts tests/e2e/cloud-family-fixture.ts --max-warnings=0` → No issues found.
Typecheck: `rtk npx tsc --noEmit` → no errors in the new/modified files.

Existing tests (confirm no fixture regression):
- `PLAYWRIGHT_BASE_URL=http://localhost:3107 rtk npx playwright test tests/e2e/reward-mutation.spec.ts tests/e2e/kid-hero-compact.spec.ts --project=chromium` → PASS (5) FAIL (0).

## Exact checks / results (against http://localhost:3107, chromium)
Command: `PLAYWRIGHT_BASE_URL=http://localhost:3107 rtk npx playwright test tests/e2e/ui-audit-regression.spec.ts --project=chromium`

Result: **PASS (5) FAIL (1)**.

Passed:
1. A02 — two children each with a pending task and reward appear in the all-family queue (heading `(2)`, each row carries child name Bé An/Bé Chi, pending-reward row carries child name).
2. A02 — batch summary lists the correct children when the whole family queue is selected (`bulk-select-all` → `bulk-selection-summary` contains Bé An and Bé Chi).
3. A04 — bulk task approval: disables while busy, exactly one `reviewHabits` request with correct `logIds` payload, failure reported via `bulk-result` alert without faking a success `status`, retry recovers to `Đã duyệt` / `Approved` (2 total requests).
4. A04 — task approval keeps batch button disabled while in flight and issues exactly one request (busy guard observed; no duplicate).
5. A04 — reward delivery failure makes a `/api/domain/commands` request (≥1) without faking `delivered`; retry makes another request (≥2 total).

Failed:
6. A01 — task name + mark toggle inside usable 375×812 band (demo). Measured first due task's toggle bottom edge ≈1256.6 CSS px vs usable band bottom ≈737.6 px (above bottom nav) at 375×812 — i.e. the toggle sits below the usable viewport / below the fold. This is the A01 "nhiệm vụ ở dưới fold" finding itself. It is reported as a baseline gap, NOT as a weakened assertion; no UI/store was changed to make it pass. Recommend phase-04 verification/fix (confirm whether this is a genuine layout regression or a test-coordinate artifact).

Note: `dailyEase` is ON on the 3107 build, so `BulkTaskReview` (bulk approval) renders. If a baseline build has `dailyEase` off, the A02 batch-summary and A04 bulk-approval tests take the early-return path (per-row scope still asserted) and the individual-`Duyệt`/individual-`Đã trao quà` path applies instead.

## Remaining baseline gaps (phase not accepted)
- A01 task-below-fold at 375×812 (observed gap above) — needs phase-04 fix or confirmation.
- A04 contract gaps against the current build (void async actions): `reviewCloudLog`/`deliverRedemption` are fire-and-forget with errors swallowed (console.error only) and no truthful UI status on success/failure, so "status/error announcements" and "authoritative status" assertions are partially future-contract. Covered where the UI exposes it (BulkTaskReview `busy`/`bulk-result`); reward-delivery truthful status remains a gap.
- Explicit all-family heading text is not asserted — current UI shows the count `(2)` only; an explicit all-family heading is a phase-03 contract question.
- No next build/dev was run (server ownership is coordinator); no commit, no deployment.

## Unrelated dirty files preserved
`.gitignore` (modified), `.impeccable/`, `docs/research/` were left exactly as found.
