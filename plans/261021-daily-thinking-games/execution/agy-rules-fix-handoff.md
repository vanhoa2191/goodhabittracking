# Báo cáo xử lý lệch luật chơi (Rules vs Checker Remediation) — Daily Thinking Games

- **Task**: `task_d1dcee130ddc`
- **Dispatch**: `ctx_6fa165ff764b`
- **Worker**: `agy` (dispatched worker)
- **Ngày thực hiện**: 2026-10-22
- **Tài liệu căn cứ**: `plans/261021-daily-thinking-games/execution/content-review/SUMMARY.md` (nhóm E, F, G, H, J) và `xc-correctness-opencode.{json,md}`.

---

## 1. Tóm tắt kết quả

| Nhóm | GameType | Vấn đề đã nêu | Tái hiện? | Số item | Hướng xử lý | Trạng thái |
|---|---|---|:---:|:---:|---|:---:|
| **E** | `g03-t1` | `MemorySequenceGame`: bắt chọn đủ `sequence.length` ô trong khi checker chỉ nhận 1 token (`missing`) hoặc 2 token (`swapped`) → không thể nộp | **Đã tái hiện 100%** | 30 | Sửa renderer hỗ trợ số slot động (`missing` → 1, `swapped` → 2, `recall` → n); cập nhật prompt rõ ràng | ✅ Đã sửa & test |
| **F** | `g03-t2` | `MemoryPositionGame`: `mode === 'missing'` hiển thị tổng mục tiêu thay vì số ô còn thiếu; ô đã reveal bị disable khiến bộ đếm không bao giờ đủ | **Đã tái hiện 100%** | 28 | Sửa renderer dùng `requiredCount = targets.length - revealed.length`; cập nhật prompt và đánh dấu ô đã lộ | ✅ Đã sửa & test |
| **G** | `g05-t3` | `QuantityTargetGame`: các ràng buộc ngầm (`fewest`, `exact-two`, `maxItems`) bị checker từ chối dù tổng đúng target; UI báo "Đủ mục tiêu" gây hiểu nhầm | **Đã tái hiện 100%** | 16 | Thêm badge điều kiện, giới hạn số món chọn theo mode, dùng `quantityTargetSatisfies` hiển thị trạng thái chuẩn xác | ✅ Đã sửa & test |
| **H** | `g05-t1` | `QuantityBalanceGame`: `mode === 'replace'` checker đòi quả cân thay thế `replaceId` nhưng UI không hiển thị quả nào bị thay | **Đã tái hiện 100%** | 16 | Sửa renderer đánh dấu rõ quả cân `replaceId` ("Cần thay"), cập nhật prompt và tính tổng hiệu dụng khi chọn | ✅ Đã sửa & test |
| **J** | `g06-t1` | `PathPlanningGame`: `shortestPathOnly === true` checker từ chối đường đi hợp lệ dài hơn đường ngắn nhất; đề bài/UI không nêu | **Đã tái hiện 100%** | 14 | Sửa renderer hiển thị badge "Đường ngắn nhất (hiện tại: N bước)", prompt yêu cầu rõ "ngắn nhất / ít bước nhất" theo đúng tên biến thể `g06-t1:đường ngắn nhất` | ✅ Đã sửa & test |

Tổng số item được khắc phục trực tiếp trên giao diện và nội dung: **104 item**.

---

## 2. Chi tiết từng nhóm

### Nhóm E — `g03-t1` Nhớ thứ tự (Memory Sequence)
- **Tái hiện**:
  - Script tái hiện trực tiếp trên engine: `item.boardData.mode = "missing"`, `solution = ["cây"]` (1 phần tử), trong khi `MemorySequenceGame.tsx` yêu cầu `userSequence.length === board.sequence.length` (4-5 phần tử) trước khi `handleSubmit` hoạt động. Mọi lần nộp trước đây đều bị chặn hoặc bị chấm sai.
- **Nguyên nhân gốc**:
  - Component `MemorySequenceGame` giả định mọi chế độ chơi đều yêu cầu tái tạo toàn bộ chuỗi ban đầu.
- **Giải pháp**:
  - Thêm helper `memorySequenceAnswerLength(board)` và `memorySequenceSlots(board)` trong `src/lib/thinking-games/mechanics/memory-sequence.ts`.
  - Trong `MemorySequenceGame.tsx`:
    - Tính `requiredLength = memorySequenceAnswerLength(board)` và `slots = memorySequenceSlots(board)`.
    - Render đúng số slot cần điền tương ứng với vị trí mục tiêu (`missingIndex + 1` hoặc `swappedIndices`).
    - Nút kiểm tra đáp án kích hoạt khi `userSequence.length === requiredLength`.
    - Cập nhật prompt: "Chọn từ còn thiếu ở vị trí X trong dãy:" / "Chọn 2 từ ở vị trí X và Y bị đổi thứ tự:".
