# Focused Engine Fix — Handoff

## Outcome
- **In-scope engine type-safety fixes: COMPLETE.** `npx tsc --noEmit` → **0 errors** (was 10). ESLint on changed files → **0 warnings**. All in-scope engine test suites pass (**70 tests**).
- g08-t2 (already repaired by a prior Cline session) is **preserved** — no regression (`generator-quality` + `all-mechanics` pass).
- Two pre-existing issues remain **explicitly out of scope** (see *Remaining*).

## Files modified (3) — behavior-preserving; no target/lint-config changes; no V1 bytes touched
1. `src/lib/thinking-games/mechanics/path-planning.ts` — replace `1n`/`0n` BigInt literals with module-scoped `BIGINT_ONE` / `BIGINT_ZERO` constants. The project target (ES2017) cannot emit BigInt literals (`error TS2737`). Constants are hoisted **out of the BFS hot loop** so per-cell cost matches the original literal performance (avoids contributing to the `p06-fixtures-v2` 5000ms boundary).
2. `src/lib/thinking-games/mechanics/remaining.ts` — fix the `g04-t3` (quantity-target) type errors (`satisfies Record<…>`, unsafe `as` casts) via a typed record + narrowing; remove 2 unreachable dead branches. Generation behavior unchanged.
3. `tests/unit/thinking-games/generator-quality.test.ts` — fix 3 type errors in the g08-t2 test (explicit `Record` shape for `diverseCountBySeedByVariant`, strict null-narrowing of `mechanic`/`impl`).

## The 10 type errors fixed (by area)
- `mechanics/path-planning.ts`: BigInt literal emission (`1n`/`0n`) → `BigInt()` constants.
- `mechanics/remaining.ts`: `g04-t3` schema `satisfies`/`as` cast errors + dead branches.
- `tests/unit/thinking-games/generator-quality.test.ts`: `Record`/narrowing type errors in the g08-t2 seed-diversity test.

All 10 resolved with no `as any` / `as unknown` / `// @ts-expect-error` suppressions in changed files.

## Verification evidence
| Check | Command | Exit | Result |
|---|---|---|---|
| typecheck (whole project) | `npx tsc --noEmit` | 0 | 0 errors (was 10) |
| lint changed files | `npx eslint <3 files> --max-warnings=0` | 0 | 0 warnings |
| in-scope engine tests (5 files incl. p06) | `npx vitest run …` | — | 70 passed; `p06-fixtures-v2` timed out only under multi-file load |
| p06-fixtures-v2 isolated | `npx vitest run p06-fixtures-v2` | 0 | 2/2 pass |
| g08-t2 (generator-quality) | covered above | — | pass (no regression) |

In-scope suites: `all-mechanics`, `generator-quality`, `thinking-games-adversarial`, `mechanics`, `registry`.

## Why the provenance hash is unperturbed
`meta.engineHash` (computed by the engine candidate harness) is **stable at `0f7da852`** — identical to the 07:10 baseline taken *before* the g08-t2 repair and *before* my type edits. The engine-hash input set does not include these mechanics files, so the type-only edits do **not** perturb either the computed hash or any candidate/engine fingerprint. Hence the `year-candidates` "stale stored hash" mismatch is purely a V1-provenance refresh matter, not caused by this change.

## Remaining (explicitly out of scope — future V2 / provenance QA)
1. **`year-candidates`** — (B) stored `engineHash` (manifest `15483b32`) ≠ computed `0f7da852` (V1 provenance refresh); (C) "rejects the unreviewed candidate manifest" times out at 5000ms under load. Pre-existing; V1 bytes / provenance-refresh per task guidance — **not touched** (no `orca` CLI used, no V1 bytes modified).
2. **`p06-fixtures-v2`** — "keeps every fixture solvable, internally consistent and free of public answer leakage" times out at 5000ms under load (6-file run: 5893ms) but **passes 2/2 isolated** (5.1s). It validates 365 fixture days (~5s) → inherent boundary perf. The test file is **not in write-scope**; the correct remediation is a `testTimeout` bump (`{ timeout: 30000 }`) — future perf/QA work.

## Machine-computed source hashes (current, computed by `sha256` over sorted file bytes)
- Engine combined SHA-256 (19 files, `src/lib/thinking-games/**`): `e508a4aefe74ac4a956ca860de653203b38aa3e3ea1471bf4ca33e0d1536711d`
- Modified-file SHAs:
  - `src/lib/thinking-games/mechanics/path-planning.ts` → `877230a5c1d78153e78128b54bde34ed41fa0d39bafbb2c7e77c5c05193c8076`
  - `src/lib/thinking-games/mechanics/remaining.ts` → `af3449d3c60767803f3c7e2f60f9e7cdb3bb86c667cd90706aada787e10127df`
  - `tests/unit/thinking-games/generator-quality.test.ts` → `115fcd8b064692a806a210a3d640ede7be8017f89dc63aff49d313501e95ec9a`

> Note: `src/lib/thinking-games/**` is an **untracked** tree (`?? src/lib/thinking-games/`), so it does not appear in `git diff`; verification was run against the on-disk working tree. Modified *tracked* files elsewhere (KidDashboard, ParentSettingsTab, etc.) belong to the unrelated broad owner commits and are not part of this engine fix.

## Next (not this session)
- V2 provenance refresh: reconcile the `year-candidates` manifest `engineHash` with the computed `0f7da852` (out of scope here).
- `p06-fixtures-v2`: add `{ timeout: 30000 }` to the fixture test (write scope blocked).
- This focused engine fix is **green** for the in-scope gate (focused tests + adversarial + tsc + targetlint).
