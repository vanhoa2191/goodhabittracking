# OpenCode engine handoff — P03 + P05 pilot content

Status: **IMPLEMENTED AND VERIFIED — 3 mechanics + 28 pilot items**.
Date: 2026-10-21.
Task: `task_98e0679d0ebc` / dispatch `ctx_5d45d4a3409e`.
Worker terminal: `term_5bd8da0d-f005-47a7-9707-cd0bffca4b85`.
Base SHA: `9db0c946c9a23d2069d71ba7878bd3079af149ff`.
Contract version: `p01-2026-10-21-r2`; content schema `content-schema-v1`; pilot manifest `pilot-manifest-v1`.
Gate receipt: `plans/261021-daily-thinking-games/execution/copilot-contract-review.md` — **ACCEPTED**.

## 1. Scope delivered

Implemented only the authorized source scope:

- `src/lib/thinking-games/**` except `src/lib/thinking-games/server/**` (Copilot/server lane owns it);
- `tests/unit/thinking-games/**`;
- `scripts/check-thinking-games-content.mjs`;
- `content/thinking-games/pilot/**` and `content/thinking-games/manifests/**`;
- this handoff.

No SQL, API, client store, UI, i18n, shared flag, command schema, package or dependency change was made. No commit, push or deploy. `src/lib/thinking-games/server/response.ts` and `server/rpc-error.ts` were left untouched.

## 2. Implemented mechanics

| Role | CSV `type_id` | Skill | Checker | Answer |
| --- | --- | --- | --- | --- |
| Pattern/rule completion | `g01-t1` | `rule` | `rule-sequence-v1` | one token |
| Spatial/path planning | `g06-t1` | `planning` | `path-planning-v1` | full path; every valid path accepted |
| Memory sequence | `g03-t1` | `memory` | `memory-sequence-v1` | exact ordered token list |

The metadata registry contains all 24 measured IDs `g01-t1`…`g08-t3` and all 96 `(type_id, rule_variant)` pairs. The other 21 mechanics are metadata-only and return `format_unavailable`; there are no fake solvers or success stubs.

Age difficulty changes structure:

- `g01-t1`: 6–8 alternating/repeating sequence; 9–12 increasing numeric sequence.
- `g06-t1`: 6–8 5×5 grid, one wall; 9–12 7×7 grid, several walls and a required waypoint.
- `g03-t1`: 6–8 3–4 tokens, same-size option set; 9–12 5 tokens plus one distractor.

## 3. Exact exports for backend/UI wiring

Import from `@/lib/thinking-games`; the barrel is client-safe and contains no `server/**`, `node:` or Next server imports.

### Core parsing and public/grading split

```ts
parsePuzzleItem(input: unknown): PuzzleItem
parseManifest(input: unknown): ThinkingGamesManifest
toPublicPuzzle(item: PuzzleItem): PublicPuzzle
toGradingData(item: PuzzleItem): GradingData
assertNoAnswerLeak(item: PuzzleItem): void
```

`toPublicPuzzle` omits `solution`, `explanation`, `validSolutionPredicate`, `editorial` and `source`.

### Registry and deterministic utilities

```ts
GAME_MECHANICS
GAME_TYPE_IDS
RULE_VARIANTS
IMPLEMENTED_GAME_TYPE_IDS // ['g01-t1', 'g06-t1', 'g03-t1']
getGameMechanic(gameTypeId)
requireImplemented(gameTypeId)
hashSeed(input)
createSeededRandom(seed)
pickOne(random, values)
shuffleDeterministic(random, values)
stableSeedKey(parts)
puzzleFingerprint(gameTypeId, boardData)
canonicalizeBoard(gameTypeId, boardData)
assertFingerprint(item)
```

No engine path calls `Date.now()` or `Math.random()`.

### Checkers

```ts
checkAnswer(item, answer):
  | { ok: true; correct: boolean }
  | { ok: false; code: 'invalid_answer' }

solvePuzzle(item):
  | { ok: true; solution: unknown }
  | { ok: false; code: GameErrorCode }

validatePuzzle(item):
  | { ok: true }
  | { ok: false; code: GameErrorCode; details: readonly string[] }
```

Malformed answer shape is `invalid_answer`; a well-formed wrong answer is `{ok:true, correct:false}` and is a normal `finished` result.

### Scheduler / content pin

```ts
resolveAssignment(request):
  | { ok: true; assignment: {
      item: PuzzleItem;
      publicPuzzle: PublicPuzzle;
      pin: { contentVersion; itemId; fingerprint };
      seededOrder: readonly string[];
    } }
  | { ok: false; code: GameErrorCode }

assignmentKey(requestWithoutManifest): string
assertContentPin(pin, item): boolean
```

