# Phase 00 — OpenCode independent source verification → Phase 01 implementation packet

Owner: OpenCode (open-code default). Lifecycle managed by the Orca shell runner; this file is the only artifact written in this dispatch.
Status: `ready-for-review` (Phase 00 verification). **No Phase 01 code written; no application/test file edited.**
Depends: plan/test-spec/phase-00/phase-01 read; audit text cross-checked against actual source.

## 0. Provenance and constraints honored

- Repo: `/home/opc/orca/goodhabittracking`, branch `main`.
- Identity: plain `git rev-parse HEAD` = `83b118367fead8a79f7918c928e4f92dbdd0590e`. Note discrepancy: `rtk git log -1` reports `d0b5f99 fix(pricing:…)`, i.e. the `rtk` git wrapper is reading a different ref/index than plain git in this checkout. **Neither hash is claimed as a Phase 01 base; coordinator decides which is canonical.** No commit was created.
- Node: `v26.11.1` (`/home/opc/.nvm/versions/node/v26.11.1/bin/node`) — Node26 via provided PATH; used only for `node --version`.
- Dirty tree preserved, not touched: ` M .gitignore`; untracked `.impeccable/`, `docs/research/`, `.playwright-mcp/`, `plans/261017-2130-ui-audit-remediation/`. Nothing cleaned/reset/stashed.
- All shell used `rtk`. No new dependencies, no build, no dev server, no tests, no deploy, no other agents, no global settings.
- This is independent source verification, not acceptance of Phase 01.

## 1. Verified current contracts (from code, not audit prose)

### 1.1 Habit actions — `src/lib/store/habit-actions.ts`
- `HabitActions` (51–56): `approveLog(logId): void` (53), `rejectLog(logId): void` (54), `reviewLogs(logIds, decision): Promise<BatchReviewOutcome | null>` (55).
- `BatchReviewOutcome` (58–63): `{ approved; rejected; skipped }` — counts per log.
- Cloud single review `reviewCloudLog` (100–118): fire-and-forget `void requestDomainCommand({type:'reviewHabit',…})` then `syncCloudFamily`; analytics only if `synced && result.status ∈ {approved,rejected}` with real `approvalLag` bucket from `log.completedAt`; on error only `setCloudSyncActive(false)` + `console.error`. **No returned result.**
- `approveLog` (279–296) / `rejectLog` (340–350): cloud → `reviewCloudLog` (silent, void); demo → local `approvePendingLog`/`rejectPendingLog`, real-bucket analytics, `sounds.playTaskComplete` / `playClick`.
- `reviewLogs` (297–339): dedups + caps at `MAX_BATCH_REVIEW` (`:298`, limit 50 — verified `domain-rules.test.ts:33`); demo path updates state locally with sound + `approvalLag:'unknown'` (`:317`); cloud path requires user else `null` (`:320–321`), sends one `reviewHabits`, maps **per-row** `result.results[].status` → approved/rejected/skipped (`:324–329`), then `await syncCloudFamily(user)` **whose boolean is ignored** (`:330`), and `catch → null` (`:335–338`). So “unknown outcome” and “command failure” and “command-ok/refresh-failed” are currently all conflated.

### 1.2 Reward actions — `src/lib/store/reward-actions.ts`
- `RewardActions` (39–47): `approveRedemption(id): void` (40), `deliverRedemption(id): void` (44), `rejectRedemption(id): void` (45); `claimReward` is already `Promise<boolean>`.
- `persistCloudTransition` (114–128): `void requestDomainCommand({transitionRedemption})` → `.then(syncCloudFamily)` → `.catch(log)`. **Result status ignored; sync failure (which cannot throw, see 1.5) is invisible.**
- `deliverRedemption` (259–288): cloud chains `approve` → `deliver` → `syncCloudFamily(user)`, all void, `.catch` only logs. **Does not distinguish approve-success/deliver-failure; does not inspect `status`; refresh failure invisible.**
- `approveRedemption` (247–258), `rejectRedemption` (289–300) → `persistCloudTransition`.
- `applyLocalTransition` (93–112) demo-only via `transitionLocalRedemption`; local demo `deliver` is allowed from `pending` **or** `approved` (`local-domain-actions.ts:166`) — i.e. demo deliver implicitly skips approve. **Cloud deliver requires server status `approved`** (see 1.4). Parity gap to note for outcome semantics.
- Callers (repo-wide): `approveRedemption` has **zero** callers outside `store.tsx` declarations/wiring + `reward-actions.ts` (safe to change). `deliverRedemption`/`rejectRedemption` called only from `ParentApprovalsTab.tsx:141/140`.