- **Số item trong scope**: 30 item (`missing`: 16 item, `swapped`: 14 item).

### Nhóm F — `g03-t2` Nhớ vị trí (Memory Position)
- **Tái hiện**:
  - `D056-bonus-vi68` có 3 targets, 2 revealed, solution chỉ gồm 1 ô `{ x: 2, y: 0 }`.
  - UI hiển thị `Đã chọn: x / 3 vị trí`. Các ô revealed bị disable trên lưới. Trẻ chỉ có thể chọn tối đa 1 ô nhưng UI lại hiển thị 1/3, gây hiểu lầm là chưa chọn đủ.
- **Nguyên nhân gốc**:
  - Renderer đếm mẫu số theo `board.targets.length` thay vì trừ đi các vị trí đã reveal.
- **Giải pháp**:
  - Thêm helper `memoryPositionRequiredCount(board)` trong `src/lib/thinking-games/mechanics/remaining.ts`.
  - Trong `MemoryPositionGame.tsx`:
    - Dùng `requiredCount = memoryPositionRequiredCount(board)` làm mẫu số cho bộ đếm.
    - Đổi prompt: "Chọn vị trí ngôi sao còn thiếu (ô đã hiện không cần bấm lại):".
    - Các ô `isRevealed` được style rõ ràng (màu hổ phách, icon sao đã biết) để trẻ nhận biết ô đã định vị sẵn.
    - Nút nộp bài kích hoạt khi `selectedPoints.length === requiredCount`.
- **Số item trong scope**: 28 item.

### Nhóm G — `g05-t3` Đủ mục tiêu (Quantity Target)
- **Tái hiện**:
  - `D010-bonus-vi912`: `target = 9`, `mode = 'fewest'`. Trẻ chọn `['item-1', 'item-2']` (6 + 3 = 9): renderer hiển thị `9 / 9 ✅ (Đủ mục tiêu)`, nhưng checker chấm SAI vì `['item-3']` (9) có độ dài 1 ít hơn.
  - `D034-bonus-vi912`: `target = 10`, `mode = 'exact-two'`. Chọn 3 món có tổng 10: bị checker từ chối vì không đúng 2 món.
- **Nguyên nhân gốc**:
  - Tutorial và renderer chỉ nhắc "tổng giá trị đạt mục tiêu", không thể hiện luật của biến thể (`fewest`, `exact-two`, `maxItems`).
- **Giải pháp**:
  - Thêm hàm `quantityTargetSatisfies(board, answer)` trong `src/lib/thinking-games/mechanics/remaining.ts`.
  - Trong `QuantityTargetGame.tsx`:
    - Hiển thị badge điều kiện cụ thể: `Ít món nhất`, `Đúng 2 món`, `Tối đa N món`.
    - Đổi prompt câu hỏi sát từng mode (ví dụ: "Chọn đúng 2 món đồ sao cho tổng giá trị bằng mục tiêu:").
    - Giới hạn thao tác chọn (`maxSelectable` khóa không cho chọn quá 2 món trong `exact-two` hoặc quá `maxItems`).
    - Dùng `quantityTargetSatisfies` để hiển thị trạng thái chính xác: chỉ hiện `✅ (Thỏa mãn yêu cầu)` khi thỏa mãn cả tổng lẫn ràng buộc mode; cảnh báo rõ ràng khi tổng đủ nhưng chưa đạt tiêu chí (ví dụ: `⚠️ (Chưa phải ít món nhất)`).
- **Số item trong scope**: 16 item.

### Nhóm H — `g05-t1` Cân hai đĩa (Quantity Balance)
- **Tái hiện**:
  - `D026-bonus-vi68`: `mode = 'replace'`, `replaceId = 'left-1'`. Đĩa trái có 2 quả (1, 1), đĩa phải có quả 7. UI không có ô `?` và không chỉ ra quả nào bị thay. Trẻ nhìn vào tưởng thêm quả 5 vào đĩa trái, nhưng solution là 6 (thay quả 1 bằng quả 6 để được 6 + 1 = 7).
- **Nguyên nhân gốc**:
  - Renderer `QuantityBalanceGame` chỉ hỗ trợ `unknownSide`, bỏ qua trường hợp `mode === 'replace'` với `replaceId`.
- **Giải pháp**:
  - Thêm helper `quantityBalanceReplaceTarget(board)` trong `src/lib/thinking-games/mechanics/remaining.ts`.
  - Trong `QuantityBalanceGame.tsx`:
    - Xác định đĩa và quả cân mang `replaceId`.
    - Đánh dấu nổi bật quả cân cần thay với nhãn "Cần thay" và viền đứt nét.
    - Khi chọn một quả cân từ khay, hiển thị trực quan giá trị mới thay thế quả cũ và cập nhật tổng hiệu dụng của đĩa cân.
    - Cập nhật prompt: "Tìm quả cân thay thế quả được đánh dấu để hai đĩa cân thăng bằng:".
    - Cập nhật explanation trong generator: nêu rõ vị trí đĩa và quả cân được thay.
