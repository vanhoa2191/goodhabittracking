# OpenCode admission + original-variant correctness handoff

Status: **DONE for the engine/contract work; one external test file is stale and intentionally red**.
Date: 2026-10-21.
Task: `task_52162c41e728` / dispatch `ctx_a7bbaf559f5e`.
Worker terminal: `term_5bd8da0d-f005-47a7-9707-cd0bffca4b85`.
Workspace: `/home/opc/orca/goodhabittracking`.
External QA file: `tests/unit/thinking-games-adversarial.test.ts` (byte-identical, not edited).

## 1. Outcome

Implemented the requested admission gate, additive trusted internal profile, four-track engine
capability, real semantics for all four variants of the original three mechanics, and full
two/three/four-track fixture coverage.

- Public `resolveAssignment` now serves only `approved` items with editorial review.
- Pilot/design-only content is available only through an explicit trusted internal profile.
- The local demo adapter no longer calls that profile from a client-facing module.
- All 24 mechanics generate, solve, check, validate and fingerprint on four tracks × four variants.
- Existing pilot payload and fingerprints are unchanged.
- `tsc`, scoped ESLint, the content CLI, API smoke tests and the owned engine suite are green.
- Seven assertions in the external Kilo suite encode the old public-default/four-track behavior and
  remain red. That file was not modified; see §7 for the exact required external update.

## 2. Admission/profile API

Exported from `src/lib/thinking-games/scheduler.ts`:

```ts
export const INTERNAL_PILOT_PROFILE = 'internal_pilot' as const;
export type AssignmentContentProfile = 'public' | typeof INTERNAL_PILOT_PROFILE;
export type AssignmentOptions = Readonly<{ contentProfile?: AssignmentContentProfile }>;

resolveAssignment(request, options?: AssignmentOptions)
resolveInternalPilotAssignment(request)
assertContentPin(pin, item)
```

Behavior:

- `resolveAssignment(request)` defaults to `public`.
- `public` admits only `status === 'approved' && editorial !== null`; `retired` is always rejected.
- If matching slot/track/locale/version items exist but none are admitted, the result is
  `{ ok: false, code: 'content_not_approved' }`.
- If no item matches the slot/track/locale/version, the result is
  `{ ok: false, code: 'content_unavailable' }`.
- `resolveInternalPilotAssignment` wraps the same resolver with `internal_pilot`; it is the only
  permissive entry point and is intended for trusted server/devtest callers.
- The browser request body cannot select a profile; the profile is an in-process typed option.
- `src/lib/store/thinking-games-local.ts` now resolves its pilot demo item locally and converts it
  with `toPublicPuzzle`, so no client-facing module selects `internal_pilot`/`contentProfile`.
- A new guard test scans `src/app`, `src/components`, `src/lib/store` and `src/lib/i18n` for
  `internal_pilot`, `contentProfile`, `resolveInternalPilotAssignment` and `allowPilotProfile`.

## 3. Four age tracks

`src/lib/thinking-games/types.ts`:

```ts
GAME_AGE_TRACKS = ['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus']
ADVERTISED_AGE_TRACKS = ['age_6_8', 'age_9_12']
type GameAgeTrack = ...GAME_AGE_TRACKS
type AgeTrack = ...ADVERTISED_AGE_TRACKS   // retained for the existing public UI contract
```

- `PuzzleItem`, manifests, generators, scheduler requests and schemas accept all four tracks.
- `PublicPuzzle`/renderer/UI-facing types remain the two advertised tracks, so existing UI code
  compiles unchanged.
- Target seconds: 3–5 = 60, 6–8 = 75, 9–12 = 105, 13+ = 115.
- The shipped pilot manifest still declares only 6–8 and 9–12; four-track content is internal only.
- `src/lib/thinking-games/age.ts` is exported from the package barrel.

## 4. Original three variants

### g01-t1 — rule sequence

- `lặp một thuộc tính` → alternating sequence.
- `tăng số phần tử` → numeric increment sequence.
- `xen kẽ hai chuỗi` → interleaved numeric sequences for 9–12/13+, repeating fallback for younger.
- `suy ngược phần đầu` → repeating block, period 3 for younger and 4 for older.

The increment variant no longer uses repeating hints/explanations. Interleaved boards expose
`ruleKind: 'alternating'` and a sequence-aware solver.

### g03-t1 — memory sequence

- `nhắc lại cùng chiều` → `recall`.
- `chọn phần tử còn thiếu` → `missing`.
- `nhắc lại theo nhóm` → `grouped` with `groupSize`.
- `tìm cặp bị đổi thứ tự` → `swapped` with `swappedIndices`.

Solver/checker/descriptions now branch by mode. Fixed a generation bug where shuffling could drop a
sequence token from `options`; all sequence tokens are now retained.

### g06-t1 — path planning

- `đến đích tránh chướng ngại` → reach goal, no waypoints.
- `đi qua một điểm bắt buộc` → at least one required waypoint.
- `lấy chìa trước khi tới cửa` → two ordered waypoints (`key`, then `door`).
- `chọn đường ít bước trong bàn nhỏ` → `shortestPathOnly`; checker rejects longer valid-looking paths.

BFS state tracking now handles ordered waypoints and shortest-path enforcement.

## 5. Remaining 21 mechanics

`src/lib/thinking-games/mechanics/remaining.ts` now accepts four tracks, uses the shared target-second
helper, and all 21 mechanics remain solvable/checkable on 3–5, 6–8, 9–12 and 13+.

- Fixed `g08-t3` variant fingerprints: four variants now use distinct rule/value/position combinations.
- Fixed a memory fixture/schema mismatch where options could omit sequence tokens.
- No changes to public answer shapes for the original three.