### 1.3 Store surface — `src/lib/store.tsx`
- Declarations 184–197: `approveLog/rejectLog` void (184–185), `reviewLogs` Promise (186), `approveRedemption/deliverRedemption/rejectRedemption` void (195–197).
- Wiring: habit actions 1032–1054; reward actions 1056–1080; context value exports at 1347–1360.
- `syncNow(): Promise<void>` is **already exposed** in the store context (`src/lib/store.tsx:218`, provided `:1378`; defined `use-cloud-family-identity.ts:180–182` → `syncCloudFamily(currentUser)`). This is an existing refresh entry point usable by the Phase 01 UI recovery path — **no new store method needed for refresh recovery**.

### 1.4 Server command semantics (real atomicity/transition evidence)
- Route `src/app/api/domain/commands/route.ts`: `reviewHabits`→`review_habits_command` (31–35); `transitionRedemption`→`transition_redemption_command` (45–49); both PIN-gated (`:80–84`); any RPC error → HTTP 409 `{success:false}` (`:90–93`), which `requestDomainCommand` throws on.
- **Bulk is one SQL transaction:** `supabase/migrations/202610040001_review_habits_batch.sql:8–51`. It is a single `plpgsql` function: `raise exception` (membership, manage rights, invalid decision, empty, `>50`) aborts the whole RPC (all-or-nothing). Row locks are taken logs-first then children, each in id order (`:30–36`), matching single-review lock order → no deadlock, concurrent-device safe. Per log it calls `review_habit_command` and appends `{logId, status}` to `results` (`:38–47`), emitting `not_found` itself. Atomicity evidence = one RPC/one transaction; per-ID outcomes are **authoritative server results**, not inferred from aggregates.
- `review_habit_command` (`202610090030_family_operations_hardening.sql:457–493`): returns `status ∈ {already_reviewed (474), rejected (479), approved (491)}`; raises only `log_not_found`.
- `transition_redemption_command` (`…:595–638`): returns `approved/delivered/rejected/invalid_transition` (617–636) — **invalid transitions are statuses, not exceptions**. Client can therefore distinguish outcomes via `result.status`.
- Result schema `domain-command-client.ts:9–39` already types `results[]` (`reviewedLogSchema`), and all redemption statuses incl. `invalid_transition`. `requestDomainCommand` throws `DomainCommandRequestError` only on HTTP/invalid-response (`:61–84`).

### 1.5 Refresh semantics — `src/lib/store/use-cloud-family-identity.ts`
- `syncCloudFamily` (113–158) **never throws**: it catches and returns `false` (151–158); returns `false` for no user/supabase (114–117). Implication: “command succeeded, refresh failed” is observable only via the **boolean**, never via `catch`.

### 1.6 Parent UI — `src/components/ParentApprovalsTab.tsx`
- Destructures `approveLog/rejectLog` (33–34) and `deliverRedemption/rejectRedemption` (38–39); does not destructure `reviewLogs`/`syncNow`.
- Selector (57–71): `role="group" aria-label={todayCopy.chooseChild}` = `'Chọn bé'`; **only selects `chosenChildId` for the summary card**, never filters the queues (`pendingLogs`/`pendingRedemptions` are family-wide, 46–48). This matches D03 all-family queue.
- Task queue renders **only when `dailyEase` is false** (80–113); heading `copy.pendingTasks (n)` (83–84) has no all-family scope label; row buttons call `rejectLog`/`approveLog` (105–106) with **no busy state, no disabled, no error/result message, no focus target**.
- Reward queue always renders (115–148), heading `copy.pendingRewards (n)` (118), buttons `rejectRedemption`/`deliverRedemption` (140–141), same missing async feedback. Container has `id="pending-rewards" tabIndex={-1}` (115) — usable as a focus fallback; the inline task card has **no** id/tabIndex.
- `dailyEase` = `defaultExperienceFlags.dailyEase` (50) = `process.env.NEXT_PUBLIC_DAILY_EASE === 'true'` (`experience-flags.ts:16`), default **off**. When on, `BulkTaskReview` (80) is the task surface.

