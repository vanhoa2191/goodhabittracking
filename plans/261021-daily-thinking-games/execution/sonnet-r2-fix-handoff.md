# Sonnet R2 fix handoff — Daily Thinking Games V2 (generator-level)

Scope: round-2 findings (Gemini + Sonnet) fixed in generators/copy, V2 content (2920 items, 5 batches) regenerated reproducibly (two runs → identical sha256). All items stay `design_only`, manifest `pending_human_review`; ids/days/slots/tracks unchanged. No git add/commit.

## Files changed
- `src/lib/thinking-games/mechanics/remaining.ts` — option shuffle (g02-t1, g02-t2, g03-t3, g05-t1), g07-t2 direction + explanation, trait keys renamed.
- `src/lib/thinking-games/mechanics/rule-sequence.ts` — g01-t1 interleaved explanation.
- `src/lib/thinking-games/mechanics/path-planning.ts` — g06-t1 hints/explanations from the real board.
- `src/lib/thinking-games/content/copy.ts` — g06-t1 tutorial modes (`reach`, `waypoint`, `ordered`, `shortest`), `getTutorialMode`, plain-language 9-12 tutorials, g06-t1 invitation.
- Renderers (needed): `PathPlanningGame.tsx` (numbered ⭐ on ordered boards), `FlexibilityClassifyGame.tsx`, `ObservationTwoTraitsGame.tsx` (read `kích cỡ`/`vị trí`, fall back to legacy `kích_cỡ`/`vị_trí` so V1/pilot content still renders).
- `scripts/check-thinking-games-candidates-v2.mjs` — new audit rules. Running it rewrites the usual audit JSONs under `plans/.../content-candidate-audits/`.
- `content/thinking-games/candidates/365-v2/**` — regenerated.
- `tests/unit/thinking-games/round2-content-fixes.test.ts` — new (15 tests).

## A. Answer position bias — fixed
- Reproduced: correct index constant for g02-t1 (all 0), g02-t2 (0), g03-t3 (0), g05-t1 (1, because options were `sort`ed `[answer-1, answer, answer+1…]`), g07-t2 (2 = "ahead").
- Root cause: correct option always built first / numerically adjacent; no shuffle.
- Fix: `shuffledOptions()` (seeded Fisher–Yates, separate RNG salt so no other generated value shifts); solution still the option id (`shape-a`, `turn-a`) / text; explanation letter ("Hình C") computed from the shuffled index. g05-t1: consecutive numbers, correct one at a seeded slot (still ascending). g07-t2: see B.
- Audit: new `answer_position_bias` **error** (per gameType, ≥20 items, any slot >60%), exported `positionBiasErrors`/`correctOptionIndex`; wired into per-batch, `--all` and `auditItems`.
- Distribution (correct option index → count, all 4 tracks of the manifest, 120-124 items per type):

| type | before | after |
|---|---|---|
| g02-t1 | 0:124 | 0:38 1:22 2:40 3:20 4:4 |
| g02-t2 | 0:120 | 0:42 1:25 2:28 3:21 4:4 |
| g03-t3 | 0:120 | 0:33 1:30 2:22 3:17 4:10 5:8 |
| g05-t1 | 0:2 1:122 | 0:36 1:40 2:37 3:11 |
| g07-t2 | 2:120 | 0:25 1:30 2:37 3:28 |
Other types (g01-t1/t3, g04-*, g05-t2, g06-t3, g08-t3) unchanged and all < 60% (largest g01-t3 slot 0 = 55/120 = 46%).

## B. g07-t2 — fixed
- Reproduced: explanation = "đồ vật nằm ở " + `DIRECTION_VI` ("ở ngay phía trước") → "ở ở"; target was always one step in the facing direction → always `ahead`.
- Fix: explanation uses `DIRECTION_SHORT_VI` ("phía trước / phía sau / bên trái / bên phải"); target direction is seeded over ahead/right/behind/left (viewer stays off the border so the object is always 1 cell away). Result: left 25, ahead 37, right 30, behind 28 (of 120).
- English: `FlexibilityPerspectiveGame.tsx` already maps `ahead/behind/left/right` to Vietnamese labels ("Phía trước", "Bên tay trái"…); no renderer change. Scan of all child text: 0 English tokens, 0 "ở ở". New audit rule `copy_duplicate_word` (ở/và/là/của/các/một/những/thì/để/với/trong/cho/nên doubled).

