# Cline V2 Reader Verification — Daily Thinking Games 365-v2 Candidates

**Date:** 2026-10-22
**Agent:** Cline (external, root-codex coordinated, sole V2 reader/independent verifier)
**Task:** Verify V2 candidate generation, audit results, and version-aware tests

---

## 1. Verification Summary

**Overall verdict: TECHNICAL FAIL** — Catalog audit fails due to 3 concrete engine bugs in non-implemented game types. V1 archive verified unchanged. Version-aware tests pass (16/16).

| Artifact | Verified | Details |
|----------|----------|---------|
| V2 candidates generated | ✅ | 2,920 items (365 days × 2 slots × 4 age tracks = 730 × 4), 5 batches |
| V2 catalog audit | ❌ FAIL | 250 errors, 250 warnings — wrong-answer acceptance, solver mismatch, missing alternates |
| Per-batch audits (1–5) | ❌ FAIL | All exit 1; same root causes across batches |
| Version-aware unit tests | ✅ PASS | 16/16 pass, 24.86s (exit 0) |
| V1 archive integrity | ✅ | Frozen, provenance intact, engine hash differs from V2 |
---

## 2. Exact Command Execution & Exit Codes (Node v22.22.0)

| Command | Exit | Status |
|---------|------|--------|
| `node scripts/check-thinking-games-candidates-v2.mjs --batch=1` | 1 | FAIL |
| `node scripts/check-thinking-games-candidates-v2.mjs --batch=2` | 1 | FAIL |
| `node scripts/check-thinking-games-candidates-v2.mjs --batch=3` | 1 | FAIL |
| `node scripts/check-thinking-games-candidates-v2.mjs --batch=4` | 1 | FAIL |
| `node scripts/check-thinking-games-candidates-v2.mjs --batch=5` | 1 | FAIL |
| `node scripts/check-thinking-games-candidates-v2.mjs --all` | 1 | FAIL |
| `npx vitest run tests/unit/thinking-games/year-candidates.test.ts` | 0 | PASS (16/16) |

> Note: Node 26 not available in environment; used current Node v22.22.0 as PATH prefix. Commands match handoff exactly.

---

## 3. Catalog Audit Metrics (Verified from `--all` output)

| Check | Result | Count |
|-------|--------|-------|
| Schema validation | ✅ PASS | 2,920/2,920 |
| Known-solution match | ❌ FAIL | 2,820/2,920 (100 mismatches — primarily g05-t2) |
| Solver correctness | ✅ PASS | 2,920/2,920 |
| Wrong-answer rejection | ❌ FAIL | 2,287/2,920 (633 accepted — g04-t2, g05-t2) |
| Malformed rejection | ✅ PASS | 2,912/2,920 |
| Alternate answers | ❌ FAIL | 15/148 applicable (g07-t3 alternate solver missing) |
| Copy safety | ✅ PASS | 0 forbidden patterns |
| Provenance integrity | ✅ PASS | All items commit = engine hash |
---

## 4. Root-Cause Engine Bugs (Technical Blockers)

| Game Type | Variant | Bug | Impact |
|-----------|---------|-----|--------|
| g04-t2 | `rule-conditional-v1` | Checker accepts wrong answers | 633 items across batches accept invalid answers |
| g05-t2 | `quantity-group-v1` | Solver output ≠ candidate solution; checker too weak | 100 known-solution mismatches + wrong-answer acceptance |
| g07-t3 | `flexibility-alternate-v1` | Alternate search not implemented | 133/148 applicable items missing valid second solution |

These are **pre-existing engine gaps** in non-implemented mechanics, not generation regressions.

---

## 5. V1 Archive Integrity (Verified)

| Property | V1 (Archived) | V2 (Current) | Status |
|----------|---------------|--------------|--------|
| Content version | `p07-candidates-365-v1` | `p08-candidates-365-v2` | Distinct |
| Engine hash | `0f7da85273374e834be53d646d323f92ea366baebd486989f59bd9504f488750` | `c5c126aa8f2579523994863508a9fe24b1c837e54b6bcbabf9481f6c9cf256a8` | **Differs — proves V1 not regenerated** |
| CSV hash | `a48461dfbfc096bec79ceab171489cfe80e133d17a4aac4313d7f1644725e3a9` | Same | ✅ Matches |
| Release profile | `not-release-selectable` | `not-release-selectable` | ✅ Frozen |
| Item count | 2,920 | 2,920 | ✅ Unchanged |
| Track distribution | 730 each | 730 each | ✅ Unchanged |

**V1 meta file timestamp:** 2026-10-21T20:49 (predates V2 generation). No V1 files rewritten.

