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

In progress. Logs and receipts: `/tmp/codex-game-resume-20261024/`. Do not infer a successful release from preparation or database import; normal PR/main CI, deployment, expected-SHA health and authenticated game smoke remain required.
