# Báo Cáo Thẩm Định Biên Tập Độc Lập (Cross-Cutting Review): Tiếng Việt & Độ Tuổi (Vietnamese Copy & Age Fit)

- **Người thẩm định (Reviewer)**: AGY (Independent Cross-Cutting Reviewer)
- **Chiều đánh giá (Dimension)**: VIETNAMESE COPY and AGE FIT (Ngôn ngữ tiếng Việt, văn phong "mình - bạn", độ khó nhận thức theo lứa tuổi 6–8 và 9–12)
- **Thời điểm hoàn thành**: 2026-10-22 13:27:53
- **Phạm vi thẩm định**: Toàn bộ 365 ngày (Batches 01–05: `batch-01-days-001-028.json` đến `batch-05-days-274-365.json`)
- **Tập item thẩm định**: Chỉ các item thuộc track `age_6_8` và `age_9_12` (Đúng 1.460 items = 365 ngày × 2 slots/ngày × 2 độ tuổi)
- **Phương pháp**:
  - **1.460 / 1.460 items** được trích xuất thành bảng cơ sở dữ liệu thu gọn (`all_1460_compact.tsv`), chạy kiểm tra tự động toàn diện bằng mã nguồn kiểm thử độc lập (`extract_items.py`, `check_english.py`, `check_explanations.py`, `check_age_progression.py`, `check_voice.py`, `find_monotonous.py`).
  - **1.460 / 1.460 items** được rà soát trực tiếp theo nhóm cơ chế trò chơi (24 game types), kiểm tra đối chiếu mẫu ngữ liệu đại diện trên toàn bộ 5 batch và 365 ngày.
- **Tập tin dữ liệu chi tiết kèm theo**: `plans/261021-daily-thinking-games/execution/content-review/xc-copy-agy.json`

---

## 1. Kết Luận Chung & Phán Quyết Biên Tập (Verdict)

> [!CAUTION]
> **PHÁN QUYẾT: KHÔNG PHÊ DUYỆT (REWORK REQUIRED - YÊU CẦU LÀM LẠI TOÀN BỘ LỚP TEXT NỘI DUNG)**
> 
> Tập nội dung ứng viên **365-v2** hiện tại **CHƯA ĐỦ ĐIỀU KIỆN ĐỂ PHÊ DUYỆT XUẤT BẢN CHO TRẺ EM**. Mặc dù logic game đã được cải thiện so với v1, lớp văn bản giao diện (title, invitation, tutorial, hints, explanation) vẫn mang tính chất sinh mã tự động (template-driven) thô sơ, vi phạm nghiêm trọng trải nghiệm người dùng và nguyên tắc sản phẩm cho trẻ em Việt Nam.

### Bảng Thống Kê Vi Phạm Tổng Quát:
| Mức độ nghiêm trọng (Severity) | Số lượng vi phạm | Tỷ lệ / Ý nghĩa |
| :--- | :--- | :--- |
| 🔴 **BLOCK** (Ngăn chặn xuất bản) | **144** | Vi phạm hợp đồng ngôn ngữ: sót tiếng Anh (`ahead`), rò rỉ mã JSON thô (`{"x":...}`), gợi ý 1 làm lộ quy luật giải. |
| 🟡 **FIX** (Bắt buộc phải sửa) | **741** | Lộ mã định danh kỹ thuật (`candidate-1`, `shape-a`, `item-X`, `step-X`), từ Hán-Việt học thuật quá khó cho lứa 6–8 tuổi. |
| 🟢 **NIT** (Gợi ý hoàn thiện) | **14** | Độ khó nhóm 9–12 chưa vượt trội nhóm 6–8 ở một số ngày của game nhớ vị trí. |
| **TỔNG CỘNG CỜ CẢNH BÁO (FLAGS)** | **899** | **899 vi phạm trên 1.460 items** |

---

