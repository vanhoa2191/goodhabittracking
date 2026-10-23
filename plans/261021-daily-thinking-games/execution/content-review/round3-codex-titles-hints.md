# PR199 round 3: independent AI review of titles and hints

**Status: review_complete_fixes_recommended_pending_root_snapshot_check. AI review only; no human editorial, child-pilot, release, or production acceptance.**

## Scope and exact coverage

Programmatically parse every row; deduplicate rendered hints by exact Unicode string without normalization, then read all 263 distinct strings. Parse every title into its exact registered name and chapter using the four source frames; read all 192 distinct names and 53 chapter phrases (245 components), plus all four frames, rather than read every full composed title separately. Read every source raw hint phrase, including the young interleaved pair not present in current age_6_8 output. Source pools are parsed through an in-memory esbuild bundle (write:false). This is AI reading, never human eyes or human approval.

Parsed **1460/1460** initial-track rows (730 per track), all 24 game types. Full-title strings: **1278** combined, 730 per track. Read **263 rendered hint strings** (131 young / 132 older), **235 raw source hint strings**, **118 source pairs**, **192 title names**, **53 chapters**, and **4 frames**. The four title frames matched every row; no unresolved hint placeholders. The manifest title/hint projection matches the five batches. The JSON includes the complete deduplicated phrase corpus and all affected IDs.

All 1460 board records were available to programmatic filters; 24 first-by-type full board examples were displayed/read, plus targeted finding examples and eight older fewest boards. No claim that all 1460 full boards or every solution was manually read or independently solved.

This review supplements the old round2/inventory assessment; it does not inherit their broad compliance claims. No tutorial/explanation acceptance is given before catalog integration.

## Findings

| Severity | Groups | Item flags | Unique affected rows |
|---|---:|---:|---:|
| block | 0 | 0 | 0 |
| fix | 11 | 156 | 146 |
| suggestion | 4 | 63 | 63 |

Flags can overlap. No block-level issue was established in this bounded title/hint lane; this does not clear unrelated release gates. Fixes below should be assigned as a narrow follow-up; this lane made no source changes.

### TH-F01 · fix · Alternating hint asks for adjacent twins that do not exist

Types: g01-t2. Affected: **8 rows** ({"age_6_8": 8}).

**Evidence:** Tìm chỗ hai hình giống nhau đứng liền nhau.

**Rationale:** D006-bonus-vi68 has lá / nắng / hoa / nắng / lá, with no equal neighboring pair. The inserted wrong token can be a third symbol, so following the hint gives no place to select.

**Scoped recommendation:** Replace with “So từng vị trí với nhịp hai hình lúc đầu, tìm hình không theo nhịp nhé.” Preserve the existing rule and answer.

Source: `src/lib/thinking-games/content/hints.ts`.

**IDs:** `D006-bonus-vi68`, `D017-main-vi68`, `D102-bonus-vi68`, `D113-main-vi68`, `D198-bonus-vi68`, `D209-main-vi68`, `D294-bonus-vi68`, `D305-main-vi68`.

### TH-F02 · fix · Combined rotation and reflection receives a reflection-only nudge

Types: g02-t2. Affected: **12 rows** ({"age_6_8": 6, "age_9_12": 6}).

**Evidence:** Hình này bị lật, không chỉ xoay. / Đây là phép lật, nên hãy tìm hình đã đổi mặt chứ không chỉ xoay.

**Rationale:** All 12 boards require quarter-mirror. Both hints omit the required rotation before reflection, while the renderer labels the actual action “Xoay 90 độ rồi lật qua gương”. This is incomplete guidance, not a claim that the current hint explicitly forbids rotation.

**Scoped recommendation:** Use a combined-operation hint that points back to both displayed operations in order. A small combined hint mode is sufficient if this correction is assigned; do not change boards or renderer.

Source: `src/lib/thinking-games/content/hints.ts; src/lib/thinking-games/mechanics/remaining.ts:407; src/components/thinking-games/SpatialRotationGame.tsx:20`.

**IDs:** `D079-bonus-vi68`, `D079-bonus-vi912`, `D090-main-vi68`, `D090-main-vi912`, `D175-bonus-vi68`, `D175-bonus-vi912`, `D186-main-vi68`, `D186-main-vi912`, `D271-bonus-vi68`, `D271-bonus-vi912`, `D282-main-vi68`, `D282-main-vi912`.

