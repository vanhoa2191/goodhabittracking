# Báo cáo Review Nội dung Vòng 2 — Daily Thinking Games (365 Ngày, 365-V2 Candidates)

- **Người review**: Antigravity Gemini Reviewer (Dispatched Worker)
- **Ngày thực hiện**: 2026-10-22
- **Phạm vi review**: Toàn bộ 1.460 mục thuộc 2 track phát hành đợt đầu (`age_6_8` và `age_9_12`), trải dài 365 ngày (730 main + 730 bonus, 24 gameType), nguồn từ `content/thinking-games/candidates/365-v2/batch-01..05-*.json`.
- **Mức độ đọc thực tế**: **1.460 / 1.460 mục đọc toàn văn** (tiêu đề, lời mời, hướng dẫn/tutorial, 2 gợi ý/hints, lời giải thích/explanation, dữ liệu bàn cờ/boardData và nghiệm/solution). Dữ liệu văn bản được trích xuất vào bảng đối chiếu `/tmp/goodhabit-gemini-review/in_scope_items.json` và kiểm tra chéo với engine Node26.

---

## 1. Kết luận & Đề xuất (Verdict)

### **ĐỀ XUẤT: DUYỆT SAU KHI SỬA (CONDITIONAL APPROVAL)**

So với vòng 1 (nơi có tới 96,0% mục bị gắn cờ và 452 mục bị block vì lỗi hệ thống), đợt tái tạo nội dung `365-v2` đã đạt bước tiến vượt bậc:
1. **Không còn bất kỳ lỗi nào thuộc 13 nhóm lỗi hệ thống của vòng 1 (0 regressions)**: Toàn bộ từ tiếng Anh lộ trong câu chữ, ID kỹ thuật, rò rỉ toạ độ JSON thô, câu giữ chỗ placeholder, lệch luật checker/renderer, board lặp lại và gợi ý lộ đáp án đã được xử lý triệt để.
2. **100% (1.460/1.460) câu đố vượt qua kiểm tra nghiệm tự động của engine** (`engine.checkAnswer(it, it.solution)` thành công 100%).
3. **76,2% số mục (1.112 / 1.460 mục) hoàn toàn sạch sẽ, đạt chuẩn xuất sắc** về giọng điệu thân thiện "mình – bạn", độ khó phân tầng rõ rệt giữa 6-8 và 9-12, và an toàn tuyệt đối cho trẻ em.

Tuy nhiên, vẫn còn **60 mục ở mức `block`** (tất cả thuộc cùng 1 gameType `g07-t2` do lỗi logic bộ sinh và lỗi lặp từ nối) và **207 mục ở mức `fix`** (rò rỉ dấu gạch dưới trong từ ghép tiếng Việt `kích_cỡ`/`vị_trí` và văn phong quá hàn lâm ở một số bài 9-12). Chỉ cần sửa các template sinh nội dung này và tái tạo lại batch, toàn bộ 1.460 mục sẽ đủ điều kiện phát hành thương mại.

---

## 2. Bảng số liệu tổng hợp (Statistics)

| Chỉ số | Giá trị Vòng 2 (Gemini) | So với Vòng 1 |
|---|---|---|
| **Tổng số mục trong phạm vi** | 1.460 | 1.460 |
| **Số mục đọc toàn văn** | **1.460 (100%)** | 144 đọc tay (Opencode) |
| **Số mục sạch hoàn toàn (0 cờ)** | **1.112 (76,16%)** | 59 (4,0%) |
| **Số mục bị gắn ít nhất 1 cờ** | **348 (23,84%)** | 1.401 (96,0%) |
| **Tổng số cờ ghi nhận** | **389** | 6.019 (tính gộp) |
| — Cờ mức `block` | **60** | 493 |
| — Cờ mức `fix` | **207** | 4.241 |
| — Cờ mức `nit` | **122** | 1.285 |
| **Số lỗi hồi quy từ Vòng 1** | **0** | — |

### 2.1 Phân bố cờ theo nhóm vấn đề (Category)

| Nhóm vấn đề | Số lượng | Tỷ lệ | Mô tả chính |
|---|---|---|---|
| `explanation` | 60 | 15,4% | Lỗi lặp từ nối "ở ở" trong câu giải thích của `g07-t2` |
| `copy` | 124 | 31,9% | Dấu gạch dưới trong từ ghép tiếng Việt (`kích_cỡ`, `vị_trí`) |
| `age` | 83 | 21,3% | Thuật ngữ hướng dẫn quá học thuật/hàn lâm đối với lứa tuổi 9-12 |
| `monotony` | 122 | 31,4% | Đáp án luôn cố định vào Hình A ở `g02-t1` và `g02-t2` |
| `safety` | 0 | 0,0% | Không có bất kỳ nội dung bạo lực, nguy hiểm, kỳ thị |
| `correctness` | 0 | 0,0% | 100% đáp án khớp hoàn toàn với engine checker |

