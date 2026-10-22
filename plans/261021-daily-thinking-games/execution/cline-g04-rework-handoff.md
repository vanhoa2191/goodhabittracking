# Cline g04-t2 Rework Handoff — Daily Thinking Games 365-v2 Candidates

**Date:** 2026-10-22
**Agent:** Cline (external, root-codex coordinated, sole V2 engine/auditor fix)
**Task:** Bounded rework of g04-t2 `reasoning-if-then-v1` regression introduced by previous V2 quality-fix lane

---

## 1. Verification Summary

**Overall verdict: TECHNICAL PASS** — g04-t2 regression fixed, g02-t3 same-class bug fixed and verified, all V2 items regenerated, catalog audit passes.

| Artifact | Status | Details |
|----------|--------|---------|
| g04-t2 generator/checker fix | ✅ | Generator: exactly 1 derivable option; Checker: oracle semantics |
| g02-t3 find-break fix | ✅ | Generator filters both symmetry-break points from distractors |
| V2 candidates regenerated | ✅ | 2,920 items (365 days × 2 slots × 4 age tracks), 5 batches, engine `engine-f73040613fef8f99` |
| V2 catalog audit | ✅ PASS | `ok: true`, status `pass_with_review_warnings`, 0 errors, 250 warnings (capped) |
| Per-batch audits (1–5) | ✅ PASS | All exit 0 (day-coverage errors expected for partial batches) |
| Version-aware unit tests | ✅ PASS | 16/16 pass |
| All unit tests (thinking-games) | ✅ PASS | 98/98 pass |
| Adversarial tests | ✅ PASS | 36/36 pass |
| TypeScript compilation | ✅ PASS | 0 errors |
| V1 archive integrity | ✅ | Frozen, provenance intact, engine hash differs from V2 |

---

## 2. Root-Cause Engine Bugs Fixed

| Game Type | Variant | Bug | Fix Location |
|-----------|---------|-----|--------------|
| g04-t2 | `reasoning-if-then-v1` | Generator put ALL derivable facts in options; checker accepted only alphabetically-first | `src/lib/thinking-games/mechanics/remaining.ts:753-808` |
| g02-t3 | `spatial-symmetry-v1` (find-break) | Generator only filtered canonical solution point; mirror point could remain in options. Checker accepts both points in break pair. | `src/lib/thinking-games/mechanics/remaining.ts:514-517` |

---

## 3. Fix Details

### g04-t2 Generator (`remaining.ts:775-808`)
- **Before:** Computed all derivable `newFacts`, put ALL in `options` along with distractors. Solution = alphabetically-first `newFact`.
- **After:** Computes all derivable facts, picks **exactly one** as solution (chain end for older tracks `rank>=2`, first for younger). Options = `[solution, ...distractors]` where distractors are ONLY words NOT in closure and NOT initial facts.
- **Age progression preserved:** Older tracks get longer chains, solution is the chain end.

### g04-t2 Checker (`remaining.ts:766-774`)
- **Before:** Accepted only the alphabetically-first derivable fact in options.
- **After:** Oracle semantics — accepts ANY option that is (a) in options, (b) in if-then closure, (c) not an initial fact. With the generator change, this set has size 1.

### g02-t3 Generator Find-Break Mode (`remaining.ts:514-517`)
- **Before:** `otherCandidates` filtered only the canonical solution point (`pointKey(point) !== pointKey(solution)`). The mirror point (other half of symmetry-breaking pair) could remain in distractors.
- **After:** `breakPairKeys = new Set([pointKey(chosen), pointKey(mirror)])` — BOTH points of the symmetry-breaking pair are filtered from distractors. Only the canonical solution point appears in options.

### g02-t3 Checker (unchanged, already correct)
- Already accepted both points in the symmetry-breaking pair (`pair.some(...)`), which is correct public-rule oracle semantics.

---

## 4. Auditor Fixes

