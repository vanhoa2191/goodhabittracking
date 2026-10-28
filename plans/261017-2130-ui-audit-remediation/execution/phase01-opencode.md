# Phase 01 — OpenCode implementation report

Status: in-progress (dispatch lifecycle; coordinator decides acceptance).
Owner: OpenCode (this dispatch). Reviewers: GPT + Kilo. Next owner: 05.
Canonical base: `83b118367fead8a79f7918c928e4f92dbdd0590e` (verified `rtk proxy git rev-parse HEAD`). No commits.
Node: v26.11.1 via provided PATH. All shell via `rtk`. Shared dev server `localhost:3107` (coordinator-owned, E1 webpack dev, dailyEase ON) is used read-only for E2E via `PLAYWRIGHT_BASE_URL`; no `next build`/`next dev` started by this worker.

## 0. Concurrent dirty-tree note (preserved, not mine)

At dispatch start the worktree already carried unrelated in-flight edits from other workers, preserved untouched:
` M .gitignore`, ` M DESIGN.md`, ` M src/app/globals.css`, ` M src/app/layout.tsx`, ` M src/app/page.tsx`,
` M src/components/FamilyDataCard.tsx`, ` M src/components/HabitTimerModal.tsx`, ` M src/components/KidIndependence.tsx`,
` M src/components/ParentDashboard.tsx` (amber confirm-button color), ` M tests/e2e/cloud-family-fixture.ts` (phase00-accepted logs/redemptions fixture extension), untracked `.impeccable/`, `.playwright-mcp/`, `docs/research/`, `plans/`, `PRODUCT.md`, `tests/e2e/ui-audit-*.spec.ts`, `tests/e2e/ui-audit-child-*.ts`. Any lint/typecheck failure originating in those files is concurrent/pre-existing, not introduced by Phase 01.

## 1. Cleanup / regression plan (written before any presentation edit, per dispatch)

**Scope of edits (ownership honored):** `src/lib/store/reward-actions.ts` (redemption outcome contract), `src/lib/store.tsx` (three action declarations only), `src/lib/store/habit-actions.ts` (bounded: optional stale marker on `BatchReviewOutcome` + its use in `reviewLogs`), `src/components/ParentApprovalsTab.tsx`, `src/components/BulkTaskReview.tsx` (whole-file ownership this turn), `src/lib/i18n/parent-approvals-copy.ts`, `parent-actions-copy.ts`, `parent-today-copy.ts` (9 locales), tests: `tests/unit/reward-actions.test.ts`, `tests/unit/habit-actions.test.ts`, `tests/parent-approvals-copy.test.ts`, `tests/unit/parent-today-copy-languages.test.ts`, `tests/e2e/parent-today.spec.ts`, `tests/e2e/ui-audit-regression.spec.ts` (parent A02/A04 only). **Not edited:** KidDashboard, Header, globals.css, HabitTimerModal, ParentDashboard, `ui-audit-fixture.ts` (helper), child A01 case, `cloud-family-fixture.ts` (shared), appearance spec, design docs.

**Regression-first order:** (1) strengthen unit tests for the truthful async contract; (2) strengthen parent A02/A04 E2E cases to the real red contract (two-child pending reward, selector-changes-summary-only, explicit all-family labels, real duplicate request counts, inline reward failure/retry keeps row, approve-cmd-success/deliver-fail recovery, deliver-success/sync-fail without command replay, no silent flag-off early return); (3) run both suites to record the expected RED baseline; (4) implement; (5) focused unit + lint + typecheck + relevant E2E to green; (6) report exact commands/exit codes.

**Cleanup after green (planned now, executed with the edits):** no dead code paths left behind (`persistCloudTransition` replaced by awaited per-decision helper; unused `approveLog`/`rejectLog` destructuring removed from ParentApprovalsTab while store signatures stay legacy-compatible); ref-based busy guards alongside state guards so a rapid double click cannot emit two logical requests before rerender; every new user-facing string lives in the 9-locale copy modules (no inline literals); focus moves to the queue container after removal; aria-live regions mirror the existing BulkTaskReview pattern (`role=alert` failure / `role=status` success); no color or layout redesign (existing Tailwind semantic classes only, matching surrounding parent UI; state colors reuse the existing emerald/rose message patterns); no new dependencies; rollback = this patch set only, no data/migration impact.

