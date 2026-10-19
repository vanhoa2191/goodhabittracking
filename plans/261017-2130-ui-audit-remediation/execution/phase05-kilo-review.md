# Phase 05 — Kilo source review (read-only)

## Verdict

**Approve source, pending the coordinator/root Phase 07 browser gate.**

No source defect was found that blocks acceptance. The Phase 05 parent-presentation
changes satisfy every item of the approved contract in
`phase-05-parent-experience.md` and the `phase05-cleanup-plan-opencode.md` target
composition. The single exit-gate item that cannot be closed here is the
**post-CSS-fix browser run** of `parent-navigation-locales.spec.ts` (German/375px
overflow) and the required *after* screenshots: the dev server on `localhost:3107` is
down (verified below), and this scope forbids starting `next dev`/`next build` or
browser tests. Per root guidance that gate stays Phase 07-owned.

## Scope of this review

Phase 05-owned files only (parent Today presentation), read against the working
tree diff from base `83b118367fead8a79f7918c928e4f92dbdd0590e`:

- `src/components/ParentDashboard.tsx`, `src/components/ParentApprovalsTab.tsx`,
  `src/components/BulkTaskReview.tsx`
- `src/lib/i18n/parent-today-copy.ts`, `src/lib/i18n/parent-approvals-copy.ts`,
  `src/lib/i18n/parent-actions-copy.ts`
- `tests/e2e/parent-today.spec.ts`, `tests/e2e/parent-navigation-locales.spec.ts`,
  `tests/unit/parent-today-copy-languages.test.ts`, `tests/parent-approvals-copy.test.ts`

`ParentNavigation.tsx` and `ParentTodayCard.tsx` are **unchanged** vs HEAD (diff
empty), as expected by the cleanup plan ("only changes if the count contract or tab
semantics require it"). Supporting store primitives (`isReviewBlocked`,
`isRedemptionBlocked`, `parentReviewSelection`, `parentOperations`, `syncNow: () => Promise<boolean>`,
`reviewLogs: BatchReviewOutcome`, `deliverRedemption/rejectRedemption: RedemptionOutcome`)
were read to confirm the components consume real, wired primitives — this supporting
store work is shared-branch/Phase 01-safe and was not authored by the Phase 05 patch.

## Findings by severity

### Sev 1 (blocking) — none in source
None. Every contract requirement below is satisfied in source.

### Sev 2 (needs change before accept) — none in source
None. No missing copy keys, no broken count contract, no heading-level violation,
no misleading approve action in the empty state.

### Sev 3 (non-blocking, documented) — residual risks / notes

1. **Open browser gate (root/Phase 07).** The 375px × 812 locale E2E
   `parent-navigation-locales.spec.ts` (the `de should fit 375px` overflow plus
   the new in-viewport `approvals.tasks` HelpTip assertion at
   `tests/e2e/parent-navigation-locales.spec.ts:28-34`) was **not exercised in a
   browser**: `curl http://localhost:3107` is refused and `ss`/`netstat` show nothing
   listening on 3107. The CSS fix is source-sound (see check 6) but is **not**
   claimed green. This is the only open Phase 05 exit-gate item.