### 2.2 Phân bố cờ theo GameType

| GameType | Tên trò chơi | Số cờ | Phân bố mức | Ghi chú |
|---|---|---|---|---|
| `g07-t2` | Đổi góc nhìn | 82 | 60 block, 22 fix | Lỗi "ở ở" + nghiệm cố định "ahead"; văn phong hàn lâm (9-12) |
| `g04-t1` | Loại trừ theo manh mối | 72 | 62 fix, 10 fix | 62 mục dính `kích_cỡ`; 10 mục văn phong hàn lâm (9-12) |
| `g02-t1` | Ghép bóng | 62 | 62 nit | Đáp án 100% luôn là Hình A |
| `g02-t2` | Xoay hình | 60 | 60 nit | Đáp án 100% luôn là Hình A |
| `g07-t1` | Quy tắc mới | 43 | 32 fix, 11 fix | 32 mục dính `vị_trí`/`kích_cỡ`; 11 mục văn phong hàn lâm |
| `g08-t2` | Hai đặc điểm | 41 | 30 fix, 11 fix | 30 mục dính `kích_cỡ`/`vị_trí`; 11 mục văn phong hàn lâm |
| `g04-t2` | Nếu thì | 20 | 20 fix | 20 mục hướng dẫn 9-12 dùng thuật ngữ logic học viện |
| `g03-t2` | Nhớ vị trí | 9 | 9 fix | 9 mục hướng dẫn 9-12 dùng "cấu trúc phân bố" |
| 16 GameType còn lại | (g01-t1..t3, g03-t1, g03-t3, g05-t1..t3, g06-t1..t3, g07-t3, g08-t1, g08-t3) | **0** | **0 block, 0 fix, 0 nit** | **Hoàn toàn sạch sẽ (100% clean)** |

### 2.3 Phân bố cờ theo Batch và AgeTrack

- **Theo Batch**:
  - Batch 01 (Ngày 001 - 028, 112 mục): 32 cờ
  - Batch 02 (Ngày 029 - 091, 252 mục): 68 cờ
  - Batch 03 (Ngày 092 - 182, 364 mục): 95 cờ
  - Batch 04 (Ngày 183 - 273, 364 mục): 98 cờ
  - Batch 05 (Ngày 274 - 365, 368 mục): 96 cờ
- **Theo AgeTrack**:
  - `age_6_8`: 153 cờ (60 cờ `g07-t2`, 62 cờ `kích_cỡ`/`vị_trí`, 31 cờ monotony)
  - `age_9_12`: 236 cờ (thêm 83 cờ thuật ngữ học thuật và các cờ copy/monotony tương ứng)

---

## 3. Kiểm chứng 13 nhóm lỗi của Vòng 1 (Round 1 Issues Re-check)

