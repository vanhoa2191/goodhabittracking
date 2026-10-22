# Sonnet design handoff: Daily Thinking Games V2 (track-specific hints, varied titles, difficulty gap)

Branch `feat/thinking-games-content-r2`. Nothing is staged or committed. All 2920 V2 items regenerated (5 batches), all still `design_only` / pending human review. Generator output is reproducible (two runs give identical sha256 for all 7 files in `content/thinking-games/candidates/365-v2`).

## Metrics before → after

Measured by one script over the stored manifest (730 pairs of the same day and slot, 6-8 vs 9-12; 730 items per track for titles). "Before" = the manifest at `f28cd3e`; "after" = the regenerated manifest.

### Goal 1: age-specific hints

| metric | before | after |
|---|---|---|
| (day, slot) pairs where hint 1 **or** hint 2 is identical for 6-8 and 9-12 | 708 / 730 (97.0%) | **0 / 730 (0%)** |
| pairs where **both** hints are identical | 673 / 730 (92.2%) | 0 / 730 (0%) |
| hint 1 identical / hint 2 identical | 700 / 681 | 0 / 0 |

### Goal 2: title variety

| metric (per track, 730 items) | before | after |
|---|---|---|
| distinct titles / items | 730 / 730 (1.000) | 730 / 730 (1.000), same for 3-5, 6-8, 9-12, 13+ |
| max repeats of one title in a track | 1 | 1 |
| titles on two consecutive days | 0 | 0 (now enforced by audit) |
| distinct title phrases ("name" part, without chapter) | 24 (one per game type) | 192 (8 per game type) |
| share of titles in the old "<Chủ đề> · <Tên dạng game>" form | 100% | 0% |
| delimiter mix | 730 × " · " | 422 × " · ", 140 × ": ", 168 × " — " (6-8; 9-12 is within 1 of that) |
| distinct title shapes (6-8, words masked) | 14 | 72 |

The chapter name (theme, 53 chapters) stays in every title, which is why titles remain unique. 6-8 and 9-12 of the same slot now usually read differently (the pick is seeded with the age track).

### Goal 3: difficulty gap

Score definition: `src/lib/thinking-games/difficulty.ts` (`difficultyScore(board)`), one formula per board kind from its real knobs (sequence length, periods, interleaved numbers, grid size, cells, options/distractors, targets, items, rules in a chain, walls, waypoints, ordered stops, shortest-only, traits, differences, display time, group size). Scores compare tracks of the same game type and variant only.

- (day, slot) pairs where 9-12 is **not** harder than 6-8: **0 / 730 before → 0 / 730 after** (limit 5%).
- pairs where 9-12 is at least 10% above 6-8: 95.3% (min ratio 1.04) before → **99.5%** (min ratio 1.04, p10 1.14) after.
- weakest game type ratio (9-12 / 6-8 average): 1.07 (g02-t3) before → **1.13** (g06-t3) after; every type is now ≥ 1.13.
- track ladder 3-5 ≤ 6-8 < 9-12 ≤ 13+ holds for all 24 types on averages (unit test).
- Note: my first draft of the score included random weight and target sizes; with that formula the *old* content had 7 pairs (g05-t1, g05-t3) where 9-12 was not harder. I removed those random terms (a score must depend on the knobs, not the draw), so the final table below shows 0 before as well. The real fix for those two types is below.

| gameType | 6-8 trước | 9-12 trước | 9-12 / 6-8 trước | 6-8 sau | 9-12 sau | 9-12 / 6-8 sau | cặp 9-12 > 6-8 (sau) |
|---|---|---|---|---|---|---|---|
| g01-t1 | 6.94 | 8.82 | 1.27 | 6.94 | 8.82 | 1.27 | 100% |
| g01-t2 | 5.67 | 6.9 | 1.22 | 5.67 | 6.9 | 1.22 | 100% |
| g01-t3 | 6 | 7 | 1.17 | 6 | 7 | 1.17 | 100% |
| g02-t1 | 7 | 8 | 1.14 | 7 | 8.56 | 1.22 | 100% |
| g02-t2 | 6.97 | 7.92 | 1.14 | 6.97 | 8.28 | 1.19 | 100% |
| g02-t3 | 6.83 | 7.33 | 1.07 | 6.83 | 10.33 | 1.51 | 100% |
| g03-t1 | 4.26 | 5.89 | 1.38 | 4.26 | 5.89 | 1.38 | 100% |
| g03-t2 | 11.7 | 14.1 | 1.21 | 11.7 | 16.35 | 1.40 | 100% |
| g03-t3 | 6.27 | 7.77 | 1.24 | 6.27 | 7.77 | 1.24 | 100% |
| g04-t1 | 5.71 | 6.71 | 1.18 | 5.71 | 6.71 | 1.18 | 100% |
| g04-t2 | 5.34 | 7.34 | 1.37 | 5.34 | 7.34 | 1.37 | 100% |
| g04-t3 | 6.5 | 7.5 | 1.15 | 6.5 | 7.5 | 1.15 | 100% |
| g05-t1 | 4.5 | 6 | 1.33 | 4.5 | 7 | 1.56 | 100% |
| g05-t2 | 6.38 | 10.67 | 1.67 | 6.38 | 10.67 | 1.67 | 100% |
| g05-t3 | 5 | 6.37 | 1.27 | 5 | 6.37 | 1.27 | 100% |
| g06-t1 | 9 | 17.25 | 1.92 | 9 | 17.25 | 1.92 | 100% |
| g06-t2 | 5.5 | 7 | 1.27 | 5.5 | 7 | 1.27 | 100% |
| g06-t3 | 7.5 | 8.5 | 1.13 | 7.5 | 8.5 | 1.13 | 100% |
| g07-t1 | 6.61 | 7.61 | 1.15 | 6.61 | 8 | 1.21 | 100% |
| g07-t2 | 5 | 6 | 1.20 | 5 | 6 | 1.20 | 100% |
| g07-t3 | 6 | 7.5 | 1.25 | 6 | 7.5 | 1.25 | 100% |
| g08-t1 | 8.58 | 12.83 | 1.50 | 8.58 | 12.83 | 1.50 | 100% |
| g08-t2 | 7 | 8 | 1.14 | 7 | 8 | 1.14 | 100% |
| g08-t3 | 4 | 5 | 1.25 | 4 | 5 | 1.25 | 100% |

6-8 boards were not made harder anywhere: the 6-8 column is identical before and after.

## What changed