2. **Empty-inbox redundancy (cosmetic).** When the family inbox is fully empty
   (`pendingCount === 0`), the new family-empty block
   (`parent-inbox-empty`, explanatory text + `manageHabits` CTA) renders *and* the
   per-queue sections still render their own `EmptyState` ("No tasks currently need
   approval" / "No reward requests are waiting") with a `0` count badge. Functionally
   correct and test-covered, but visually redundant. Not a contract violation (the
   exit gate forbids a *misleading approve action*, which is absent). Suggested
   Phase 07 polish: suppress the per-queue `0` sections when the whole inbox is empty.

3. **A04 reward-delivery timing flake.** Pre-existing, not introduced by this
   presentation patch; isolated rerun passes. Test not weakened
   (`tests/e2e/ui-audit-regression.spec.ts` region).

## Contract checks (source-verified)

1. **Family inbox before per-child summary; selector inside summary, summary-only.**
   `ParentApprovalsTab.tsx:205-230` renders `<section data-testid="parent-family-inbox">`
   (task queue + reward queue + action strip) **before**
   `<section data-testid="parent-child-summary">` at `:315`. The child selector group
   (`role="group"`, `aria-label={todayCopy.overviewOfChild}`) lives at `:325` **inside**
   the summary section and is labelled "summary-only". Queue rows/counts are computed
   from all logs/redemptions (not filtered by `focusChildId`), so selecting a child
   never alters the queues, the counts, bulk IDs, or deeplink/query behavior.
   `parent-today-copy-languages.test.ts:55-58` + `parent-today.spec.ts:104-105` cover this.

2. **Actionable counts include approved-but-undelivered redemptions.**
   `ParentDashboard.tsx:305-307` and `ParentApprovalsTab.tsx:100-102` both compute
   `queueRedemptions = redemptions.filter((r) => r.status === 'pending' || r.status === 'approved')`
   and `pendingCount = pendingLogs.length + queueRedemptions.length`. The nav badge
   (`ParentDashboard.tsx:332`) and the app-icon badge (`appBadgeCount` in
   `src/lib/parent-actions.ts`, fed `pendingRewards: queueRedemptions.length`) consume
   the same number. Fixture in `parent-today.spec.ts:118-131` asserts the inbox badge = `3`
   (1 task + 1 pending redemption + 1 approved-undelivered), the Today tab = `3`, the
   task heading `(1)`, the reward heading `(2)`, and the
   `redemption-awaiting` label — all matching source.

3. **Semantic h1/h2/h3 outline, localized.**
   - `h1`: `ParentDashboard.tsx:318` `{t.parentMode}` (e.g. "Phụ huynh" / "Parent Mode"
     in `src/lib/i18n/locales/*.ts`, 9 locales).
   - `h2`: inbox `ParentApprovalsTab.tsx:209` (`copy.inboxTitle`), summary `:319`
     (`todayCopy.summaryTitle`).
   - `h3`: task queue `:248`, reward queue `:270`; `ParentTodayCard.tsx:40` (`h3#parent-today-title`,
     unchanged). No `h2` was promoted/demoted into the queue/card level.
   - Localization confirmed: `parent-today-copy.ts` (overviewOfChild/summaryTitle/
     summaryScopeNote), `parent-approvals-copy.ts` (inboxTitle/inboxEmptyBody/allChildrenScope
     + queue-state copy), `parent-actions-copy.ts` (reviewedStale/reviewUnconfirmed/
     refreshed/refreshList), plus global `t.parentMode/manageHabits/approve/reject/delivered`
     in all 9 `locales/*.ts`.

4. **Empty inbox: honest next step, valid CTA, no misleading approve.**
   `ParentApprovalsTab.tsx:213-227`: when `pendingCount === 0`, renders
   `copy.inboxEmptyBody` + a `min-h-11` `manageHabits` button (44px target) wired to
   `onOpenHabits`; **no** approve/reject button is present. The per-queue
   `EmptyState` components also carry no action button. `parent-today.spec.ts:133-149`
   asserts the body text, `bulk-approve` count 0, and the CTA navigates to the Habits
   tab.

5. **Parent navigation: count, tab keyboard semantics, URL/deep-link, Phase 01 recovery.**
   `ParentNavigation.tsx` is unchanged: 3 area tabs (`today`/`design`/`family`) +
   per-section tabs, `role="tablist"`/`tab`/`tabpanel`, `aria-selected`/`aria-controls`,
   and `selectWithKeyboard` (ArrowLeft/Right/Home/End, `requestAnimationFrame` focus
   move) at `ParentNavigation.tsx:24-34,54-103`. Section IDs (`parent-area-*`,
   `parent-section-*`) are stable and label-independent (label changes do not alter
   URLs/IDs). Tab-keyboard recovery (Home→today→approvals) is asserted at
   `parent-navigation-locales.spec.ts:20-26`. Phase 01 recovery (blocked/reconcile
   retry) is preserved via `parentOperations.reviews.blocked`/`redemptions.blocked`,
   cleared on successful `syncNow`; `settle()` adds `stale` when reload fails
   (`src/lib/store/habit-actions.ts:385`; `src/lib/store/reward-actions.ts:197`).
   The `#pending-tasks` / `#pending-rewards` fragment targets are retained.

6. **Long localized headings + HelpTip target bounded at 375px; 44px touch targets.**
   The overflow fix applies `flex flex-wrap items-start gap-1` to the queue heading rows
   and `flex min-w-0 flex-wrap items-center gap-2` + `min-w-0 break-words` on the text
   span, with `shrink-0` on icons, in `ParentApprovalsTab.tsx:229,270` and
   `BulkTaskReview.tsx`. The HelpTip trigger is a fixed `h-11 w-11 shrink-0` (44 × 44px)
   at `HelpTip.tsx:134` — `flex-wrap` lets it drop to its own line when a localized
   heading + scope badge would otherwise exceed the 375px content width, so
   `taskHelpBox.x + taskHelpBox.width ≤ 375` is expected to hold. **This fix and the
   new assertion at `parent-navigation-locales.spec.ts:28-34` are NOT browser-verified
   (see Sev 3 #1).**

7. **Copy keys present in all 9 locales; child/scope labels clear.**
   `parent-today-copy.ts` and `parent-approvals-copy.ts` and `parent-actions-copy.ts`
   each contain entries for `vi, en, fr, de, it, es, zh, ja, ko`
   (`Record<Language, …>` over `Language = 'vi'|'en'|'zh'|'ja'|'ko'|'fr'|'de'|'it'|'es'`).
   `parent-today-copy-languages.test.ts:9-52` enforces key-set parity with `en` across
   all nine; `parent-approvals-copy.test.ts:9-38` enforces the new labels in all nine.
   Row child identity uses `child?.name`/`child?.nickname`; family scope is named by
   `allChildrenScope` ("tất cả bé"/"all children"/…) and the summary-only note by
   `summaryScopeNote` — both carried in all 9 locales.

## Checks actually ran (source-only; no dev server, no build, no browser)

- `git status` / `git diff HEAD -- <phase-05 files>`: confirmed the owned patch set and
  that `ParentNavigation.tsx`/`ParentTodayCard.tsx` are untouched vs HEAD.
- Read current source of the three parent components, three parent copy modules, and
  `HelpTip.tsx`.
- Read store wiring: `src/lib/store.tsx:507-519` (`parentOperations`, `syncNow`),
  `:1098-1145` (`createHabitActions`/`createRewardActions` wiring of
  `reviewOperations`/`redemptionOperations`), `:1450-1462` (provider surface
  `isReviewBlocked`/`isRedemptionBlocked`/`parentReviewSelection`).
- Read `src/lib/store/habit-actions.ts:100-107` (`BatchReviewOutcome`),
  `src/lib/store/reward-actions.ts:29-62` (`RedemptionOutcome`, `runParentTransition`),
  `src/lib/parent-actions.ts` (`appBadgeCount`).
- Read all four Phase 05 tests and traced each assertion to a source landmark (table
  above).
- Read the plan, handoff, cleanup plan, and the OpenCode resumed execution report.
- `curl http://localhost:3107` → refused (HTTP 000); `(ss|netstat) | grep 3107` → nothing
  listening. **Confirms the dev server is down, validating the browser-verification gap.**
- Did **not** run: `next dev`/`next build`, `tsc`, `eslint`, `vitest`, `playwright`
  (read-only scope; browser gate reserved for Phase 07).

## Source observations vs. browser-verification gaps

- **Source-correct / green:** count contract (3 = 1 task + 1 pending + 1 approved),
  h1/h2/h3 outline, family-inbox-before-summary ordering, summary-only selector,
  empty-inbox empty state + CTA + no approve button, nine-locale copy parity, 44px
  HelpTip target, Phase 01 recovery/blocked-set wiring.
- **Browser-unverified (open gate):** 375px × 812 layout for every locale *after* the
  final `flex-wrap`/`min-w-0`/`break-words`/`shrink-0` CSS fix, including the new
  `approvals.tasks` HelpTip in-viewport assertion
  (`parent-navigation-locales.spec.ts:28-34`). Source reasoning says it should pass; it
  is intentionally **not** marked green pending the Phase 07 E1 run.
- **No `next`/`.next` rebuild state inspected beyond process/port check**; no
  `tsconfig.tsbuildinfo`/cache claims made.

## Residual risk / handoff

- Root/Phase 07 must re-run `parent-navigation-locales.spec.ts` across all nine locales,
  re-run `parent-today.spec.ts`, then capture *after* 375×812 / 1280×900 screenshots on
  the E1 server before visual acceptance.
- A04 reward-delivery timing flake may recur (pre-existing, not caused by this patch).
- Rollback: revert only the Phase 05 presentation/copy/test patch against base
  `83b1183` (per `handoffs/phase-05.md:22`); keep Phase 01 bugfix logic and all
  unrelated shared-checkout changes. No store schema/data change.

Report written; awaiting Phase 07 browser gate for final accept.