### 1.7 Bulk UI — `src/components/BulkTaskReview.tsx`
- Uses `reviewLogs` (16, call 35); **already** has `busy` guard (23,32), disabled buttons (106,115), `aria-live` result region and `data-testid="bulk-result"` (100,126), selection summary `bulk-selection-summary` (101), scope-derived `chosen` (27) and `pendingIds` (21). This is the reuse pattern Phase 01 must mirror.
- Selection summary lists child names/counts (28,101) but the heading (53–54) has no explicit all-family scope label.

## 2. Minimal async changes required (A04) — bounded proposal

### 2.1 Redemption outcome contract (reward-actions.ts + store.tsx declarations only)
No new deps, no schema/domain/PIN change, no store rewrite. Replace three `void` signatures with an awaitable, discriminated outcome:

```ts
export type RedemptionCommand = 'approved' | 'delivered' | 'rejected' | 'invalid_transition' | 'failed';
export type RedemptionRefresh = 'synced' | 'stale';
export type RedemptionOutcome = {
  readonly command: RedemptionCommand;
  readonly refresh: RedemptionRefresh;
  /** true only when approve committed server-side but the following deliver did not. */
  readonly unfulfilled?: true;
};
```
- `approveRedemption`: await command; `result.status==='approved'` → `approved`, else `invalid_transition`; refresh from `syncCloudFamily` boolean. No caller exists → signature change is caller-safe.
- `rejectRedemption`: `rejected` / `invalid_transition` / `failed`; refresh from boolean.
- `deliverRedemption` (the critical partial path):
  1. `approve` command. If it throws → `{command:'failed', refresh:'stale'}` (no local mutation; row stays pending — correct, don't fake pending→approved).
  2. If approve status `approved`: run `deliver`. If deliver throws or returns `invalid_transition` → `{command:'approved', refresh:'stale', unfulfilled:true}` → UI keeps the row / shows “Đã duyệt, chưa giao” recovery with a retry that re-runs only deliver (`approve` on an approved row returns `invalid_transition`, a no-op, so re-calling `deliverRedemption` is safe and idempotent server-side; no duplicate side effect).
  3. If deliver status `delivered`: `{command:'delivered', refresh: synced|stale}`. `refresh:'stale'` means command committed + refresh failed → UI says “Đã giao, chưa làm mới danh sách”, recovery = `syncNow()` (existing) / re-read, **not** re-issuing the command.
  - `approve` returning `invalid_transition` when the row was already approved/delivered: treat as “already advanced”, proceed to deliver; final status governs.
- Keep `claimReward`, `persistReward`, demo `applyLocalTransition` untouched. Demo parity note: demo deliver commits `delivered` in one step (no unfulfilled state) — document in handoff; do not invent an artificial unfulfilled state in demo.
- `ParentApprovalsTab` awaits these, maps to localized copy + keeps the row on failure/unknown, announces success before/with removal, and moves focus to the next row or `#pending-rewards`.

### 2.2 Single review reuse (no new wrapper, per D01/plan)
- Inline task buttons in `ParentApprovalsTab` (dailyEase-off) switch to `await reviewLogs([log.id], decision)` (`habit-actions.ts:297–339`), guarded by per-row busy/disabled so one logical click = one network request (server already returns `already_reviewed`→`skipped` on a race, but the client guard is required by the exit gate).
- Keep `approveLog`/`rejectLog` signatures and implementations untouched (legacy callers = unit tests only: `tests/unit/habit-actions.test.ts:159–160,361,380,390`).
- **Truthful parity deltas to record (no fabrication):** via `reviewLogs`, analytics `approvalLag` becomes `'unknown'` (vs real bucket in `approveLog`), and demo sound becomes one `playTaskComplete`/`playClick` per call (same perceived result); cloud single review had no sound before either. If the reviewer requires the real `approvalLag` bucket for single rows, that requires editing `habit-actions.ts` (`reviewLogs` has no `log` context) — **out of the currently opened scope**; see §7 Q1. Recommend accepting `'unknown'` as truthful.

### 2.3 Bulk sync/unknown recovery (small, within `habit-actions.ts:297–339`)
- Use the `syncCloudFamily` boolean: if `false` after a successful command, still return the authoritative `outcome` **plus** a stale marker so `BulkTaskReview` can say “đã duyệt, chưa làm mới — đối chiếu lại” instead of implying the local list is current.
- Do not replay the whole previous selection after timeout; on retry resend only currently-pending+selected IDs (BulkTaskReview already derives `chosen` from live `pendingLogs`, `:27`). Unknown/catch → null → keep “reviewFailed”, and after recovery reconcile pending IDs.
- Any signature widening here (`BatchReviewOutcome` + stale flag) touches a shared type used by `store.tsx:186` and `BulkTaskReview.tsx`. Prefer a non-breaking optional field.

## 3. Bulk atomicity evidence (A02/D05.4)
- **One RPC = one transaction** (`review_habits_batch.sql:8–51`): hard validation failures abort everything; no partial writes. Evidence is the SQL source and the single `requestDomainCommand` call at `habit-actions.ts:323` (verified by `habit-actions.test.ts:452`, called once).
- **Per-ID truth:** the RPC returns `results[]` with per-log `status` (`:38–47`); client maps per row (`habit-actions.ts:324–329`) — aggregate counts are derived from per-ID server results, **not** inferred. This satisfies D05.4’s “không suy per-ID từ aggregate”.
- **Concurrency/PIN:** row locks in id order (`:30–36`) prevent deadlock; concurrent second-device review yields `already_reviewed`→`skipped`; PIN/auth expiry surfaces as HTTP 409 → `requestDomainCommand` throw → `reviewLogs` null → “reviewFailed” while keeping selection context (existing behaviour). Re-sending already-reviewed IDs is safe (skipped).
- **Remaining gap:** command-ok/refresh-fail is currently indistinguishable (boolean ignored, §1.1). Address via §2.3, do not claim idempotency beyond server behaviour.

## 4. A02 scope labels (D03)
- Add all-family scope labels (9 locales) at: inline task queue heading (`ParentApprovalsTab.tsx:81–84`), `BulkTaskReview` heading (`:53–54`) + selection summary (`:101`), redemption queue heading (`:116–119`). Existing copy modules in scope: `parent-approvals-copy.ts` (interface 3–13), `parent-actions-copy.ts` (3–26), `parent-today-copy.ts` (`chooseChild` etc.). Keep `pendingTasks`/`pendingRewards` meanings; add explicit scope strings rather than rewriting persisted activity titles.
- Selector: rename accessible name toward “Xem tổng quan của …” per phase-01 line 13 **only if** the spec assertion is updated; `tests/e2e/parent-today.spec.ts:13` currently asserts group name **`Chọn bé`** — that assertion must move to the new name without dropping the scope assertions (`:14,19,21`). Keep the selector summary-only (do not half-filter the family queues).
- 9-locale coverage already enforced by `tests/unit/parent-today-copy-languages.test.ts:11` (key parity) and `tests/unit/independence-copy-languages.test.ts:20–45` (`parentActions` path parity, no Vietnamese leakage). `tests/parent-approvals-copy.test.ts:8–31` covers existing approvals keys → new keys need adding there.

## 5. Caller inventory (exhaustive, repo-wide)
- `approveLog`/`rejectLog`: `ParentApprovalsTab.tsx:33–34,105–106`; tests `habit-actions.test.ts:159–160,361,380,390`.
- `reviewLogs`: `BulkTaskReview.tsx:16,35`; tests `habit-actions.test.ts:412,423,433,450,462,471`. (Phase 01 adds `ParentApprovalsTab` single-row use.)
- `approveRedemption`: **no component caller**; only `store.tsx:195,1073,1358`, `reward-actions.ts:40,247`.
- `deliverRedemption`/`rejectRedemption`: `ParentApprovalsTab.tsx:38–39,140–141`; `store.tsx`, `reward-actions.ts`.
- Redemption tests: `tests/unit/reward-actions.test.ts:128,184`.
- No component reads `syncNow` for this flow yet (available at `store.tsx:218,1378`).

## 6. Test gaps (existing vs required by phase-01 exit gate / test-spec A02/A04/Bulk)
Gaps (nothing below runs in this dispatch):
1. **Single review outcome:** no unit test drives the single-row path through `reviewLogs` (only batch at `habit-actions.test.ts:397–476`); no test that one logical click sends exactly 1 request, nor per-row busy/disabled.
2. **Redemption async contract:** no test for approve-redemption; none for approve-ok/deliver-fail (`unfulfilled`); none for command-ok/refresh-fail (`syncCloudFamily`→false) for deliver/approve/reject; existing `deliverRedemption` test (`reward-actions.test.ts:161–191`) only asserts the happy two-command sequence + one sync, fire-and-forget.
3. **Bulk refresh-failure:** no test that a successful batch with failed refresh returns authoritative outcome + stale marker (current `reviewLogs` tests: `:439–475`, none set `syncCloudFamily`→false).
4. **UI feedback:** no test for keep-row-on-error, localized error, retry, announce-then-remove, or focus move in `ParentApprovalsTab` (inline queue and reward queue are untested in `tests/e2e/parent-today.spec.ts`; bulk bar only at `:39–42`).
5. **Scope labels/i18n:** new all-family label keys need assertions in `tests/parent-approvals-copy.test.ts` (and, if added to `parent-actions-copy`, covered by `independence-copy-languages.test.ts`); selector accessible-name change requires updating `parent-today.spec.ts:13`.
6. **Two-child fixtures:** test-spec A02 requires two children with both pending tasks and rewards, verifying selector does not change queue counts/IDs and bulk IDs stay in displayed scope — no such fixture exists in the current parent specs (smoke/parent-panels do not assert this).
7. **Typecheck of changed callers:** `store.tsx` declarations + `reward-actions.ts` + `ParentApprovalsTab.tsx` must typecheck together after signature change (`rtk npm run typecheck`).

## 7. Decisions requested from coordinator (no code until 00 accepted)
- **Q1 (non-blocking, parity):** Accept `approvalLag:'unknown'` for single rows reusing `reviewLogs`, or open a bounded `habit-actions.ts` edit to pass the real bucket? Plan line 9 says keep sensible semantics and don’t fabricate; recommendation: accept `'unknown'`, no habit-actions edit.
- **Q2 (scope):** Phase 01 owns `reward-actions.ts` + `store.tsx` declarations. The redemption outcome change also implies editing `ParentApprovalsTab.tsx` (already listed, in scope) and possibly widening the shared `BatchReviewOutcome` type for §2.3 (used by `store.tsx:186`, `BulkTaskReview.tsx`) — confirm an optional, non-breaking field is acceptable.
- **Q3 (canonical base):** Which commit is the Phase 01 base — plain-git `83b1183…` or `rtk`-reported `d0b5f99…`? Wrapper/ref divergence observed in this checkout.
- **Q4 (auth/PIN):** Confirm no need for new unlock handling in Phase 01 beyond the existing 409/PIN-expiry path (test-spec Bulk requires PIN-expiry/no-bypass coverage; current UI has no recovery surface for it — recommend keeping Phase 01 scope to surfacing the failure and preserving selection, deferring full PIN-expiry UX to Phase 05 if not required by the gate).

No human approval prompt is being raised; these are scoped implementation choices. If unreplied, recommendation is to accept Q1 `'unknown'`, Q2 optional field, Q3 defer to coordinator, Q4 keep-scope.

## 8. Bounded edit list for Phase 01 (for coordinator acceptance)
- `src/lib/store/reward-actions.ts` — redemption outcome contract + partial/sync handling; export outcome type.
- `src/lib/store.tsx` — action declarations 184–197 for changed signatures (and optional `BatchReviewOutcome` field import if §2.3 accepted).
- `src/components/ParentApprovalsTab.tsx` — single-row `reviewLogs` reuse with busy/disabled/error/announce/focus; redemption await + recovery copy; all-family scope labels; selector accessible name.
- `src/components/BulkTaskReview.tsx` — scope label + stale/unknown message handling.
- `src/lib/i18n/parent-approvals-copy.ts`, `parent-actions-copy.ts`, `parent-today-copy.ts` — 9-locale strings.
- Tests: `tests/unit/reward-actions.test.ts`, `tests/unit/habit-actions.test.ts`, `tests/parent-approvals-copy.test.ts`, `tests/unit/parent-today-copy-languages.test.ts`, `tests/e2e/parent-today.spec.ts`, plus new scope/mutation tests.
- Rollback: revert this patch set only; no migration/data rewrite; PIN/domain command IDs/`MAX_BATCH_REVIEW`/entitlements untouched.

## 9. What was verified / not done
- Verified from source: contracts above, server transaction/transition semantics, callers, existing tests, copy coverage tests, store wiring, `syncNow` availability, Node26, dirty-tree preservation.
- Not done (per instruction): no application/test edits, no lint/typecheck/test/build, no runtime or prod calls, no commit/deploy, no other agents, no lifecycle messages.

Next: coordinator reviews this Phase 00 packet; Phase 01 remains `not-started` until dispatched.