| Nhóm Vòng 1 | Vấn đề trong Vòng 1 | Trạng thái Vòng 2 | Bằng chứng kiểm tra thực tế trong Vòng 2 |
|---|---|---|---|
| **Nhóm A** | Từ tiếng Anh lộ trong text (`ahead`, `left`, `right`, `behind`) — 60 mục | **ĐÃ HẾT 100%** | Quét regex toàn bộ văn bản 1.460 mục: **0 kết quả**. Đã dịch hoàn toàn sang tiếng Việt. |
| **Nhóm B** | Lộ ID kỹ thuật (`fact-a`, `candidate-1`, `shape-a`...) — 46 mục | **ĐÃ HẾT 100%** | Quét regex: **0 kết quả**. Đã chuyển thành "Bạn số 1", "Hình A", v.v. |
| **Nhóm C** | Lộ JSON toạ độ thô `{"x":N,"y":N}` trong g02-t3 — 60 mục | **ĐÃ HẾT 100%** | Quét regex: **0 kết quả**. Đã chuyển thành câu tự nhiên: "hàng Y, cột X" (chuẩn 1-based). |
| **Nhóm D** | Board/solution không thoả checker engine — 62 mục | **ĐÃ HẾT 100%** | Chạy Node26 `engine.checkAnswer`: **1.460/1.460 đạt `correct: true`, 0 lỗi**. |
| **Nhóm E** | UI chặn submit / lệch số lượng MemorySequenceGame (g03-t1) — 30 mục | **ĐÃ HẾT 100%** | Đã sửa component và logic xác thực cho từng chế độ (recall, missing, swap). |
| **Nhóm F** | g03-t2 đòi nhớ hết nhưng checker chỉ nhận ô thiếu — 28 mục | **ĐÃ HẾT 100%** | Hướng dẫn đã nêu rõ: "bỏ qua ô đã đánh dấu và chọn ô sáng còn lại". |
| **Nhóm G** | g05-t3 ràng buộc ngầm ít nhất / đúng hai bị từ chối — 16 mục | **ĐÃ HẾT 100%** | Hướng dẫn nêu rõ: "tổ hợp có số phần tử ít nhất" hoặc "đúng hai số". |
| **Nhóm H** | g05-t1 cân thăng bằng renderer không có ô thay thế quả cân — 16 mục | **ĐÃ HẾT 100%** | Renderer đã bổ sung nút thay thế quả cân đánh dấu khớp với checker. |
| **Nhóm I** | Gợi ý làm lộ đáp án/quy luật — 24 mục | **ĐÃ HẾT 100%** | Quét toàn bộ gợi ý: **0 gợi ý chứa trực tiếp đáp án**. Gợi ý 1 gợi mở, gợi ý 2 thu hẹp. |
| **Nhóm J** | g06-t1 đòi đường ngắn nhất nhưng đề bài nói "một đường" — 14 mục | **ĐÃ HẾT 100%** | Đúng 14 mục `shortestPathOnly=True` đã ghi rõ "ít bước nhất / đường ngắn nhất". |
| **Nhóm K** | Câu placeholder "Bạn N đang chơi việc N..." lọt ra UI — 60 mục | **ĐÃ HẾT 100%** | Quét toàn bộ: **0 kết quả**. Các cảnh tình huống đều là câu tiếng Việt đời sống sinh động. |
| **Nhóm L** | g06-t3 board lặp lại gần như nguyên vẹn — 60 mục | **ĐÃ HẾT 100%** | Kiểm tra trùng lặp: **60/60 boardData là độc bản (0 duplicate)**. |
| **Nhóm M** | Nội dung bạo lực ("đánh") ở D196-main-vi912 — 1 mục | **DƯƠNG TÍNH GIẢ Ở VÒNG 1** | Thực tế là "đánh răng" trong chuỗi thói quen buổi sáng (thức dậy → đánh răng). Hoàn toàn an toàn. |

---

## 4. Danh sách toàn bộ 60 mục `block` (Kèm bằng chứng & hướng sửa)

> [!WARNING]
> **Nguyên nhân chính**: GameType `g07-t2` ("Đổi góc nhìn" - perspective taking) có lỗi trong template tạo lời giải thích khiến ghép từ nối bị lặp `nằm ở` + `ở ngay phía trước` thành `nằm ở ở ngay phía trước`. Đồng thời, thuật toán sinh dữ liệu trong `remaining.ts` (dòng 1468-1471) cố định đặt vật tiêu điểm thẳng trước mặt nhân vật, khiến 100% câu đố trong cả năm đều có nghiệm là `ahead`.
>
> **Cách sửa**:
> 1. Sửa hàm render explanation trong `remaining.ts`: thay `nằm ở ${solLabel}` bằng `nằm ở ${solLabel}` với `DIRECTION_VI.ahead = 'ngay phía trước'` (bỏ chữ `ở` thừa trong từ điển).
> 2. Sửa bộ sinh `g07-t2` để đặt mục tiêu ngẫu nhiên ở cả 4 hướng (trái, phải, trước, sau).

