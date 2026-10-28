# Codex round 3 title/hint repairs

Status: bounded source repairs complete; local verification passed; final catalog regeneration and independent closure pending root. This is AI implementation and source/test verification, not human Vietnamese editorial review, child usability acceptance, release acceptance, or production readiness.

## Scope and changed files

Read workspace AGENTS.md and the full Markdown/JSON independent review at `execution/content-review/round3-codex-titles-hints.{md,json}`. Its 11 fix groups cover 156 flags / 146 unique initial-track rows; its four suggestion groups cover 63 flags / 63 unique rows, with overlap possible. The JSON corpus contains 192 title names, 53 chapters, 263 rendered distinct hints and 235 raw distinct hints.

Only these five files were written by this worker:

- `src/lib/thinking-games/content/titles.ts`
- `src/lib/thinking-games/content/hints.ts`
- `src/lib/thinking-games/mechanics/remaining.ts` (only two lines inside g02-t2: hint selection and neutral operation explanation)
- `tests/unit/thinking-games/round3-titles-hints.test.ts` (new, 19 tests)
- `plans/261021-daily-thinking-games/execution/codex-r3-titles-hints-fix.md` (this report)

No dependencies, subagents, git mutations, source approvals, signatures, flags, catalog regeneration, production actions, or process-wide termination commands. Shared dirty work was preserved. No copy.ts edits; no modifications to the earlier g04-t2, g06-t2 or g08-t3 mechanic fixes or original105 fixes.

## Repair mapping

| Finding | Repair and evidence |
| --- | --- |
| TH-F01 | Alternating hint now compares each position with the initial two-symbol rhythm, without asking for nonexistent adjacent twins. Regression uses the historical `lá/nắng/hoa/nắng/lá` board, confirms there are no equal neighbors, and verifies the checker accepts index 2. |
| TH-F02 | Added `quarter-mirror` hint mode to both tracks and selected it directly from the actual turn. Both hints describe rotation then reflection, in order, and differ from reflection-only hints. All four generated turn modes and the actual UI label are covered. The generic explanation now says to perform the displayed transformation, fitting rotation, mirror, and combined cases without changing shape/options/solution. |
| TH-F03 | Replaced all eight transform title names with neutral transformation/imagination names valid for every turn. No full-turn wording or mandatory rotation/reflection sequence in titles. |
| TH-F04 | Completion-question titles became neutral symmetry titles. Also neutralized `Tranh hai bên giống nhau`, which could incorrectly describe a find-break board as already symmetric. |
| TH-F05 | Replaced `Được mấy nhóm?` with `Cùng chia thành nhóm`, keeping the title compatible with exact/floor, remainder and needed modes. |
| TH-F06 | Replaced the addition question with `Cân thế nào cho bằng?`, valid for missing, compare and replacement tasks. |
| TH-F07 | Both young ordering-hint pairs now reference the rules of this game. Removed both the home-routine appeal and the nearby real-life-imagination appeal; the mechanic's declared before-relations remain authoritative. |
| TH-F08 | Directions now *may* differ from screen directions. Regression covers an actual generated north-facing board. |
| TH-F09 | Hints use the actual color-independent legend `Đường cũ`, explicitly allow a shared segment, and require at least one difference, reaching the goal and avoiding walls. Replaced `Không đi đường cũ` title with `Một chỗ rẽ mới`. Regressions accept a different route sharing interior cells and reject the identical old route, for both hint tracks. |
| TH-F10 | Replaced face-down-card wording with `bấm Gạch bớt`; regression checks the actual component's cross-out control label. |
| TH-F11 | Older fewest hints try single items and pairs, then compare counts among ways reaching the displayed target. Removed both the largest-first guarantee and two-small-for-one-large shortcut. Historical D213-main-vi912 fixture is exactly values `[6,8,1,9,4]`, target 14, maximum 3: checker rejects `9+4+1` and accepts `6+8`; independent subset enumeration confirms minimum count 2. |
| TH-S01 | Existing placeholder helper maps child-facing trait `hình` to `hình dạng`; internal trait keys and boards remain unchanged. |
| TH-S02 | Replaced `cho ta` with `giúp bạn tìm ra`. |
| TH-S03 | Shortest hints compare step counts of wall-avoiding routes and choose the fewest steps. Removed monotonic-distance and no-detour prescriptions. A valid synthetic shortest-path regression requires temporarily increasing distance to the goal. This is robustness coverage, not a claim that any of the review's 14 stored shortest boards had that counterexample. |
| TH-S04 | Replaced the algebra term `ẩn số` with the concrete missing-number/equal-pan instruction. No measured reading-age or child-usability claim. |