## C. Underscore tokens — fixed (124 items)
- Reproduced: `kích_cỡ`, `vị_trí`, `trọng_lượng` were trait keys in boardData and rendered raw by FlexibilityClassify/ObservationTwoTraits/ReasoningElimination/MissingInfo/ObservationImplausible (`{trait}: …`).
- Fix: keys renamed to natural Vietnamese in the generator (`kích cỡ`, `vị trí`, `trọng lượng`), so every display path (hints, explanation, boards, renderers) shows natural text. Renderers that index the keys fall back to the legacy names, so frozen V1/pilot content is untouched and still renders.
- Audit: `copy_underscore_token` error (`/[\p{L}\p{N}]_[\p{L}\p{N}]/u`) on title/invitation/tutorial/explanation/hints. Scan: 0 hits in 2920 items.

## D. g01-t1 and g06-t1 — fixed
- g01-t1: reproduced on interleaved numeric items (e.g. 1,2,3,3,5,4: odd +2, even +1) — explanation said "mỗi nhịp tăng thêm N" with only the next track's step. Now: "các số ở vị trí 1, 3, 5... tăng thêm A, các số ở vị trí 2, 4, 6... tăng thêm B. Vị trí tiếp theo thuộc nhịp lẻ/chẵn, nên lấy số cùng nhịp liền trước cộng X, ra Y." (steps from the actual sequence). Test checks both steps against the sequence.
- g06-t1: reproduced — `getTutorialMode` returned `default` for both 0- and 1-waypoint boards, and the `default`/`shortest` copy spoke of "điểm mốc"; ordered copy spoke of "chìa khóa/cánh cửa" that the board never shows (only ⭐); 28 reach/shortest items had waypoint tutorials, shortest-mode copy said "đi qua các điểm mốc nếu có". Fix: modes `reach` (no waypoint), `waypoint` (⭐), `ordered` (⭐ numbered 1, 2 — renderer now draws the number), `shortest` (explicit "đường ít bước nhất, đi vòng thừa là chưa đúng", no "hợp lệ"). Invitation no longer promises a waypoint. Explanations/hints are built from the board (ordered vs waypoint vs shortest vs reach). Test: for each variant × track, tutorial mentions ⭐ iff the board has waypoints, never "điểm mốc/chìa/cánh cửa", shortest never says "hợp lệ".
- Left: CSV titles (e.g. variant name "lấy chìa trước khi tới cửa") are variant ids, not displayed; titles of items contain none of chìa/cửa (0 hits).

## E. Other agreed fixes
- Applied: rewrote all 9-12 generic and mode tutorials (≈75 strings) into plain language ("Xem mỗi phần thay đổi thế nào so với phần ngay trước nó…"), kept "ít nhất" wording the mode tests require. Scan of 9-12 tutorials for academic markers (tiêu chuẩn, tâm lý, hệ quy chiếu, tọa độ, thuộc tính, trạng thái, tiền đề, tối ưu, phân tích, tập hợp, logic, hệ thống, đối tượng) → 0.
- Left (not cheap/safe in this lane): hint 1/2 identical between 6-8 and 9-12 (110 items); title pattern "Chủ đề · Tên trò"; difficulty gap 6-8 vs 9-12 (board sizes/steps); ≥10 invitations per gameType; duplicate_fingerprint / normalized_skin_duplicate review warnings (unchanged, warnings only); remaining ~40 mild 9-12 abstractions Sonnet mentioned beyond the list above; 6-8 g03-t2 4x4 board parity. These need content design or schema/CSV changes outside my write scope.

## Verification
- `node scripts/check-thinking-games-candidates-v2.mjs --all` and `--batch=1..5`: exit 0, errorCount 0 (status pass_with_review_warnings; `releaseRejection` still expected: not release selectable).
- `npx vitest run tests/unit/thinking-games/ tests/unit/thinking-games-adversarial.test.ts --testTimeout=30000`: 20 files / 162 tests pass (includes the 15 new tests).
- `npm run test:unit`: 240 files / 2868 tests pass. `npx tsc --noEmit`: clean. `npm run lint`: clean.
- Reproducibility: generator run twice → identical sha256 for all 7 files in `content/.../365-v2`.
- Note: I ran `git stash` by mistake once and popped it back immediately (no changes lost); worth a `git status` sanity check.

