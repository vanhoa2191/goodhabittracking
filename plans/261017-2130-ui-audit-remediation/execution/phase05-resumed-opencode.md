# Phase 05 — resumed execution report (OpenCode)

- Date: 2026-10-19
- Status: ready-for-review with two explicit verification gaps (mobile locale E2E after the last CSS fix; after screenshots). Not accepted.
- Base commit: `83b118367fead8a79f7918c928e4f92dbdd0590e`
- Producer: OpenCode. Reviewers: AGY Gemini / Kilo. Next owner: 06/07.
- Checkout: shared. Unrelated `.gitignore`, `.impeccable/`, `docs/research/`, `DESIGN.md`, `PRODUCT.md`, Kid/Header/globals/timer/font and other workers' dirty files were preserved and not edited by this task.

## Contract and composition

- Kept the Phase01 truthful outcomes, recovery path, guards and PIN flow unchanged.
- Kept the three parent primary areas, deeplink/query behavior, PIN/pairing, and tab keyboard semantics unchanged.
- Family inbox now leads, before the per-child summary:
  - meaningful `h1` parent title (same typographic scale) in `ParentDashboard.tsx`;
  - `h2` family inbox (`parent-family-inbox`) and `h2` per-child summary (`parent-child-summary`);
  - `h3` nested queue/card headings.
- Child selector moved inside the later summary section and is labelled as summary-only; it never filters the family queues.
- The parent intro was compacted on mobile while keeping the title, slogan, lock action and identity.
- Actionable counts use the Phase01 queue contract: pending tasks + pending redemptions + approved-but-undelivered redemptions. The nav badge consumes the same count.
- Empty inbox shows an honest explanation and a `manage tasks` CTA, with no approval action.
- Added all required copy in nine locales:
  - `summaryTitle`, `summaryScopeNote` in `src/lib/i18n/parent-today-copy.ts`;
  - `inboxTitle`, `inboxEmptyBody` in `src/lib/i18n/parent-approvals-copy.ts`.

## Files changed by this task

- `src/components/ParentDashboard.tsx`
- `src/components/ParentApprovalsTab.tsx`
- `src/components/BulkTaskReview.tsx` (presentation/heading wrapping only for this final fix; the file also contains accepted Phase01-safe recovery behavior from the shared branch)
- `src/lib/i18n/parent-today-copy.ts`
- `src/lib/i18n/parent-approvals-copy.ts`
- `tests/e2e/parent-today.spec.ts`
- `tests/e2e/parent-navigation-locales.spec.ts` (targeted task-help-trigger bounds assertion added)
- `tests/unit/parent-today-copy-languages.test.ts`
- `tests/parent-approvals-copy.test.ts`
- `plans/261017-2130-ui-audit-remediation/execution/phase05-cleanup-plan-opencode.md`

## Regression lock (written before implementation)

- Three new E2E regressions in `tests/e2e/parent-today.spec.ts`:
  - inbox precedes summary, selector inside summary, heading outline;
  - actionable count `3` (1 task + 1 pending redemption + 1 approved-undelivered redemption) with child identity;
  - mobile inbox visibility/long names, and truthful empty inbox with CTA and no approval button.
- Extended the nine-locale unit copy tables for the four new labels.
- Intentional red runs captured before source edits:
  - 5 failed / 12 passed in the two copy files (new keys undefined);
  - 3 failed in `parent-today.spec.ts` (new inbox test IDs absent).
- Logs: `/tmp/phase05-resumed-unit-red.log`, `/tmp/phase05-resumed-e2e-red.log`.

## Verification results

### Green