### Hints (goal 1)
- New `src/lib/thinking-games/content/hints.ts`: `TRACK_HINTS` table + `getTrackHints(gameTypeId, ageTrack, seed, mode, vars)`. Per game type and mode there is a **young** pair set (3-5, 6-8: short, everyday words, points at where to look, ≤100 characters) and an **older** pair set (9-12, 13+: strategy nudge, what to compare / which rule to test). Hint 1 never names the answer; hint 2 narrows (e.g. "tính hiệu của hai tổng"). Modes follow the board (increment / interleaved / repeat, fill / find-break, removed / added / swapped / property, replace / compare / missing, ordered / waypoint / shortest …). Single-mode types have two alternate pairs picked by seed. Placeholders (`{target}`, `{max}`, `{trait}`) are filled from the board.
- All 21 generators in `mechanics/remaining.ts` use it. The three original mechanics (g01-t1, g03-t1, g06-t1) got an optional `context` argument on `describeRuleSequenceBoard / describeMemorySequenceBoard / describePathBoard`; without it they return the old texts (V1 generator and old tests unchanged).
- No hint contains digits except the target/max numbers of g05-t3; the young pool and the older pool share no string (unit test).

### Titles (goal 2)
- New `content/titles.ts`: `TITLE_NAMES` (8 natural names per game type, 192 total, mix of statements and questions such as "Chiếc bóng nào đây?", "Việc nào làm trước?"), four frames (`Chủ đề · Tên`, `Tên · Chủ đề`, `Chủ đề: Tên`, `Tên — Chủ đề`; questions only use the two prefix frames), `getVariedTitle`, `themeOfTitle`.
- The generator keeps per-track state and passes the previous day's titles (and the current day's) as `avoid`, so a title never repeats on the next day or twice in a day; state is shared across batches.
- CSV titles are untouched; only the chapter name is read from them.

### Difficulty (goal 3), real knobs changed (6-8 untouched)
- g02-t1, g02-t2: options `3 + min(rank, 2)` (9-12: 4 → 5 options).
- g02-t3: grid `3 + min(rank, 2)` (9-12: 4×4 → 5×5), 13+ gets one more distractor so it stays above 9-12.
- g03-t2: grid `3 + min(rank, 2)` (9-12: 4×4 → 5×5).
- g05-t1: left pan `1 + min(rank, 2)` (9-12: 2 → 3 weights, 5 weights in total vs 3), 13+ gets one more option.
- g07-t1: extra trait ("vị trí") from 9-12 (was only 13+).
- g01-t3: 13+ gets one more option.
- Everything else already had a 9-12 > 6-8 step (sequence length, cells, candidates, chain length, group size, items, walls …) and was kept. Engine solve/check, uniqueness and alternate audits all still pass.

### Audit rules (goal 4), `scripts/check-thinking-games-candidates-v2.mjs`
New errors, run in `--batch=N` and `--all` (also written to `metrics.difficulty`):
- `hints_identical_across_tracks`: for the same (day, slot), 6-8 and 9-12 share hint 1 or hint 2.
- `title_repeated_consecutive_days` / `title_repeated_same_day`: per track.
- `difficulty_gap`: more than 5% of (day, slot) pairs have a 9-12 score ≤ 6-8.
- `difficulty_gap_type`: a game type whose average 9-12 score is ≤ 6-8, or less than 1.10× the 6-8 score ("clearly harder"; my addition on top of the brief).
Exports: `crossTrackHintErrors`, `titleRepeatErrors`, `difficultyReport`, `difficultyGapErrors`, `crossTrackErrors`, `DIFFICULTY_MAX_NOT_HARDER_SHARE`, `DIFFICULTY_MIN_TYPE_RATIO`.
All earlier guarantees remain: answer-position bias rule, copy audits (ids, JSON, English, underscore, duplicate words), engine accepts every stored solution, wrong/malformed answer rejection, alternates.

## Tests and verification
- New `tests/unit/thinking-games/track-design.test.ts` (17 tests): hint tables cover 24 types and both tiers, no shared strings, length limits, determinism and placeholders, 6-8 vs 9-12 hints differ for every type × variant × seed, hint 1 does not contain the answer, original mechanics stay backwards compatible, title names unique / deterministic / avoid list / three delimiters, difficulty (≥95% strictly harder and ≥1.10× on average for every type over 40 seeds × all variants; track ladder), audit rules with synthetic items (including the 5% tolerance edge), regenerated manifest has no identical hints, no repeated titles, unique titles per track.
- `node scripts/check-thinking-games-candidates-v2.mjs --all` and `--batch=1..5`: all exit 0, errorCount 0 (status pass_with_review_warnings; release rejection still expected).
- `npx vitest run tests/unit/thinking-games/ tests/unit/thinking-games-adversarial.test.ts --testTimeout=30000`: 179 tests pass.
- `npm run test:unit`: 241 files / 2885 tests pass. `npx tsc --noEmit`: clean. `npm run lint`: clean.
- Existing `generator-quality.test.ts` (strict monotone complexity across 4 tracks) forced two choices: I did not give older tracks fewer worked examples in g01-t3, and the 9-12 and 13+ variants of g05-t1 differ by option count.

## Files
Modified: `scripts/generate-thinking-games-candidates-v2.mjs`, `scripts/check-thinking-games-candidates-v2.mjs`, `src/lib/thinking-games/index.ts`, `mechanics/{remaining,rule-sequence,memory-sequence,path-planning}.ts`, `content/thinking-games/candidates/365-v2/*` (regenerated), audit JSONs in `content-candidate-audits/` (rewritten by the check script).
New: `src/lib/thinking-games/difficulty.ts`, `content/hints.ts`, `content/titles.ts`, `tests/unit/thinking-games/track-design.test.ts`.

## Not done / for the human reviewer
- Hints are mode-level, not board-specific (no coordinates or values), which is what keeps hint 1 safe; the 6-8 hint wording was not tested with real children.
- 3-5 shares the young hint pool and 13+ the older pool; 3-5 / 13+ are experimental tracks.
- Difficulty scores are a design proxy, not a calibrated measure; 9-12 pairs are ≥ 10% above 6-8 in 99.5% of cases, not by a fixed amount.
- Remaining items from the round-2 list that this task did not cover: ≥10 invitations per game type, duplicate_fingerprint / normalized_skin_duplicate review warnings.

## 12 before / after sample pairs (same day and slot, both tracks, child-facing text)
Each block shows the difficulty score and main board sizes. "Trước" is the manifest before this change, "Sau" the regenerated one.

### 1. g01-t1 · D001-main

_Trước_

