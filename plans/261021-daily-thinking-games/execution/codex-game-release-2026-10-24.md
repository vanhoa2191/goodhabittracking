# Approved thinking-games production release — resumed 2026-10-24

## Scope and authority

Recovered session `01a1664b-1c43-7062-ae42-bd99e670414f` records the product owner's explicit instruction: “phan game ok roi ma. Cho production di”, followed by approval to use production administration and “tiep tuc nhe. da log in”. This continuation completes that authorized game release. It does not claim independent editorial review or child-pilot observations.

Base main is `889c986f523dcb9342259a5456c5ffbcf6945fe2`; release branch is `feat/enable-approved-thinking-games`. Preserve unrelated shared-checkout changes. Git ownership and all production actions remain with root.

Approved release is `release-365-v1`: Vietnamese, age 6–8 and 9–12, 365 days with main and bonus, 1,460 approved items. Serving manifest SHA-256 is `dd623f9e19d98d72387fc3cd15470f1239a55baf6507bb1c9708ec2a22f1010e`. The prior session already set repository variable `NEXT_PUBLIC_THINKING_GAMES=true`; fresh readback confirms it. No family is enabled automatically.

## Recovered state and repair

Supabase login works for project `evkwelozdcmsmwdzhlxz`. Schema preflight passes. Fresh aggregate readback found the content table empty; the prior multi-statement query returned only its final resolver result and did not prove content import.

The serving catalog is now bundled server-side for Cloudflare instead of depending on repository filesystem access. Successful validation is cached per isolate, after checking the runtime flag on every call. The new cache regression failed before the repair and passed afterward; toggling the flag still immediately denies admission.

Local import artifacts under `/tmp/codex-game-resume-20261024/import/` use the existing schema projections plus non-secret editorial/source metadata required by approved-item reconstruction. Private grading data stays separate. All 1,460 rows roundtrip exactly, with recomputed fingerprints and no private answer fields in public payloads. Isolated PostgreSQL 17 execution proved import, exact equality, no-rewrite idempotency, mismatch rejection and rollback. Import uses 15 independently atomic batches, never overwrites existing content, and rejects mismatches.

## Production data receipt

Root executed all 15 guarded import transactions successfully. Fresh independent readback compared every field: **1,460 matched, zero missing, zero mismatched**. Each track has 730 approved Vietnamese items spanning days 1–365, with 365 main and 365 bonus entries; zero private answer fields in public payloads. Receipts are `import/batch-*.receipt.log` and `import/verify-*.receipt.log` in the evidence directory. The production schema was not modified.

## Verification and publication

First fresh full lint/typecheck/test sequence passed: 344 files / 3,732 tests, 166.82 seconds. Cache regression separately failed before implementation and passed after it. The existing audit then blocked on newly published [Zod advisory GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5); its patched version is 4.6.6. Updated only the existing direct Zod dependency and its lock entry from 4.6.5 to exact 4.6.6, without a new dependency or audit exception. Full final CI is being rerun against this dependency and the cache repair.

Initial publication is commit `06abe1b017f680497e04abfd15f1bc61d56de44a`, [PR203](https://github.com/vanhoa2191/goodhabittracking/pull/203). Root verified the exact 14-file staging allowlist, staged whitespace and secrets before committing/pushing. Zod audit now passes. The post-patch full suite found exactly three V2 engine-provenance failures (3,729 passed); lint/typecheck still pass. PR quality also failed, while SQL and marketing build passed. This failed run is not acceptance evidence.

The engine hash includes bundled Zod, so the required patch changes the canonical hash. The existing V2 generator was rerun, changing engine hash from `f649e4224478fc181cb844ff27a88149e7a9c9602949ace0ae66da3c12ae71c3` to `e2ee48b85e3f760d54d6550ca8fc7d1fc135f193bfceb5bc6155543dacdd0848`. All seven generated documents compare equal after omitting only engine identity fields; all 2,920 puzzle contents, IDs, fingerprints and copy are unchanged. The serving manifest and pin are byte-identical, and the production import remains valid. Generator/audit evidence is retained under `provenance/` in the evidence directory.

Provenance repair committed and pushed as `7a1f5c5`, with root independently comparing all generated documents and audits against their exact saved originals, verifying the unchanged approved digest, and checking the exact 14-file follow-up index. Focused provenance tests pass 16/16. The 2,920-item checker and all five batches pass with zero errors; the existing capped 250 review warnings remain unchanged. Root cancelled the superseded failed CI run to avoid spending runner time on its remaining browser job.

Fresh Cloudflare build, performance budget and content checker pass. Real local Workerd catalog admission passes with the flag enabled and returns `401/session_invalid` before database access. Timings for first/repeated catalog requests: **2,315 / 37 / 30 / 25 ms**, demonstrating cache reuse. Secret-free health remains `503/unavailable` by design; this local check does not claim production readiness.

Final root full tests on patched Zod and regenerated provenance pass: **344 files / 3,732 tests**, 127.02 seconds, exit 0 (`final-tests.log`). Root observed lint/typecheck pass on the same code/dependency state before the JSON-only provenance correction; audit passes without exception. Independent final integration review found no blocking defect and confirmed that all current production consumers preserve the cached manifest. Current-head GitHub checks remain pending; successful local results do not replace them.

On exact head `7a1f5c5`, GitHub quality passes in 3m19s, SQL in 52s, marketing build in 30s, and game E2E in 5m31s (**76 passed / 16 skipped**). Quality logs independently confirm 3,732 tests, audit and bundled catalog/session gate. General browser remained in Chromium installation for over seven minutes, before any test started. Root cancelled that remaining run, then requested one bounded rerun of only browser job `120696341157` in run `40036251204`; completed successful jobs are retained. No source, assertions or timeout was changed for this infrastructure retry.

Cancelled-job logs confirm Ubuntu mirror package downloads stalled before application tests. Attempt 2 browser job `120699396120` installed Chromium successfully and entered the existing full browser suite. Local HEAD, remote release branch and PR head independently match `7a1f5c5da039eadcc41bc0f5426564ac2ad6cd0a`; the index is empty. This evolving final receipt remains local to avoid restarting checks for documentation-only updates.

Attempt 2 completed with **330 passed / 9 skipped / 1 flaky / 1 failed** in 20.1 minutes. Blocking accessibility failure sampled the selected rewards tab during its color transition (`#dadde2` on `#6364fb`, 3.24:1); the test incorrectly assumed reduced-motion CSS disabled all color transitions, while the source deliberately preserves color feedback. The scrolling fixture also failed once before retrying successfully, with coordinates measured during smooth scrolling. Root inspected logs and downloaded browser artifacts instead of repeating the failed workflow unchanged.

Two fixture-only corrections retain every acceptance assertion: wait for selected tab state and live tablist animations before Axe measures contrast; scroll the settings heading instantly using its authored `scroll-margin` before checking sticky navigation and current section. No UI colors, CSS behavior, Axe rules, assertions or timeouts changed. Focused repeated verification passes **6/6 in 2.0 minutes**, exit 0, with three repeats per scenario. Changed-test ESLint and root typecheck also pass, exit 0. Evidence: `browser-repairs-repeated.log`.

Logs and receipts: `/tmp/codex-game-resume-20261024/`. Do not infer a successful release from preparation or database import; normal PR/main CI, deployment, expected-SHA health and authenticated game smoke remain required.