## 2. Đánh Giá Chi Tiết 8 Chiều Biên Tập (The 8 Review Dimensions)

### 2.1. Lỗi chính tả & Thiếu dấu tiếng Việt (Misspelling & Missing Diacritics)
- **Kết quả rà soát**: Không phát hiện lỗi gõ sai chính tả thô hoặc mất dấu tiếng Việt ở các từ thông dụng. Bộ gõ Unicode tiếng Việt chuẩn được bảo toàn trên các trường tiêu đề và lời mời.
- **Vấn đề phát hiện**: Xuất hiện hiện tượng nối từ gạch ngang nhân tạo như `cá-xanh`, `mèo-xanh`, `hoa-xanh`, `nắng-xanh`, `quả-xanh`, `sao-xanh` ở game `g03-t3` (60 items) thay vì cụm từ tiếng Việt tự nhiên (`con cá màu xanh`, `bông hoa xanh`). Đã gắn cờ `FIX` và đề xuất chuẩn hóa.

### 2.2. Văn phong máy móc, thiếu tự nhiên (Unnatural or Machine-like Phrasing)
- **Nhân hóa sai đối tượng ("các bạn")**: Ở các game phân loại, loại trừ (`g04-t1`, `g04-t3`, `g07-t1`, `g08-t2`), câu giải thích dùng từ "các bạn" để chỉ các hình học tĩnh (ví dụ: *"chỉ giữ các bạn khớp tiêu chí đó"*, *"mình loại từng bạn không khớp manh mối"*, *"kiểm tra cả hai dấu hiệu cho từng bạn"*). Trẻ em Việt Nam không gọi các hình tam giác, hình vuông, hình thoi là "bạn". Cần sửa thành *"các hình"*, *"các đồ vật"*.
- **Văn bản sinh theo khuôn mẫu cứng (Template-driven)**: Toàn bộ 24 loại game chỉ dùng duy nhất đúng một câu tutorial và một cấu trúc câu explanation cố định, chỉ ghép nối đáp án vào đuôi.

### 2.3. Tính nhất quán trong đại từ xưng hô "Mình – Bạn" (Voice Consistency)
- **Kết quả**: Hệ thống tuân thủ tốt nguyên tắc đại từ `mình – bạn`. Không xuất hiện đại từ cấm như `tôi`, `tao`, `tui`, `cậu`, `mày`, `người chơi`. Không có ngôn ngữ phán xét tiêu cực, trừng phạt (`thua cuộc`, `sai rồi`, `kém cỏi`, `phạt`).
- **Tồn tại**: Do lạm dụng cấu trúc máy móc, đại từ `mình - bạn` trở nên vô cảm, lặp lại máy móc 1.460 lần câu *"Bạn cùng thử nhé?"* thay vì tạo ra cảm giác một người bạn đồng hành ấm áp, sinh động.

### 2.4. Độ dài câu & Từ vựng quá khó với lứa tuổi 6–8 (Age 6–8 Fit & Vocabulary)
- **Từ ngữ học thuật / Hán-Việt trừu tượng**:
  - `tiêu chí` (xuất hiện 62 lần, trong đó 31 lần ở lứa tuổi 6–8): Trẻ 6 tuổi vừa vào lớp 1 chưa hiểu khái niệm "tiêu chí" (criteria). Cần thay bằng *"cách chia"*, *"đặc điểm"*.
  - `dữ kiện` (xuất hiện 60 lần, 30 lần ở lứa 6–8): Thuật ngữ toán cấp 2-3. Cần thay bằng *"gợi ý"*, *"manh mối"*.
  - `tổng khối lượng` (31 lần ở lứa 6–8 game `g05-t1`): Khái niệm vật lý vượt tầm nhận thức lớp 1-2. Cần thay bằng *"nặng bằng nhau"*, *"cân bằng hai bên"*.
  - `tương ứng` (31 lần ở lứa 6–8 game `g04-t2`): Cần thay bằng *"phù hợp"*.