## Sample items (child-facing text)
### D002-main-vi68 (g02-t1, age_6_8)
- Tiêu đề: Hạt giống · Ghép bóng
- Lời mời: Thử thách ghép bóng hôm nay đòi hỏi bạn phải quan sát từng ô nhỏ đấy nhé.
- Hướng dẫn: So từng ô của bóng với hình mẫu để tìm chiếc bóng khớp nhất.
- Gợi ý: Bạn hãy đếm số lượng ô và nhìn kỹ các góc nhọn của hình mẫu nhé. / Loại dần những hình có số lượng ô hoặc cấu trúc không trùng khớp với hình mẫu.
- Giải thích: Hình có đúng số ô và hình dạng khớp hoàn toàn với bóng mẫu là Hình C.
- Đáp án: "shape-a" ; options: ["shape-d","shape-b","shape-a","shape-c"]

### D007-bonus-vi912 (g02-t2, age_9_12)
- Tiêu đề: Hạt giống · Xoay hình
- Lời mời: Cùng mình tưởng tượng hình mẫu khi xoay sang hướng mới sẽ ra hình nào nhé!
- Hướng dẫn: Tưởng tượng từng ô của hình mẫu chạy sang chỗ mới khi cả hình xoay.
- Gợi ý: Bạn hãy chọn một góc nổi bật của hình mẫu làm điểm mốc để theo dõi khi xoay nhé. / Chú ý chiều xoay và góc quay để không bị nhầm với trường hợp lật đối xứng.
- Giải thích: Khi xoay hình mẫu đúng góc quay, ta được kết quả là Hình C.
- Đáp án: "turn-a" ; options: ["turn-d","turn-b","turn-a","turn-c"]

### D011-main-vi68 (g03-t3, age_6_8)
- Tiêu đề: Vườn hoa · Nhận ra thay đổi
- Lời mời: Chào bạn, hãy nhìn thật kỹ hai cảnh và chỉ ra điểm thay đổi cùng mình nhé!
- Hướng dẫn: Nhìn thật kỹ xem bạn nào vừa đổi chỗ, đổi màu hoặc biến mất nha.
- Gợi ý: Bạn hãy đối chiếu từng vị trí giữa cảnh trước và cảnh sau theo thứ tự nhé. / Quan sát xem có bạn nào đổi màu sắc, đổi vị trí hay vừa xuất hiện thêm không.
- Giải thích: Ở cảnh sau, quả đã biến mất khỏi khung hình.
- Đáp án: "quả" ; options: ["quả","lá","nắng","sao"]

### D002-bonus-vi912 (g05-t1, age_9_12)
- Tiêu đề: Hạt giống · Cân bằng hai bên
- Lời mời: Cùng mình làm cho chiếc cân trở nên thăng bằng thật đẹp mắt nào bạn!
- Hướng dẫn: So tổng số cân của hai đĩa để tìm số cân còn thiếu.
- Gợi ý: Bạn hãy tính tổng số cân ở đĩa cân đã biết đủ các quả nhé. / Lấy tổng số cân đó trừ đi phần đã có ở bên đĩa còn lại để tìm số cân còn thiếu.
- Giải thích: Cần thêm 9 để hai bên đĩa cân có cân nặng bằng nhau.
- Đáp án: 9 ; options: [9,10,11,12]

### D007-main-vi68 (g07-t2, age_6_8)
- Tiêu đề: Hạt giống · Đổi góc nhìn
- Lời mời: Chào bạn, cùng mình khám phá hướng nhìn mới trong câu đố ngày hôm nay nhé!
- Hướng dẫn: Nhìn theo hướng mắt của bạn nhỏ để xem đồ vật ở trước, sau, trái hay phải.
- Gợi ý: Bạn hãy tưởng tượng mình đang đứng ở vị trí bạn nhỏ và nhìn theo hướng mũi tên nhé. / Xác định xem đồ vật nằm ở phía trước mặt, sau lưng hay bên tay trái, tay phải của bạn nhỏ.
- Giải thích: Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở phía trước.
- Đáp án: "ahead" ; options: ["left","right","ahead","behind"]

### D007-main-vi912 (g07-t2, age_9_12)
- Tiêu đề: Hạt giống · Đổi góc nhìn
- Lời mời: Chào bạn, cùng mình khám phá hướng nhìn mới trong câu đố ngày hôm nay nhé!
- Hướng dẫn: Xem đồ vật nằm ở đâu so với bạn nhỏ, không phải so với màn hình của bạn.
- Gợi ý: Bạn hãy tưởng tượng mình đang đứng ở vị trí bạn nhỏ và nhìn theo hướng mũi tên nhé. / Xác định xem đồ vật nằm ở phía trước mặt, sau lưng hay bên tay trái, tay phải của bạn nhỏ.
- Giải thích: Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở bên phải.
- Đáp án: "right" ; options: ["left","right","ahead","behind"]