### TH-F03 · fix · Rotation-only titles are used for reflections, and “một vòng” implies a full turn

Types: g02-t2. Affected: **26 rows** ({"age_6_8": 16, "age_9_12": 10}).

**Evidence:** Vòng xoay bí ẩn · Căn phòng mới (mirror); Hạt giống · Xoay một vòng (quarter).

**Rationale:** The seed-only title selection does not consider turn mode. “Một vòng” naturally means a full rotation, while the actual task is a quarter/half turn or reflection. A playful title should not suggest a different operation.

**Scoped recommendation:** Smallest scope: replace operation-specific names with neutral names valid for all current variants, e.g. “Hình sẽ đổi thế nào?”. Alternatively select existing names by actual turn only if separately assigned. Keep title frames and diversity rules.

Source: `src/lib/thinking-games/content/titles.ts`.

**IDs:** `D007-bonus-vi68`, `D018-main-vi68`, `D055-bonus-vi912`, `D066-main-vi68`, `D079-bonus-vi68`, `D079-bonus-vi912`, `D090-main-vi68`, `D090-main-vi912`, `D151-bonus-vi68`, `D151-bonus-vi912`, `D162-main-vi68`, `D162-main-vi912`, `D175-bonus-vi68`, `D175-bonus-vi912`, `D186-main-vi68`, `D186-main-vi912`, `D199-bonus-vi68`, `D247-bonus-vi68`, `D247-bonus-vi912`, `D258-main-vi68`, `D258-main-vi912`, `D271-bonus-vi68`, `D282-main-vi68`, `D343-bonus-vi68`, `D343-bonus-vi912`, `D354-main-vi68`.

### TH-F04 · fix · Completion titles are shown on find-the-break boards

Types: g02-t3. Affected: **7 rows** ({"age_9_12": 2, "age_6_8": 5}).

**Evidence:** Hoàn thành đối xứng — Góc đồ chơi; Kệ sách: Ô nào làm tranh cân xứng?

**Rationale:** These rows ask the child to identify an existing mismatched cell, not fill a missing cell. The title suggests completing the picture.

**Scoped recommendation:** Replace those names with a neutral symmetry title valid for fill and find-break, or constrain them to fill in a separately assigned narrow correction.

Source: `src/lib/thinking-games/content/titles.ts`.

**IDs:** `D034-main-vi912`, `D047-bonus-vi68`, `D191-bonus-vi68`, `D274-main-vi68`, `D287-bonus-vi912`, `D322-main-vi68`, `D335-bonus-vi68`.

### TH-F05 · fix · Group-count question is shown when the answer is how many to add

Types: g05-t2. Affected: **3 rows** ({"age_9_12": 2, "age_6_8": 1}).

**Evidence:** Bản đồ khu rừng: Được mấy nhóm? (D090-bonus-vi912, total=23, groupSize=3, needed, solution=1).

**Rationale:** The question asks for a group count, while the board expects a count of extra pieces. In this example there are seven full groups, but the accepted answer is one extra piece.

**Scoped recommendation:** Use a neutral name such as “Cùng chia thành nhóm” across modes, keeping arithmetic and options unchanged.

Source: `src/lib/thinking-games/content/titles.ts`.

**IDs:** `D090-bonus-vi912`, `D269-main-vi68`, `D317-main-vi912`.

### TH-F06 · fix · “Cần thêm” title is used for replacing an existing weight

Types: g05-t1. Affected: **2 rows** ({"age_6_8": 1, "age_9_12": 1}).

**Evidence:** Căn bếp: Cần thêm bao nhiêu? (D037-main, both tracks).

**Rationale:** Replace mode asks for the new marked weight, not the amount added to a pan. The two operations can produce different numbers.

**Scoped recommendation:** Use “Cân bằng hai bên” or another existing neutral balance name instead of the addition question for replace mode.

Source: `src/lib/thinking-games/content/titles.ts`.

**IDs:** `D037-main-vi68`, `D037-main-vi912`.

### TH-F07 · fix · Home-routine hint conflicts with the game-local ordering contract

Types: g06-t2. Affected: **17 rows** ({"age_6_8": 17}).

**Evidence:** Nghĩ xem ở nhà bạn làm việc đó thế nào nhé.

