# OpenCode all-mechanics P06 handoff

Status: **DONE — 21 remaining mechanics implemented, wired, tested, and backed by internal fixtures; the original 3 mechanics and the external QA suite remain green**.
Date: 2026-10-21.
Task: `task_bbdb4aee482e` / dispatch `ctx_2543d21d9179`.
Worker terminal: `term_5bd8da0d-f005-47a7-9707-cd0bffca4b85`.
Workspace: `/home/opc/orca/goodhabittracking`.
External QA test: `tests/unit/thinking-games-adversarial.test.ts` (not edited).

## 1. Baseline and scope

Baseline after the previous P1 fix: **83/83 combined tests green**, `tsc` clean, scoped ESLint clean,
and the content CLI gates in their expected pass/fail shape.

This task implemented the 21 remaining CSV mechanics:

| Family | New mechanics |
| --- | --- |
| g01 rule | `g01-t2`, `g01-t3` |
| g02 spatial | `g02-t1`, `g02-t2`, `g02-t3` |
| g03 memory | `g03-t2`, `g03-t3` |
| g04 reasoning | `g04-t1`, `g04-t2`, `g04-t3` |
| g05 quantity | `g05-t1`, `g05-t2`, `g05-t3` |
| g06 planning | `g06-t2`, `g06-t3` |
| g07 flexibility | `g07-t1`, `g07-t2`, `g07-t3` |
| g08 observation | `g08-t1`, `g08-t2`, `g08-t3` |

The original `g01-t1`, `g03-t1`, and `g06-t1` generators/checkers/answer shapes were not rewritten.

## 2. Implementation

### 2.1 Engine mechanics

File: `src/lib/thinking-games/mechanics/remaining.ts` (new).

Every mechanic has a strict board parser, deterministic seeded generator, solver, checker, two
non-leaking hints, an explanation, a title/tutorial, age-track target seconds, and praise keys.
The concrete rules are:

- `g01-t2`: locate the single sequence position that breaks alternating, increment, or repeating order.
- `g01-t3`: infer add/subtract/double/reverse from worked examples and apply it to a new input.
- `g02-t1`: match a silhouette by exact occupied cells, not just its outline.
- `g02-t2`: choose the rotated/mirrored copy of a shape.
- `g02-t3`: fill the one missing cell or identify the unique mirror-breaking cell.
- `g03-t2`: recall all target positions, or recall the hidden positions after a reveal phase.
- `g03-t3`: name the single removed/added/swapped/changed detail between two scenes.
- `g04-t1`: eliminate candidates using positive and negative clues.
- `g04-t2`: derive new facts from if-then rules; any correctly derivable option is accepted.
- `g04-t3`: choose the extra fact that makes exactly one candidate match the target.
- `g05-t1`: balance two pans by finding the missing/replacement weight, comparing sums, or solving an unknown.
- `g05-t2`: divide into groups and answer the group count, remainder, floor count, or number needed for another group.
- `g05-t3`: choose a subset for a target; supports fewest items, exactly two items, not-over target, and any valid subset.
- `g06-t2`: order commands while respecting precedence constraints; any valid topological order is accepted.
- `g06-t3`: repair one command so the robot reaches its goal; any working repair option is accepted.
- `g07-t1`: classify under a newly stated rule instead of a familiar one.
- `g07-t2`: describe a target from another viewer’s facing direction.
- `g07-t3`: find a valid path different from the shown path; every valid alternative is accepted.
- `g08-t1`: identify every changed cell between two grids.
- `g08-t2`: select all items satisfying two traits at once.
- `g08-t3`: identify the one scene detail that violates the stated rule.

Checks accept valid alternatives where the mechanic is genuinely multi-solution (`g04-t2`,
`g05-t3`, `g06-t2`, `g06-t3`, `g07-t3`) and remain strict for single-answer mechanics.
No `Date.now()` or `Math.random()` is used in engine generation.

### 2.2 Types, schemas, registry, dispatch

- `src/lib/thinking-games/types.ts` — added 21 checker IDs, board/point/trait types, expanded
  `BoardData`, and `BoardKind`.
- `src/lib/thinking-games/schema.ts` — added strict Zod schemas for all 21 boards, expanded
  `boardDataSchema`, and changed item validation to validate checker/board-kind when
  `mechanic.available` (not only legacy `implemented`).
- `src/lib/thinking-games/registry.ts` — added `available`, `AVAILABLE_GAME_TYPE_IDS` (24),
  `requireAvailable()`, and checker/board-kind metadata for all 21. Legacy
  `IMPLEMENTED_GAME_TYPE_IDS` remains `['g01-t1','g03-t1','g06-t1']` so existing tests and the
  bounded P03/P05 contract stay compatible.
- `src/lib/thinking-games/checkers.ts` — dispatches the 21 new mechanics through the remaining
  registry; `solvePuzzle` preserves the legacy `format_unavailable` result for a metadata-only
  item with no board data. Old answer shapes remain unchanged.
- `src/lib/thinking-games/fingerprint.ts` — canonicalizes all 21 new board kinds; the existing
  path-orbit canonicalization for `g06-t1` is unchanged.
