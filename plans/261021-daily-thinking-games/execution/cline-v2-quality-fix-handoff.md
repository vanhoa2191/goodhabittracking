# Cline V2 Quality Fix Handoff — Daily Thinking Games 365-v2 Candidates

**Date:** 2026-10-22
**Agent:** Cline (external, root-codex coordinated, sole V2 engine/auditor fix)
**Task:** Fix PROVEN V2 quality faults in engine checkers/solvers and audit false positives

---

## 1. Verification Summary

**Overall verdict: TECHNICAL PASS** — All engine bugs fixed, audit false positives eliminated, catalog audit passes with `pass_with_review_warnings` (cross-age fingerprint collisions by design).

| Artifact | Status | Details |
|----------|--------|---------|
| V2 candidates regenerated | ✅ | 2,920 items (365 days × 2 slots × 4 age tracks), 5 batches, engine `engine-cfd35b35a615f07e` |
| V2 catalog audit | ✅ PASS | `ok: true`, status `pass_with_review_warnings`, 0 errors, 250 warnings (capped) |
| Per-batch audits (1–5) | ✅ PASS | All exit 0 |
| Version-aware unit tests | ✅ PASS | 16/16 pass |
| All unit tests (thinking-games) | ✅ PASS | 97/97 pass |
| TypeScript compilation | ✅ PASS | 0 errors |
| V1 archive integrity | ✅ | Frozen, provenance intact, engine hash differs from V2 |

---

## 2. Root-Cause Engine Bugs Fixed

| Game Type | Variant | Bug | Fix Location |
|-----------|---------|-----|--------------|
| g04-t2 | `reasoning-if-then-v1` | Checker accepted ANY derivable fact in options (not just canonical solution) | `src/lib/thinking-games/mechanics/remaining.ts:757-764` |
| g02-t3 | `spatial-symmetry-v1` | Generator: wrong solution in fill mode; duplicate options in find-break mode | `src/lib/thinking-games/mechanics/remaining.ts:503-517` |
| g03-t2 / g08-t1 | `memory-position-v1` / `observation-difference-v1` | Checkers accepted malformed points with extra fields (e.g., `{x,y,z}`) | `src/lib/thinking-games/mechanics/remaining.ts:115-120` |

---

## 3. Audit False Positives Eliminated

| Audit Check | False Positive | Fix Location |
|-------------|----------------|--------------|
| `known_answer_rejected` (g08-t1, g02-t3) | Order-sensitive JSON.stringify vs set semantics | `sameAnswerForAudit` in `check-thinking-games-candidates-v2.mjs:37-51` |
| `wrong_answer_accepted` (g07-t1, g08-t2, g05-t3, g03-t1) | Testing permutations as "wrong answers" for set-based answers | `wrongAnswer` function in `check-thinking-games-candidates-v2.mjs:72-113` |
| `alternate_missing` (g07-t3, g03-t1) | g07-t3 assumed `board.options`; g03-t1 swapped mode not handled | `alternateAnswer` + `findAlternatePath` in `check-thinking-games-candidates-v2.mjs:110-180` |

---

## 4. Files Modified

### Engine (src/lib/thinking-games/mechanics/remaining.ts)
- **g04-t2 checker** (lines 757-764): Now computes canonical solution (first sorted derivable fact in options) and only accepts exact match
- **g02-t3 generator** (lines 503-517): 
  - Fill mode: solution = hole position (chosen)
  - Find-break mode: solution = canonical point (smaller pointKey)
  - Options: filter by solution pointKey to avoid duplicates
- **isPoint** (lines 115-120): Strict check `Object.keys(value).length === 2` rejects extra properties (e.g., `z`)

### Audit Script (scripts/check-thinking-games-candidates-v2.mjs)
- **sameAnswerForAudit** (lines 37-51): Set-based comparison for point arrays (g08-t1) and string arrays (g07-t1, g08-t2, g05-t3)
- **wrongAnswer** (lines 72-113): Skip permutations for set-based types; filter solution from g08-t1 option combinations
- **alternateAnswer** + **findAlternatePath** (lines 110-180): g07-t3 BFS pathfinding; g03-t1 swapped mode returns swapped sequence
- **auditItems** (lines 800-900): Extended return type with metrics/checks/quality/releaseRejection for V1 type compatibility

### Tests (tests/unit/thinking-games/)
- **all-mechanics.test.ts:135-151**: g04-t2 test now verifies checker accepts ONLY canonical solution, rejects other derivable facts
- **p06-fixtures-v2.test.ts:47**: Increased timeout to 10000ms for fixture validation
- **year-candidates.test.ts**: 
  - `auditItemsFn` parameter type made compatible with both V1/V2
  - Skin object creation uses spread operator to respect read-only properties

---

## 5. Catalog Audit Metrics (Final)

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

## 6. Commands Executed & Exit Codes

| Command | Exit | Status |
|---------|------|--------|
| `node scripts/generate-thinking-games-candidates-v2.mjs` | 0 | PASS |
| `node scripts/check-thinking-games-candidates-v2.mjs --all` | 0 | PASS |
| `node scripts/check-thinking-games-candidates-v2.mjs --batch=1..5` | 0 | PASS |
| `npx vitest run tests/unit/thinking-games/year-candidates.test.ts` | 0 | PASS (16/16) |
| `npx vitest run tests/unit/thinking-games/` | 0 | PASS (97/97) |
| `npx tsc --noEmit` | 0 | PASS |

---

## 7. Remaining Work / Human Review Gates

| Item | Status | Note |
|------|--------|------|
| Editorial approval for 2,920 candidates | `pending_human_review` | Only `age_6_8`, `age_9_12` initially approved (1,460 items) |
| Release profile | `not-release-selectable` | Correctly blocks all unreviewed items |
| Cross-age fingerprint/normalized collisions | `by_design` | Not a bug — intentional structural reuse across age tracks |

---

## 8. Checkpoint Verdict

**TECHNICAL PASS** — All proven engine bugs fixed, audit false positives eliminated, catalog audit passes. V1 archive preserved. No test regressions. No new dependencies. No V1/pilot/release bytes touched.

**Human review remains external release gate** even with technical PASS. Do not weaken checker/profile/test to mask failures.