## 6. Fixtures and tests

### New fixture

`content/thinking-games/p06-fixtures/p06-fixtures-v2.json`

- **384 items** = 24 mechanics × 4 tracks × 4 variants.
- All `design_only`, `editorial: null`, `source: null`, `humanApproved: false`.
- 384 unique IDs; four unique fingerprints per mechanic/track (cross-track duplicates are allowed
  where the same structural board is intentionally reused).
- `sha256: afab20fe12874e48bb80a463ad804d41acacd7989f03d124f2530fe58cb1187c`.

`p06-fixtures-v1.json` remains unchanged at 168 items
(`sha256: 5cafcd59bf0fefa530cff921eb492253b22e7890a8764f9ab052ffedcdf77933`).
The pilot manifest remains unchanged
(`sha256: 2f9ce10c0540b6e6617bb6c4206a32a6ee47749bced40e016f7a4c4a0d56e879`).

### Tests added/updated

- `tests/unit/thinking-games/scheduler.test.ts`: public rejects pilot; internal serves it; approved +
  editorial item serves publicly; four-track manifest acceptance.
- `tests/unit/thinking-games/pilot-content.test.ts`: uses `resolveInternalPilotAssignment`.
- `tests/unit/thinking-games/mechanics.test.ts`: all four original variants × four tracks; asserts
  actual `ruleKind`/`mode`/path shape and non-empty hints/explanations.
- `tests/unit/thinking-games/all-mechanics.test.ts`: 21 mechanics × four tracks × four variants.
- `tests/unit/thinking-games/admission-profile.test.ts`: no permissive profile token in client-facing dirs.
- `tests/unit/thinking-games/p06-fixtures-v2.test.ts`: 384-item four-track fixture validation.

## 7. External Kilo suite — intentional conflict

`tests/unit/thinking-games-adversarial.test.ts` is unchanged:

- `sha256: c3c024c387f200303acfe68e6dd2ebebbf4a73755aeac794c5044f35b55e5aa9`
- 864 lines, 36 tests.
- Current run: **29 passed / 7 failed**, exit 1.

Why it cannot pass unchanged under the accepted contract:

1. Six determinism tests call the default resolver against the design-only pilot manifest. Under the
   requested gate that now correctly returns `content_not_approved`, so `first.ok`/`second.ok` are
   false. They must either call `resolveInternalPilotAssignment` (they test pilot determinism) or use
   an approved + editorial fixture. This is a test-side change; no engine change can both reject
   design-only content by default and serve it to those six calls.
2. `schema rejects unsafe boards > rejects out-of-range item level fields` still expects
   `age_13_plus` to be invalid. Under the four-track contract it is valid; the assertion must be
   changed to reject a bogus track instead.

The external owner must update those assertions. I did not edit the file and did not introduce a
test-environment bypass.

## 8. Verification

| Command | Exit | Result |
| --- | --- | --- |
| `./node_modules/.bin/vitest run tests/unit/thinking-games --exclude tests/unit/thinking-games-adversarial.test.ts` | 0 | 15 files, **64 passed / 0 failed** |
| `./node_modules/.bin/vitest run tests/unit/thinking-games-adversarial.test.ts` | 1 | 36 tests, **29 passed / 7 failed** (stale external expectations; file unchanged) |
| `./node_modules/.bin/tsc --noEmit --pretty false` | 0 | no errors |
| `./node_modules/.bin/eslint src/lib/thinking-games src/lib/store/thinking-games-local.ts tests/unit/thinking-games --max-warnings=0` | 0 | no issues |
| `./node_modules/.bin/vitest run tests/api/thinking-games-catalog.test.ts tests/api/thinking-games-settings.test.ts` | 0 | 6 passed |
| `node scripts/check-thinking-games-content.mjs` | 0 | editorial PASS, pilot PASS, pilot-as-release expected FAIL, release-placeholder expected FAIL |

Content CLI still reports the intended gates: 365 days / 730 slots / 24 types / 96 variant pairs;
pilot 7 days / 28 items / 3 types; release remains blocked by human approval and zero items.

## 9. Files changed by this task

- `src/lib/thinking-games/age.ts` (new)
- `src/lib/thinking-games/types.ts`
- `src/lib/thinking-games/registry.ts`
- `src/lib/thinking-games/schema.ts`
- `src/lib/thinking-games/fingerprint.ts`
- `src/lib/thinking-games/scheduler.ts`
- `src/lib/thinking-games/index.ts`
- `src/lib/thinking-games/mechanics/rule-sequence.ts`
- `src/lib/thinking-games/mechanics/memory-sequence.ts`
- `src/lib/thinking-games/mechanics/path-planning.ts`
- `src/lib/thinking-games/mechanics/remaining.ts`
- `src/lib/store/thinking-games-local.ts` (client admission blocker fix)
- `tests/unit/thinking-games/scheduler.test.ts`
- `tests/unit/thinking-games/pilot-content.test.ts`
- `tests/unit/thinking-games/mechanics.test.ts`
- `tests/unit/thinking-games/all-mechanics.test.ts`
- `tests/unit/thinking-games/admission-profile.test.ts` (new)
- `tests/unit/thinking-games/p06-fixtures-v2.test.ts` (new)
- `content/thinking-games/p06-fixtures/p06-fixtures-v2.json` (new)
- `plans/261021-daily-thinking-games/execution/opencode-admission-variants-handoff.md` (this report)

No pilot/release manifest, server/API route, UI component, dependency, or external adversarial file
was edited. No commit, push, deploy, build, or dev server was run. Pre-existing unrelated workspace
changes were preserved.
