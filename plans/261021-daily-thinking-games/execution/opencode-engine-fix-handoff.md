# OpenCode engine P1 fix handoff

Status: **DONE — both reproduced P1 engine defects fixed and the external QA suite is re-green**.
Date: 2026-10-21.
Task: `task_e9a8bde67261` / dispatch `ctx_3a22777adde3`.
Worker terminal: `term_5bd8da0d-f005-47a7-9707-cd0bffca4b85`.
Workspace: `/home/opc/orca/goodhabittracking`.
QA source: `plans/261021-daily-thinking-games/execution/kilo-engine-qa-handoff.md`.
External QA test: `tests/unit/thinking-games-adversarial.test.ts` (not edited).

## 1. Baseline reproduction (before fixes)

Command run before any source/content edit:

```text
npx vitest run tests/unit/thinking-games-adversarial.test.ts
exit 1
Test Files  1 failed (1)
Tests       2 failed | 34 passed (36)
```

The two failures were exactly the two reported P1s:

1. `adversarial: pilot profile rejects a per-track equal-skill day > rejects a day where one age track repeats the same skill in both slots`
   - `AssertionError: expected [] to include 'pilot_equal_skill'`
   - The pilot profile aggregated main/bonus skills across both age tracks, so an equal-skill day on `age_9_12` was masked by the other track's different bonus skill.
2. `adversarial: pilot hints and explanations agree with the board > does not attach a repetition hint to a board whose items never repeat`
   - `AssertionError: expected 'nhìn xem các hình lặp lại theo nhịp n…' not to contain 'lặp lại'`
   - Five `age_9_12` numeric `increment` rule items carried the 6–8 repetition hint.

No validator, assertion, fixture, answer or external test was weakened to obtain these results.

## 2. Fixes

### P1-1 — pilot profile per-track equal-skill detection

File: `src/lib/thinking-games/manifest.ts`.

- `manifestMetrics()` now counts equal-skill violations per `(dayIndex, ageTrack)`, not by aggregating main/bonus skills across both tracks for a day.
- `validatePilotManifest()` now emits `pilot_equal_skill` at the offending path `ageTrack.day` (for example `age_9_12.1`), using the same per-track logic already used by the release validator.
- The shipped pilot remains clean and still reports `equalSkillDays: 0`.
- No public API, schema, export, error-code or fixture-profile shape changed.

### P1-2 — board-aligned rule hints

File: `content/thinking-games/pilot/pilot-manifest-v1.json`.

- The five `age_9_12` numeric `increment` rule items now use:
  - `Nhìn xem mỗi số tăng thêm bao nhiêu.`
  - `Thử tính khoảng cách giữa hai số liền nhau.`
- Their explanations now state the actual step and the graded answer, for example:
  - `Quy luật là mỗi số tăng thêm 3. Số tiếp theo là 20.`
- The five `age_6_8` alternating items also had the misleading word `hình` replaced with `từ`, matching their word-token boards.
- No `boardData`, `solution`, `fingerprint`, `id`, `contentVersion`, `status`, `editorial` or `source` field changed. Answers and pins are unchanged; this was a hint/explanation copy correction only.
- Content version remains `pilot-2026-10-21` because the external fixture/profile pins that version and no answer, board or fingerprint changed; the payload is still `design_only`, `editorial: null`, `source: null`; no human gate is claimed and no production enablement occurred.

## 3. Regression coverage added (own tests only)

- `tests/unit/thinking-games/manifest.test.ts`
  - rejects an equal-skill day on one age track even when the other track differs;
  - asserts `equalSkillDays: 1` and the exact `pilot_equal_skill` path `age_9_12.1`.
- `tests/unit/thinking-games/pilot-content.test.ts`
  - asserts numeric `increment` rule hints do not say `lặp lại`;
  - asserts each numeric rule explanation still ends with its graded answer.

The external Kilo adversarial file was left byte-for-byte untouched.

## 4. Verification after fixes

Run from `/home/opc/orca/goodhabittracking`:

| Command | Exit | Result |
| --- | --- | --- |
| `npx vitest run tests/unit/thinking-games-adversarial.test.ts` | **0** | 36 passed / 0 failed |
| `npx vitest run "tests/unit/thinking-games/"` | **0** | 10 files, 44 passed / 0 failed |
| `npx vitest run tests/unit/thinking-games-copy.test.ts` | **0** | 3 passed / 0 failed |
| `npx vitest run tests/unit/thinking-games tests/unit/thinking-games-adversarial.test.ts` | **0** | 12 files, **83 passed / 0 failed** |
| `npx tsc --noEmit --pretty false` | **0** | `TypeScript: No errors found` |
| `npx eslint src/lib/thinking-games tests/unit/thinking-games tests/unit/thinking-games-adversarial.test.ts scripts/check-thinking-games-content.mjs --max-warnings=0` | **0** | `ESLint: No issues found` |
| `node scripts/check-thinking-games-content.mjs` | **0** | editorial PASS, pilot PASS, pilot-as-release expected FAIL, release-placeholder expected FAIL |

Content CLI exact metrics after the fix:

```text
editorial: PASS 365 days / 730 slots / 24 typeIds / 96 variantPairs / 8 skills /
  equalSkillDays 0 / rolling 358 of 358 / min spacing 11 / itemCount 0
pilot: PASS 7 days / 28 items / 3 typeIds / 6 variantPairs / 3 skills /
  equalSkillDays 0 / min spacing 1 / itemCount 28
pilot-as-release: FAIL pilot_fixture_not_release (expected)
release-placeholder: FAIL release_editorial + release_item_count + 9 more (expected)
```

The adversarial suite also re-passed its broader negative checks: independent reference grading for
rule/memory/path, all simple paths on a 4×4 board, multi-answer path acceptance, unsafe geometry
rejection, answer-shape distinction, fingerprint orbit collapse/split checks, deterministic
assignment/no-reroll/order independence, schema hardening, profile gates, and client-safe boundary.

## 5. Exact files changed

- `src/lib/thinking-games/manifest.ts` — P1-1 per-track metric and pilot gate.
- `content/thinking-games/pilot/pilot-manifest-v1.json` — P1-2 hint/explanation copy only.
- `tests/unit/thinking-games/manifest.test.ts` — regression for per-track equal skill.
- `tests/unit/thinking-games/pilot-content.test.ts` — regression for numeric rule hints.
- `plans/261021-daily-thinking-games/execution/opencode-engine-fix-handoff.md` — this report.

No server/API/UI/store/flag/contract/dependency file was edited. No commit, push, deploy, build or dev
server was run. Unrelated workspace changes were preserved.

## 6. Remaining gaps (not claimed as fixed)

- **QA P1-3 (unreviewed content serving)** remains open. The QA report itself notes it is not a
  proven production leak and that a correct fix needs a production/pilot profile or explicit
  server-owned `allowUnapproved` gate, which changes the assignment API. That decision is outside
  this two-bug fix and was not made silently.
- **QA P2-1 (decorative/mis-mapped `ruleVariantId`)** remains open. The generator still does not
  distinguish all declared variants; no variant logic was expanded in this bounded fix.
- The other 21 mechanics and 365-day approved content are still not implemented.
- Human Vietnamese editorial/age review, real pilot, server/API/UI integration and production
  enablement remain **PENDING**.