**Trước** — 6–8 tuổi (`D001-main-vi68`, điểm độ khó 6.50; bảng: sequence=5, options=3)
- Tiêu đề: Hạt giống · Điền phần tiếp theo
- Lời mời: Chào bạn, thử thách điền tiếp vào dãy quy luật đang chờ bạn trổ tài đấy!
- Hướng dẫn: Đọc to các phần theo thứ tự, tìm xem phần nào đến tiếp theo.
- Gợi ý 1: Nhìn xem các từ lặp lại theo nhịp nào.
- Gợi ý 2: Thử đọc to chuỗi theo từng cặp.
- Giải thích: Phần tiếp theo hợp với nhịp của chuỗi là mây.

**Trước** — 9–12 tuổi (`D001-main-vi912`, điểm độ khó 8.00; bảng: sequence=6, options=4)
- Tiêu đề: Hạt giống · Điền phần tiếp theo
- Lời mời: Mình có dãy quy luật rất thú vị, bạn xem nhịp điệu của nó nhé!
- Hướng dẫn: Tìm xem dãy tăng thêm bao nhiêu hoặc lặp lại theo nhịp nào, rồi chọn phần tiếp theo.
- Gợi ý 1: Nhìn xem các từ lặp lại theo nhịp nào.
- Gợi ý 2: Thử đọc to chuỗi theo từng cặp.
- Giải thích: Phần tiếp theo hợp với nhịp của chuỗi là hoa.

_Sau_

**Sau** — 6–8 tuổi (`D001-main-vi68`, điểm độ khó 6.50; bảng: sequence=5, options=3)
- Tiêu đề: Hạt giống · Ai đứng tiếp theo?
- Lời mời: Chào bạn, thử thách điền tiếp vào dãy quy luật đang chờ bạn trổ tài đấy!
- Hướng dẫn: Đọc to các phần theo thứ tự, tìm xem phần nào đến tiếp theo.
- Gợi ý 1: Nhìn xem hai hình nào cứ thay nhau xuất hiện.
- Gợi ý 2: Đọc nhỏ cả dãy: cái này, cái kia, cái này, cái kia.
- Giải thích: Phần tiếp theo hợp với nhịp của chuỗi là mây.

**Sau** — 9–12 tuổi (`D001-main-vi912`, điểm độ khó 8.00; bảng: sequence=6, options=4)
- Tiêu đề: Hạt giống · Tiếp theo là gì?
- Lời mời: Mình có dãy quy luật rất thú vị, bạn xem nhịp điệu của nó nhé!
- Hướng dẫn: Tìm xem dãy tăng thêm bao nhiêu hoặc lặp lại theo nhịp nào, rồi chọn phần tiếp theo.
- Gợi ý 1: Thử so mỗi phần tử với phần tử cách nó một vị trí.
- Gợi ý 2: Nếu mọi cặp như vậy đều giống nhau thì nhịp lặp chỉ có hai phần tử.
- Giải thích: Phần tiếp theo hợp với nhịp của chuỗi là hoa.

### 2. g02-t3 · D023-bonus

_Trước_

**Trước** — 6–8 tuổi (`D023-bonus-vi68`, điểm độ khó 6.83; bảng: grid=4, options=3)
- Tiêu đề: Bữa tiệc trong vườn · Hoàn thành đối xứng
- Lời mời: Chào bạn, cùng mình khám phá vẻ đẹp đối xứng của bức tranh này nhé!
- Hướng dẫn: Nhìn hai bên trục gương xem ô nào cần điền để hai bên giống hệt nhau.
- Gợi ý 1: Bạn hãy đối chiếu từng ô qua đường trục ở giữa nhé.
- Gợi ý 2: Quan sát xem ô nào ở vị trí đối xứng còn đang bị thiếu hoặc chưa cân đối.
- Giải thích: Ô cần chọn nằm ở hàng 2, cột 4 để hình hoàn toàn đối xứng.

**Trước** — 9–12 tuổi (`D023-bonus-vi912`, điểm độ khó 7.33; bảng: grid=4, options=4)
- Tiêu đề: Bữa tiệc trong vườn · Hoàn thành đối xứng
- Lời mời: Hai bên gương đang chờ bạn hoàn thành để đối xứng thật đẹp đấy!
- Hướng dẫn: Gấp đôi hình theo đường giữa: ô nào không có ô trùng bên kia thì cần bổ sung hoặc là ô bị lệch.
- Gợi ý 1: Bạn hãy đối chiếu từng ô qua đường trục ở giữa nhé.
- Gợi ý 2: Quan sát xem ô nào ở vị trí đối xứng còn đang bị thiếu hoặc chưa cân đối.
- Giải thích: Ô cần chọn nằm ở hàng 1, cột 2 để hình hoàn toàn đối xứng.

_Sau_

**Sau** — 6–8 tuổi (`D023-bonus-vi68`, điểm độ khó 6.83; bảng: grid=4, options=3)
- Tiêu đề: Đối xứng hai bên · Bữa tiệc trong vườn
- Lời mời: Chào bạn, cùng mình khám phá vẻ đẹp đối xứng của bức tranh này nhé!
- Hướng dẫn: Nhìn hai bên trục gương xem ô nào cần điền để hai bên giống hệt nhau.
- Gợi ý 1: Nhìn đường chia đôi ở giữa tranh.
- Gợi ý 2: Mỗi ô có một ô bạn ở bên kia đường, giống hệt nó.
- Giải thích: Ô cần chọn nằm ở hàng 2, cột 4 để hình hoàn toàn đối xứng.

**Sau** — 9–12 tuổi (`D023-bonus-vi912`, điểm độ khó 10.33; bảng: grid=5, options=4)
- Tiêu đề: Bữa tiệc trong vườn: Ô nào làm tranh cân xứng?
- Lời mời: Hai bên gương đang chờ bạn hoàn thành để đối xứng thật đẹp đấy!
- Hướng dẫn: Gấp đôi hình theo đường giữa: ô nào không có ô trùng bên kia thì cần bổ sung hoặc là ô bị lệch.
- Gợi ý 1: Với mỗi ô, hình dung ô đối xứng với nó qua trục.
- Gợi ý 2: Ô trống cần giống ô đối xứng của nó, nên hãy xem ô đó đang là gì.
- Giải thích: Ô cần chọn nằm ở hàng 2, cột 5 để hình hoàn toàn đối xứng.

### 3. g03-t2 · D043-main

_Trước_

**Trước** — 6–8 tuổi (`D043-main-vi68`, điểm độ khó 11.70; bảng: width=4, height=4, targets=3, revealed=0, options=4)
- Tiêu đề: Kệ sách · Nhớ vị trí
- Lời mời: Bạn hãy tập trung quan sát các vị trí xuất hiện rồi chỉ lại thật đúng nhé!
- Hướng dẫn: Tập trung nhìn các vị trí xuất hiện rồi bấm lại thật chính xác nha.
- Gợi ý 1: Bạn hãy dùng các góc và đường viền của bảng làm điểm mốc để nhớ vị trí nhé.
- Gợi ý 2: Ghi nhớ các ô sáng đèn theo thứ tự từ trên xuống dưới để không bỏ sót.
- Giải thích: Các vị trí bạn nhỏ đã xuất hiện nằm ở hàng 4, cột 2 và hàng 1, cột 4 và hàng 4, cột 4.

