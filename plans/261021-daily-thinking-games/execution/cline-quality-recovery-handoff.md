# Quality Recovery Checkpoint & Execution Log

Status: **IN_PROGRESS — Prior AGY quality11/11 PASS but 2920 V2 generation not accepted**

Date: 2026-10-22

Task: task_7ef3d9f33e81

## Engine & Environment
- Git HEAD: `9db0c946c9a23d2069d71ba7878bd3079af149ff`
- Source 365 CSV: `docs/research/2026-10-17-daily-thinking-games-365.csv`
- Engine Entry: `src/lib/thinking-games/index.ts`
- Engine Types: `src/lib/thinking-games/types.ts`

## Current Test Results (before fixes)
- generator-quality.test.ts: 9 pass, 2 fail
- Defect 1 fail: g07-t3 seed diversity - got 2 unique fingerprints across 8 seeds (need >= 3)
- Defect 4 fail: g07-t1 age complexity monotonicity - age_3_5 = age_6_8 = 34 (non-monotonic)

## 4 Known Reader-Independent Defects Requiring Fix

### Defect 1: Static generators ignore seed (g06-t2, g07-t1, g07-t3, g08-t2)
- Problem: Only 2 unique boards across 32 candidates, 714 duplicate fingerprints in 365-v1
- Investigation needed: Reproduce golden test independent of implementation, fix seeded data/constraint/strategy diversity
- Scope: Ensure 8+ seeds per type/variant/track yield meaningful canonical diversity
- Specific types affected: g06-t2, g07-t1, g07-t3, g08-t2
- Action: Fix seed usage in remaining mechanics to produce truly diverse outputs

### Defect 2: solvePath returns routes with cell revisits forbidden by checkPath
- Problem: Paths that revisit cells are returned, violating checkPath contract
- Investigation needed: Reproduce with tiny board counterexamples, fix solvePath to guarantee simple paths
- Scope: visited set, waypoint state, bounded valid simple paths
- Action: Implement proper path validation and visited-cell tracking

### Defect 3: assertNoAnswerLeak false positive on Vietnamese substring (e.g. 'cá' in 'các')
- Problem: Vietnamese substring matches falsely triggering answer leak guard
- Investigation needed: Unicode-aware word/phrase boundary matching
- Scope: preserve strict answer protection while avoiding false positives
- Action: Implement word-boundary-aware textContainsAnswer check with positive/negative controls

### Defect 4: Age complexity audit inverted (83/96 variant pairs)
- Problem: Inversion between age_3_5, age_6_8, age_9_12, age_13_plus fallback to 6_8 branch
- Investigation needed: Classify audit metric vs generator fallbacks, implement genuine 4-profile scaling
- Scope: Not just larger numbers/textLength - actual constraint/inference/planning/memory load complexity
- Action: Fix age complexity scoring to be strictly monotonic: age_3_5 < age_6_8 < age_9_12 < age_13_plus

## Phase 5: Candidate v2 Generation & Verification

After defects are resolved, will generate 2920 V2 candidates across 5 batches:
- Total: 365 x 2x4 = 2920 candidates (but V2 uses design_only/pending_human_review)
- 5 batches across 365 days with 24 type IDs, 96 variant pairs, 8 skills
- Each batch: 24 items/day x 2 slots = 48 items per batch
- After engine hash regeneration, will regenerate ALL 2920 candidates with current engine

## Execution Plan
1. Fix Defect 1: Seed diversity in static generators (g06-t2, g07-t1, g07-t3, g08-t2)
2. Fix Defect 2: solvePath cell revisit bug
3. Fix Defect 3: Unicode-aware answer leak detection
4. Fix Defect 4: Age complexity monotonicity
5. Run all 11 generator-quality tests to verify all pass
6. Regenerate ALL 2920 V2 candidates in 5 batches
7. Run full V2 audit suite: schema validation, known solution/solve/checker agreement, wrong/alternate answer audits, fingerprint diversity, monotonicity checks
8. Preserve all v1 candidate historical data and pilot bytes unchanged

## Constraints
- No new deps/commit/push/deploy
- Preserve original pilot bytes and V1 history
- Minimal changes only to owned src/lib/thinking-games/** 
- Output must be deterministic given same seed