**Rationale:** The mechanics handoff explicitly retains scenario chains and requires following this game’s declared before-relations. Household order can differ, particularly rice/soup/inviting family. This unchanged hint would pull the child back toward the ambiguity the mechanics lane is fixing.

**Scoped recommendation:** Point the hint to the current game’s before-relations, e.g. “Nhìn luật của ván này: việc nào cần xong trước việc tiếp theo?”. Review the final integrated wording later; no tutorial or explanation acceptance here.

Source: `src/lib/thinking-games/content/hints.ts`.

**IDs:** `D006-main-vi68`, `D019-bonus-vi68`, `D030-main-vi68`, `D043-bonus-vi68`, `D078-main-vi68`, `D126-main-vi68`, `D139-bonus-vi68`, `D150-main-vi68`, `D163-bonus-vi68`, `D198-main-vi68`, `D211-bonus-vi68`, `D246-main-vi68`, `D259-bonus-vi68`, `D270-main-vi68`, `D283-bonus-vi68`, `D307-bonus-vi68`, `D331-bonus-vi68`.

Integration dependency noted from the handoff; this review does not evaluate the unintegrated tutorial or explanation.

### TH-F08 · fix · Perspective hint says screen directions always differ

Types: g07-t2. Affected: **4 rows** ({"age_9_12": 4}).

**Evidence:** Trước mặt, sau lưng, tay trái, tay phải của bạn ấy khác với phía trên, dưới, trái, phải của màn hình.

**Rationale:** When facing north, front/back/left/right align with screen up/down/left/right. The unconditional “khác” is false in these four stored rows.

**Scoped recommendation:** Use “Hãy tính các phía theo hướng bạn nhỏ nhìn; chúng có thể khác các phía của màn hình.”

Source: `src/lib/thinking-games/content/hints.ts`.

**IDs:** `D020-bonus-vi912`, `D103-main-vi912`, `D116-bonus-vi912`, `D295-main-vi912`.

### TH-F09 · fix · Alternative-path hints refer to a gray path; the current component uses amber dashes

Types: g07-t3. Affected: **60 rows** ({"age_6_8": 30, "age_9_12": 30}).

**Evidence:** Đường xám là đường đã đi rồi. / Tìm điểm đầu tiên mà bạn có thể rẽ khác đường xám.

**Rationale:** All 60 rows use “đường xám”. FlexibilityAlternativeGame renders the known path with amber dashed styling, labels it “Đường màu cam nét đứt”, and labels the legend “Đường cũ”. The child is asked to find a visual reference that the current component does not show.

**Scoped recommendation:** Replace color-dependent “đường xám” with “đường cũ” or “đường nét đứt”. Clarify that part of the new route may overlap the old one; it must differ somewhere, not avoid every old cell. Keep renderer and checker unchanged.

Source: `src/lib/thinking-games/content/hints.ts; src/components/thinking-games/FlexibilityAlternativeGame.tsx:115,174,188`.

**IDs:** `D012-bonus-vi68`, `D012-bonus-vi912`, `D023-main-vi68`, `D023-main-vi912`, `D036-bonus-vi68`, `D036-bonus-vi912`, `D047-main-vi68`, `D047-main-vi912`, `D060-bonus-vi68`, `D060-bonus-vi912`, `D071-main-vi68`, `D071-main-vi912`, `D084-bonus-vi68`, `D084-bonus-vi912`, `D095-main-vi68`, `D095-main-vi912`, `D108-bonus-vi68`, `D108-bonus-vi912`, `D119-main-vi68`, `D119-main-vi912`, `D132-bonus-vi68`, `D132-bonus-vi912`, `D143-main-vi68`, `D143-main-vi912`, `D156-bonus-vi68`, `D156-bonus-vi912`, `D167-main-vi68`, `D167-main-vi912`, `D180-bonus-vi68`, `D180-bonus-vi912`, `D191-main-vi68`, `D191-main-vi912`, `D204-bonus-vi68`, `D204-bonus-vi912`, `D215-main-vi68`, `D215-main-vi912`, `D228-bonus-vi68`, `D228-bonus-vi912`, `D239-main-vi68`, `D239-main-vi912`, `D252-bonus-vi68`, `D252-bonus-vi912`, `D263-main-vi68`, `D263-main-vi912`, `D276-bonus-vi68`, `D276-bonus-vi912`, `D287-main-vi68`, `D287-main-vi912`, `D300-bonus-vi68`, `D300-bonus-vi912`, `D311-main-vi68`, `D311-main-vi912`, `D324-bonus-vi68`, `D324-bonus-vi912`, `D335-main-vi68`, `D335-main-vi912`, `D348-bonus-vi68`, `D348-bonus-vi912`, `D359-main-vi68`, `D359-main-vi912`.