**Trước** — 9–12 tuổi (`D043-main-vi912`, điểm độ khó 14.10; bảng: width=4, height=4, targets=4, revealed=0, options=5)
- Tiêu đề: Kệ sách · Nhớ vị trí
- Lời mời: Cùng mình thử tài siêu trí nhớ với bảng vị trí ngày hôm nay nào!
- Hướng dẫn: Nhớ mỗi ô nằm ở hàng nào, cột nào sẽ giúp bạn không nhầm chỗ.
- Gợi ý 1: Bạn hãy dùng các góc và đường viền của bảng làm điểm mốc để nhớ vị trí nhé.
- Gợi ý 2: Ghi nhớ các ô sáng đèn theo thứ tự từ trên xuống dưới để không bỏ sót.
- Giải thích: Các vị trí bạn nhỏ đã xuất hiện nằm ở hàng 1, cột 1 và hàng 1, cột 2 và hàng 3, cột 2 và hàng 1, cột 3.

_Sau_

**Sau** — 6–8 tuổi (`D043-main-vi68`, điểm độ khó 11.70; bảng: width=4, height=4, targets=3, revealed=0, options=4)
- Tiêu đề: Đèn nhỏ trên bảng · Kệ sách
- Lời mời: Bạn hãy tập trung quan sát các vị trí xuất hiện rồi chỉ lại thật đúng nhé!
- Hướng dẫn: Tập trung nhìn các vị trí xuất hiện rồi bấm lại thật chính xác nha.
- Gợi ý 1: Nhớ ô nằm ở góc hay ở giữa bảng.
- Gợi ý 2: Đếm xem có mấy ô sáng rồi chỉ lại.
- Giải thích: Các vị trí bạn nhỏ đã xuất hiện nằm ở hàng 4, cột 2 và hàng 1, cột 4 và hàng 4, cột 4.

**Sau** — 9–12 tuổi (`D043-main-vi912`, điểm độ khó 16.35; bảng: width=5, height=5, targets=4, revealed=0, options=5)
- Tiêu đề: Nhớ chỗ các ô sáng — Kệ sách
- Lời mời: Cùng mình thử tài siêu trí nhớ với bảng vị trí ngày hôm nay nào!
- Hướng dẫn: Nhớ mỗi ô nằm ở hàng nào, cột nào sẽ giúp bạn không nhầm chỗ.
- Gợi ý 1: Dùng các góc và mép bảng làm mốc để nhớ vị trí.
- Gợi ý 2: Nhớ theo hình các ô sáng tạo nên, chẳng hạn một hàng hay một đường chéo.
- Giải thích: Các vị trí bạn nhỏ đã xuất hiện nằm ở hàng 2, cột 1 và hàng 1, cột 2 và hàng 4, cột 2 và hàng 1, cột 4.

### 4. g04-t1 · D073-bonus

_Trước_

**Trước** — 6–8 tuổi (`D073-bonus-vi68`, điểm độ khó 7.00; bảng: candidates=4, clues=3, options=4)
- Tiêu đề: Dòng suối · Loại trừ theo manh mối
- Lời mời: Chào bạn, hãy dùng các manh mối để tìm ra bạn nhỏ bí ẩn cùng mình nhé!
- Hướng dẫn: Xem kỹ từng lời gợi ý để tìm ra đúng người bạn bí mật.
- Gợi ý 1: Bạn hãy đọc từng manh mối và tìm dấu hiệu chắc chắn nhất trước nhé.
- Gợi ý 2: Gạch bớt những bạn có đặc điểm không khớp với manh mối đã cho.
- Giải thích: Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số 1 (màu vàng, hình tam giác, kích cỡ to).

**Trước** — 9–12 tuổi (`D073-bonus-vi912`, điểm độ khó 8.00; bảng: candidates=5, clues=3, options=5)
- Tiêu đề: Dòng suối · Loại trừ theo manh mối
- Lời mời: Chào bạn, hãy dùng các manh mối để tìm ra bạn nhỏ bí ẩn cùng mình nhé!
- Hướng dẫn: Đọc từng manh mối, cái nào nói "là" hay "không phải" đều giúp bạn loại bớt lựa chọn sai.
- Gợi ý 1: Bạn hãy đọc từng manh mối và tìm dấu hiệu chắc chắn nhất trước nhé.
- Gợi ý 2: Gạch bớt những bạn có đặc điểm không khớp với manh mối đã cho.
- Giải thích: Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số 1 (màu vàng, hình vuông, kích cỡ to).

_Sau_

**Sau** — 6–8 tuổi (`D073-bonus-vi68`, điểm độ khó 7.00; bảng: candidates=4, clues=3, options=4)
- Tiêu đề: Dòng suối · Bạn nhỏ bí ẩn là ai?
- Lời mời: Chào bạn, hãy dùng các manh mối để tìm ra bạn nhỏ bí ẩn cùng mình nhé!
- Hướng dẫn: Xem kỹ từng lời gợi ý để tìm ra đúng người bạn bí mật.
- Gợi ý 1: Nhìn từng bạn nhỏ một và hỏi: bạn này có khớp không?
- Gợi ý 2: Bạn nào khác manh mối ở một chỗ cũng không phải.
- Giải thích: Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số 1 (màu vàng, hình tam giác, kích cỡ to).

**Sau** — 9–12 tuổi (`D073-bonus-vi912`, điểm độ khó 8.00; bảng: candidates=5, clues=3, options=5)
- Tiêu đề: Dòng suối: Manh mối chỉ đường
- Lời mời: Chào bạn, hãy dùng các manh mối để tìm ra bạn nhỏ bí ẩn cùng mình nhé!
- Hướng dẫn: Đọc từng manh mối, cái nào nói "là" hay "không phải" đều giúp bạn loại bớt lựa chọn sai.
- Gợi ý 1: Tách các manh mối ra: manh mối nào nói về màu, manh mối nào nói về hình?
- Gợi ý 2: Với mỗi bạn, kiểm tra tất cả manh mối; chỉ cần sai một manh mối là loại.
- Giải thích: Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số 1 (màu vàng, hình vuông, kích cỡ to).

### 5. g05-t1 · D085-main

_Trước_