- Focused unit/copy suite: `npx vitest run tests/unit/parent-today-copy-languages.test.ts tests/parent-approvals-copy.test.ts tests/unit/parent-actions.test.ts tests/unit/habit-actions.test.ts tests/unit/reward-actions.test.ts tests/unit/domain-command-client.test.ts tests/unit/ui-audit-child-store-truth.test.ts` — exit 0, 7 files, 146/146 tests. Log: `/tmp/phase05-resumed-final-unit.log`.
- `npx tsc --noEmit` — exit 0. Log: `/tmp/phase05-resumed-final-tsc.log`.
- Scoped ESLint on the owned parent/copy/test files — exit 0. Log: `/tmp/phase05-resumed-final-eslint.log`.
- `tests/e2e/parent-today.spec.ts` — 6/6 Chromium pass, including the three new Phase05 tests. Log: `/tmp/phase05-resumed-e2e-parent-today.log`; artifacts: `/tmp/phase05-resumed-pw-parent-today`.
- `tests/e2e/parent-section-url.spec.ts` — 4/4 pass.
- `tests/e2e/parent-panels.spec.ts` — both tests pass (including empty approvals).
- `tests/e2e/phase02b-contrast.spec.ts` — 1/1 pass. Log: `/tmp/phase05-resumed-e2e-contrast.log`.
- A02/A04 audit suite — 15/16 pass. The single A04 reward-delivery failure (`approve` observed without `deliver`) passed on isolated rerun (1/1); this is an existing timing flake and the test was not weakened. Logs: `/tmp/phase05-resumed-e2e-a02a04.log`, `/tmp/phase05-resumed-e2e-a04-retry1.log`.

### Red before the final fix

- `tests/e2e/parent-navigation-locales.spec.ts` failed at `de should fit 375px`; measured `scrollWidth` 377 at 375. Root independently isolated the offender as the task-queue `HelpTip` trigger (`right 377.09`, 47.5 px rendered). Log: `/tmp/phase05-resumed-e2e-parent-suite.log`; artifacts: `/tmp/phase05-resumed-pw-parent-suite`.

### Final CSS fix and verification gap

- Fixed the queued-heading rows in `ParentApprovalsTab.tsx` and `BulkTaskReview.tsx`: `flex-wrap`, `min-w-0`, `break-words` on heading text/badges, `shrink-0` on icons; the 44px help target is preserved. Added a targeted assertion in `parent-navigation-locales.spec.ts` that the `approvals.tasks` help trigger stays inside the 375px viewport in every locale.
- The coordinator-owned dev server at `http://localhost:3107` went down during this work (connection refused; no `next dev` process) and remained down. Per task constraints I did not start `next build`/`next dev`. Therefore:
  - the CSS fix and the new help-trigger assertion have **not** been exercised in a browser;
  - the nine-locale `parent-navigation-locales.spec.ts` is **not** claimed green;
  - the required after visual capture/inspection was not possible.
- This matches root guidance: report the limitation transparently and do not claim the locale E2E is green. Re-run `parent-navigation-locales.spec.ts`, `parent-today.spec.ts`, contrast, and the after captures once the Phase07 E1/dev server is running.

## Visual evidence

- Before, same fixtures: `.omx/ui-execution/parent-before/parent-375-light.png`, `.omx/ui-execution/parent-before/parent-1280-light.png`, `.omx/ui-execution/parent-before/metrics.json` (vi, 108%, 2 profiles, 1 pending task, 1 pending redemption, 1 approved-unfulfilled redemption). The 2099 trial expiry/extreme-day badge is fixture-only, not a product claim.
- After: not captured (server unavailable). Root owns final images and currently holds a revise verdict until the 375px server run.
- Pre-fix failure screenshot: `/tmp/phase05-resumed-pw-parent-suite/parent-navigation-locales--d9450-in-every-supported-language-chromium/test-failed-1.png`.

## Residual risks / open gates

1. Mobile German (and the full nine-locale loop) needs re-running after the CSS fix; this is the only known Phase05 exit-gate gap.
2. After visual capture and root visual verdict are pending.
3. A04 reward-delivery timing flake can recur; it is pre-existing, not caused by this presentation patch.
4. No `next build`/dev, detector, suppression, deploy or commit was run. No data migration or store semantics were changed.

## Handoff

See `plans/261017-2130-ui-audit-remediation/handoffs/phase-05.md` for the review packet and the exact remaining gate.