- **Số item trong scope**: 16 item.

### Nhóm J — `g06-t1` Vẽ đường (Path Planning)
- **Tái hiện**:
  - `D075-bonus-vi68`: `shortestPathOnly = true`. Solution dài 9 ô (8 bước). Nếu trẻ đi một đường vòng hợp lệ tránh vật cản dài 10 ô, checker trả về sai.
- **Nguyên nhân gốc**:
  - Tên biến thể là `g06-t1:đường ngắn nhất` nhưng tutorial và renderer chỉ viết chung chung "Tìm đường từ điểm xuất phát đến đích", không nêu rõ tiêu chí tối ưu số bước.
- **Giải pháp**:
  - Giữ nguyên quy tắc sư phạm của biến thể "đường ngắn nhất", làm rõ luật chơi minh bạch cho trẻ:
    - Trong `PathPlanningGame.tsx`: khi `shortestPathOnly === true`, cập nhật prompt thành "Tìm đường ngắn nhất (ít bước nhất) từ điểm xuất phát 🏠 đến đích 🎯".
    - Hiển thị badge: `⚡ Đường ngắn nhất (hiện tại: N bước)`.
    - Cập nhật tutorial cho variant `shortest`: "Tìm đường ngắn nhất từ ô bắt đầu đến ô đích, tránh các bức tường nhé." / "Lập kế hoạch đường đi ngắn nhất từ điểm xuất phát đến đích, tránh vật cản."
- **Số item trong scope**: 14 item.

---

## 3. Đồng bộ Catalog V2

- Do cập nhật nội dung giải thích, tutorial cho các biến thể và logic helper trong engine, toàn bộ **2.920 puzzle** trong `content/thinking-games/candidates/365-v2/` đã được sinh lại một cách tất định (deterministic) thông qua:
  ```bash
  node scripts/generate-thinking-games-candidates-v2.mjs
  ```
- Kết quả sinh:
  - 5 batch (224, 504, 728, 728, 736 items), đủ 4 age tracks, khớp 100% CSV mapping.
  - Cập nhật `engineHash` và `engineVersion` nhất quán trên toàn bộ 2.920 item và file `candidate-meta-v2.json`.

---

## 4. Kiểm thử & Xác minh (Verification Results)

1. **Candidate Verification (`scripts/check-thinking-games-candidates-v2.mjs --all`)**:
   - `ok: true`, `errorCount: 0`, `errors: []`, `status: pass_with_review_warnings`.
   - 0 lỗi schema, 0 lỗi known answer, 0 lỗi solver, 0 rò rỉ đáp án/JSON/từ tiếng Anh.
2. **Vitest Thinking-Games Test Suite (`tests/unit/thinking-games/` + adversarial)**:
   - `19 passed (19 files)`, `147 passed (147 tests)`.
   - Bao gồm toàn bộ negative control, provenance integrity, và bộ test hồi quy mới `rules-mismatch-remediation.test.ts` (13 tests).
3. **Toàn bộ Unit Tests (`npm run test:unit`)**:
   - `239 passed (239 files)`, `2853 passed (2853 tests)`.
4. **Kiểm tra kiểu (`npx tsc --noEmit`)**:
   - Exit code 0, không có lỗi TypeScript.
5. **Lint (`npm run lint`)**:
   - Exit code 0, `--max-warnings=0`.

---

## 5. Danh sách tệp sửa đổi

- `src/components/thinking-games/MemorySequenceGame.tsx`
- `src/components/thinking-games/MemoryPositionGame.tsx`
- `src/components/thinking-games/QuantityBalanceGame.tsx`
- `src/components/thinking-games/QuantityTargetGame.tsx`
- `src/components/thinking-games/PathPlanningGame.tsx`
- `src/lib/thinking-games/content/copy.ts`
- `src/lib/thinking-games/mechanics/memory-sequence.ts`
- `src/lib/thinking-games/mechanics/remaining.ts`
- `scripts/generate-thinking-games-candidates-v2.mjs`
- `content/thinking-games/candidates/365-v2/batch-01-days-001-028.json`
- `content/thinking-games/candidates/365-v2/batch-02-days-029-091.json`
- `content/thinking-games/candidates/365-v2/batch-03-days-092-182.json`
- `content/thinking-games/candidates/365-v2/batch-04-days-183-273.json`
- `content/thinking-games/candidates/365-v2/batch-05-days-274-365.json`
- `content/thinking-games/candidates/365-v2/candidate-manifest-v2.json`
- `content/thinking-games/candidates/365-v2/candidate-meta-v2.json`
- `plans/261021-daily-thinking-games/execution/content-candidate-audits/p08-365-v2-catalog.json`
- `tests/unit/thinking-games/rules-mismatch-remediation.test.ts`
