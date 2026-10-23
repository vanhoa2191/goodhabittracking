# PR199 round 3 mechanics implementation handoff

Workspace verified: `/home/opc/orca/goodhabittracking`; HEAD inspected: `b6bf6a94fa79856b195d73fa2370fc31112abc16`, branch `feat/thinking-games-content-r2`.

Role: scoped Codex executor. Read this workspace's `AGENTS.md`, executor role prompt, current inventory Markdown and JSON, relevant generator/checker/schema code and prior tests. No subagents. No changes in solobusiness.

## Scoped result

Implemented the root fixes for the 48 mechanic findings: g04-t2 (15 initial items), g06-t2 (21), g08-t3 (12). This is source implementation and local verification only; catalog integration/regeneration and editorial review remain outstanding. All 2,920 persisted candidate rows are still `design_only`.

Files written by this lane, and only these files:

- `src/lib/thinking-games/mechanics/remaining.ts`
- `tests/unit/thinking-games/round3-mechanics.test.ts` (new)
- `plans/261021-daily-thinking-games/execution/codex-r3-mechanics-handoff.md` (this report)

Existing dirty/untracked files were preserved. Concurrent changes to `src/lib/thinking-games/content/copy.ts` belong to Gemini, not this lane. No git writes, commits, push, merge, dependencies, production access, feature flag edits, signatures, approval changes, schema/UI edits or catalog regeneration.

## Decisions and behavior

### g04-t2: game-local symbol implications for every pool

All four word pools contain contingent associations: clouds/rain/clothing, plant growth, sun/morning/routines and heat/thirst/feelings. Replacing only “mặt trời” with “bình minh” would leave false necessary implications in these pools.

The generator now begins its tutorial and explanation with: `Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này.` Its explanation lists the actual board rules as symbol arrows and states the derived result as a **card**, rather than a necessary real-world event. Pool selection, chain/shortcut rules, options, answer order, hints and solver/checker remain unchanged. The two initial tracks retain 2 versus 3 chain links and 4 versus 5 options.

### g06-t2: disclose the actual ordering constraints before play

Tutorials now list **every** actual `board.before` relation using the command text and explain that the arrow means “do before”. They call these the rules of this particular game and accept every order obeying those rules. Explanations use “Một thứ tự theo luật của ván này” instead of claiming a single correct everyday sequence.

The generator retains the scenarios and constraint graph. The checker and solver are unchanged; all topological sorts remain valid. The initial tracks retain 4 versus 5 commands. A separate regression with a partial order explicitly accepts both rice-before-soup and soup-before-rice when no edge orders those two steps.

### g08-t3: explain the actual scene and relevant rule

The incorrect line-crossing scene now has trait `đi ngoài vạch`; the opposite-direction scene keeps `đi sai hướng`. The explanation quotes the actual selected scene, its actual differing trait and the board's required value. Scene IDs, option order, solutions and hints are unchanged. The initial tracks retain 4 versus 5 scenes.

The implementation reuses existing board rules, command labels and scene data; it adds no dependencies, validators or abstraction layers. No existing audit was weakened.

## Verification observed

All commands below ran in `/home/opc/orca/goodhabittracking` with `PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH`.

1. Before the generator fix:
   `npx vitest run tests/unit/thinking-games/round3-mechanics.test.ts --reporter=dot`
   **Exit 1**, 6 failed / 1 passed: both initial tracks failed the missing symbol frame, hidden-order tutorial and missing actual scene explanation assertions; alternate topological-order acceptance already passed.

2. First implementation focused run of the same command:
   **Exit 0**, 7/7 tests. This preceded the final compact text revision needed to honor schema limits; the final combined run below also includes all seven new tests.

3. Final relevant mechanic suite:

   ```sh
   npx vitest run tests/unit/thinking-games/round3-mechanics.test.ts tests/unit/thinking-games/all-mechanics.test.ts tests/unit/thinking-games/mechanics.test.ts tests/unit/thinking-games/generator-quality.test.ts tests/unit/thinking-games/round2-content-fixes.test.ts tests/unit/thinking-games/rules-mismatch-remediation.test.ts tests/unit/thinking-games/track-design.test.ts --reporter=dot
   ```

   **Exit 0**, 7 files passed, **83/83 tests**, reported duration 36.92s. Includes prior answer-position, difficulty, hint and rule-mismatch regressions and generation/schema/check/solve validation of every mechanic variant across all four tracks.

4. `npx eslint src/lib/thinking-games/mechanics/remaining.ts tests/unit/thinking-games/round3-mechanics.test.ts --max-warnings=0`
   **Exit 0**, no output.

5. `npm run typecheck`
   **Exit 0**, `tsc --noEmit`, no diagnostics.

6. `git diff --check`
   **Exit 0**, no output.