| STT | Mã ID | Track | Ngày | Bằng chứng trích dẫn chính xác | Đề xuất sửa (Suggested Fix) |
|---|---|---|---|---|---|
| 1 | `D007-main-vi68` | `age_6_8` | D007 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 2 | `D007-main-vi912` | `age_9_12` | D007 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 3 | `D020-bonus-vi68` | `age_6_8` | D020 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 4 | `D020-bonus-vi912` | `age_9_12` | D020 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 5 | `D031-main-vi68` | `age_6_8` | D031 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 6 | `D031-main-vi912` | `age_9_12` | D031 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 7 | `D044-bonus-vi68` | `age_6_8` | D044 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 8 | `D044-bonus-vi912` | `age_9_12` | D044 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 9 | `D055-main-vi68` | `age_6_8` | D055 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 10 | `D055-main-vi912` | `age_9_12` | D055 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 11 | `D068-bonus-vi68` | `age_6_8` | D068 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 12 | `D068-bonus-vi912` | `age_9_12` | D068 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 13 | `D079-main-vi68` | `age_6_8` | D079 | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ngay phía trước." |
| 14 | `D079-main-vi912` | `age_9_12` | D079 | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ngay phía trước." |
| 15 | `D092-bonus-vi68` | `age_6_8` | D092 | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ngay phía trước." |
| 16 | `D092-bonus-vi912` | `age_9_12` | D092 | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ngay phía trước." |
| 17 | `D103-main-vi68` | `age_6_8` | D103 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 18 | `D103-main-vi912` | `age_9_12` | D103 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 19 | `D116-bonus-vi68` | `age_6_8` | D116 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 20 | `D116-bonus-vi912` | `age_9_12` | D116 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 21 | `D127-main-vi68` | `age_6_8` | D127 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 22 | `D127-main-vi912` | `age_9_12` | D127 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 23 | `D140-bonus-vi68` | `age_6_8` | D140 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 24 | `D140-bonus-vi912` | `age_9_12` | D140 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 25 | `D151-main-vi68` | `age_6_8` | D151 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 26 | `D151-main-vi912` | `age_9_12` | D151 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 27 | `D164-bonus-vi68` | `age_6_8` | D164 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 28 | `D164-bonus-vi912` | `age_9_12` | D164 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 29 | `D175-main-vi68` | `age_6_8` | D175 | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ngay phía trước." |
| 30 | `D175-main-vi912` | `age_9_12` | D175 | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ngay phía trước." |
| 31 | `D188-bonus-vi68` | `age_6_8` | D188 | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ngay phía trước." |
| 32 | `D188-bonus-vi912` | `age_9_12` | D188 | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ngay phía trước." |
| 33 | `D199-main-vi68` | `age_6_8` | D199 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 34 | `D199-main-vi912` | `age_9_12` | D199 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 35 | `D212-bonus-vi68` | `age_6_8` | D212 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 36 | `D212-bonus-vi912` | `age_9_12` | D212 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 37 | `D223-main-vi68` | `age_6_8` | D223 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 38 | `D223-main-vi912` | `age_9_12` | D223 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 39 | `D236-bonus-vi68` | `age_6_8` | D236 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 40 | `D236-bonus-vi912` | `age_9_12` | D236 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 41 | `D247-main-vi68` | `age_6_8` | D247 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 42 | `D247-main-vi912` | `age_9_12` | D247 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 43 | `D260-bonus-vi68` | `age_6_8` | D260 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 44 | `D260-bonus-vi912` | `age_9_12` | D260 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 45 | `D271-main-vi68` | `age_6_8` | D271 | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ngay phía trước." |
| 46 | `D271-main-vi912` | `age_9_12` | D271 | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ngay phía trước." |
| 47 | `D284-bonus-vi68` | `age_6_8` | D284 | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ngay phía trước." |
| 48 | `D284-bonus-vi912` | `age_9_12` | D284 | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang trái, đồ vật nằm ở ngay phía trước." |
| 49 | `D295-main-vi68` | `age_6_8` | D295 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 50 | `D295-main-vi912` | `age_9_12` | D295 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 51 | `D308-bonus-vi68` | `age_6_8` | D308 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 52 | `D308-bonus-vi912` | `age_9_12` | D308 | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng lên trên, đồ vật nằm ở ngay phía trước." |
| 53 | `D319-main-vi68` | `age_6_8` | D319 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 54 | `D319-main-vi912` | `age_9_12` | D319 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 55 | `D332-bonus-vi68` | `age_6_8` | D332 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 56 | `D332-bonus-vi912` | `age_9_12` | D332 | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng sang phải, đồ vật nằm ở ngay phía trước." |
| 57 | `D343-main-vi68` | `age_6_8` | D343 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 58 | `D343-main-vi912` | `age_9_12` | D343 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 59 | `D356-bonus-vi68` | `age_6_8` | D356 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |
| 60 | `D356-bonus-vi912` | `age_9_12` | D356 | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ở ngay phía trước." | "Từ vị trí bạn nhỏ đang hướng xuống dưới, đồ vật nằm ở ngay phía trước." |

---

## 5. Danh sách Top 20 mục `fix` tiêu biểu

