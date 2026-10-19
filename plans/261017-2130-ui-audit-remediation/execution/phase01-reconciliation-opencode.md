# Phase 01 reconciliation follow-up — OpenCode report

Status: in-progress (dispatch lifecycle; coordinator decides acceptance).
Owner: OpenCode (this follow-up dispatch). Prior implementation/report preserved in `execution/phase01-opencode.md`; not redone.
Canonical base: `83b118367fead8a79f7918c928e4f92dbdd0590e` (verified `rtk proxy git rev-parse HEAD`). No commits.
Node: v26.11.1 via provided PATH. All shell via `rtk`. Shared dev server `localhost:3107` (coordinator-owned) used read-only for E2E via `PLAYWRIGHT_BASE_URL`; no `next build`/`next dev` started.

## 1. Regression / cleanup plan (written before any edit, per dispatch)

**Blockers being corrected (from coordinator follow-up, verified against the current diff):**

1. `reward-actions.ts` `sendTransition` returns `result.status` or `null`; `runSingleTransition`/`deliverRedemption` then treat *every* non-refusal status as the expected ACK and every `null` as plain `failed` **without reconciliation** — so an unknown response status is claimed as success, and a lost/timeout/invalid response leaves a possibly-committed row immediately re-actionable (opposite decision or replay on a stale row).
2. `habit-actions.ts` `reviewLogs` catch returns `null` without reconciliation; success counts are derived without validating that `results[]` answers every requested ID with a known status — a missing/partial result yields `{0,0,0}` which the bulk UI renders as an empty *success* message, and the bulk UI clears the whole selection so per-ID recovery is lost.
3. `store.tsx` exposes `syncNow(): Promise<void>` — awaiting it cannot prove a refresh succeeded, so no screen can truthfully keep or lift an uncertainty gate after an explicit refresh.
4. No gate exists for a row whose last command outcome is unknown and whose reconciliation reload also failed.

**Contract executed (decisions override suggestions):**

- ACK is only the exact expected status: `approved` for approve, `delivered` for deliver, `rejected` for reject. `invalid_transition`/`not_found` remain server refusals (never proof of approval) and are reconciled by reload as before. An answered `{success:false}` body (client `DomainCommandRequestError` whose message is the server's refusal) is a definite decline: nothing committed, no reload, no gate. Everything else that throws — network/timeout, unparsable body, unknown status — is **uncertain**: the action reconciles via `syncCloudFamily` before returning, reports `command:'unknown'` (new, additive to the existing union; success shape unchanged), and never continues a multi-step sequence or claims an approval the server did not confirm (`unfulfilled:true` only when our own approve *was* acknowledged and the following deliver is failed/unknown).
- `reviewLogs` validates per-ID results (every requested ID answered once with `approved`/`rejected`/`already_reviewed`/`not_found`); missing/unknown rows become `uncertainIds` (additive optional field on `BatchReviewOutcome`); a declined batch still returns `null` (existing UI keeps selection and shows failure); an uncertain batch reconciles via reload and reports `uncertainIds` (+`stale` when the reload fails). No per-ID success is ever inferred from aggregate counts; no empty-success message is possible.
- `syncNow` in the store context becomes `Promise<boolean>` (minimal compatible truthful refresh outcome, coordinator-authorized): implemented in `store.tsx` as a `useCallback` over the already-exposed `syncCloudFamily` boolean; the hook's internal void `syncNow` keeps feeding `use-local-family-lifecycle` unchanged. `use-cloud-family-identity.ts` and `use-local-family-lifecycle.ts` are **not** edited.
- UI: rows whose last outcome is unknown **and** whose reload failed are gated (buttons disabled) until an explicit refresh returns true; refresh failure keeps the gate and the message. Acknowledged outcomes are preserved even when the reload failed (never re-sent, never claimed fresh). Bulk keeps exactly the unresolved `uncertainIds` selected after a mixed/partial batch; acked IDs leave the selection. PIN/auth: HTTP 403 `parent_pin_required` still flows through the existing fetch signal → Header PIN modal; the outcome is a definite decline (row/selection preserved, retry explicit, no auto-replay).

**Order:** (1) meaningful red unit tests (reward uncertain/unknown-status/reconcile, habit catch/missing-results/mixed/403, copy keys ×9); (2) meaningful red E2E regressions in `tests/e2e/ui-audit-regression.spec.ts` (server-committed+lost response, stale reconciliation with row gating, unknown response status, mixed per-ID/missing batch results with selection preservation, real HTTP 403 PIN fixture) preserving the child A01 case and all existing parent cases; (3) record RED baseline; (4) implement; (5) focused unit + lint + typecheck + focused E2E to green; (6) report exact commands/exit codes.

**Cleanup (planned now, executed with the edits):** no dead paths (`sendTransition` becomes a small discriminated result; the old `isRefusal` string-returning helper is subsumed); ref busy guards remain the duplicate guard (pre-rerender); every new user-facing string lives in the 9-locale copy modules (`outcomeUnknown`, `approvedDeliveryUnknown`, `reviewOutcomeUnknown` + the gate affordance reuses `refreshList`); focus/aria patterns keep the existing `role=alert|status` regions; gates are lifted only by a truthful successful refresh; no color/layout/dependency change (existing Tailwind semantic classes only); rollback = this patch set only, no data/migration impact. Ownership: same Phase01 files plus the whole `tests/e2e/ui-audit-regression.spec.ts` (child A01 preserved); no KidDashboard/Header/globals.css/HabitTimerModal/other-worker specs/design docs; `store.tsx` edit limited to the `syncNow` declaration/wiring (truthful boolean), no other store surface.

## 2. Status

Implementation in progress — final evidence appended below when green.