New regressions cover 768 generated boards: 320 g04 boards (all four pools), 192 g06 boards (all six scenarios), and 256 g08 boards (all four wrong-scene variants), spanning every variant and both initial tracks. They independently derive implication closure, enumerate all 13,824 complete permutations of the generated order boards, exercise valid/invalid answers and solver results, validate board schema, preserve age complexity, check actual explanation contents and enforce the existing tutorial/explanation size limits. The partial-order fixture enumerates another 24 orders and accepts exactly its two valid sorts.

### Read-only catalog reproduction

Executed `node --input-type=module` heredoc probes using an esbuild **in-memory** engine bundle (`write: false`), inventory JSON, persisted batches and Node assertions; no catalog output was written.

- Initial status probe: **exit 0**, 2,920 rows and every row `design_only`; recorded the three examples below.
- First 48-item comparison: **exit 1** at D246-main-vi68 because the probe initially assumed the base seed, while that existing row used the generator's duplicate-avoidance retry. This was a probe assumption, not a generator failure.
- Corrected comparison: **exit 0**, all **48/48** flagged items matched their existing seeds/boards/solutions/hints with only the intended g08 bad-scene trait normalized; D246-main-vi68 matched `|attempt=2`, the other 47 matched the base seed. All generated tutorial/explanation lengths passed the existing 240/300 character limits.
- All **seven** persisted candidate hashes (five batches, manifest and meta) match `codex-current-inventory.json` exactly. The probe reconstructs seeds as `p08-candidates-365-v2|Dddd-slot|ageTrack|vi|gameTypeId|variant`, including existing attempt suffixes as needed.

No build, full repository suite, browser/child pilot, production/provider test, editorial approval or release acceptance is claimed.

## Before/after from original flagged items

### D028-main-vi912 — g04-t2

Before explanation: `Từ những điều đã biết chắc chắn và áp dụng luật Nếu - Thì, ta tìm ra kết luận là đánh răng.`

After tutorial: `Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Nối từng câu "nếu ... thì ..." với nhau, đi từ điều đã biết đến kết quả cuối cùng.`

After explanation: `Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "mặt trời" → "buổi sáng"; "buổi sáng" → "thức dậy"; "thức dậy" → "đánh răng". Từ thẻ "mặt trời", áp dụng luật để suy ra thẻ "đánh răng".`

### D006-main-vi68 — g06-t2

Before tutorial: `Xem việc nào phải làm trước, việc nào làm sau rồi xếp lại cho đúng.`

Before explanation: `Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà.`

After tutorial: `Luật riêng của ván này (→ là làm trước): Lấy bát → Xới cơm; Xới cơm → Múc canh; Múc canh → Mời cả nhà. Mọi thứ tự giữ đủ luật đều được.`

After explanation: `Luật riêng của ván này (→ là làm trước): Lấy bát → Xới cơm; Xới cơm → Múc canh; Múc canh → Mời cả nhà. Một thứ tự theo luật của ván này là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà.`

### D085-bonus-vi68 — g08-t3

Before explanation: `Tình huống 2 chưa hợp lý vì có đặc điểm "đi sai hướng", trong khi quy tắc chuẩn yêu cầu "đi đúng vạch".`

After explanation: `Tình huống 2: "Bạn chạy băng qua bên ngoài vạch kẻ an toàn" có đặc điểm "đi ngoài vạch", trong khi luật của ván này yêu cầu "đi đúng vạch".`

All three sampled solutions are unchanged. Examples are generated in memory; persisted candidate explanations remain the old text until integration.

## Required integration dependency / next owner

**Do not assume catalog generation uses `generated.tutorial`.** `scripts/generate-thinking-games-candidates-v2.mjs:225` calls `getNaturalTutorial(gameTypeId, ageTrack, day, seed, payload.boardData)` and overwrites it. Thus the remaining.ts tutorial fix alone will not reach persisted catalog tutorials through the current integration path.

The coordinator's integration lane must preserve game-local g04 symbol framing and disclose every g06 `before` edge in the **final persisted tutorial**, using board-aware copy.ts output (coordinate with Gemini) or a scoped generator selection of these generated tutorials. Recheck 240/300 character limits and child-facing semantics on the integrated output. This lane did not edit copy.ts or the catalog script because they are outside its write scope. A status identifying this dependency was delivered to the internal run before completion.

After both source lanes complete: integrate the tutorial path, regenerate through the authorized integration lane, rerun unchanged catalog/answer-position/difficulty/hint validators and independently review the regenerated items. Retain all 2,920 `design_only` statuses. g08-t3's corrected trait changes affected board fingerprints, so integration must regenerate fingerprints/metadata through the normal pipeline rather than patching only explanation text. No approval or merge readiness is implied by this source-level handoff.