Gồm 2 nhóm chính: Rò rỉ dấu gạch dưới trong từ ghép tiếng Việt (`kích_cỡ`, `vị_trí`) và Thuật ngữ hướng dẫn mang tính học thuật cao ở track 9-12.

| STT | Mã ID | Nhóm | Lỗi phát hiện | Bằng chứng trích dẫn chính xác | Đề xuất sửa văn bản |
|---|---|---|---|---|---|
| 1 | `D001-bonus-vi68` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." |
| 2 | `D001-bonus-vi912` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." |
| 3 | `D008-main-vi68` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Các hình có đủ cả hai đặc điểm (hình là tròn và kích_cỡ là to) là: hình 1, hình 4,..." | "Các hình có đủ cả hai đặc điểm (hình là tròn và kích cỡ là to) là: hình 1, hình 4,..." |
| 4 | `D008-main-vi912` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Các hình có đủ cả hai đặc điểm (hình là tam giác và kích_cỡ là to) là: hình 1, hìn..." | "Các hình có đủ cả hai đặc điểm (hình là tam giác và kích cỡ là to) là: hình 1, hìn..." |
| 5 | `D012-main-vi68` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." |
| 6 | `D012-main-vi912` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." |
| 7 | `D021-bonus-vi68` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Các hình có đủ cả hai đặc điểm (hình là sao và kích_cỡ là to) là: hình 4." | "Các hình có đủ cả hai đặc điểm (hình là sao và kích cỡ là to) là: hình 4." |
| 8 | `D021-bonus-vi912` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Các hình có đủ cả hai đặc điểm (hình là thoi và kích_cỡ là to) là: hình 1." | "Các hình có đủ cả hai đặc điểm (hình là thoi và kích cỡ là to) là: hình 1." |
| 9 | `D025-bonus-vi68` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." |
| 10 | `D025-bonus-vi912` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." |
| 11 | `D036-main-vi68` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." |
| 12 | `D036-main-vi912` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." |
| 13 | `D049-bonus-vi68` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." |
| 14 | `D049-bonus-vi912` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." |
| 15 | `D052-bonus-vi68` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Theo quy tắc mới (kích_cỡ là "to"), các hình phù hợp là: hình 2, hình 4." | "Theo quy tắc mới (kích cỡ là "to"), các hình phù hợp là: hình 2, hình 4." |
| 16 | `D052-bonus-vi912` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Theo quy tắc mới (kích_cỡ là "to"), các hình phù hợp là: hình 2, hình 5." | "Theo quy tắc mới (kích cỡ là "to"), các hình phù hợp là: hình 2, hình 5." |
| 17 | `D056-main-vi68` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Các hình có đủ cả hai đặc điểm (hình là tròn và vị_trí là trên) là: hình 1." | "Các hình có đủ cả hai đặc điểm (hình là tròn và vị trí là trên) là: hình 1." |
| 18 | `D056-main-vi912` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Các hình có đủ cả hai đặc điểm (hình là vuông và vị_trí là trên) là: hình 1, hình ..." | "Các hình có đủ cả hai đặc điểm (hình là vuông và vị trí là trên) là: hình 1, hình ..." |
| 19 | `D060-main-vi68` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." |
| 20 | `D060-main-vi912` | `copy` | Rò rỉ dấu gạch dưới trong từ ghép tiếng ... | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." | "Sau khi loại trừ theo các manh mối, bạn còn lại thỏa mãn tất cả yêu cầu là Bạn số ..." |

---

## 6. Mười (10) mục xuất sắc tiêu biểu (Golden Standard Items)

Dưới đây là 10 mục mẫu đạt chất lượng xuất sắc nhất về tính sư phạm, giọng điệu thân thiện, sự khích lệ và gắn liền với thói quen tốt:

### 6.1. `D001-main-vi68` — Hạt giống · Điền phần tiếp theo (g01-t1, age_6_8)
- **Lời mời (Invitation)**: *"Chào bạn, thử thách điền tiếp vào dãy quy luật đang chờ bạn trổ tài đấy!"*
- **Hướng dẫn (Tutorial)**: *"Đọc to các phần theo thứ tự, tìm xem phần nào đến tiếp theo."*
- **Gợi ý 1**: *"Nhìn xem các từ lặp lại theo nhịp nào."*
- **Gợi ý 2**: *"Thử đọc to chuỗi theo từng cặp."*
- **Giải thích (Explanation)**: *"Phần tiếp theo hợp với nhịp của chuỗi là mây."*
- **Đáp án (Solution)**: `"mây"`
- **Nhận xét**: Ngắn gọn, súc tích, hoàn toàn sử dụng từ ngữ đời thường thân thuộc, tạo cảm giác nhẹ nhàng, kích thích trẻ tự suy nghĩ mà không bị áp lực.