- **Độ dài câu**: Các bài tìm đường (`g06-t1`, `g07-t3`) xả một chuỗi tọa độ dài 22–28 từ trong một câu giải thích duy nhất (ví dụ: `(0,0) → (1,0) → (2,0) → ...`), làm mất ý nghĩa giáo dục của lời giải thích.

### 2.5. Gợi ý làm lộ đáp án ở Gợi ý 1 (Hints Revealing Answers in Hint 1)
- **8 items của biến thể `g01-t1:xen kẽ hai chuỗi`**: Hint 1 viết thẳng: *"Tách các số ở vị trí chẵn và vị trí lẻ thành hai chuỗi."* -> Lộ toàn bộ bí mật quy luật của bài toán giải đố, tước đi cơ hội phát hiện của trẻ (Mức độ: **BLOCK**).
- **16 items của biến thể `g06-t1:lấy chìa trước khi tới cửa`**: Hint 1 viết: *"Đi qua chìa trước, rồi mới tìm cửa."* và Hint 2 viết: *"Không được ghé cửa trước khi lấy chìa."* -> Hint 1 chỉ thẳng thứ tự giải, còn Hint 2 là câu nói ngược vô nghĩa của Hint 1 (Mức độ: **BLOCK**).
- **87,3% gợi ý trong toàn bộ sản phẩm (1.274/1.460 items)** chỉ là 3 cặp câu gợi ý chung chung copy-paste, hoàn toàn vô dụng cho việc trợ giúp tư duy của trẻ.

### 2.6. Lời giải thích không khớp với phương án hoặc gây khó hiểu (Explanation vs Solution)
- **Xuất mã JSON thô vào giải thích (`g02-t3` - 60 items)**: Lời giải thích cho trẻ ghi: `Đáp án là {"x":1,"y":2}.`. Trẻ em không thể hiểu cấu trúc dữ liệu JSON lập trình (Mức độ: **BLOCK**).
- **Xuất tọa độ thô (`g08-t1`, `g03-t2`, `g07-t3`)**: Thay vì giải thích bằng ngôn ngữ trực quan (ví dụ: *"ngôi sao ở góc trên bên phải"*), máy xuất thẳng `(0,1) (1,2)`.

### 2.7. Độ khó nhóm 9–12 không cao hơn nhóm 6–8 (Age Progression Flaws)
- **Game nhớ vị trí (`g03-t2`)**: Ở 14 ngày (`D056`, `D067`, `D080`, `D091`, `D152`, `D163`, `D176`, `D187`, `D248`, `D259`, `D272`, `D283`, `D344`, `D355`), cả bài dành cho lứa 6–8 và 9–12 đều chỉ yêu cầu nhớ duy nhất **1 vị trí bị ẩn** trên lưới 4x4. Không có sự gia tăng độ khó nhận thức phù hợp với trẻ 9–12 tuổi.
- **Xu hướng thiên kiến đáp án (Option Bias)**: Ở các game `g02-t1`, `g02-t2`, `g04-t1`, `g04-t3`, `g07-t2`, đáp án đúng **100% LUÔN LUÔN LÀ PHƯƠNG ÁN ĐẦU TIÊN** (`shape-a`, `turn-a`, `candidate-1`, `fact-a`, `ahead`). Trẻ 9–12 tuổi rất nhanh trí, sẽ nhận ra ngay mẹo chỉ cần bấm phương án đầu tiên là qua bài mà không cần suy nghĩ.