**Trước** — 6–8 tuổi (`D085-main-vi68`, điểm độ khó 4.50; bảng: left=2, right=1, options=3)
- Tiêu đề: Bản đồ khu rừng · Cân bằng hai bên
- Lời mời: Chào bạn, cùng mình tìm quả cân còn thiếu để hai đĩa cân bằng nhau nhé!
- Hướng dẫn: Bạn tính để hai bên đĩa cân có cùng cân nặng bằng nhau nhé.
- Gợi ý 1: Bạn hãy tính tổng số cân ở đĩa cân đã biết đủ các quả nhé.
- Gợi ý 2: Lấy tổng số cân đó trừ đi phần đã có ở bên đĩa còn lại để tìm số cân còn thiếu.
- Giải thích: Cần thêm 6 để hai bên đĩa cân có cân nặng bằng nhau.

**Trước** — 9–12 tuổi (`D085-main-vi912`, điểm độ khó 6.00; bảng: left=2, right=2, options=4)
- Tiêu đề: Bản đồ khu rừng · Cân bằng hai bên
- Lời mời: Hãy tính toán thật nhanh xem cần thêm bao nhiêu để hai bên cân bằng nhau nha!
- Hướng dẫn: So tổng số cân của hai đĩa để tìm số cân còn thiếu.
- Gợi ý 1: Bạn hãy tính tổng số cân ở đĩa cân đã biết đủ các quả nhé.
- Gợi ý 2: Lấy tổng số cân đó trừ đi phần đã có ở bên đĩa còn lại để tìm số cân còn thiếu.
- Giải thích: Cần thêm 2 để hai bên đĩa cân có cân nặng bằng nhau.

_Sau_

**Sau** — 6–8 tuổi (`D085-main-vi68`, điểm độ khó 4.50; bảng: left=2, right=1, options=3)
- Tiêu đề: Bản đồ khu rừng · Hai đĩa ngang nhau
- Lời mời: Chào bạn, cùng mình tìm quả cân còn thiếu để hai đĩa cân bằng nhau nhé!
- Hướng dẫn: Bạn tính để hai bên đĩa cân có cùng cân nặng bằng nhau nhé.
- Gợi ý 1: Cộng các quả cân đã có ở mỗi đĩa.
- Gợi ý 2: Đĩa nhẹ hơn cần thêm đúng phần còn thiếu.
- Giải thích: Cần thêm 6 để hai bên đĩa cân có cân nặng bằng nhau.

**Sau** — 9–12 tuổi (`D085-main-vi912`, điểm độ khó 7.00; bảng: left=3, right=2, options=4)
- Tiêu đề: Bản đồ khu rừng: Chiếc cân thăng bằng
- Lời mời: Hãy tính toán thật nhanh xem cần thêm bao nhiêu để hai bên cân bằng nhau nha!
- Hướng dẫn: So tổng số cân của hai đĩa để tìm số cân còn thiếu.
- Gợi ý 1: Gọi quả còn thiếu là ẩn số rồi viết: tổng đĩa này bằng tổng đĩa kia.
- Gợi ý 2: Số cần tìm là hiệu giữa hai tổng đã biết.
- Giải thích: Cần thêm 2 để hai bên đĩa cân có cân nặng bằng nhau.

### 6. g05-t3 · D010-bonus

_Trước_

**Trước** — 6–8 tuổi (`D010-bonus-vi68`, điểm độ khó 5.00; bảng: items=4, target=8, maxItems=2, options=4)
- Tiêu đề: Vườn hoa · Đủ mục tiêu
- Lời mời: Cùng mình nhặt các món đồ vào giỏ để đạt được tổng điểm mong muốn nào!
- Hướng dẫn: Gom thật ít món vừa đủ để cộng ra đúng số mục tiêu nha.
- Gợi ý 1: Bạn hãy tìm cách dùng thật ít món mà vẫn đủ mục tiêu nhé.
- Gợi ý 2: Cộng các số lại rồi xem món nào là thừa, bỏ đi thì có còn đúng mục tiêu 8 không nhé.
- Giải thích: Chọn 2 món (1 và 7) để đạt tổng đúng bằng 8 với số món ít nhất.

**Trước** — 9–12 tuổi (`D010-bonus-vi912`, điểm độ khó 6.50; bảng: items=5, target=9, maxItems=3, options=5)
- Tiêu đề: Vườn hoa · Đủ mục tiêu
- Lời mời: Cùng mình nhặt các món đồ vào giỏ để đạt được tổng điểm mong muốn nào!
- Hướng dẫn: Tìm cách chọn có số lượng ít nhất mà tổng vẫn đúng bằng mục tiêu.
- Gợi ý 1: Bạn hãy tìm cách dùng thật ít món mà vẫn đủ mục tiêu nhé.
- Gợi ý 2: Cộng các số lại rồi xem món nào là thừa, bỏ đi thì có còn đúng mục tiêu 9 không nhé.
- Giải thích: Chọn 1 món (9) để đạt tổng đúng bằng 9 với số món ít nhất.

_Sau_

**Sau** — 6–8 tuổi (`D010-bonus-vi68`, điểm độ khó 5.00; bảng: items=4, target=8, maxItems=2, options=4)
- Tiêu đề: Vườn hoa · Giỏ đồ khéo léo
- Lời mời: Cùng mình nhặt các món đồ vào giỏ để đạt được tổng điểm mong muốn nào!
- Hướng dẫn: Gom thật ít món vừa đủ để cộng ra đúng số mục tiêu nha.
- Gợi ý 1: Thử chọn ít món trước nhé.
- Gợi ý 2: Nếu chưa đủ mục tiêu 8 thì mới thêm món khác.
- Giải thích: Chọn 2 món (1 và 7) để đạt tổng đúng bằng 8 với số món ít nhất.

**Sau** — 9–12 tuổi (`D010-bonus-vi912`, điểm độ khó 6.50; bảng: items=5, target=9, maxItems=3, options=5)
- Tiêu đề: Vườn hoa: Gom cho vừa đủ
- Lời mời: Cùng mình nhặt các món đồ vào giỏ để đạt được tổng điểm mong muốn nào!
- Hướng dẫn: Tìm cách chọn có số lượng ít nhất mà tổng vẫn đúng bằng mục tiêu.
- Gợi ý 1: Bắt đầu từ các số lớn để cần ít món nhất.
- Gợi ý 2: Khi đã có một cách đạt 9, thử thay hai món nhỏ bằng một món lớn.
- Giải thích: Chọn 1 món (9) để đạt tổng đúng bằng 9 với số món ít nhất.

### 7. g06-t1 · D027-bonus

_Trước_