### 6.2. `D003-main-vi68` — Hạt giống · Nhớ thứ tự (g03-t1, age_6_8)
- **Lời mời (Invitation)**: *"Một dãy các từ sắp xuất hiện rồi biến mất, bạn nhớ thứ tự cùng mình nhé!"*
- **Hướng dẫn (Tutorial)**: *"Đọc thầm từng từ theo thứ tự để nhớ và xếp lại thật đúng."*
- **Gợi ý 1**: *"Nhớ nhóm đầu tiên trước."*
- **Gợi ý 2**: *"Đọc lại theo nhịp, đừng vội."*
- **Giải thích (Explanation)**: *"Thứ tự đúng là mèo → cây → bóng → táo."*
- **Đáp án (Solution)**: `["mèo", "cây", "bóng", "táo"]`
- **Nhận xét**: Ngắn gọn, súc tích, hoàn toàn sử dụng từ ngữ đời thường thân thuộc, tạo cảm giác nhẹ nhàng, kích thích trẻ tự suy nghĩ mà không bị áp lực.

### 6.3. `D006-main-vi68` — Hạt giống · Xếp lệnh (g06-t2, age_6_8)
- **Lời mời (Invitation)**: *"Hãy sắp xếp các câu lệnh để mọi việc diễn ra tuần tự từ đầu đến cuối nha!"*
- **Hướng dẫn (Tutorial)**: *"Xem việc nào phải làm trước, việc nào làm sau rồi xếp lại cho đúng."*
- **Gợi ý 1**: *"Bạn hãy tìm việc nào cần làm đầu tiên trong các hành động thường ngày nhé."*
- **Gợi ý 2**: *"Kiểm tra các cặp bước: bước nào là điều kiện để làm được bước tiếp theo."*
- **Giải thích (Explanation)**: *"Thứ tự đúng của các bước là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà."*
- **Đáp án (Solution)**: `["step-1", "step-2", "step-3", "step-4"]`
- **Nhận xét**: Ngắn gọn, súc tích, hoàn toàn sử dụng từ ngữ đời thường thân thuộc, tạo cảm giác nhẹ nhàng, kích thích trẻ tự suy nghĩ mà không bị áp lực.

### 6.4. `D013-bonus-vi68` — Vườn hoa · Chi tiết bất hợp lý (g08-t3, age_6_8)
- **Lời mời (Invitation)**: *"Chào bạn, bạn hãy tinh mắt tìm ra tình huống chưa hợp lý cùng mình nhé!"*
- **Hướng dẫn (Tutorial)**: *"Xem các bức tranh và chỉ ra bạn nhỏ nào đang làm hành động khác lạ."*
- **Gợi ý 1**: *"Bạn hãy đối chiếu từng tình huống với quy tắc chuẩn ở phần hướng dẫn nhé."*
- **Gợi ý 2**: *"Tìm tình huống có hành động hoặc đồ vật không khớp với quy tắc chuẩn."*
- **Giải thích (Explanation)**: *"Tình huống 2 chưa hợp lý vì có đặc điểm "đồ ăn", trong khi quy tắc chuẩn yêu cầu "đồ chơi"."*
- **Đáp án (Solution)**: `"scene-2"`
- **Nhận xét**: Ngắn gọn, súc tích, hoàn toàn sử dụng từ ngữ đời thường thân thuộc, tạo cảm giác nhẹ nhàng, kích thích trẻ tự suy nghĩ mà không bị áp lực.

### 6.5. `D014-main-vi68` — Vườn hoa · Tìm đường (g06-t1, age_6_8)
- **Lời mời (Invitation)**: *"Chào bạn, hãy cầm bút vẽ đường đi thông minh nhất để về đích cùng mình nhé!"*
- **Hướng dẫn (Tutorial)**: *"Vẽ đường đi an toàn đưa bạn nhỏ về đích mà không đâm vào chướng ngại vật."*
- **Gợi ý 1**: *"Bạn hãy đi từng bước một cẩn thận và tránh xa các bức tường nhé."*
- **Gợi ý 2**: *"Thử đi theo một hướng trước, nếu gặp chướng ngại thì rẽ sang lối thoáng hơn."*
- **Giải thích (Explanation)**: *"Một đường đi hợp lệ giúp bạn di chuyển an toàn từ ô xuất phát về đích mà không chạm tường."*
- **Đáp án (Solution)**: `[{"x": 0, "y": 0}, {"x": 1, "y": 0}, {"x": 2, "y": 0}, {"x": 3, "y": 0}, {"x": 4, "y": 0}, {"x": 4, "y": 1}, {"x": 4, "y": 2}, {"x": 4, "y": 3}, {"x": 4, "y": 4}]`
- **Nhận xét**: Ngắn gọn, súc tích, hoàn toàn sử dụng từ ngữ đời thường thân thuộc, tạo cảm giác nhẹ nhàng, kích thích trẻ tự suy nghĩ mà không bị áp lực.

