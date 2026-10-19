# Phase01 parent completion — GPT

Status: in progress. Coordinator alone accepts Phase01. Session `01a15195-fd11-7f73-b7ec-bbf1e9794822`; new supervised implementation dispatch supersedes the previous test-only lane. Wrapper owns heartbeat/worker_done.

## Pre-edit cleanup and regression plan

1. Preserve current shared diff; inspect checkpoint, prior reports/review notes, accepted contracts and actual parent implementation. No child04b/appearance/font/timer/layout edits.
2. Add regression tests before implementation: actual HTTP refusal versus503/contradictory/invalid envelope; exact redemption ACK; batch per-ID completeness/duplicates/mixed outcomes and uncertainty; stateful parent E2E for committed/lost responses, repeated refresh failure, stale/opposite-command gates, partial selection and actual403 PIN recovery. Existing child A01 tests stay unchanged.
3. Replace message/name inference with a minimal typed client refusal classification. Reuse existing outcome types, extending per-ID metadata only where needed. Keep stable bounded busy/stale operation sets in the provider across factory recreation; gate affected IDs until a genuinely successful authoritative refresh. No lifecycle refactor/schema/dependency change.
4. Update existing parent queue handlers to honor ACK/unknown/stale outcomes, retain unresolved selection and show localized refresh-only recovery. Reuse incumbent semantic controls/colors; preserve all-family scope and approved-undelivered rows. Read installed Next docs and impeccable craft-floor immediately before UI edits.
5. Run only focused parent/client/copy units, targeted ESLint, full typecheck and external3107 parent E2E with unique output directories and stdout logs outside those directories. No full Vitest/build/dev/detector/capture loop.
6. Finish this report and phase-01 handoff ready-for-review with exact results, fingerprints and remaining outside-scope gaps. No whole-phase self-acceptance.

Simplification intent: remove duplicated redemption status/failure inference, share the existing queue recovery copy, and keep gates at the action boundary so unmount/remount cannot bypass them. Do not introduce a new architecture or unrelated refactor.