### 2.8. Sót tiếng Anh & Rò rỉ mã định danh kỹ thuật (English Leftovers & Raw ID Leaks)
- 🔴 **Từ tiếng Anh thuần túy**: Ở game `g07-t2` (60 items), câu giải thích ghi: `Đáp án là ahead.` -> Vi phạm hợp đồng giao diện tiếng Việt thuần túy.
- 🟡 **Rò rỉ mã định danh kỹ thuật (606 items)**: Lời giải thích trẻ em chứa đầy các mã biến nội bộ của developer:
  - `candidate-1` (62 items)
  - `shape-a` (62 items)
  - `turn-a` (60 items)
  - `fact-a` (60 items)
  - `fix-a`, `fix-b` (60 items)
  - `item-1`, `item-2`, `item-5` (182 items)
  - `step-1`, `step-2`, `step-3`, `step-4` (60 items)
  - `scene-2`, `scene-3` (60 items)

---

## 3. Bảng Xếp Hạng 20 Mẫu Câu Lặp Lại Gây Nhàm Chán Nhất (Top 20 Monotonous Phrasings)

| Hạng | Tần suất | Câu văn trích dẫn từ dữ liệu | Vị trí | Nhận xét & Vấn đề biên tập |
| :---: | :---: | :--- | :---: | :--- |
| **1** | **1.460x** | `Bạn cùng thử nhé?` | `invitation` | Xuất hiện ở 100% số bài trong năm. Cực kỳ rập khuôn, gây nhàm chán. |
| **2** | **788x** | `Bạn thử so sánh từng lựa chọn với dấu hiệu chính trong hình.` | `hints[0]` | Chiếm hơn 54% tổng số câu đố; gợi ý sáo rỗng, không giúp ích cụ thể. |
| **3** | **788x** | `Mình gợi ý: loại dần những lựa chọn chưa khớp thay vì đoán ngay.` | `hints[1]` | Câu khẩu hiệu máy móc lặp lại gần 800 lần. |
| **4** | **244x** | `Bạn thử tính chậm từng bước và kiểm tra lại bằng cách làm ngược.` | `hints[0]` | Gợi ý tính toán rập khuôn cho toàn bộ các bài toán chia/cân bằng. |
| **5** | **244x** | `Mình gợi ý: che bớt một phần để thấy phần còn thiếu rõ hơn.` | `hints[1]` | Trẻ dùng điện thoại/tablet không thể "che bớt một phần" trên màn hình. |
| **6** | **242x** | `Bạn thử đọc to từng phần theo đúng thứ tự.` | `hints[0]` | Rập khuôn cho toàn bộ các bài trí nhớ chuỗi và dãy hình. |
| **7** | **242x** | `Mình gợi ý: tìm phần đã chắc chắn trước, rồi mới xếp phần còn lại.` | `hints[1]` | Lời khuyên chung chung, thiếu sự gợi mở trực quan. |
| **8** | **62x** | `Mình có thử thách điền phần tiếp theo. Bạn cùng thử nhé?` | `invitation` | Lời mời cơ học 100% các bài dãy quy luật g01-t1. |
| **9** | **62x** | `Nhìn kỹ nhịp lặp hoặc bước tăng, rồi chọn phần tiếp theo.` | `tutorial` | Hướng dẫn chơi cứng nhắc, văn phong dịch máy. |
| **10** | **62x** | `Mình có thử thách loại trừ theo manh mối. Bạn cùng thử nhé?` | `invitation` | Rập khuôn 62 lần ở g04-t1. |
| **11** | **62x** | `Bạn đọc các manh mối và chọn bạn còn lại sau khi loại trừ.` | `tutorial` | Dùng từ "chọn bạn còn lại" cho các hình vẽ tĩnh. |
| **12** | **62x** | `Mình loại từng bạn không khớp manh mối, còn lại một bạn. Đáp án là candidate-1.` | `explanation` | Câu giải thích máy móc + lộ raw ID kỹ thuật. |
| **13** | **62x** | `Mình có thử thách ghép bóng. Bạn cùng thử nhé?` | `invitation` | Lời mời rập khuôn 62 lần ở g02-t1. |
| **14** | **62x** | `Bạn chọn bóng có đúng các ô như hình mẫu.` | `tutorial` | Văn phong nghèo nàn, lặp lại toàn bộ các bài ghép bóng. |
| **15** | **62x** | `Mình so từng ô của bóng với hình mẫu, không chỉ nhìn đường viền. Đáp án là shape-a.` | `explanation` | Giải thích rập khuôn 62 lần + lộ raw ID "shape-a". |
| **16** | **62x** | `Mình có thử thách cân bằng hai bên. Bạn cùng thử nhé?` | `invitation` | Lời mời rập khuôn 62 lần ở g05-t1. |
| **17** | **62x** | `Bạn tính để hai bên có cùng tổng khối lượng.` | `tutorial` | Dùng thuật ngữ "tổng khối lượng" quá nặng cho trẻ 6-8 tuổi. |
| **18** | **62x** | `Mình cộng hai bên rồi tìm phần còn thiếu để cân bằng.` | `explanation` | Giải thích không đưa ra con số tính toán thực tế của bài. |
| **19** | **62x** | `Bạn quên cách chia cũ và làm theo tiêu chí mới.` | `tutorial` | Dùng từ "tiêu chí" trừu tượng lặp lại 62 lần ở g07-t1. |
| **20** | **60x** | `Mình đứng vào vị trí người xem rồi xác định phía của vật. Đáp án là ahead.` | `explanation` | Giải thích rập khuôn 60 lần + từ tiếng Anh "ahead". |