---

## 6. Manifest & Provenance Verification (Machine-Computed)

**V2 Manifest (`candidate-manifest-v2.json`):**
- Total items: **2,920**
- Track counts: `age_3_5: 730`, `age_6_8: 730`, `age_9_12: 730`, `age_13_plus: 730` ✅ 730 × 4
- Coverage: `{dayCount: 365, slotsPerDay: 2, typeIds: 24, variantPairs: 96}` ✅
---

## 7. Fingerprint/Normalized Collision Analysis

| Metric | Count | Assessment |
|--------|-------|------------|
| Unique fingerprints | 2,753 / 2,920 | 167 duplicates — **all cross-age-track** (same variant, different ageTrack) |
| Unique normalized signatures | 2,456 / 2,920 | 464 structural collisions — **all cross-age-track** |
| Structural reuse pairs | 50 | Expected cross-age reuse (same variant, different ageTrack) |

**Assessment:** By design. Cosmetic ID fingerprints differ across age tracks; structural board reuse is intentional for same variant across ages. Not a bug.

---

## 8. Human-Review Pending (External Release Gate)

| Item | Status | Note |
|------|--------|------|
| Editorial approval for 2,920 candidates | `pending_human_review` | Only `age_6_8`, `age_9_12` initially approved for production (1,460 items) |
| Release profile | `not-release-selectable` | Correctly blocks all unreviewed items |
| Production tracks advertised | 2 of 4 | Initial approved production = 1,460, not all 2,920 |

**Not a technical bug** — explicit design decision per leader updates.

---

## 9. Remaining Work / Minimal Repro Blockers

| # | Fix Required | Owner | Scope |
|---|--------------|-------|-------|
| 1 | Fix g04-t2 checker (`mechanics/remaining.ts` → `rule-conditional-v1`) | Engine writer | Reject wrong answers |
| 2 | Fix g05-t2 solver/checker (`quantity-group-v1`) | Engine writer | Align solver output, strengthen checker |
| 3 | Implement g07-t3 alternate search (`flexibility-alternate-v1`) | Engine writer | Find valid second solutions |
| 4 | Re-audit after fixes | Verifier | Expect `review_blocked_quality` (cross-age fingerprint collisions remain) |
| 5 | Human editorial review | External | 1,460 initial production tracks only |

**Minimal repro for g04-t2:** Any `D004-*` or `D005-*` item in batch 1 — `wrong_answer_accepted` on all 4 age tracks.
**Minimal repro for g05-t2:** `D029-*`, `D032-*`, `D034-*` in batch 2 — `known_answer_rejected` + `wrong_answer_accepted`.
**Minimal repro for g07-t3:** `D095-*` (batch 3), `D276-*` (batch 5) — `alternate_missing: no options for alternate search`.

---

## 10. Checkpoint Verdict

**TECHNICAL FAIL** — Catalog audit fails on 3 concrete engine bugs. Generation deterministic, audit infrastructure complete, version-aware tests pass. V1 archive preserved. No fake approvals; quality limits honestly reported.

**Human review remains external release gate** even if technical candidate were GREEN. Do not weaken checker/profile/test to mask failures.
- Manifest version: `p08-candidates-365-v2` ✅
- Status: `pending_human_review` ✅

**V2 Meta (`candidate-meta-v2.json`):**
- Engine hash: `c5c126aa8f2579523994863508a9fe24b1c837e54b6bcbabf9481f6c9cf256a8` ✅ matches live canonical
- Engine version: `engine-c5c126aa8f257952` ✅
- Source hash: `a48461dfbfc096bec79ceab171489cfe80e133d17a4aac4313d7f1644725e3a9` ✅ matches CSV
- Seed policy: `contentVersion|slotId|ageTrack|locale|gameTypeId|ruleVariant` ✅
- Release profile: `not-release-selectable` ✅

**All 2,920 items:** `source.commit = engineHash`, `contentVersion = p08-candidates-365-v2`, `status = design_only`, `editorial = null` ✅
| Fingerprint uniqueness | ⚠️ WARN | 2,753 unique / 2,920 (167 cross-age duplicates) |
| Normalized uniqueness | ⚠️ WARN | 2,456 unique / 2,920 (464 structural collisions) |
| Age complexity | ✅ PASS | 0 over target |
| Structural reuse | ⚠️ WARN | 50 variant×day collisions (expected cross-age) |
| Release profile rejection | ✅ PASS | Correctly rejects all `design_only` |
| CSV↔manifest mapping | ✅ PASS | 730 slot IDs × 4 tracks match CSV |

**Catalog status:** `fail` (250 errors, 250 warnings — capped at 250 each)