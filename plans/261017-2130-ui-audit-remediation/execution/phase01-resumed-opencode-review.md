# Phase01 resumed — independent correctness review (OpenCode, read-only)

Verdict: **REVISE narrow01** — one blocking contract/test-fidelity item on the real PIN 403; all other parent-safety criteria are implemented and independently verified. Nothing outside phase01 was reviewed or edited.

Scope reviewed (current working tree, not the historical reports):
`src/components/ParentApprovalsTab.tsx`, `src/components/BulkTaskReview.tsx`,
`src/lib/store.tsx` (parentOperations/syncNow only), `src/lib/store/habit-actions.ts` (reviewLogs only),
`src/lib/store/reward-actions.ts` (transitionRedemption/parent transition only),
`src/lib/store/domain-command-client.ts`, plus parent regressions/units
(`tests/e2e/ui-audit-regression.spec.ts`, `tests/unit/habit-actions.test.ts`,
`tests/unit/reward-actions.test.ts`, `tests/unit/domain-command-client.test.ts`,
`tests/unit/parent-actions.test.ts`, `tests/parent-approvals-copy.test.ts`,
`tests/unit/parent-today-copy-languages.test.ts`), the domain route + parent-unlock bodies.
No source/test/plan edits were made; only this report was written.

## Blocking finding (narrow01)

**B1 — the actual precommand PIN/cross-site 403 is not a "validated refusal"; tests assert an envelope the server never emits.**

- `/api/domain/commands` returns PIN-required as `{ error, code }` with 403, no `success` field
  (`src/app/api/domain/commands/route.ts:81-84` → `requireParentUnlock`,
  `src/lib/security/parent-unlock.ts:109-118`; same shape for `rejectCrossSiteRequest`,
  `src/lib/security/request-origin.ts:29-31`).
- `requestDomainCommand` sends any non-conforming body to the invalid-envelope branch with default
  outcome `unknown` (`src/lib/store/domain-command-client.ts:76-78`); `refused` is only decided inside the
  valid-envelope branch (`:79-87`). So the real 403 is classified `unknown`, not `refused`, and
  `reviewLogs` runs a needless `syncCloudFamily` reconcile (`habit-actions.ts:369-372`) and shows
  `reviewUnconfirmed` instead of a definite failure (`BulkTaskReview.tsx:56-61`,
  `ParentApprovalsTab.tsx:133-135`).
- The tests only pin fabricated envelopes: `tests/unit/domain-command-client.test.ts:109` uses
  `{success:false, error, code}` at 403 (→ refused) and `:115` uses `{error}` (→ unknown); the E2E
  `pin` mock uses `{success:false,...}` (`tests/e2e/ui-audit-regression.spec.ts:213-216`). Neither
  matches the route body, so criterion "validated precommand4xx refusal explicit retry/PIN preserved"
  is not demonstrated against the real server.
- Safety is still intact (PIN dialog still fires via `parent-pin-signal`, selection is preserved, no
  auto-replay). The issue is that the authoritative contract (`execution/phase01-reconciliation-opencode.md`
  line 22) calls 403 a *definite decline*, and the coordinator notes call 403 a *known precommand*
  response; the implementation does neither for the real body.

Required fix (owner GPT): classify a non-enveloped 403 whose body carries
`code: parent_pin_required|parent_pin_not_set` (and the cross-site 403) as `refused` while keeping
5xx / 2xx-contradictory / unreadable bodies `unknown`, or wrap the route's 403 in the
`{success:false,error}` envelope (backend — out of this scope, would need a scope packet). Add a
route-faithful regression for the exact `{ error, code }` body. If root instead decides the real 403
is intentionally `unknown`, update the contract/test so the deviation is explicit.

## Verified criteria (APPROVE-worthy)

- **Missing/contradictory/invalid 5xx and lost responses are unknown.** `domain-command-client.ts:73-88`
  (unreadable body, invalid envelope, `success:true` on non-OK, 5xx, unknown status) plus catch paths in
  `habit-actions.ts:369-372` and `reward-actions.ts:149-151`. Unit matrix
  `domain-command-client.test.ts:107-131` and reward reconciliation tests cover it.
- **Per-ID batch truth.** `habit-actions.ts:347-363` accepts only `status:'reviewed'`, expected decision
  status, `already_reviewed`, `not_found`; requires uniqueness (`:351`), rejects missing/duplicate/
  out-of-scope/wrong-status rows (→ `unresolvedIds`), never derives per-ID success from counts.
  `BulkTaskReview.tsx:62-63` removes only explicit `acknowledgedIds`; unresolved selection is retained.
  E2E `missing-results`/`wrong-status`/`partial` pass.