---

## 4. Khuyến Nghị Hành Động Dành Cho Chủ Sản Phẩm (Recommendations)

1. **Rework ngay bộ sinh lời giải thích (Explanation Generator)**:
   - Thay thế việc chèn mã ID (`candidate-1`, `shape-a`, `item-X`, `step-X`, `turn-a`, `fix-a`, `scene-X`) bằng việc tra cứu ngược vào thuộc tính hiển thị tiếng Việt của phương án trong `boardData`.
   - Với `ahead`, bắt buộc dịch thành *"ở ngay phía trước"*.
   - Với `g02-t3`, chuyển tọa độ `{"x":1,"y":2}` thành mô tả vị trí tự nhiên: *"ô ở hàng 3, cột 2"*.
   - Với `g06-t2`, nối các nhãn hành động tiếng Việt (`Lấy bát → Xới cơm → Múc canh → Mời cả nhà`) thay vì in chuỗi `step-1, step-2...`.

2. **Soạn thảo ngân hàng lời mời & gợi ý phong phú (Copy Bank)**:
   - Xóa bỏ việc gắn cứng chuỗi gợi ý tĩnh cho hàng trăm bài.
   - Xây dựng ngân hàng ít nhất 20–30 biến thể lời mời tự nhiên, sinh động phù hợp với tâm lý trẻ nhỏ.

3. **Điều chỉnh từ vựng theo khung lứa tuổi**:
   - Đối với lứa tuổi 6–8 (lớp 1–2): Thay thế toàn bộ các từ Hán-Việt trừu tượng (`tiêu chí` → `cách chia`, `dữ kiện` → `gợi ý`, `tổng khối lượng` → `nặng bằng nhau`, `tương ứng` → `phù hợp`).

4. **Khắc phục lỗi thiên kiến phương án (Option Bias) & Tăng độ khó lứa 9–12**:
   - Xáo trộn ngẫu nhiên vị trí của đáp án đúng (`shuffle options`) trong dữ liệu sinh ra thay vì luôn đặt ở vị trí A.
   - Nâng cấp độ khó nhận thức của nhóm 9–12 ở game nhớ vị trí (`g03-t2`) lên 2–3 ô nhớ hoặc mở rộng lưới 5x5.

---

*Báo cáo được khởi tạo tự động và lưu trữ tại `plans/261021-daily-thinking-games/execution/content-review/xc-copy-agy.md` đi kèm tệp dữ liệu chi tiết `xc-copy-agy.json`.*