Static component inspection only; no browser screenshot or visual acceptance.

### TH-F10 · fix · Elimination hint asks the child to flip cards that have a cross-out control

Types: g04-t1. Affected: **16 rows** ({"age_6_8": 16}).

**Evidence:** Bạn nào không giống manh mối thì úp xuống nhé.

**Rationale:** The component offers “Gạch bớt” and line-through/dim styling. No flip action or face-down card state exists. The child may search for an unavailable action.

**Scoped recommendation:** Use “Bạn nào không khớp manh mối thì bấm Gạch bớt nhé.” Keep the existing candidate interaction.

Source: `src/lib/thinking-games/content/hints.ts; src/components/thinking-games/ReasoningEliminationGame.tsx:170-175`.

**IDs:** `D001-bonus-vi68`, `D012-main-vi68`, `D060-main-vi68`, `D108-main-vi68`, `D121-bonus-vi68`, `D132-main-vi68`, `D145-bonus-vi68`, `D156-main-vi68`, `D180-main-vi68`, `D193-bonus-vi68`, `D217-bonus-vi68`, `D228-main-vi68`, `D265-bonus-vi68`, `D276-main-vi68`, `D289-bonus-vi68`, `D300-main-vi68`.

### TH-F11 · fix · Largest-first hint can yield more pieces than the required minimum

Types: g05-t3. Affected: **1 rows** ({"age_9_12": 1}).

**Evidence:** Bắt đầu từ các số lớn để cần ít món nhất. / Khi đã có một cách đạt 14, thử thay hai món nhỏ bằng một món lớn.

**Rationale:** For values [6,8,1,9,4], target 14, largest-first gives 9+4+1 (three items), while 6+8 needs two. The suggested replacement of two small items by one large item cannot turn that three-item combination into the valid two-item optimum. Hint 1 should be an exploration nudge, not imply a greedy guarantee.

**Scoped recommendation:** Use “Thử từng cặp trước; nếu chưa đủ thì thử thêm món. So các cách để chọn ít món nhất.” Preserve the target and fewest rule; consider the same wording for all eight older fewest rows.

Source: `src/lib/thinking-games/content/hints.ts`.

**IDs:** `D213-main-vi912`.

Read-only subset enumeration was limited to the eight older fewest rows to verify this wording concern; it was not a whole-mechanics solver audit.

### TH-S01 · suggestion · Rendered trait name repeats “hình” awkwardly

Types: g07-t1. Affected: **16 rows** ({"age_6_8": 8, "age_9_12": 8}).

**Evidence:** Chỉ chọn những hình có hình đúng như luật. / Kiểm tra từng hình theo đặc điểm hình;

**Rationale:** The meaning is recoverable but the repeated bare noun sounds machine-filled. “Hình dạng” is a more natural label for the shape trait.

**Scoped recommendation:** Map the child-facing trait label hình to hình dạng when filling this hint, or use a neutral sentence referring to the displayed rule. Preserve internal trait keys.

Source: `src/lib/thinking-games/content/hints.ts`.

**IDs:** `D004-bonus-vi68`, `D004-bonus-vi912`, `D015-main-vi68`, `D015-main-vi912`, `D100-bonus-vi68`, `D100-bonus-vi912`, `D111-main-vi68`, `D111-main-vi912`, `D196-bonus-vi68`, `D196-bonus-vi912`, `D207-main-vi68`, `D207-main-vi912`, `D292-bonus-vi68`, `D292-bonus-vi912`, `D303-main-vi68`, `D303-main-vi912`.

### TH-S02 · suggestion · One pool phrase uses collective “ta”

Types: g04-t2. Affected: **18 rows** ({"age_6_8": 18}).

**Evidence:** Luật nào bắt đầu bằng điều đó thì cho ta một điều mới.

**Rationale:** This is not punitive and is intelligible, but departs from the preferred mình–bạn voice. There is one source phrase, appearing in 18 rows, not 18 distinct phrases.

**Scoped recommendation:** Replace “cho ta một điều mới” with “giúp bạn tìm ra điều mới”.