**Contract decisions executed (coordinator decisions override suggestions):** `invalid_transition` never proves approved — on ambiguous approve outcome the action reconciles via `syncCloudFamily` and reports `invalid_transition` without side effects; approved/unfulfilled is labeled only when our own approve was acknowledged or fresh authoritative state says approved; `syncCloudFamily` returns boolean and is never treated as throwing; single-row inline review reuses `reviewLogs([id])` with truthful `approvalLag:'unknown'`; PIN/auth failure (HTTP 403 `parent_pin_required` path, existing Header modal) keeps row/selection for explicit retry, never auto-replays; all-family queue default kept; selector is summary-only and renamed "Xem tổng quan của…"; delivery request counts follow the real command sequence (approve+deliver = 2, deliver-only retry = 1), never one-request fiction nor whole-workflow duplication.

## 2. Implementation delivered (owned files only)

**Async contract (store):** `src/lib/store/reward-actions.ts` now exports `RedemptionOutcome` (`command: 'approved'|'delivered'|'rejected'|'invalid_transition'|'failed'`, `refresh: 'synced'|'stale'`, `unfulfilled?: true`) and returns it (awaited, never fire-and-forget) from `approveRedemption`/`deliverRedemption`/`rejectRedemption`; `deliverRedemption(redemptionId)` takes a single id and, when the row still needs approval, sends approve then deliver, applying each acknowledged step locally before the reload. A refusal (`invalid_transition`/`not_found`) is reported as `invalid_transition` and reconciled only by reload; a transport failure is `failed` with **no sync and no local mutation**; `unfulfilled: true` marks an approval that was acknowledged while its follow-up deliver threw. `REWARD_TRANSITIONS` import removed as unused. `src/lib/store.tsx` types the three actions as `Promise<RedemptionOutcome>`. `src/lib/store/habit-actions.ts` adds `readonly stale?: true` to `BatchReviewOutcome` (key omitted when fresh) and `reviewLogs` returns `{ ...outcome, stale: true }` when the post-review `syncCloudFamily` returns false.

**Copy (9 locales):** `parent-approvals-copy.ts` — `allChildrenScope`, `approvedAwaitingDelivery`, `deliveryUnfulfilled`, `deliveryFailed`, `deliveredStale`, `deliveredDone`, `rejectedDone`, `reconcileMessage`; `parent-actions-copy.ts` — `reviewedStale`, `refreshList`; `parent-today-copy.ts` — `chooseChild` renamed to `overviewOfChild` (vi "Xem tổng quan của bé", en "View a child’s overview", …). No inline strings.

**UI:** `ParentApprovalsTab.tsx` — child selector `aria-label` uses `overviewOfChild`; task and reward queues carry an explicit all-family scope badge (`approvals-scope-label`); inline task review goes through `reviewLogs([id])`; reward rows keep `redemption-row-<id>` testids and the existing `bg-pink-50/60` styling, show an `redemption-awaiting` pill when approved, and render a truthful result region (`reward-result`, `role=alert|status`) plus `reward-refresh` (only for stale); ref-based busy guards (`inlineBusyRef`/`rewardBusyRef`) prevent a same-frame double command; focus moves to `#pending-tasks`/`#pending-rewards` after a settled action; badges/strip use the combined pending-tasks + pending-rewards count. `BulkTaskReview.tsx` — scope badge in the heading and selection summary, `busyRef` guard, `stale` suffix + `bulk-refresh` on the batch result, focus to the queue container after success, `bulk-result` keeps `role=alert|status`.

## 3. Verification (exact commands and results)

