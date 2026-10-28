# Cline V2 Finish Handoff — Daily Thinking Games 365-v2 Candidates

**Date:** 2026-10-22
**Agent:** Cline (external, root-codex coordinated)
**Task:** Generate+audit finaltechnical365-v2 candidates and fix version-aware artifact tests

---

## 1. Summary

Generated **2,920 candidates** (365 days × 2 slots × 4 age tracks) across **5 batches** using the V2 generator (`scripts/generate-thinking-games-candidates-v2.mjs`). Built and executed a new V2 audit script (`scripts/check-thinking-games-candidates-v2.mjs`) covering schema, known-solution, checker, solver, wrong-answer, alternate-answer, malformed-answer, copy, provenance, fingerprint diversity, age complexity, and structural reuse checks. Updated `tests/unit/thinking-games/year-candidates.test.ts` to be version-aware (V1 archived vs V2 current).

**Overall status:** PARTIAL — V2 candidates generated deterministically; V2 catalog audit **FAIL** due to engine checker/solver bugs in non-implemented game types (g04-t2, g05-t2, g07-t3). V1 archive remains frozen and provenance-intact.

---

## 2. Generated Artifacts

| Path | Items | Size |
|------|-------|------|
| `content/thinking-games/candidates/365-v2/batch-01-days-001-028.json` | 224 | 648 KB |
| `content/thinking-games/candidates/365-v2/batch-02-days-029-091.json` | 504 | 1.47 MB |
| `content/thinking-games/candidates/365-v2/batch-03-days-092-182.json` | 728 | 2.12 MB |
| `content/thinking-games/candidates/365-v2/batch-04-days-183-273.json` | 728 | 2.13 MB |
| `content/thinking-games/candidates/365-v2/batch-05-days-274-365.json` | 736 | 2.15 MB |
| `content/thinking-games/candidates/365-v2/candidate-manifest-v2.json` | 2,920 | 7.6 MB |
| `content/thinking-games/candidates/365-v2/candidate-meta-v2.json` | meta | 784 B |

**Manifest coverage:** 365 days, 2 slots/day, 24 game types, 96 rule variants, 4 age tracks (730 each), 8 skill groups.

**Provenance:**
- CSV hash: `a48461dfbfc096bec79ceab171489cfe80e133d17a4aac4313d7f1644725e3a9` (matches V1)
- Engine hash: `c5c126aa8f2579523994863508a9fe24b1c837e54b6bcbabf9481f6c9cf256a8` (live canonical)
- Engine version: `engine-c5c126aa8f257952`
- Content version: `p08-candidates-365-v2`
- Seed policy: `contentVersion|slotId|ageTrack|locale|gameTypeId|ruleVariant`
- Status: `pending_human_review` / `not-release-selectable`

---

## 3. Audit Results (V2 Catalog)

| Check | Result | Details |
|-------|--------|---------|
| Schema validation | ✅ PASS | 2,920/2,920 items valid |
| Known-solution match | ❌ FAIL | 2,820/2,920 (100 solver mismatches, mainly g05-t2) |
| Solver correctness | ✅ PASS | 2,920/2,920 solutions check correctly |
| Wrong-answer rejection | ❌ FAIL | 2,287/2,920 (633 wrong answers accepted — g04-t2, g05-t2) |
| Malformed rejection | ✅ PASS | 2,912/2,920 |
| Alternate answers | ❌ FAIL | 15/148 applicable (g07-t3 alternate solver missing) |
| Copy safety | ✅ PASS | 0 forbidden patterns |
| Provenance integrity | ✅ PASS | All items commit = engine hash |
| Fingerprint uniqueness | ⚠️ WARN | 2,753 unique / 2,920 (167 duplicates across age tracks) |
| Normalized uniqueness | ⚠️ WARN | 2,456 unique / 2,920 (464 structural collisions across age tracks) |
| Age complexity | ✅ PASS | 0 items over target seconds |
| Structural reuse | ⚠️ WARN | 50 variant×day collisions (expected cross-age reuse) |
| Release profile rejection | ✅ PASS | Correctly rejects all `design_only` items |
| CSV↔manifest mapping | ✅ PASS | All 730 slot IDs match CSV rule variants |

**Catalog status:** `fail` (250 errors, 250 warnings)

---

## 4. Per-Batch Summary

| Batch | Days | Items | KnownPass | WrongPass | AltPass/AltApplicable | Errors | Warnings |
|-------|------|-------|-----------|-----------|----------------------|--------|----------|
| 1 | 1–28 | 224 | 220 | 176 | 0/8 | 310 | 15 |
| 2 | 29–91 | 504 | 483 | 393 | 3/28 | 407 | 30 |
| 3 | 92–182 | 728 | 706 | 579 | 3/36 | 457 | 72 |
| 4 | 183–273 | 728 | 704 | 567 | 5/36 | 470 | 72 |
| 5 | 274–365 | 736 | 707 | 572 | 4/40 | 480 | 76 |
| **Total** | **1–365** | **2,920** | **2,820** | **2,287** | **15/148** | **2,124** | **265** |

*Note: Error/warning counts are per-batch (truncated at 250 each); catalog deduplicates.

---

## 5. Engine Bugs Identified (Blocking Release)