Source: `src/lib/thinking-games/content/hints.ts`.

**IDs:** `D028-main-vi68`, `D052-main-vi68`, `D065-bonus-vi68`, `D076-main-vi68`, `D089-bonus-vi68`, `D100-main-vi68`, `D113-bonus-vi68`, `D148-main-vi68`, `D209-bonus-vi68`, `D220-main-vi68`, `D233-bonus-vi68`, `D281-bonus-vi68`, `D292-main-vi68`, `D316-main-vi68`, `D329-bonus-vi68`, `D340-main-vi68`, `D353-bonus-vi68`, `D364-main-vi68`.

### TH-S03 · suggestion · Shortest-path hints overstate that every step must approach the goal

Types: g06-t1. Affected: **14 rows** ({"age_6_8": 7, "age_9_12": 7}).

**Evidence:** Mỗi bước nên đi gần đích hơn. / Tránh đi lùi hoặc đi vòng; mỗi bước phải rút ngắn khoảng cách đến đích.

**Rationale:** Shortest valid routes around walls can require temporary moves away from the goal. All 14 current shortest-mode stored solutions were checked for Manhattan-distance decreases and contain no counterexample, so this is a source robustness suggestion, not a demonstrated failing row.

**Scoped recommendation:** Prefer “So số bước của các đường tránh tường và chọn đường ít bước nhất.” Do not change path generation as part of this review.

Source: `src/lib/thinking-games/content/hints.ts`.

**IDs:** `D075-bonus-vi68`, `D075-bonus-vi912`, `D086-main-vi68`, `D086-main-vi912`, `D171-bonus-vi68`, `D171-bonus-vi912`, `D182-main-vi68`, `D182-main-vi912`, `D267-bonus-vi68`, `D267-bonus-vi912`, `D278-main-vi68`, `D278-main-vi912`, `D363-bonus-vi68`, `D363-bonus-vi912`.

### TH-S04 · suggestion · Algebra terminology may be unnecessary for the youngest older-track readers

Types: g05-t1. Affected: **15 rows** ({"age_9_12": 15}).

**Evidence:** Gọi quả còn thiếu là ẩn số rồi viết: tổng đĩa này bằng tổng đĩa kia.

**Rationale:** For age 9–12 the strategy is relevant, but “ẩn số” adds school vocabulary when the same operation can be described concretely. This is an AI readability observation, not a measured reading-age failure.

**Scoped recommendation:** Use “Tìm số còn thiếu để tổng hai đĩa bằng nhau.”

Source: `src/lib/thinking-games/content/hints.ts`.

**IDs:** `D002-bonus-vi912`, `D013-main-vi912`, `D074-bonus-vi912`, `D085-main-vi912`, `D098-bonus-vi912`, `D109-main-vi912`, `D170-bonus-vi912`, `D181-main-vi912`, `D194-bonus-vi912`, `D205-main-vi912`, `D266-bonus-vi912`, `D277-main-vi912`, `D290-bonus-vi912`, `D301-main-vi912`, `D362-bonus-vi912`.

## Vietnamese, age, tone and leakage observations

- **tone:** No shaming, punishment, urgency, comparison with other children, or threat was identified in the title/hint pools. “Bắt lỗi” describes puzzle/robot errors, not a child’s worth. These observations do not certify all product copy.
- **age:** Young hints are short and generally concrete (max 62 rendered characters); older hints offer comparison and rule-testing strategies (max 104). Differences alone do not establish age usability. Some older terms (phần tử, ứng viên, tổ hợp, trục) require reading familiarity.
- **answerLeakage:** No obvious exact answer, candidate/option ID, solution coordinate or answer label is inserted by these hint templates. target/max/trait are already-visible task parameters. Naming a board mode (removed/added/flip) narrows the task, but does not identify its answer. This is semantic/template inspection, not a proof against every inference or all renderer/board interactions.
- **titleThemes:** Chapter names are story framing; the boards do not always literally depict the chapter. Do not infer a promised illustrated scene from title variety.

## Snapshot and reuse contract

Both source hashes and both pre/post-regeneration candidate snapshots are recorded in the JSON. **Title/hint sources and per-ID title/hint projection stayed unchanged across concurrent catalog regeneration. All seven complete candidate-file hashes changed.** The table below records the final candidate snapshot; this review gives no tutorial/explanation acceptance. Root must independently verify source and projection hashes before reuse.