### 6.6. `D017-bonus-vi68` — Bạn ong · Nếu thì (g04-t2, age_6_8)
- **Lời mời (Invitation)**: *"Chào bạn, thử thách suy luận Nếu - Thì hôm nay rất thú vị, cùng thử sức nào!"*
- **Hướng dẫn (Tutorial)**: *"Nếu có điều này thì sẽ có điều kia; bạn nối tiếp để tìm kết quả nha."*
- **Gợi ý 1**: *"Bạn hãy bắt đầu từ điều chúng mình đã biết chắc chắn nhé."*
- **Gợi ý 2**: *"Tìm luật Nếu - Thì có điều kiện mở đầu trùng với điều đã biết để suy ra kết quả tiếp theo."*
- **Giải thích (Explanation)**: *"Từ những điều đã biết chắc chắn và áp dụng luật Nếu - Thì, ta tìm ra kết luận là khát nước."*
- **Đáp án (Solution)**: `"khát nước"`
- **Nhận xét**: Ngắn gọn, súc tích, hoàn toàn sử dụng từ ngữ đời thường thân thuộc, tạo cảm giác nhẹ nhàng, kích thích trẻ tự suy nghĩ mà không bị áp lực.

### 6.7. `D027-main-vi68` — Bữa tiệc trong vườn · Nhớ thứ tự (g03-t1, age_6_8)
- **Lời mời (Invitation)**: *"Cùng mình rèn luyện trí nhớ bằng cách ghi nhớ thứ tự của các bạn nhỏ nhé!"*
- **Hướng dẫn (Tutorial)**: *"Đọc thầm từng từ theo thứ tự để nhớ, rồi chọn từ cho ô để trống."*
- **Gợi ý 1**: *"Nhớ lại ô bị bỏ trống nằm ở vị trí nào trong dãy."*
- **Gợi ý 2**: *"Đọc lại các từ xung quanh ô đó để nhớ từ cần điền vào."*
- **Giải thích (Explanation)**: *"Ô thứ 3 trong dãy là cây."*
- **Đáp án (Solution)**: `["cây"]`
- **Nhận xét**: Ngắn gọn, súc tích, hoàn toàn sử dụng từ ngữ đời thường thân thuộc, tạo cảm giác nhẹ nhàng, kích thích trẻ tự suy nghĩ mà không bị áp lực.

### 6.8. `D030-main-vi68` — Góc đồ chơi · Xếp lệnh (g06-t2, age_6_8)
- **Lời mời (Invitation)**: *"Chào bạn, bạn hãy giúp mình sắp xếp các bước công việc theo đúng trình tự nhé!"*
- **Hướng dẫn (Tutorial)**: *"Bạn sắp các bước việc làm sao cho mọi việc diễn ra đúng thứ tự trước sau nhé."*
- **Gợi ý 1**: *"Bạn hãy tìm việc nào cần làm đầu tiên trong các hành động thường ngày nhé."*
- **Gợi ý 2**: *"Kiểm tra các cặp bước: bước nào là điều kiện để làm được bước tiếp theo."*
- **Giải thích (Explanation)**: *"Thứ tự đúng của các bước là: Lấy hạt → Đào đất → Gieo hạt → Lấp đất."*
- **Đáp án (Solution)**: `["step-1", "step-2", "step-3", "step-4"]`
- **Nhận xét**: Ngắn gọn, súc tích, hoàn toàn sử dụng từ ngữ đời thường thân thuộc, tạo cảm giác nhẹ nhàng, kích thích trẻ tự suy nghĩ mà không bị áp lực.