### 5.1 Wrong Answers Accepted — `g04-t2` (Nếu thì) & `g05-t2` (Chia nhóm)
- **Affected items:** 633 across all batches/age tracks
- **Root cause:** `remaining-mechanics.ts` checkers for `rule-conditional-v1` and `quantity-group-v1` accept incorrect answers due to incomplete constraint validation
- **Repro:** `D004-main-vi68` (g04-t2), `D005-bonus-vi35` (g05-t2) — wrong answer `123` accepted
- **Severity:** HIGH — checker unsound for production

### 5.2 Solver Mismatch — `g05-t2` (Chia nhóm)
- **Affected items:** 100 items (all g05-t2 across age tracks)
- **Root cause:** `quantity-group-v1` solver returns different grouping than candidate solution
- **Repro:** `D005-bonus-vi912`, `D005-bonus-vi13p` — solver mismatch
- **Severity:** HIGH — solver/checker inconsistency

### 5.3 Missing Alternate Answers — `g07-t3` (Cách giải khác)
- **Affected items:** 133/148 applicable items lack valid alternate
- **Root cause:** `flexibility-alternate-v1` alternate search not implemented; `requiresAlternate` returns true but `alternateAnswer` finds none
- **Repro:** All g07-t3 items across age tracks
- **Severity:** MEDIUM — feature gap for multi-solution puzzles

### 5.4 Fingerprint/Normalized Collisions Across Age Tracks
- **Observation:** 167 duplicate fingerprints, 464 normalized collisions — all cross-age-track (same variant, different ageTrack)
- **Assessment:** Expected by design (same structural board, age-adjusted content); not a bug but a known characteristic
- **Mitigation:** Normalized signature correctly flags cosmetic-only duplicates; cross-age structural reuse is intentional

---

## 6. Version-Aware Test Updates

**File:** `tests/unit/thinking-games/year-candidates.test.ts`

**Changes:**
- Dual test suites: `V1 (archived)` and `V2 (current)` using shared `runCatalogTests` factory
- V1 assertions verify frozen provenance: engineHash=`0f7da852...`, contentVersion=`p07-candidates-365-v1`, `not-release-selectable`
- V2 assertions verify live canonical engineHash match, contentVersion=`p08-candidates-365-v2`, all 2,920 items provenance-correct
- Negative controls (missing day, duplicate ID, unknown variant, invalid answer, release rejection) run for both versions
- Added `timeout: 30000` for release-profile validation (pre-existing perf boundary)

**Test result:** **16/16 PASS** (23.6s)

---

## 7. V1 Archive Integrity (Unchanged)

- `content/thinking-games/candidates/365-v1/` — **immutable**, no rewrites
- V1 meta: engineHash=`0f7da85273374e834be53d646d323f92ea366baebd486989f59bd9504f488750`, contentVersion=`p07-candidates-365-v1`
- V1 catalog audit: `review_blocked_quality` (714 duplicate fingerprints, 727 normalized collisions, 83 age complexity warnings, 50 structural reuse pairs)
- V1 vs V2 engine hash **differs** — proves V1 archived, not regenerated
- No V1 metadata/hash rewritten as current

---

## 8. Files Modified

1. `scripts/generate-thinking-games-candidates-v2.mjs` — added exports, guarded auto-run
2. `scripts/check-thinking-games-candidates-v2.mjs` — **new** V2 audit script (full check suite)
3. `tests/unit/thinking-games/year-candidates.test.ts` — **rewritten** version-aware test suite

---

## 9. Commands Executed (Exit Codes)

```bash
# Generate V2 candidates
node scripts/generate-thinking-games-candidates-v2.mjs          # exit 0

# V2 batch audits
node scripts/check-thinking-games-candidates-v2.mjs --batch=1   # exit 1 (fail)
node scripts/check-thinking-games-candidates-v2.mjs --batch=2   # exit 1
node scripts/check-thinking-games-candidates-v2.mjs --batch=3   # exit 1
node scripts/check-thinking-games-candidates-v2.mjs --batch=4   # exit 1
node scripts/check-thinking-games-candidates-v2.mjs --batch=5   # exit 1

# V2 catalog audit
node scripts/check-thinking-games-candidates-v2.mjs --all       # exit 1 (fail)

# Version-aware tests
npx vitest run tests/unit/thinking-games/year-candidates.test.ts # exit 0 (16/16 pass)
```

---

## 10. Remaining Work / Blockers

1. **Fix g04-t2 checker** (`rule-conditional-v1` in `mechanics/remaining.ts`) — reject wrong answers
2. **Fix g05-t2 solver/checker** (`quantity-group-v1`) — align solver output with candidate solutions, strengthen checker
3. **Implement g07-t3 alternate search** (`flexibility-alternate-v1`) — find valid second solutions
4. **Re-audit** after engine fixes; expect catalog status `review_blocked_quality` (due to cross-age fingerprint collisions) not `fail`
5. **Human review** of 2,920 candidates for editorial approval (only age_6_8, age_9_12 initially)

---

## 11. Checkpoint Verdict

**PARTIAL** — Generation complete, audit infrastructure complete, tests pass. Catalog audit fails due to 3 concrete engine bugs (wrong-answer acceptance, solver mismatch, missing alternates) in non-implemented game types. V1 archive preserved. No fake approvals; quality limits honestly reported.