**Trước** — 6–8 tuổi (`D027-bonus-vi68`, điểm độ khó 8.50; bảng: width=5, height=5, walls=1, waypoints=1)
- Tiêu đề: Bữa tiệc trong vườn · Tìm đường
- Lời mời: Bản đồ mê cung đã mở ra, bạn dẫn đường cho bạn nhỏ về đích cùng mình nhé!
- Hướng dẫn: Tìm một đường đi tới đích, nhớ ghé qua ngôi sao trên bảng nhé.
- Gợi ý 1: Bạn hãy đi từng bước một cẩn thận và tránh xa các bức tường nhé.
- Gợi ý 2: Nhớ đi qua ngôi sao trước khi tiến về ô đích nha.
- Giải thích: Đường đi đúng ghé qua ngôi sao trên bảng rồi mới về đích, không chạm tường.

**Trước** — 9–12 tuổi (`D027-bonus-vi912`, điểm độ khó 16.75; bảng: width=7, height=7, walls=4, waypoints=1)
- Tiêu đề: Bữa tiệc trong vườn · Tìm đường
- Lời mời: Thử thách tìm đường hôm nay sẽ giúp bạn rèn luyện khả năng quan sát không gian đấy!
- Hướng dẫn: Đi sao cho đường đi ghé qua ngôi sao rồi mới tới đích.
- Gợi ý 1: Bạn hãy đi từng bước một cẩn thận và tránh xa các bức tường nhé.
- Gợi ý 2: Nhớ đi qua ngôi sao trước khi tiến về ô đích nha.
- Giải thích: Đường đi đúng ghé qua ngôi sao trên bảng rồi mới về đích, không chạm tường.

_Sau_

**Sau** — 6–8 tuổi (`D027-bonus-vi68`, điểm độ khó 8.50; bảng: width=5, height=5, walls=1, waypoints=1)
- Tiêu đề: Tìm đường — Bữa tiệc trong vườn
- Lời mời: Bản đồ mê cung đã mở ra, bạn dẫn đường cho bạn nhỏ về đích cùng mình nhé!
- Hướng dẫn: Tìm một đường đi tới đích, nhớ ghé qua ngôi sao trên bảng nhé.
- Gợi ý 1: Tìm ngôi sao trên bản đồ.
- Gợi ý 2: Đi qua ngôi sao rồi mới về đích.
- Giải thích: Đường đi đúng ghé qua ngôi sao trên bảng rồi mới về đích, không chạm tường.

**Sau** — 9–12 tuổi (`D027-bonus-vi912`, điểm độ khó 16.75; bảng: width=7, height=7, walls=4, waypoints=1)
- Tiêu đề: Hành trình về đích · Bữa tiệc trong vườn
- Lời mời: Thử thách tìm đường hôm nay sẽ giúp bạn rèn luyện khả năng quan sát không gian đấy!
- Hướng dẫn: Đi sao cho đường đi ghé qua ngôi sao rồi mới tới đích.
- Gợi ý 1: Chia đường đi thành hai đoạn: từ chỗ xuất phát đến ngôi sao, rồi từ ngôi sao đến đích.
- Gợi ý 2: Mỗi đoạn tự tìm đường tránh tường.
- Giải thích: Đường đi đúng ghé qua ngôi sao trên bảng rồi mới về đích, không chạm tường.

### 8. g06-t3 · D046-main

_Trước_

**Trước** — 6–8 tuổi (`D046-main-vi68`, điểm độ khó 7.50; bảng: width=5, height=5, walls=0, commands=5, options=4)
- Tiêu đề: Kệ sách · Sửa bước sai
- Lời mời: Chương trình robot bị sai một bước rồi, bạn cùng mình sửa lại cho đúng nhé!
- Hướng dẫn: Xem lại từng bước đi của robot và sửa lại một bước sai duy nhất nha.
- Gợi ý 1: Bạn hãy di chuyển thử theo từng bước lệnh xem robot đi chệch đường ở bước nào nhé.
- Gợi ý 2: Tìm bước khiến robot đi xa khỏi đích hoặc đâm vào tường để đổi hướng cho bước đó.
- Giải thích: Đổi bước 2 thành hướng "bên phải" để robot về đích an toàn.

**Trước** — 9–12 tuổi (`D046-main-vi912`, điểm độ khó 8.50; bảng: width=5, height=5, walls=0, commands=6, options=4)
- Tiêu đề: Kệ sách · Sửa bước sai
- Lời mời: Hãy xem robot đi tới đâu bị vướng và đổi lại một bước để tới đích an toàn nha!
- Hướng dẫn: Chỉ cần đổi đúng một bước đi là cả lộ trình sẽ tới được đích.
- Gợi ý 1: Bạn hãy di chuyển thử theo từng bước lệnh xem robot đi chệch đường ở bước nào nhé.
- Gợi ý 2: Tìm bước khiến robot đi xa khỏi đích hoặc đâm vào tường để đổi hướng cho bước đó.
- Giải thích: Đổi bước 5 thành hướng "xuống" để robot về đích an toàn.

_Sau_

**Sau** — 6–8 tuổi (`D046-main-vi68`, điểm độ khó 7.50; bảng: width=5, height=5, walls=0, commands=5, options=4)
- Tiêu đề: Kệ sách · Chỉnh lại một lệnh
- Lời mời: Chương trình robot bị sai một bước rồi, bạn cùng mình sửa lại cho đúng nhé!
- Hướng dẫn: Xem lại từng bước đi của robot và sửa lại một bước sai duy nhất nha.
- Gợi ý 1: Đi theo từng mũi tên của robot.
- Gợi ý 2: Dừng ở chỗ robot bắt đầu đi lạc xa khỏi đích.
- Giải thích: Đổi bước 2 thành hướng "bên phải" để robot về đích an toàn.

**Sau** — 9–12 tuổi (`D046-main-vi912`, điểm độ khó 8.50; bảng: width=5, height=5, walls=0, commands=6, options=4)
- Tiêu đề: Kệ sách · Chỉnh lại một lệnh
- Lời mời: Hãy xem robot đi tới đâu bị vướng và đổi lại một bước để tới đích an toàn nha!
- Hướng dẫn: Chỉ cần đổi đúng một bước đi là cả lộ trình sẽ tới được đích.
- Gợi ý 1: Mô phỏng từng lệnh và theo dõi vị trí của robot sau mỗi bước.
- Gợi ý 2: Bước làm robot lệch khỏi đường tới đích là bước cần đổi; hãy chọn hướng sao cho robot vẫn đến được đích.
- Giải thích: Đổi bước 5 thành hướng "xuống" để robot về đích an toàn.

### 9. g07-t2 · D068-bonus

_Trước_