Filtering is exact on `dayIndex`, `slotType`, `ageTrack`, `locale`, `contentVersion`; multiple candidates are ordered by canonical fingerprint and selected with a seeded child/day/slot/version key. The same request never rerolls. Day `366` is `journey_complete`; unsupported track/locale and missing content return explicit errors.

### Manifest/catalog validation

```ts
validateEditorialRows(rows): CatalogValidationResult
validateManifest(input, { profile: 'pilot' | 'release', allowPilotProfile? }): CatalogValidationResult
validateCatalog({ rows?, manifest?, profile, allowPilotProfile? }): CatalogValidationResult
assertReleaseManifest(input): ThinkingGamesManifest
```

`CatalogValidationResult` is `{ok:true,metrics}` or `{ok:false,errors,metrics}`. Metrics always report `typeIds` and `variantPairs` separately.

Release validation requires 365 days × 2 slots × released tracks/locales, approved items with editorial fields, 24 type IDs, 96 variant pairs, 8 skills, main≠bonus, 358/358 rolling 8-day coverage, declared spacing ≥7 and actual spacing, and no fingerprint repeat inside the spacing window. The current release manifest is a `not_ready` placeholder with zero items and is rejected.

### Renderer interface only

`src/lib/thinking-games/renderer.ts` exports `RendererPuzzle`, `RendererAction`, `RendererFeedback` and `ThinkingGameRendererProps`. It has no React/UI implementation; the AGY/UI lane owns rendering.

## 4. Pilot content

`content/thinking-games/pilot/pilot-manifest-v1.json`:

- `isPilotFixture: true`, `minFormatSpacingDays: 1`, explicit `spacingException` with `appliesTo: "pilot-only"` and `productionManifestRequired: true`;
- 7 days × 2 slots × 2 tracks (`age_6_8`, `age_9_12`) × `vi` = **28 items**;
- exactly 3 type IDs and 3 distinct skill groups;
- main and bonus skills differ on every day/track;
- 28 unique canonical fingerprints;
- every item is `design_only`, `editorial: null`, `source: null`;
- every item is solvable, passes its checker, has exactly two hints and no answer leak.

Pilot matrix:

| Day | Main | Bonus | Main skill | Bonus skill |
| --- | --- | --- | --- | --- |
| 1 | `g01-t1` | `g06-t1` | rule | planning |
| 2 | `g03-t1` | `g01-t1` | memory | rule |
| 3 | `g06-t1` | `g03-t1` | planning | memory |
| 4 | `g01-t1` | `g03-t1` | rule | memory |
| 5 | `g03-t1` | `g06-t1` | memory | planning |
| 6 | `g06-t1` | `g01-t1` | planning | rule |
| 7 | `g01-t1` | `g06-t1` | rule | planning |

The release placeholder is `content/thinking-games/manifests/release-365-v1.json`; it claims the required 365/2/24/96 shape but has zero approved items and `editorialApproval: null`, so the release validator rejects it.

## 5. Verification evidence

Run from `/home/opc/orca/goodhabittracking`:

```text
npx vitest tests/unit/thinking-games
PASS (45) FAIL (0)

npx tsc --noEmit --pretty false
exit 0; "TypeScript: No errors found"

npx eslint src/lib/thinking-games tests/unit/thinking-games scripts/check-thinking-games-content.mjs --max-warnings=0
exit 0; "ESLint: No issues found"

node scripts/check-thinking-games-content.mjs
exit 0
editorial: PASS 365 days / 730 slots / 24 typeIds / 96 variantPairs / 8 skills /
  equalSkillDays 0 / rolling 358 of 358 / min spacing 11
pilot: PASS 7 days / 28 items / 3 typeIds / 3 skills / equalSkillDays 0
pilot-as-release: FAIL pilot_fixture_not_release (expected)
release-placeholder: FAIL release_item_count + release_editorial (expected)
```

Test coverage includes strict schema/adversarial inputs, public/grading separation, hint leaks, all 24 registry IDs, 96 variants, 21 unavailable mechanics, seeded stability with clock/random spies, canonical fingerprints and path symmetry, multi-answer path acceptance, exact memory order, deterministic pinning, pilot/release profile gates, canonical duplicate detection, 365-day editorial metrics, and client-safe import boundaries.

## 6. Honest limitations / next phase

- No renderer/UI was implemented; only the interface types above.
- No SQL/API/server integration was implemented; Copilot/P04 owns it and should import these pure modules rather than duplicate schemas/checkers.
- All pilot items are internal `design_only` fixtures. Human semantic/age approval and a real target-age pilot remain **PENDING**.
- The remaining 21 mechanics and the 365-day/730-slot approved release content are **NEXT**, not claimed. Passing the pilot never counts toward 24-format or 730-slot release coverage.
- No real-browser, performance, concurrency, migration or production enablement evidence is claimed.