### D001-bonus-vi912 (g04-t1, age_9_12)
- Tiêu đề: Hạt giống · Loại trừ theo manh mối
- Lời mời: Chào bạn, hãy dùng các manh mối để tìm ra bạn nhỏ bí ẩn cùng mình nhé!
- Hướng dẫn: Dùng cùng lúc tất cả manh mối để tìm ra lựa chọn đúng duy nhất.
- Gợi ý: Bạn hãy đọc từng manh mối và tìm dấu hiệu chắc chắn nhất trước nhé. / Gạch bớt những bạn có đặc điểm không khớp với manh mối đã cho.
- Giải thích: Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số 1 (màu hồng, hình vuông, kích cỡ to).
- Đáp án: "candidate-1" ; options: ["candidate-4","candidate-5","candidate-2","candidate-1","candidate-3"]

### D049-main-vi912 (g01-t1, age_9_12)
- Tiêu đề: Kệ sách · Điền phần tiếp theo
- Lời mời: Bạn hãy quan sát thật tinh mắt để đoán xem số hoặc hình nào sẽ xuất hiện tiếp theo.
- Hướng dẫn: Tìm xem dãy tăng thêm bao nhiêu hoặc lặp lại theo nhịp nào, rồi chọn phần tiếp theo.
- Gợi ý: Bạn thử nhìn các số cách nhau một vị trí xem có bước tăng nào quen thuộc không nhé. / Ở đây có hai nhịp số cùng tăng đều đan xen; bạn tìm số tiếp theo của nhịp đang tới nhé.
- Giải thích: Hai nhịp số đan xen: các số ở vị trí 1, 3, 5... tăng thêm 2, các số ở vị trí 2, 4, 6... tăng thêm 1. Vị trí tiếp theo thuộc nhịp lẻ, nên lấy số cùng nhịp liền trước cộng 2, ra 7.
- Đáp án: "7" ; options: ["8","6","7","9"]

### D051-bonus-vi68 (g06-t1, age_6_8)
- Tiêu đề: Căn phòng mới · Tìm đường
- Lời mời: Cùng mình lên kế hoạch cho từng bước chân để đến đích một cách khéo léo nào!
- Hướng dẫn: Nhớ ghé qua ngôi sao số 1 trước khi tới ngôi sao số 2 rồi mới về đích nha.
- Gợi ý: Bạn nhìn xem trên bảng có hai ngôi sao đánh số 1 và 2, cần ghé theo đúng số thứ tự nhé. / Hãy tìm đường ghé ngôi sao số 1 trước, rồi ngôi sao số 2, sau đó mới về đích nhé.
- Giải thích: Đường đi đúng ghé ngôi sao số 1 trước, rồi ngôi sao số 2, sau đó mới về đích mà không chạm tường.
- Đáp án: [{"x":0,"y":0},{"x":1,"y":0},{"x":1,"y":1},{"x":2,"y":1},{"x":3,"y":1},{"x":3,"y":2},{"x":3,"y":3},{"x":4,"y":3},{"x":4,"y":4}] ; options: []

### D075-bonus-vi912 (g06-t1, age_9_12)
- Tiêu đề: Dòng suối · Tìm đường
- Lời mời: Chào bạn, hãy cầm bút vẽ đường đi thông minh nhất để về đích cùng mình nhé!
- Hướng dẫn: Chọn đường ít bước nhất, đi vòng thừa là chưa đúng nhé.
- Gợi ý: Bạn đếm số bước của từng ngả đường để so sánh nhé. / Đường ngắn nhất không đi vòng qua những ô thừa, mỗi bước đều tiến gần đích hơn.
- Giải thích: Đường ngắn nhất đưa bạn nhỏ về đích cần đúng 12 bước di chuyển an toàn.
- Đáp án: [{"x":0,"y":0},{"x":1,"y":0},{"x":2,"y":0},{"x":2,"y":1},{"x":3,"y":1},{"x":4,"y":1},{"x":5,"y":1},{"x":5,"y":2},{"x":5,"y":3},{"x":5,"y":4},{"x":6,"y":4},{"x":6,"y":5},{"x":6,"y":6}] ; options: []
