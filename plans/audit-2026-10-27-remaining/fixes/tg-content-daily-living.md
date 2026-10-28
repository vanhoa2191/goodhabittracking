# Fix report — tg-content + daily-living

## Thinking games

- **TG-C01 — confirmed and fixed.** `g04-t1` now renders cards in `board.options` order, the generator stores candidates in that same order and numbers its explanation from the displayed answer index, and the player corrects saved explanation numbering against the current board order. The candidate checker measures the order actually rendered.
- **TG-C02 — confirmed and fixed.** Grouping option order now uses one deterministic display-order helper shared by the generator, component, and candidate audit. The audit checks `g05-t2` per age track and rule variant, so a bias in an individual mode cannot disappear in the game-type aggregate.
- **TG-C03 — confirmed and fixed.** V2 batch/catalog metric counters now start at zero; quality totals are copied from the measured metrics and finite-checked before status is set. A read-only catalog run reports 137 duplicate fingerprints and 434 normalized collisions, with `quality.blocked=true` instead of zero/NaN.
- **TG-C04 — confirmed and fixed.** Missing-info cards show a Vietnamese ordinal instead of `candidate-*`; quantity-target accessible names use `Món số N` instead of `item-*`.

## Daily living

- **Shared assignment overlap — confirmed and fixed.** An active child-specific assignment blocks changing the same template to shared scope; the action returns failure so the library can show its unconfirmed-save state. Another child may still receive a separate assignment, and archived child assignments do not block a shared one.
- **Mixed-language cue — confirmed and fixed.** `WIT-DLY-07` now says “Sau khi thay đồ”; a catalog regression check rejects CJK characters in Vietnamese copy.

## Files changed

- Thinking games: `scripts/check-thinking-games-candidates-v2.mjs`; `src/lib/thinking-games/display-order.ts`; `src/lib/thinking-games/index.ts`; `src/lib/thinking-games/mechanics/remaining.ts`; `src/components/thinking-games/ReasoningEliminationGame.tsx`; `src/components/thinking-games/QuantityGroupingGame.tsx`; `src/components/thinking-games/ReasoningMissingInfoGame.tsx`; `src/components/thinking-games/QuantityTargetGame.tsx`; `src/components/thinking-games/ThinkingGamePlayer.tsx`; `tests/unit/thinking-games/round2-content-fixes.test.ts`.
- Daily living: `src/lib/store/activity-actions.ts`; `src/data/daily-living-habits-v1.vi.json`; `tests/unit/daily-living-habits.test.ts`; `tests/unit/activity-actions.test.ts`.

The shared display-order helper keeps renderer and audit order in one implementation. No dependencies were added.

## Verification

- Vitest: `round2-content-fixes`, `daily-living-habits`, `activity-actions` — 3 files / 60 tests passed. A final daily-living/action rerun after the action return-value change — 2 files / 37 tests passed.
- TypeScript `tsc --noEmit` — passed.
- ESLint on the changed TypeScript and checker files with `--max-warnings=0` — passed.
- `node scripts/check-thinking-games-content.mjs` — release/editorial/pilot validation passed; the pilot-as-release and placeholder fixtures failed as expected.
- `node scripts/check-thinking-games-release-bundle.mjs` — passed; 1,460 items, manifest digest still matches its existing pin.
- V2 `checkAll({write:false})` — status `fail`, with 137 duplicate fingerprints, 434 normalized collisions, `quality.blocked=true`; its only error code is `provenance` because stored candidate records still carry the previous engine hash.
- `node --check` on the V2 checker, JSON parse of the Vietnamese catalog, and `git diff --check` — passed.

## Remaining risks and owner decision

Per coordinator direction, stored candidate/release JSON, hashes, and release pins were not changed because that requires owner reapproval. The candidate artifacts need regeneration and reapproval before their provenance check can pass; no migration, deployment, or live data was touched. The shared-scope guard runs against the local activity snapshot and in-flight requests; cross-tab/server concurrency still needs a server-side invariant if simultaneous writes must be serialized.