**Trước** — 6–8 tuổi (`D068-bonus-vi68`, điểm độ khó 5.00; bảng: width=4, height=4, options=4)
- Tiêu đề: Nhà trên cây · Đổi góc nhìn
- Lời mời: Thử thách đổi góc nhìn hôm nay rất thú vị, bạn hãy đặt mình vào vị trí đó nhé!
- Hướng dẫn: Bạn đứng vào vị trí người quan sát và chọn xem đồ vật ở phía nào nhé.
- Gợi ý 1: Bạn hãy tưởng tượng mình đang đứng ở vị trí bạn nhỏ và nhìn theo hướng mũi tên nhé.
- Gợi ý 2: Xác định xem đồ vật nằm ở phía trước mặt, sau lưng hay bên tay trái, tay phải của bạn nhỏ.
- Giải thích: Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở phía sau.

**Trước** — 9–12 tuổi (`D068-bonus-vi912`, điểm độ khó 6.00; bảng: width=5, height=5, options=4)
- Tiêu đề: Nhà trên cây · Đổi góc nhìn
- Lời mời: Hãy thử đổi góc nhìn và xác định hướng của đồ vật theo vị trí mới nha bạn!
- Hướng dẫn: Chọn đồ vật đang ở phía trước, phía sau, bên trái hay bên phải của bạn nhỏ.
- Gợi ý 1: Bạn hãy tưởng tượng mình đang đứng ở vị trí bạn nhỏ và nhìn theo hướng mũi tên nhé.
- Gợi ý 2: Xác định xem đồ vật nằm ở phía trước mặt, sau lưng hay bên tay trái, tay phải của bạn nhỏ.
- Giải thích: Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở phía trước.

_Sau_

**Sau** — 6–8 tuổi (`D068-bonus-vi68`, điểm độ khó 5.00; bảng: width=4, height=4, options=4)
- Tiêu đề: Nhà trên cây · Đứng ở chỗ bạn ấy
- Lời mời: Thử thách đổi góc nhìn hôm nay rất thú vị, bạn hãy đặt mình vào vị trí đó nhé!
- Hướng dẫn: Bạn đứng vào vị trí người quan sát và chọn xem đồ vật ở phía nào nhé.
- Gợi ý 1: Hãy xoay đầu theo hướng bạn nhỏ nhìn.
- Gợi ý 2: Đồ vật ở trước mặt, sau lưng hay bên tay nào của bạn ấy?
- Giải thích: Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở phía sau.

**Sau** — 9–12 tuổi (`D068-bonus-vi912`, điểm độ khó 6.00; bảng: width=5, height=5, options=4)
- Tiêu đề: Nhà trên cây · Hướng nhìn của bạn nhỏ
- Lời mời: Hãy thử đổi góc nhìn và xác định hướng của đồ vật theo vị trí mới nha bạn!
- Hướng dẫn: Chọn đồ vật đang ở phía trước, phía sau, bên trái hay bên phải của bạn nhỏ.
- Gợi ý 1: Xác định hướng nhìn của bạn nhỏ, rồi hình dung trục trước sau và trái phải theo hướng đó.
- Gợi ý 2: Đặt đồ vật lên trục ấy để biết vị trí so với bạn nhỏ, không so với màn hình.
- Giải thích: Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở phía trước.

### 10. g08-t1 · D088-main

_Trước_

**Trước** — 6–8 tuổi (`D088-main-vi68`, điểm độ khó 8.58; bảng: left=4, right=4, options=5)
- Tiêu đề: Bản đồ khu rừng · Điểm khác biệt
- Lời mời: Hai bức tranh trông rất giống nhau, nhưng có những điểm khác, bạn tìm nhé!
- Hướng dẫn: So từng ô theo hàng và cột để tìm ra những điểm thay đổi.
- Gợi ý 1: Bạn hãy so sánh từng hàng từ trên xuống dưới giữa hai bức hình nhé.
- Gợi ý 2: Quan sát kỹ từng biểu tượng ở hàng và cột tương ứng để tìm ra ô bị thay đổi.
- Giải thích: Điểm khác nhau giữa hai hình nằm ở hàng 2, cột 2 và hàng 3, cột 2.

**Trước** — 9–12 tuổi (`D088-main-vi912`, điểm độ khó 12.83; bảng: left=5, right=5, options=6)
- Tiêu đề: Bản đồ khu rừng · Điểm khác biệt
- Lời mời: Hai bức tranh trông rất giống nhau, nhưng có những điểm khác, bạn tìm nhé!
- Hướng dẫn: Nhìn thật kỹ để tìm đủ mọi ô không giống nhau giữa hai hình.
- Gợi ý 1: Bạn hãy so sánh từng hàng từ trên xuống dưới giữa hai bức hình nhé.
- Gợi ý 2: Quan sát kỹ từng biểu tượng ở hàng và cột tương ứng để tìm ra ô bị thay đổi.
- Giải thích: Điểm khác nhau giữa hai hình nằm ở hàng 3, cột 1 và hàng 2, cột 2 và hàng 5, cột 4.

_Sau_

**Sau** — 6–8 tuổi (`D088-main-vi68`, điểm độ khó 8.58; bảng: left=4, right=4, options=5)
- Tiêu đề: Bản đồ khu rừng · Hai hình khác nhau ở đâu?
- Lời mời: Hai bức tranh trông rất giống nhau, nhưng có những điểm khác, bạn tìm nhé!
- Hướng dẫn: So từng ô theo hàng và cột để tìm ra những điểm thay đổi.
- Gợi ý 1: So từng hàng của hai hình nhé.
- Gợi ý 2: Nhìn kỹ từng ô: hai ô cùng chỗ có giống nhau không?
- Giải thích: Điểm khác nhau giữa hai hình nằm ở hàng 2, cột 2 và hàng 3, cột 2.

**Sau** — 9–12 tuổi (`D088-main-vi912`, điểm độ khó 12.83; bảng: left=5, right=5, options=6)
- Tiêu đề: Bản đồ khu rừng · Chỗ nào không giống?
- Lời mời: Hai bức tranh trông rất giống nhau, nhưng có những điểm khác, bạn tìm nhé!
- Hướng dẫn: Nhìn thật kỹ để tìm đủ mọi ô không giống nhau giữa hai hình.
- Gợi ý 1: Quét theo hàng hoặc theo cột và so từng ô với ô cùng vị trí ở hình kia.
- Gợi ý 2: Đánh dấu mỗi chỗ khác nhau; có thể có nhiều hơn một chỗ nên đừng dừng quá sớm.
- Giải thích: Điểm khác nhau giữa hai hình nằm ở hàng 3, cột 1 và hàng 2, cột 2 và hàng 5, cột 4.

### 11. g03-t3 · D011-main

_Trước_

