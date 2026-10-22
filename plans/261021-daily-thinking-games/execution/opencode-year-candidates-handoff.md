# P07 year candidates — OpenCode handoff

Task: `task_f8c03ee7a55a`  
Dispatch: `ctx_9a526466c5fb`  
Date: 2026-10-21  
Status: **technical candidate authoring complete; release blocked**

All 2,920 payloads are reviewable technical candidates only. They are `design_only`, have no human editorial/age approval, and are not production or release-ready.

## Delivered

- `scripts/generate-thinking-games-candidates.mjs`
- `scripts/check-thinking-games-candidates.mjs`
- `content/thinking-games/candidates/365-v1/candidate-manifest-v1.json`
- `content/thinking-games/candidates/365-v1/candidate-meta-v1.json`
- `content/thinking-games/candidates/365-v1/batch-01-days-001-028.json`
- `content/thinking-games/candidates/365-v1/batch-02-days-029-091.json`
- `content/thinking-games/candidates/365-v1/batch-03-days-092-182.json`
- `content/thinking-games/candidates/365-v1/batch-04-days-183-273.json`
- `content/thinking-games/candidates/365-v1/batch-05-days-274-365.json`
- `tests/unit/thinking-games/year-candidates.test.ts`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p07-365-v1-batch-01.json`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p07-365-v1-batch-02.json`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p07-365-v1-batch-03.json`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p07-365-v1-batch-04.json`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p07-365-v1-batch-05.json`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p07-365-v1-catalog.json`

No engine, pilot, release manifest, server, client, dependency, commit, push, or deploy changes were made.

## Commands and exits

| Command | Result |
| --- | --- |
| `node scripts/generate-thinking-games-candidates.mjs` | exit 0; 2,920 items |
| `node scripts/check-thinking-games-candidates.mjs --batch=1..5` | exit 0; all five audit documents written |
| `node scripts/check-thinking-games-candidates.mjs --all` | exit 0; catalog audit written |
| `npx vitest run tests/unit/thinking-games/year-candidates.test.ts` | 6/6 pass |
| `npx vitest run tests/unit/thinking-games/` | 67/67 pass |
| `npx vitest run tests/unit/thinking-games-adversarial.test.ts` | 29/36 pass, 7 known stale failures |
| `npm run typecheck` | exit 0 |
| scoped ESLint on both scripts + candidate test | exit 0, 0 warnings |
| `node scripts/check-thinking-games-content.mjs` | exit 0; editorial/pilot PASS; release-placeholder expected FAIL |
| in-memory rerun of generator | 2,920 items; byte-identical canonical manifest |

## Catalog result

- Total: **2,920** = 365 days × 2 slots × 4 tracks.
- Per track: 730; initial `age_6_8` + `age_9_12`: **1,460**.
- Experimental `age_3_5` + `age_13_plus`: **1,460**; no support promise.
- 365 continuous days per track; main and bonus skill differ all 365 days per track.
- 24 type IDs; 96 `(type, ruleVariant)` pairs; 8 skills.
- Minimum type spacing: **11** days (actual CSV mapping; required >= 7).
- 358/358 rolling eight-day windows cover all eight skills per track.
- CSV slot IDs, type, variant, age, locale, and content version are preserved.
- Every item has a private solution, hints, explanation, provenance, source/license metadata, age parameter, version, and fingerprint.
- Every candidate is `design_only`; every `editorial` is `null`.
- Full schema, known answer, solver, wrong-answer rejection, malformed-answer rejection, required alternate, copy, and provenance checks: **2,920/2,920**.
- Required alternate answers found: **362/362** applicable cases.
- Unique fingerprints: **2,206/2,920**.
- Unique normalized structures: **2,193/2,920**.

Production release profile correctly rejects the catalog:

- `release_editorial`: 1 — no human approval.
- `release_unapproved`: 2,920 — all items are `design_only`.
- `release_editorial_item`: 2,920 — no per-item human review.

## Batch audits

| Batch | Days | Items | Status | Duplicate fingerprints | Normalized collisions | Age-complexity warnings |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| 1 | 1–28 | 224 | `review_blocked_quality` | 31 | 31 | 27 |
| 2 | 29–91 | 504 | `review_blocked_quality` | 66 | 69 | 63 |
| 3 | 92–182 | 728 | `review_blocked_quality` | 113 | 119 | 86 |
| 4 | 183–273 | 728 | `review_blocked_quality` | 120 | 126 | 84 |
| 5 | 274–365 | 736 | `review_blocked_quality` | 118 | 124 | 84 |

