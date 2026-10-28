# Phase05 cleanup plan — OpenCode resumed 19Oct2026

Scope: parent Today presentation only. No store/habit/reward/kid/global/header/timer/font edits.
Preserve Phase01 truthful outcomes and Phase02 contrast.

## Target composition

1. Compact the parent intro banner (`ParentDashboard.tsx`) without removing the parent title,
   slogan, lock action, or identity. Use a meaningful `h1` for the parent title (same classes),
   `h2` for top-level inbox/summary sections, `h3` for nested queue/card headings.
2. `ParentApprovalsTab.tsx` order:
   - family inbox section (`h2`, explicit all-family scope and actionable count) containing the
     all-family task queue, reward queue (pending **and** approved-undelivered), family action
     strip, and the existing habit-support prompt as nested `h3` content;
   - per-child summary section (`h2`) below it containing the child selector, its explicit
     summary-only note, `ParentTodayCard`, and the existing habit progress/weekly cards.
3. Keep the selector inside the summary section only. Selecting a child must not change queue
   rows, counts, IDs, bulk selection or deeplink/query behavior.
4. `ParentDashboard.tsx` navigation pending count must match the Phase01 queue contract:
   pending tasks + pending redemptions + approved-but-undelivered redemptions.
5. Empty family inbox: truthful explanation plus a "manage tasks" next step; never an approval
   action that implies pending work.
6. `BulkTaskReview.tsx` only gets presentation/heading changes if the inbox wrapper requires it.
   `ParentTodayCard.tsx` keeps its `h3` under the summary `h2`. `ParentNavigation.tsx` only
   changes if the count contract or tab semantics require it; tab keyboard behavior is preserved.

## Copy

Add only the labels required by the approved composition, in all nine locales:
- family inbox heading and honest empty explanation;
- per-child summary heading and a summary-only scope note.
Existing queue/section titles and Phase01 error/recovery copy stay unchanged.

## Regression lock before source edits

E2E (parent-today spec, cloud fixture) covering:
- inbox precedes summary in DOM and reading order; selector is inside the summary section;
  heading levels are `h1` parent title, `h2` inbox/summary, `h3` queue/card;
- actionable badge/queue counts include an approved-undelivered redemption (1 task + 1 pending +
  1 approved = 3), rows carry child identity;
- 375x812 has a visible inbox entry or honest empty CTA, no horizontal overflow with long names;
- selector changes summary only; queues keep all-family rows/counts;
- empty family inbox shows the honest next step and no approval button.

Unit copy tests extend existing parent copy tables for the new keys in all nine locales.

## Verification

One red run before edits, focused source edits, then focused unit/E2E/typecheck/lint plus the
existing parent suites. One batched visual inspection and at most one fix confirmation. No
build/dev/detector/suppression runs; coordinator owns final captures.