- **ACK+stale gating.** `habit-actions.ts:342-345` adds blocked on failed reload, `:335-337` refuses a
  blocked batch without sending; `reward-actions.ts:171,182` block acknowledged/unknown rows; UI disables
  affected rows (`isReviewBlocked`/`isRedemptionBlocked`, `store.tsx:1404-1405`) and offers refresh-only.
  `syncNow` clears blocked only on a real successful sync (`store.tsx:474-481`).
- **Partial approve+deliver.** `reward-actions.ts:143` rejects a mismatched `redemptionId`; `:144-148`
  accepts only the exact expected status; `approved` is set only by a local approved row or an exact
  `approved` ACK (`:165,168-175`), so `invalid_transition` can never set it; `:184` reports
  `unfulfilled` only for `approved && deliver && command!=='delivered'`. Unit tests cover
  approved-unfulfilled, lost deliver, wrong-status, invalid-transition non-proof, different-ID.
- **Factory-recreation guards are family/user scoped.** `parentOperations` is memoized on
  `[currentUser?.id, familyId]` and shared by both action factories through getter closures
  (`store.tsx:469-473,1054,1079`); queue remount cannot discard them (E2E `lost committed reward answer`).
- **All-family scope, not child-filtered.** `pendingLogs`/`queueRedemptions` are unfiltered
  (`ParentApprovalsTab.tsx:93-96`); the child chips only drive the summary card (`:204-220`); scope labels
  are present on tasks, rewards and the bulk summary (`:231,270`, `BulkTaskReview.tsx:87,137`). Selector
  rename and parent-today spec updated (`tests/e2e/parent-today.spec.ts`).
- **Copy is complete in 9 locales.** `parent-approvals-copy.ts` (15 keys ×9) and `parent-actions-copy.ts`
  define every truthful state; `parent-approvals-copy.test.ts` asserts presence and no VI leakage.

## Verification evidence (read-only, reproduced where bounded)

- Focused units: I reran `tests/unit/habit-actions.test.ts reward-actions.test.ts
  domain-command-client.test.ts parent-approvals-copy.test.ts parent-today-copy-languages.test.ts`
  → **106/106 pass**, then `tests/unit/parent-actions.test.ts` → **7/7 pass** (total 113, matches the
  GPT report; `/tmp/phase01-review-unit.log`, `/tmp/phase01-review-parent-actions.log`).
- GPT artifacts: ESLint log empty/exit0, `npm run typecheck` exit0
  (`/tmp/phase01-resumed-eslint.log`, `/tmp/phase01-resumed-typecheck.log`).
- Parent E2E: first scoped run `14 passed` (`/tmp/phase01-resumed-e2e-01.log`); the expanded 16-case run
  was `14 passed / 2 failed` (`/tmp/phase01-resumed-e2e-final.log`, `.last-run.json` failed) — the two
  failures were harness-level (entry stuck at `data-app-mode=loading`; `partial batch` element-not-found)
  and the just-finished confirm rerun is **16 passed / exit0**
  (`/tmp/phase01-resumed-e2e-confirm.log`, `/tmp/phase01-resumed-pw-confirm/.last-run.json`). I do not
  infer the final pass from the flaky run; the 16/16 confirm is the evidence.
- Report gap: `execution/phase01-resumed-gpt.md` ends with "Parent E2E final result is appended below"
  but no result was appended; add the 16/16 confirm result and log path.

## Missing / suggested tests (non-blocking beyond B1)

- Route-faithful 403: unit + E2E using the exact `{ error, code }` body from
  `parent-unlock.ts:117` (and cross-site 403), not just `{success:false}`.
- Guards across action-factory recreation: call `createHabitActions`/`createRewardActions` twice against
  the same operations object and assert busy/blocked persist (E2E only covers tab remount).
- Missing `redemptionId` on the ACK path: assert status-only responses still behave as intended, or make
  the ID required. Note the real SQL returns `{status}` only
  (`supabase/migrations/202609190004_authoritative_domain.sql:170-198`), so the different-ID guard is
  currently only exercised by a synthetic field.
- `parentApprovalsCopy.reconcileMessage` is defined in all 9 locales and asserted by
  `parent-approvals-copy.test.ts` but never rendered (`grep` shows only the copy file) — either use or
  drop it.

## Not reviewed / excluded

No child04b, header/ThemeSelector, font/font-settings, timer/globals, layout, detector/screenshot,
build/dev/deps/global-config/commit/deploy work, and no full Vitest (known 04b reds not retried). Runtime
evidence is Chromium/vi-VN on the root 3107 server; nine-locale completeness is unit-only.