Each batch had **0 audit errors**; the blocked status is quality findings, not schema/solver failure.

## Source and hashes

- Input CSV SHA-256: `a48461dfbfc096bec79ceab171489cfe80e133d17a4aac4313d7f1644725e3a9`
- Engine bundle hash: `0f7da85273374e834be53d646d323f92ea366baebd486989f59bd9504f488750`
- Engine version: `engine-0f7da85273374e83`
- Candidate manifest file SHA-256: `f3393309edaf8ecc244f134cc3989cc7cf7981fb979f3cfb0e2e55dc93f9be67`
- Candidate meta file SHA-256: `fa052b57476cbbb1f8fdc0cb9ce043c86c037b1be363d737bb93bfb4b43609f3`
- Batch 01 SHA-256: `89ef8cad5880434a9878040f012f82038a97aa4ee2ac857bc81cb9ed64d12ad3`
- Batch 02 SHA-256: `275798ae803e6326a0448f57d2baaeaa7584cfd59fd12cfe29af22b5ff0d7e6d`
- Batch 03 SHA-256: `c3c90150780afc380cf3b90699b0827e911560d63de5bd3a05ec66faef7d46a0`
- Batch 04 SHA-256: `a7c3bf18187f2f533103daeb7f087b549f23e3044287c427448c0a0b2a54541f`
- Batch 05 SHA-256: `3d88fb88c9ff44252a0e11dd90cfe33e0b3229ff655ae689a5fd916d541d3490`
- Catalog audit SHA-256: `2cae7e682766eb0b98273aa3bd983a3183c6fe485791c2146fbda9bea1726990`
- Generator SHA-256: `66c91591f67fe3eaeb1f1bc79cceb24da0aa91ce257f38d83cb0b4064f82a636`
- Checker SHA-256: `e01ebc64e94cd199a481973009e7d85ba6e367c1b883c84fb40acf0d894d65d4`
- Candidate test SHA-256: `85223b3f9d4154badde0996b9b6a26b10e80e07da03fe5a5dd84d3d775fcc165`
- Adversarial test SHA-256 unchanged: `c3c024c387f200303acfe68e6dd2ebebbf4a73755aeac794c5044f35b55e5aa9`

Deterministic rerun comparison: canonical manifest JSON SHA-256 `39cf5042683e883de099ad50b32d7fa3fd823422a9d5e1ba7ab51ac6fdd426b7` matched exactly between disk and in-memory rerun.

## Engine quality defects routed to OMP

The pure engine remains read-only. The following are reported, not hidden or repaired in engine source.

1. **Static generators ignore seed for many variants.** Seed attempts 0–20 were tried before accepting a duplicate. 714 candidates still collide exactly after retries. Examples: each of `g06-t2`, `g07-t1`, `g07-t3`, and `g08-t2` produces only 2 unique boards across 32 candidates for several variants. This is a generator diversity defect, not cosmetic normalization noise.
2. **Structural reuse:** 50 `(type, variant, track)` groups have only one normalized structure across all generated candidates in that group.
3. **Age adaptation is not monotonic:** 83/96 `(type, variant)` pairs do not show strictly increasing structural complexity from `age_3_5` to `age_13_plus`. Several mechanics differ only by copy and `targetSeconds`, not by relations, steps, or visual choices. This violates the technical intent for four-track adaptation even though the candidates are usable as review inputs.
4. **Path solver/checker disagreement:** seed retry resolved 2 initial `g06-t1` candidates whose `solvePath` result revisited a cell and failed `checkPath`. Root cause remains: `solvePath` can return a path outside the checker's no-revisit contract. Current delivered catalog has 2,920/2,920 known-answer acceptance, but the engine defect should be fixed by the pure-engine owner.
5. **Hint leak false positive:** `assertNoAnswerLeak` uses substring matching, so the single-token memory answer `cá` matched the ordinary word `các`. The candidate author avoided this with safe hint copy; the engine assertion remains over-broad.

## Human/release gates

Still required before any production use:

- Human editorial review of all 2,920 candidates.
- Human semantic age review for all four tracks.
- Resolution or explicit acceptance of duplicate/structural-reuse and age-adaptation findings.
- A separate approved production manifest; this candidate manifest must remain non-selectable and release-validator-rejected.