- `src/lib/thinking-games/renderer.ts` — exports `InteractionDescriptor` and
  `GAME_INTERACTIONS` for all 24 game types, covering single/multi/ordered/number/index/point/
  cells/path input and answer shape. No UI renderer was implemented; this is the stable
  renderer-agnostic contract for the UI owner.
- `src/lib/thinking-games/index.ts` — exports the remaining mechanics.

## 3. Internal fixtures

File: `content/thinking-games/p06-fixtures/p06-fixtures-v1.json` (new).

- **168 items** = 21 mechanics × 2 released age tracks × 4 variants.
- All items are `design_only`, `editorial: null`, `source: null`, `humanApproved: false`, and
  `status: internal_test_only` at fixture level.
- All 168 IDs and all 168 canonical fingerprints are unique.
- This file is **not** a pilot manifest and **not** a release manifest. It does not claim 365-day
  coverage, human approval, or production readiness.
- The task wording mentions four GAME age tracks, but the frozen contract/types expose only
  `age_6_8` and `age_9_12`. I generated both released tracks and did not silently add 3–5 or 13+
  tracks. This needs a contract decision before any four-track fixture expansion.

## 4. Tests added

- `tests/unit/thinking-games/all-mechanics.test.ts`
  - 21 registered/available mechanics with matching checker/board metadata;
  - every variant on both tracks generates, solves, checks, validates, fingerprints, and rejects
    a wrong answer;
  - malformed answer shapes are rejected;
  - alternative valid answers are accepted for multi-solution mechanics;
  - deterministic regeneration;
  - 24/24 interaction descriptors;
  - legacy `implemented` metadata remains exactly the original three.
- `tests/unit/thinking-games/p06-fixtures.test.ts`
  - 168-item/21-type/2-track/4-variant coverage;
  - unique IDs and fingerprints;
  - internal-only status and no approval claim;
  - every fixture item parses, validates, solves, and has no public solution field.

## 5. Verification

Run from `/home/opc/orca/goodhabittracking`:

| Command | Exit | Result |
| --- | --- | --- |
| `./node_modules/.bin/vitest run tests/unit/thinking-games tests/unit/thinking-games-adversarial.test.ts` | **0** | 14 files, **92 passed / 0 failed** |
| `./node_modules/.bin/tsc --noEmit --pretty false` | **0** | no errors |
| `./node_modules/.bin/eslint src/lib/thinking-games tests/unit/thinking-games/all-mechanics.test.ts tests/unit/thinking-games/p06-fixtures.test.ts --max-warnings=0` | **0** | no issues |
| `node scripts/check-thinking-games-content.mjs` | **0** | editorial PASS, pilot PASS, pilot-as-release expected FAIL, release-placeholder expected FAIL |

Content CLI still reports the intended gates:

```text
editorial: PASS 365 days / 730 slots / 24 typeIds / 96 variantPairs / 8 skills
pilot: PASS 7 days / 28 items / 3 typeIds / 6 variantPairs / 3 skills
pilot-as-release: FAIL pilot_fixture_not_release (expected)
release-placeholder: FAIL release_editorial + release_item_count + 9 more (expected)
```

The external Kilo adversarial suite is included in the 92/92 run and was left byte-for-byte
untouched.

## 6. Files changed

- `src/lib/thinking-games/types.ts`
- `src/lib/thinking-games/schema.ts`
- `src/lib/thinking-games/registry.ts`
- `src/lib/thinking-games/checkers.ts`
- `src/lib/thinking-games/fingerprint.ts`
- `src/lib/thinking-games/renderer.ts`
- `src/lib/thinking-games/index.ts`
- `src/lib/thinking-games/mechanics/remaining.ts` (new)
- `tests/unit/thinking-games/all-mechanics.test.ts` (new)
- `tests/unit/thinking-games/p06-fixtures.test.ts` (new)
- `content/thinking-games/p06-fixtures/p06-fixtures-v1.json` (new)
- `plans/261021-daily-thinking-games/execution/opencode-all-mechanics-handoff.md` (this report)

No pilot/release manifest, server/API/UI/store/contract/dependency file, or external adversarial
test was edited. No commit, push, deploy, build, or dev server was run. Pre-existing unrelated
workspace changes were preserved.

## 7. Findings and remaining gaps

- **Human Vietnamese editorial/age review is still pending.** The 168 P06 fixtures are internal
  test material only; they are not approved content.
- **P1-3 (unreviewed content serving)** remains open from the prior QA handoff. No serving/API
  behavior was changed here.
- **P2-1 (legacy variant mapping)** remains scoped as before for the original three mechanics. The
  21 new mechanics do distinguish their four declared variants in generation and tests.
- **Renderer UI is not implemented.** `GAME_INTERACTIONS` is the contract only; accessibility,
  memory reveal phases, pause/exit, and fallback interaction still belong to the UI phase.
- The full repo lint still has the unrelated `src/components/thinking-games/ThinkingGamePreview.tsx`
  `react-hooks/set-state-in-effect` finding; the scoped P06 lint is clean.
- The research underdetermines several exact rules. The implemented rules above are the smallest
  coherent playable interpretations; they need content/age review before release use.