### `wrongAnswer` for g04-t2 (`check-thinking-games-candidates-v2.mjs:77-101`)
- **Before:** Tested ALL other options as wrong answers, causing false positives (633 "wrong-answer accepted" for g04-t2).
- **After:** Special handling for g04-t2 — only tests options that are NOT in closure and NOT initial facts as genuine wrong answers.

### New Audit Check: `g04_t2_multiple_valid_options` (`check-thinking-games-candidates-v2.mjs:424-443`, `669-688`)
- Added to both batch and catalog audit loops.
- Flags any g04-t2 item where `ruleValidOptions.length !== 1` as an error.
- Verified: 0 items flagged across all 124 g04-t2 items.

---

## 5. Test Updates

### `tests/unit/thinking-games/all-mechanics.test.ts:136-208`
- **Replaced** the test that locked bad behavior ("checker accepts ONLY canonical solution").
- **New test** `"accepts alternative valid answers where the mechanic allows them"` verifies:
  1. Canonical solution accepted
  2. Non-derivable distractor rejected
  3. Initial fact rejected
  4. Oracle semantics documented (if board had two derivable options, both would be accepted)
- **Added** regression test `"g04-t2 generator produces exactly one rule-valid option per item"` — iterates all age tracks, variants, and 5 seeds each, asserts exactly 1 rule-valid option matching solution.

---

## 6. Catalog Audit Metrics (Final)

```
itemCount: 2920
schemaPass: 2920
knownPass: 2920
solvePass: 2920
wrongPass: 2920
malformedPass: 2920
alternateApplicable: 148
alternatePass: 148
uniqueFingerprints: 2753 (167 cross-age duplicates — by design)
uniqueNormalized: 2456 (464 structural collisions — by design)
status: pass_with_review_warnings
errors: 0
warnings: 250 (capped — all structural reuse warnings)
```

---

## 7. Commands Executed & Exit Codes

| Command | Exit | Status |
|---------|------|--------|
| `node scripts/generate-thinking-games-candidates-v2.mjs` | 0 | PASS |
| `node scripts/check-thinking-games-candidates-v2.mjs --all` | 0 | PASS |
| `node scripts/check-thinking-games-candidates-v2.mjs --batch=1..5` | 0 | PASS (day-coverage errors expected) |
| `npx vitest run tests/unit/thinking-games/` | 0 | PASS (98/98) |
| `npx vitest run tests/unit/thinking-games-adversarial.test.ts` | 0 | PASS (36/36) |
| `npx tsc --noEmit` | 0 | PASS |

---

## 8. Verification Proofs

### g04-t2: All 124 items have exactly one rule-valid option
```
Total g04-t2 items: 124
Items with !=1 valid option: 0
```

### g02-t3 find-break: No items have both symmetry-break points in options
```
Total g02-t3 items: 120
Items with issues: 0
```

---

## 9. Files Modified

| File | Changes |
|------|---------|
| `src/lib/thinking-games/mechanics/remaining.ts` | g04-t2 generator/checker rewrite; g02-t3 find-break generator fix |
| `scripts/check-thinking-games-candidates-v2.mjs` | g04-t2 wrongAnswer fix; g04_t2_multiple_valid_options audit check |
| `tests/unit/thinking-games/all-mechanics.test.ts` | g04-t2 test replaced + regression test added |

---

## 10. Remaining Work / Human Review Gates

| Item | Status | Note |
|------|--------|------|
| Editorial approval for 2,920 candidates | `pending_human_review` | Only `age_6_8`, `age_9_12` initially approved (1,460 items) |
| Release profile | `not-release-selectable` | Correctly blocks all unreviewed items |
| Cross-age fingerprint/normalized collisions | `by_design` | Not a bug — intentional structural reuse across age tracks |

---

## 11. Checkpoint Verdict

**TECHNICAL PASS** — g04-t2 regression fixed, g02-t3 same-class bug fixed, all V2 items regenerated reproducibly, catalog audit passes with 0 errors. V1 archive preserved. No test regressions. No new dependencies. No V1/pilot/release bytes touched.

**Human review remains external release gate** even with technical PASS. Do not weaken checker/profile/test to mask failures.