| Input | SHA256 |
|---|---|
| `src/lib/thinking-games/content/titles.ts` | `d874cafb5c13acc31731f711480f6aab74fc273b85db6f8a7109fedbc35ec780` |
| `src/lib/thinking-games/content/hints.ts` | `8c5b3822f833252a222520c2158e9289f749b633bbcc08426ebd1c7a3ace4132` |
| `content/thinking-games/candidates/365-v2/batch-01-days-001-028.json` | `445fcac504000e900ae50d76f32d578115aa093fca86c04b0ed84a7cf0ab18eb` |
| `content/thinking-games/candidates/365-v2/batch-02-days-029-091.json` | `7ae659233845433705ebfee1a5dd4edae418d2e35391a9e1dc2c8942e7564a2d` |
| `content/thinking-games/candidates/365-v2/batch-03-days-092-182.json` | `a19183e272175171ce37fb9621c5c33e98ccb052a18288dd8fd61f096688edf3` |
| `content/thinking-games/candidates/365-v2/batch-04-days-183-273.json` | `ca0db01ddbd0cd13ab5ddd8f3b6d976437d0f451ca653c3c611a04ff59a81395` |
| `content/thinking-games/candidates/365-v2/batch-05-days-274-365.json` | `7e1161da56afe152afdd85cc4ff78a816dbeffb209d1e060e337cf6daefcc1c2` |
| `content/thinking-games/candidates/365-v2/candidate-manifest-v2.json` | `9f5df6ea97b9ac10bd493d84025e7cf3f825df03361708bd5544ab604271fd7c` |
| `content/thinking-games/candidates/365-v2/candidate-meta-v2.json` | `5d0f9b788ef147dac03f0f8c2da499cf981c438769b63e6e265ca392447594ae` |

Identical pre/post-regeneration per-ID title/hint projection SHA256: `256647b1f1cbb8ebe48d73298778a68575ef639d55cebd87ef1828fde3c6e2bc`. The JSON defines exact encoding and row order.

Root must recheck both title/hint source hashes and per-ID title/hint projection after catalog regeneration. Any source change invalidates this assessment and requires a stale status/review. Unchanged sources do not automatically certify new boards, mode mapping, renderer, tutorials or explanations.

## Remaining gaps

- No sequential manual reading of all 1278 full composed title strings; compositional inspection and exact frame verification are the stated method.
- No child pilot, human Vietnamese editorial review, accessibility session or browser rendering validation.
- No review of unintegrated round3 mechanic tutorial/explanation wording; root must review final generated copy.
- Candidate and source assessment is snapshot-bound; renderer source was inspected only for the named visual/action concerns and may change independently.
- No full lint/typecheck/build/test suite was run for this documentation-only, source-read-only lane. Only read-only extraction/assertions and narrowly scoped evidence probes ran.

## Work performed and verification

Only this Markdown report and its sibling JSON were written. No source/git writes, dependencies, flags, approvals, signatures, production activity, subagents, catalog regeneration or test-file edits. No code simplification was performed.

Observed read-only checks: 1460 unique IDs; complete title-frame/name decomposition; all 263 rendered hints match source templates after variable filling; zero unfilled placeholders; all reviewed rows design_only; manifest/batch title-hint equality; source and candidate hash freshness; targeted alternating-pattern, turn/mode, title/answer-unit, perspective-direction, static UI-reference, shortest-route-distance and eight older fewest-subset probes. These checks establish the evidence stated, not full gameplay correctness.

Run destination: `run_6149b435d3ef`. Detailed machine-readable evidence: `plans/261021-daily-thinking-games/execution/content-review/round3-codex-titles-hints.json`.

## Concurrent regeneration and report delivery

Concurrent catalog regeneration changed all seven candidate files during this lane. The pre-regeneration extraction and post-regeneration extraction have identical per-ID title/hint projection SHA256, and both title/hint sources retain their original SHA256. Findings remain about those unchanged fields and relevant board modes only; this is not review or acceptance of regenerated tutorial/explanation copy. Root must independently verify the same evidence before reuse.

The requested direct report send to `run_6149b435d3ef` was rejected by Orca: `Dispatch ctx_d3d65aa24b41 belongs to Run run_d2b1a0cf783f, not run_6149b435d3ef.` The full report is being routed through the active Dispatch Run with its artifact path for the coordinator to forward; requested-Run delivery is not claimed.