| Step | Command | Result |
| --- | --- | --- |
| Unit RED baseline (strengthened tests, pre-implementation) | `rtk node node_modules/vitest/vitest.mjs run tests/unit/reward-actions.test.ts tests/unit/habit-actions.test.ts tests/parent-approvals-copy.test.ts tests/unit/parent-today-copy-languages.test.ts tests/unit/independence-copy-languages.test.ts` | 15 failed / 110 passed (expected RED) |
| Focused unit (final) | same command | **5 files, 125 passed, 0 failed** ✅ |
| Full unit suite | `rtk node node_modules/vitest/vitest.mjs run` | **312 files / 3384 passed** (Phase00 baseline 3369, +15 new) — exit 0 |
| E2E RED baseline | `PLAYWRIGHT_BASE_URL=http://localhost:3107 rtk npx playwright test tests/e2e/ui-audit-regression.spec.ts --project=chromium --output=.omx/ui-execution/phase01-test-output` | 3 passed / 7 failed (A02 scope labels ×3, selector group name, A04 focus, A04 reward row testids ×3) |
| E2E focused (green) | same + `tests/e2e/parent-today.spec.ts` | PASS 13 / FAIL 0 |
| E2E regression guards (green) | `… ui-audit-regression.spec.ts parent-today.spec.ts smoke.spec.ts reward-mutation.spec.ts help-tips.spec.ts` | PASS 35 / FAIL 0 |
| Lint | `rtk npm run lint` | clean (0 errors, 0 warnings) |
| Typecheck | `rtk npx tsc --noEmit --incremental false` | No errors |

All E2E ran against the coordinator's dev server `http://localhost:3107` (never started/stopped by this task), Node v26.11.1, locale vi-VN, chromium.

**Flakiness found and fixed (root cause identified, not masked):** `@supabase/postgrest-js@2.117.2` retries idempotent GETs on 503/520 up to 3 times with 1s/2s/4s exponential backoff, honouring `Retry-After`. The A04 "deliver success with a failed reload" case therefore takes ≥7 s to settle even though the code was correct; the 503 route now answers `Retry-After: 0` and the stale assertion waits 15 s. Verified green in the focused run and in the 35-test guard run (previously 1 flaky failure under parallel load).

## 3b. Temporary debugging residue — removed

Debug `console.log` markers were briefly added to `reward-actions.ts` and `use-cloud-family-identity.ts` plus listeners in the regression spec to locate the stall; all were removed and verified absent (`grep -n 'DBG'` over src/tests → no matches). `use-cloud-family-identity.ts` diff is empty (clean revert).

## 4. Decisions, deviations, preserved behavior

- `invalid_transition` is never read as approved; the screen reconciles by reload and offers refresh, never a blind approve→deliver replay. Row and selection are kept so retry is explicit.
- `deliverRedemption` = one command pair maximum per click; a deliver-only retry emits exactly one command (asserted).
- Stale (sync false) is surfaced as an explicit "fresh data has not loaded" + `reward-refresh`; the acknowledged delivery is never re-sent by refresh (asserted).
- Ref-based guards (not only state) so a same-frame double click cannot emit a second logical request; state guards keep the button visually disabled after rerender.
- Scope semantics: both queues are all-family by default; the child selector only re-scopes the Today summary card (`parent-today-card`), never the queues — stated in the UI via `approvals-scope-label`.
- `tests/e2e/parent-today.spec.ts` group name updated to the renamed selector label. `smoke.spec.ts` assertions were checked against the new markup (pink row class, "Đã trao quà", pending-tasks heading) and pass unchanged.
- No dependency, color, layout, or global-settings changes; unrelated concurrent worktree edits (`KidDashboard.tsx`, `kid-quest-copy.ts`, `cloud-family-fixture.ts`, appearance/child specs, `.impeccable/`, docs) were not touched.

## 5. Remaining risks / notes

- The stale path leaves the queue in a "busy" state for as long as the underlying table retries (≈7 s with server backoff). This is truthful but the product may later want an explicit "retrying…" hint; out of scope for Phase01.
- Reviewer acceptance is explicitly pending; nothing here auto-accepts the phase.