**Trước** — 6–8 tuổi (`D011-main-vi68`, điểm độ khó 7.00; bảng: before=5, after=4, options=4)
- Tiêu đề: Vườn hoa · Nhận ra thay đổi
- Lời mời: Chào bạn, hãy nhìn thật kỹ hai cảnh và chỉ ra điểm thay đổi cùng mình nhé!
- Hướng dẫn: Nhìn thật kỹ xem bạn nào vừa đổi chỗ, đổi màu hoặc biến mất nha.
- Gợi ý 1: Bạn hãy đối chiếu từng vị trí giữa cảnh trước và cảnh sau theo thứ tự nhé.
- Gợi ý 2: Quan sát xem có bạn nào đổi màu sắc, đổi vị trí hay vừa xuất hiện thêm không.
- Giải thích: Ở cảnh sau, quả đã biến mất khỏi khung hình.

**Trước** — 9–12 tuổi (`D011-main-vi912`, điểm độ khó 8.50; bảng: before=6, after=5, options=5)
- Tiêu đề: Vườn hoa · Nhận ra thay đổi
- Lời mời: Thử thách nhận ra thay đổi hôm nay sẽ rèn cho bạn đôi mắt rất tinh đấy!
- Hướng dẫn: Xem kỹ màu sắc, số lượng và chỗ đứng của từng món để nhận ra điểm khác.
- Gợi ý 1: Bạn hãy đối chiếu từng vị trí giữa cảnh trước và cảnh sau theo thứ tự nhé.
- Gợi ý 2: Quan sát xem có bạn nào đổi màu sắc, đổi vị trí hay vừa xuất hiện thêm không.
- Giải thích: Ở cảnh sau, nắng đã biến mất khỏi khung hình.

_Sau_

**Sau** — 6–8 tuổi (`D011-main-vi68`, điểm độ khó 7.00; bảng: before=5, after=4, options=4)
- Tiêu đề: Vườn hoa: Cảnh nào đã đổi?
- Lời mời: Chào bạn, hãy nhìn thật kỹ hai cảnh và chỉ ra điểm thay đổi cùng mình nhé!
- Hướng dẫn: Nhìn thật kỹ xem bạn nào vừa đổi chỗ, đổi màu hoặc biến mất nha.
- Gợi ý 1: Đếm xem cảnh sau còn đủ bạn không.
- Gợi ý 2: Có một bạn đã đi mất rồi.
- Giải thích: Ở cảnh sau, quả đã biến mất khỏi khung hình.

**Sau** — 9–12 tuổi (`D011-main-vi912`, điểm độ khó 8.50; bảng: before=6, after=5, options=5)
- Tiêu đề: Vườn hoa: Cảnh nào đã đổi?
- Lời mời: Thử thách nhận ra thay đổi hôm nay sẽ rèn cho bạn đôi mắt rất tinh đấy!
- Hướng dẫn: Xem kỹ màu sắc, số lượng và chỗ đứng của từng món để nhận ra điểm khác.
- Gợi ý 1: Đếm số đồ vật ở hai cảnh để biết cảnh sau thiếu hay thừa.
- Gợi ý 2: Gạch dần những đồ vật có mặt ở cả hai cảnh; đồ vật còn lại chính là điều đã đổi.
- Giải thích: Ở cảnh sau, nắng đã biến mất khỏi khung hình.

### 12. g04-t2 · D028-main

_Trước_

**Trước** — 6–8 tuổi (`D028-main-vi68`, điểm độ khó 5.00; bảng: rules=2, facts=1, options=4)
- Tiêu đề: Bữa tiệc trong vườn · Nếu thì
- Lời mời: Chào bạn, thử thách suy luận Nếu - Thì hôm nay rất thú vị, cùng thử sức nào!
- Hướng dẫn: Dùng gợi ý có sẵn và luật dẫn đường để tìm ra điều chắc chắn xảy ra.
- Gợi ý 1: Bạn hãy bắt đầu từ điều chúng mình đã biết chắc chắn nhé.
- Gợi ý 2: Tìm luật Nếu - Thì có điều kiện mở đầu trùng với điều đã biết để suy ra kết quả tiếp theo.
- Giải thích: Từ những điều đã biết chắc chắn và áp dụng luật Nếu - Thì, ta tìm ra kết luận là mưa.

**Trước** — 9–12 tuổi (`D028-main-vi912`, điểm độ khó 7.00; bảng: rules=3, facts=1, options=5)
- Tiêu đề: Bữa tiệc trong vườn · Nếu thì
- Lời mời: Từ các điều đã biết và luật Nếu - Thì, bạn suy luận cùng mình nhé!
- Hướng dẫn: Kiểm tra từng bước suy nghĩ và chọn kết luận chắc chắn đúng, không thể sai.
- Gợi ý 1: Bạn hãy bắt đầu từ điều chúng mình đã biết chắc chắn nhé.
- Gợi ý 2: Tìm luật Nếu - Thì có điều kiện mở đầu trùng với điều đã biết để suy ra kết quả tiếp theo.
- Giải thích: Từ những điều đã biết chắc chắn và áp dụng luật Nếu - Thì, ta tìm ra kết luận là đánh răng.

_Sau_

**Sau** — 6–8 tuổi (`D028-main-vi68`, điểm độ khó 5.00; bảng: rules=2, facts=1, options=4)
- Tiêu đề: Chuỗi suy luận · Bữa tiệc trong vườn
- Lời mời: Chào bạn, thử thách suy luận Nếu - Thì hôm nay rất thú vị, cùng thử sức nào!
- Hướng dẫn: Dùng gợi ý có sẵn và luật dẫn đường để tìm ra điều chắc chắn xảy ra.
- Gợi ý 1: Nhìn điều đã biết ở phía trên.
- Gợi ý 2: Luật nào bắt đầu bằng điều đó thì cho ta một điều mới.
- Giải thích: Từ những điều đã biết chắc chắn và áp dụng luật Nếu - Thì, ta tìm ra kết luận là mưa.

**Sau** — 9–12 tuổi (`D028-main-vi912`, điểm độ khó 7.00; bảng: rules=3, facts=1, options=5)
- Tiêu đề: Chuỗi suy luận · Bữa tiệc trong vườn
- Lời mời: Từ các điều đã biết và luật Nếu - Thì, bạn suy luận cùng mình nhé!
- Hướng dẫn: Kiểm tra từng bước suy nghĩ và chọn kết luận chắc chắn đúng, không thể sai.
- Gợi ý 1: Hình dung các mũi tên nối từng điều theo mỗi luật Nếu - Thì.
- Gợi ý 2: Đi theo mũi tên xuất phát từ điều đã biết; chỉ những điều đến được mới đáng chọn.
- Giải thích: Từ những điều đã biết chắc chắn và áp dụng luật Nếu - Thì, ta tìm ra kết luận là đánh răng.