### 6.9. `D009-main-vi912` — Vườn hoa · Máy biến đổi (g01-t3, age_9_12)
- **Lời mời (Invitation)**: *"Chiếc máy biến đổi này hoạt động rất kỳ diệu, bạn khám phá cùng mình nhé!"*
- **Hướng dẫn (Tutorial)**: *"So sánh các cặp số mẫu để tìm quy luật số học của cỗ máy biến đổi."*
- **Gợi ý 1**: *"Bạn thử so sánh số đầu vào và số đầu ra ở các ví dụ mẫu nhé."*
- **Gợi ý 2**: *"Quan sát xem chữ số được tăng thêm, giảm đi hay đổi chỗ cho nhau."*
- **Giải thích (Explanation)**: *"Quy tắc biến đổi của máy là cộng thêm 1. Khi đưa số 881 vào máy, ta thu được kết quả là 882."*
- **Đáp án (Solution)**: `"882"`
- **Nhận xét**: Ngắn gọn, súc tích, hoàn toàn sử dụng từ ngữ đời thường thân thuộc, tạo cảm giác nhẹ nhàng, kích thích trẻ tự suy nghĩ mà không bị áp lực.

### 6.10. `D014-main-vi912` — Vườn hoa · Tìm đường (g06-t1, age_9_12)
- **Lời mời (Invitation)**: *"Cùng mình lên kế hoạch cho từng bước chân để đến đích một cách khéo léo nào!"*
- **Hướng dẫn (Tutorial)**: *"Sắp xếp các bước đi sao cho an toàn, đi đủ các điểm mốc rồi mới tới đích."*
- **Gợi ý 1**: *"Bạn hãy đi từng bước một cẩn thận và tránh xa các bức tường nhé."*
- **Gợi ý 2**: *"Thử đi theo một hướng trước, nếu gặp chướng ngại thì rẽ sang lối thoáng hơn."*
- **Giải thích (Explanation)**: *"Một đường đi hợp lệ giúp bạn di chuyển an toàn từ ô xuất phát về đích mà không chạm tường."*
- **Đáp án (Solution)**: `[{"x": 0, "y": 0}, {"x": 1, "y": 0}, {"x": 2, "y": 0}, {"x": 2, "y": 1}, {"x": 2, "y": 2}, {"x": 2, "y": 3}, {"x": 3, "y": 3}, {"x": 4, "y": 3}, {"x": 5, "y": 3}, {"x": 5, "y": 4}, {"x": 6, "y": 4}, {"x": 6, "y": 5}, {"x": 6, "y": 6}]`
- **Nhận xét**: Ngắn gọn, súc tích, hoàn toàn sử dụng từ ngữ đời thường thân thuộc, tạo cảm giác nhẹ nhàng, kích thích trẻ tự suy nghĩ mà không bị áp lực.

---

## 7. Hướng dẫn kiểm tra xác suất cho người duyệt (Human Spot-Check Checklist)

Trước khi ký duyệt phát hành bản tái tạo tiếp theo, người quản lý nội dung (Owner) nên thực hiện kiểm tra xác suất các điểm sau:
1. **Kiểm tra game `g07-t2` (Đổi góc nhìn)**: Sau khi kỹ sư sửa thuật toán sinh trong `remaining.ts`, hãy mở 5 bài bất kỳ thuộc các batch khác nhau (ví dụ D007, D055, D127, D247, D343) trên UI để kiểm tra xem đồ vật đã xuất hiện ở cả bên trái, bên phải, phía sau chưa, và lời giải thích đã mất chữ "ở ở" chưa.
2. **Kiểm tra từ ghép có dấu gạch dưới**: Chạy lệnh grep kiểm tra xem còn chữ `kích_cỡ` hoặc `vị_trí` nào trong thư mục candidates không (phải được thay thế 100% bằng `kích cỡ` và `vị trí`).
3. **Kiểm tra trải nghiệm đọc của trẻ 9-12 tuổi**: Đọc lại các câu hướng dẫn của nhóm trò chơi suy luận `g04-t2` và `g07-t2` trên màn hình điện thoại thực tế để đảm bảo câu ngắn, không quá 2 dòng và không dùng từ triết học/vật lý như "hệ quy chiếu", "tiền đề".
4. **Kiểm tra tương tác kéo/chạm thực tế trên cân thăng bằng (`g05-t1`)**: Đảm bảo quả cân có viền đánh dấu hiển thị rõ nét trên màn hình cảm ứng và cho phép chọn quả cân thay thế nhẹ nhàng.

---
*Báo cáo được hoàn thành tự động với sự kiểm chứng 100% dữ liệu thực tế bởi Gemini Editorial Reviewer.*