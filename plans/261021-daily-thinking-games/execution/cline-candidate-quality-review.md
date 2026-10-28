# P07 Candidate Quality Review — Cline Independent Audit

## Task Scope

This report conducts an independent quality audit of the P07 year candidates (365 days × 4 tracks × 2 slots × 24 types = 2,920 design_only candidates), using existing engine exports and existing audit infrastructure. NO engine/content/candidate/status/UI/API/SQL edits were made. The audit scope covers:

- **Manifest**: `content/thinking-games/candidates/365-v1/candidate-manifest-v1.json` — 2,920 items
- **Engine**: `engine-0f7da85273374e83` (generated via esbuild from `src/lib/thinking-games/index.ts`)
- **Source CSV**: `docs/research/2026-10-17-daily-thinking-games-365.csv` — SHA-256: `a48461dfbfc096bec79ceab171489cfe80e133d17a4aac4313d7f1644725e3a9`
- **Audit infrastructure**: `scripts/check-thinking-games-candidates.mjs` and `scripts/generate-thinking-games-candidates.mjs`

## UNVERIFIED Initial Assessment

**Status**: review_blocked_quality  
**Quality defects pending verification**:

1. **Duplicate fingerprints**: 714 candidates share fingerprints with other candidates (uniqueFingerprints: 2206/2920).  
   *Source: catalog audit p07-365-v1-catalog.json; batch-level counts: 31–124 per batch.*

2. **Normalized skin duplicates**: 727 candidates have normalized structural signatures that collide across cosmetic variants (uniqueNormalized: 2193/2920).  
   *Source: catalog audit p07-365-v1-catalog.json; batch-level counts: 31–126 per batch.*

3. **Age complexity not monotonic**: 83/96 (type, variant) pairs do not show strictly increasing structural complexity from `age_3_5` to `age_13_plus`.  
   *Source: catalog audit p07-365-v1-catalog.json; by-variant details in ageComplexityWarnings.*

4. **Structural reuse**: 50 (type, variant, track) groups have only one normalized structural signature across all generated candidates in that group.  
   *Source: catalog audit p07-365-v1-catalog.json; structuralReuseWarnings list.*

5. **Path solver/checker disagreement**: `solvePath` can return paths that fail `checkPath`'s no-revisit contract (2 initial g06-t1 candidates resolved via seed retry).

6. **Hint leak false positive**: `assertNoAnswerLeak` uses substring matching — single-token memory answer `cá` matches ordinary word `các`.

## Independent Reproduction Plan

To be executed after checkpoint creation:

- Run `npx vitest run tests/unit/thinking-games/year-candidates.test.ts` → expect 6/6 pass
- Run `npx vitest run tests/unit/thinking-games/` → expect 67/67 pass  
- Run audit on each batch independently using `auditItems` engine function
- Verify normalized structural signatures and age complexity monotonicity per (type, variant, track)
- Independently reproduce path solver/checker disagreement cases
- Record all source/candidate hashes and fingerprints for evidence

## Commands Reference

- Run all unit thinking-games tests: `npx vitest run tests/unit/thinking-games/`
- Run year-candidates tests: `npx vitest run tests/unit/thinking-games/year-candidates.test.ts`
- Run check-thinking-games-candidates audit: `node scripts/check-thinking-games-candidates.mjs --all`
- Run check-thinking-games-candidates per batch: `node scripts/check-thinking-games-candidates.mjs --batch=1..5`

---
*This checkpoint is marked UNVERIFIED. Independent audit will populate exact defect details, severity, and candidate IDs before finalization.*