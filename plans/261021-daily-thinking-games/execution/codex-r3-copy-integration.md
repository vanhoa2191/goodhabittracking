# Round 3 copy integration correction

## Cleanup plan

Preserve the five valid invitation replacements and all shared checkout work. Replace mirrored exact-copy assertions, invented seed examples and redundant pool counts with Unicode-aware detector controls and generation from historical catalog inputs. First add failing board-aware tutorial regressions, then reuse the mechanics wording directly in getNaturalTutorial without new layers. Verify all four tracks, every affected variant and all displayed ordering edges, existing default/mode behavior and tutorial/explanation limits; run focused suites, scoped lint and typecheck. Do not regenerate catalog files.

## Execution evidence

Workspace: `/home/opc/orca/goodhabittracking`. Scoped executor correction, no agents or git mutations. Read the mechanics handoff and inspected the catalog override at `scripts/generate-thinking-games-candidates-v2.mjs:225`.

### Changes and simplifications

Only these three files were written:

- `src/lib/thinking-games/content/copy.ts`: `getNaturalTutorial` now prefixes g04-t2 with `Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này.` when given a reasoning-if-then board. For g06-t2 command-order boards it lists every actual `before` edge with command labels, explains `→ là làm trước`, identifies game-local rules and states `Mọi thứ tự giữ đủ luật đều được.` This directly reuses the completed mechanics lane wording; no new abstractions, dependencies, checker/solver changes or explanation edits. Both game ID and board kind must match. Existing five invitation replacements remain intact.
- `tests/unit/thinking-games/round3-copy.test.ts`: replaced exact replacement mappings, invented affected seeds, fixed historical count, pool-size and distribution assertions with 19 behavior tests. Unicode letter boundaries replace JavaScript ASCII word boundaries. All five retired pressure sentences are positive detector controls; additional controls catch Vietnamese address words and distinguish ordinary classifiers. Every selectable invitation is exercised deterministically, and invitations are generated from all actual catalog row inputs, checking all historical flagged evidence is detected and replaced without hardcoding replacement sentences.
- This report: cleanup plan, evidence, scope and next owner.

Catalog seed reconstruction follows the actual script shape using the row slot ID, track, type and variant. This invitation test does not reproduce duplicate-avoidance retry suffixes; complete pool coverage independently checks all invitation variants, so safe-copy coverage does not depend on selecting a particular seed index. No claim is made that persisted invitation fields were rewritten.

### Regression coverage

- Calls `getNaturalTutorial(..., generated.board)` exactly as the catalog integration calls it, across all four tracks, every g04/g06 variant and 40 seeds per variant: 1,280 generated boards. g04 requires game-local symbol framing and checks for whole-word answer leakage. g06 checks every actual edge and ensures no additional ordering arrows were introduced. Tutorials stay <=240 characters and unchanged generated explanations stay <=300 characters on these boards.
- A partial-order fixture discloses all four edges while leaving rice/soup unordered and explicitly allowing all valid sequences.
- Default selection with omitted/null boardData is preserved for every type and track; unrelated board kinds preserve g04/g06 defaults. Existing mode-specific rules and track suites passed unchanged.
- All 2,920 persisted board inputs are passed through final tutorial selection on all four tracks (11,680 calls), enforcing <=240 characters and no unresolved placeholders. These are read-only inputs, not regenerated artifacts.

### Exact verification observed

All Node commands used `PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH` and existing installed dependencies, invoked through `rtk proxy`.

1. Initial test rewrite before source correction: `npx vitest run tests/unit/thinking-games/round3-copy.test.ts --reporter=dot`, exit **1**, **7 failed / 8 passed**. Five integration cases failed as intended; two failures exposed an overly strict new test assumption that every supportive invitation contains an explicit peer pronoun. Removed that unsupported assumption and split mechanic cases for independent failure visibility.
2. Final regression shape before source correction: same focused command, exit **1**, **9 failed / 10 passed**. g04 and g06 each failed on all four tracks for missing symbol/rule disclosures; the partial-order disclosure test also failed. The ten unrelated/default/copy checks passed.
3. First source-corrected focused run: same command, exit **1**, **1 failed / 18 passed**. The remaining test failure was a substring false positive: answer `ô` appeared inside `không`. Changed the leakage assertion to Unicode whole words; production code was unchanged after that run.
4. Final requested combined command:

   ```sh
   npx vitest run tests/unit/thinking-games/round3-copy.test.ts tests/unit/thinking-games/round3-mechanics.test.ts tests/unit/thinking-games/rules-mismatch-remediation.test.ts tests/unit/thinking-games/track-design.test.ts --reporter=dot
   ```

   Exit **0**, **4 files passed, 56/56 tests**, duration **25.03s**. Includes all 19 rewritten copy tests and all seven mechanics regressions, plus existing rules and track checks.
5. `npx eslint src/lib/thinking-games/content/copy.ts tests/unit/thinking-games/round3-copy.test.ts --max-warnings=0`: exit **0**, no output.
6. `npm run typecheck`: exit **0**, `tsc --noEmit`, no diagnostics.
7. `git diff --check -- src/lib/thinking-games/content/copy.ts tests/unit/thinking-games/round3-copy.test.ts plans/261021-daily-thinking-games/execution/codex-r3-copy-integration.md`: exit **0**, no output.

### Next owner and remaining limits

Source integration correction is complete and locally verified. OpenCode must regenerate candidates through the normal pipeline, validate fingerprints/metadata and unchanged catalog/answer-position/difficulty/hint gates, then obtain independent editorial review. No candidates were regenerated by this lane, and existing title/hint sources and read-only review work were untouched. No full repository lint/test/build, browser/child pilot, deployment, production access, approvals, signatures, commit, push or merge is claimed. Shared pre-existing dirty files remain outside this lane's ownership; source verification does not grant release acceptance. All design-only and release gates remain the next owner's responsibility.


### Report delivery routing

Direct sends of this full report path to `run:run_6149b435d3ef` were rejected by Orca: `Dispatch ctx_8b9a0bfe8db9 belongs to Run run_d2b1a0cf783f, not run_6149b435d3ef.` The same ordinary-message retry without the explicit dispatch-capability flag returned the same ownership error. The authorized outer coordinator was asked to forward the report or acknowledge this routing limitation before terminal completion; no run ownership or dispatch state was changed.

The outer coordinator confirmed: “I forwarded full report path to reader dispatch ctx_44be41b7731e within outer run. Send worker_done now with routing limitation noted.” Source scope is complete; the root owns onward delivery and independent final catalog verification.
