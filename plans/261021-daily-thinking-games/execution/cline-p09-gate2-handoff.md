# Cline P09 Gate2 Fix Handoff

## Summary
Fixed all remaining lint warnings (30) in feature files and the test timeout in `mechanics.test.ts` to achieve clean CI gate passage.

## Changes Made

### 1. Lint Warning Fixes (30 warnings across 4 real files + 1 ignored file)

#### `scripts/check-thinking-games-candidates-v2.mjs` (18 warnings fixed)
- Removed unused imports: `SOURCE_REPO`, `SOURCE_URL`
- Removed unused constants: `INITIAL_TRACKS`, `ALTERNATE_CANDIDATE_TYPES`, `SET_BASED_ANSWER_TYPES`
- Removed unused variables in loops: `knownPathSet`, `solutionSet`, `textContainsAnswer` function
- Fixed unused destructured variables in for-loops (`fp`, `norm`) by using `.values()` instead of `.entries()`
- Fixed unused function parameters `scope`, `manifest` in `auditItems` by removing them
- Removed dead code: `checks` and `quality` objects that were created but not used

#### `tests/integration/migrations/thinking-games-authority-races-runtime.mjs` (6 warnings fixed)
- Removed unused function `clientAs`
- Removed unused function `serialOn`
- Removed unused constant `RELEASE_VERSION`
- Removed unused destructured variable `utc_hour`
- Removed unused variable `admin`
- Removed unused variable `snapshotId`

#### `tests/integration/migrations/thinking-games-settings-runtime.mjs` (1 warning fixed)
- Removed unused variable `tomorrow`

#### `tests/unit/thinking-games/year-candidates.test.ts` (1 warning fixed)
- Removed unused variable `loaded`

#### `private/tmp/verify-defects.mjs` (4 warnings - ignored via eslint config)
- Added `private/**` to `globalIgnores` in `eslint.config.mjs` — consistent with how other generated/private dirs (`.next/**`, `build/**`, `coverage/**`, etc.) are ignored
- File preserved as requested (scratch file for local verification)

### 2. Test Timeout Fix: `tests/unit/thinking-games/mechanics.test.ts:170`

**Issue**: Test "generates a solvable board and a rejected answer for every variant on every track" timed out at default 5000ms under full `npm run test:unit` load (passed in isolation in ~7s).

**Fix**: Added explicit per-test timeout `{ timeout: 15000 }` following the convention used in `p06-fixtures-v2.test.ts:47` (`{ timeout: 10000 }`), sized with margin (measured isolated duration ~7.2s, set to 15s).

**Coverage**: No reduction — all 24 mechanics × 4 tracks × 4 variants still tested.

## Verification Results

| Command | Exit Code | Result |
|---------|-----------|--------|
| `npm run lint` (on modified files) | 0 | ✅ PASS (0 errors, 0 warnings) |
| `npm run typecheck` | 0 | ✅ PASS |
| `npm run test:unit` (run 1) | 0 | ✅ PASS (238 files, 2840 tests, 54.51s) |
| `npm run test:unit` (run 2) | 0 | ✅ PASS (238 files, 2840 tests, 45.87s) |
| `node scripts/check-thinking-games-candidates-v2.mjs --all` | 0 | ✅ PASS (`ok: true`, `errorCount: 0`) |
| `SQL_TEST_DATABASE_URL=... node tests/integration/migrations/thinking-games-authority-races-runtime.mjs` | 0 | ✅ PASS (25/25 cases PASS) |
| `SQL_TEST_DATABASE_URL=... node tests/integration/migrations/thinking-games-settings-runtime.mjs` | 0 | ✅ PASS (5/5 cases PASS) |

## Scope Compliance
- ✅ Only modified the 5 scoped files + eslint config
- ✅ No src/ engine, SQL, or content changes
- ✅ No eslint-disable comments or rule changes
- ✅ No test semantics/assertions or audit behavior changes
- ✅ Private file preserved, ignored via config

## Files Modified
1. `eslint.config.mjs` — added `private/**` to ignores
2. `scripts/check-thinking-games-candidates-v2.mjs` — removed 18 unused vars/imports
3. `tests/integration/migrations/thinking-games-authority-races-runtime.mjs` — removed 6 unused vars/functions
4. `tests/integration/migrations/thinking-games-settings-runtime.mjs` — removed 1 unused var
5. `tests/unit/thinking-games/year-candidates.test.ts` — removed 1 unused var
6. `tests/unit/thinking-games/mechanics.test.ts` — added 15000ms timeout

## Pre-existing Issues (Unchanged)
- `private/tmp/verify-defects.mjs` still has 4 unused imports — now properly ignored by eslint config
- No other regressions introduced