Simplification: reused existing title frames, seed selection, hint modes, placeholder filling and checker APIs. No new abstraction or mode-dependent title selector; neutral names remove the need for conditional title logic.

## Verification and observed results

All commands used Node 26.11.1 via `PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH` and the existing installed dependencies.

1. Test-first run of the new test file against unchanged title/hint source: exit 1, **17 failed / 2 passed / 19 tests**. Failures established the reviewed bad wording with board/checker or static UI evidence, rather than exact-copy snapshots. During subsequent verification one test assumption was corrected: actual grouping board modes are `exact` and `floor`, not the hint-mode name `groups`.
2. Final selected run: `npx vitest run tests/unit/thinking-games/round3-titles-hints.test.ts tests/unit/thinking-games/round3-mechanics.test.ts tests/unit/thinking-games/round3-copy.test.ts tests/unit/thinking-games/round2-content-fixes.test.ts tests/unit/thinking-games/track-design.test.ts tests/unit/thinking-games/rules-mismatch-remediation.test.ts` — **exit 0, 6 files passed, 90 tests passed, 25.41s**. Includes all 19 new tests; existing track tests verify hint separation, limits, determinism, answer leakage, difficulty ladder and title cleanliness; earlier round3 mechanic regressions pass.
3. New title tests run existing selection in editorial schedule order without writing catalog files: **8 names/type, 192 globally distinct names, 730 unique titles per initial track, no same-day or consecutive-day repeat, no number padding**.
4. Scoped lint: `npx eslint src/lib/thinking-games/content/titles.ts src/lib/thinking-games/content/hints.ts src/lib/thinking-games/mechanics/remaining.ts tests/unit/thinking-games/round3-titles-hints.test.ts --max-warnings=0` — **exit 0**, no output/diagnostics.
5. Scoped typecheck: TypeScript `readConfigFile` / `parseJsonConfigFileContent` using repo `tsconfig.json`, `createProgram` with those four source/test roots plus imported dependencies, `incremental:false`, `noEmit:true`; `getPreEmitDiagnostics` — **exit 0, 4 roots, 0 diagnostics**. This did not run a full-repository typecheck or write a config/cache file.
6. Read-only esbuild `write:false` probe loaded the current engine and applied actual stored board modes to 670 initial-track rows in changed hint types. No reviewed forbidden wording remained and combined-transform hints included both ordered operations. Probe seed was the item ID rather than original generator seed; multi-pair pool variants are covered by direct pool assertions in the regression tests. This is an additional source/mode probe, not final catalog regeneration or an all-solution audit.
7. `git diff --check -- <four scoped source/test paths>` — **exit 0**.

## Preservation evidence and snapshot

Before and after repairs, SHA256 of `remaining.ts` excluding the complete g02-t2 definition block is identical:

`c30bacc99623484abf7c38caab0014f7b44602b25d323143d9b266f25a20e42b`

Inside g02-t2 only hint-mode selection and the explanation string changed. RNG calls, board shape, options, solution, and checker/solver code are untouched, preserving board/solution/answer-position/difficulty behavior by source identity. Existing position-bias and track-difficulty tests also pass.

`copy.ts` before/after SHA256 is identical:

`d3c7a6a28a9a558e1a9cb21c88e0d99058650f34e07306fa965596fe8d130143`

Final scoped source/test SHA256 values:

| File | SHA256 |
| --- | --- |
| titles.ts | `df94ee3bdf60fb10e1d0cdd4a85895a77a56992f91ae36de9af3c8c18c2228a9` |
| hints.ts | `ca3ac2db7e00c68bfc57d24a51ed332ab2b6bc6a780e2f8578c05f11aae5eb64` |
| remaining.ts | `3291b6089672c556cab624c275e8e8a3c26cbed0a4b8d8acff0a63b1419ace94` |
| round3-titles-hints.test.ts | `974726ad17cb7bca802f1034b46a4c5b773e2f7b2c252249b88788dd668471fe` |

## Remaining work and limits

Root must regenerate the final catalog, independently verify TH-F01..F11 and TH-S01..S04 against regenerated fields, verify final title uniqueness/track separation and unchanged boards/solutions/distributions, and perform the final integrated copy review. The old review's source hashes are intentionally stale after these repairs; this handoff supplies the new snapshot. Existing catalog-oriented tests passed against the existing catalog and do not prove that generated files already contain these source changes.

No browser rendering, human editorial session, physical-device or child pilot, full repository suite/build, SQL/provider/release checks, commit/push or deployment was performed. This task does not clear unrelated gates.

## Delivery

Full report sent successfully inside the active outer run to reader dispatch `ctx_44be41b7731e`: message `msg_bce98e586354`, CLI exit 0. No cross-run delivery or final catalog closure is claimed.
