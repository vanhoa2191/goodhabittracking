# PR199 Vòng 3: Báo cáo Độc lập Đánh giá Khắc phục 105 Lỗi Gốc & Nội dung Cơ chế (Gemini Reviewer)

> **Tư cách báo cáo**: Đánh giá độc lập, chỉ đọc (read-only) bởi Gemini AI Reviewer trong hệ thống Orca.
> **Tuyên bố pháp lý & giới hạn**: Báo cáo này là kết quả rà soát AI thuần túy; **KHÔNG** đưa ra tuyên bố phê duyệt biên tập của con người (human editorial approval) và **KHÔNG** tuyên bố đã thử nghiệm với trẻ em trên thực tế (child-pilot claim). Báo cáo **KHÔNG** sửa đổi mã nguồn hay file catalog.

## 1. Thông tin rà soát & Bảng mã băm (Freshness & Input Hashes)

- **Task ID**: `task_93b259460f52` / **Dispatch ID**: `ctx_2b3840dfeb64`
- **Trạng thái**: `review_complete_all_105_fixed` (105/105 lỗi gốc đã được khắc phục hoàn toàn)
- **Thời điểm tạo**: `2026-10-23T01:30:00.000Z`
- **Mã băm chiếu gộp (Canonical Composite 105 Projection SHA-256)**: `bfa83f93eea3c7e371b98e102d4aaf6556918ca0289481d01c7e8abf0ceb23ba`
- **Quy cách mã hoá projection**: SHA256 of UTF-8 JSON.stringify([{id,invitation,tutorial,explanation,boardData,solution},...]) with items in canonical lexical inventory ID order

### Bảng SHA-256 tệp đầu vào

| Đường dẫn tệp | SHA-256 Checksum |
|---|---|
| `content/thinking-games/candidates/365-v2/batch-01-days-001-028.json` | `445fcac504000e900ae50d76f32d578115aa093fca86c04b0ed84a7cf0ab18eb` |
| `content/thinking-games/candidates/365-v2/batch-02-days-029-091.json` | `7ae659233845433705ebfee1a5dd4edae418d2e35391a9e1dc2c8942e7564a2d` |
| `content/thinking-games/candidates/365-v2/batch-03-days-092-182.json` | `a19183e272175171ce37fb9621c5c33e98ccb052a18288dd8fd61f096688edf3` |
| `content/thinking-games/candidates/365-v2/batch-04-days-183-273.json` | `ca0db01ddbd0cd13ab5ddd8f3b6d976437d0f451ca653c3c611a04ff59a81395` |
| `content/thinking-games/candidates/365-v2/batch-05-days-274-365.json` | `7e1161da56afe152afdd85cc4ff78a816dbeffb209d1e060e337cf6daefcc1c2` |
| `content/thinking-games/candidates/365-v2/candidate-manifest-v2.json` | `9f5df6ea97b9ac10bd493d84025e7cf3f825df03361708bd5544ab604271fd7c` |
| `content/thinking-games/candidates/365-v2/candidate-meta-v2.json` | `5d0f9b788ef147dac03f0f8c2da499cf981c438769b63e6e265ca392447594ae` |
| `src/lib/thinking-games/content/copy.ts` | `d3c7a6a28a9a558e1a9cb21c88e0d99058650f34e07306fa965596fe8d130143` |
| `src/lib/thinking-games/mechanics/remaining.ts` | `3291b6089672c556cab624c275e8e8a3c26cbed0a4b8d8acff0a63b1419ace94` |
| `plans/261021-daily-thinking-games/execution/content-review/codex-current-inventory.json` | `6b7bd1daca1be8e1480369eddaa4ed1241ce53f4961b44d250776ac8bf73cad1` |

## 2. Phạm vi & Phương pháp đọc thực tế (Scope & Read Coverage)

### 2.1 Phạm vi kiểm tra
- **Tổng số ứng viên trong kho**: 2.920 mục (5 batches 365-v2, 4 track tuổi).
- **Phạm vi phát hành đợt đầu**: 1.460 mục (365 ngày × 2 slot `main`/`bonus` × 2 track `age_6_8`/`age_9_12`).
- **105 mục lỗi gốc**: Rà soát 100% (105/105) mục từ tồn đọng vòng 2 (`codex-current-inventory.json`).
- **Mục cơ chế liên quan**: Rà soát toàn bộ 182 mục thuộc 3 nhóm trò chơi cơ chế (`g04-t2`: 62 mục, `g06-t2`: 60 mục, `g08-t3`: 60 mục) trong phạm vi 1.460 mục ban đầu.
- **Ranh giới trách nhiệm (Lane Boundary)**: Nhánh rà soát này CHỈ đánh giá 105 mục gốc và các trường `invitation`, `tutorial`, `explanation`, `boardData`, `solution`. Không sửa mã nguồn; không trùng lặp các phát hiện tiêu đề/gợi ý mới (do lane Codex phụ trách sửa chữa độc lập); không chấp nhận tiêu đề/gợi ý cho đến khi hoàn thành đợt tái tạo cuối cùng.

### 2.2 Phương pháp đọc thực tế
Programmatic extraction and full-text AI semantic analysis of 105 original inventory items, cross-checked against regenerated batch files. Exhaustive structural audit of all 24 distinct tutorials and 40 distinct explanations across 182 mechanics items (g04-t2, g06-t2, g08-t3) in initial 1460 release scope. Full-catalog regex scan across all 1460 invitations for authoritarian/pressure language, and regex whole-word scan across all 1460 tutorials for premature answer leakage. This is an independent AI review; no human editorial or child-pilot claims are made.

- Đọc toàn văn 105/105 mục lỗi gốc: **Đã thực hiện đầy đủ**.
- Đọc và phân tích 24/24 hướng dẫn (tutorials) đặc thù của `g04-t2`, `g06-t2`, `g08-t3`: **Đã thực hiện đầy đủ**.
- Đọc và phân tích 40/40 giải thích (explanations) đặc thù của `g04-t2`, `g06-t2`, `g08-t3`: **Đã thực hiện đầy đủ**.
- Quét toàn bộ 1.460 lời mời tìm giọng điệu áp lực/thi đua/thứ bậc: **0 vi phạm**.
- Quét toàn bộ 1.460 hướng dẫn tìm rò rỉ đáp án nguyên từ trước khi trả lời: **0 vi phạm**.
- Kiểm tra giới hạn độ dài ký tự: Tutorial tối đa 160 ký tự (giới hạn <= 240); Explanation tối đa 218 ký tự (giới hạn <= 300) -> **Đạt chuẩn 100%**.

## 3. Tổng hợp kết quả đánh giá (Quantitative Summary)

| Nhóm lỗi gốc | Số mục | Đã khắc phục (PASS) | Còn tồn đọng (FAIL) | Trạng thái |
|---|---:|---:|---:|---|
| 1. Giọng gây áp lực / so sánh (`pressure_comparison_language`) | 57 | 57 | 0 | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** |
| 2. g04-t2 Luật Nếu - Thì sai thực tế (`g04_t2_false_if_then`) | 15 | 15 | 0 | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** |
| 3. g06-t2 Thứ tự chuỗi đời thực gây mơ hồ (`g06_t2_ambiguous_sequencing`) | 21 | 21 | 0 | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** |
| 4. g08-t3 Lời giải thích lệch cảnh đáp án (`g08_t3_explanation_mismatch`) | 12 | 12 | 0 | **ĐÃ KHẮC PHỤC TRIỆT ĐỂ** |
| **TỔNG CỘNG** | **105** | **105** | **0** | **100% PASS (0 block, 0 fix)** |

## 4. Chi tiết đánh giá 4 nhóm lỗi gốc (Detailed Evidence by Group)

### 4.1 Nhóm 1: Giọng gây áp lực / So sánh trẻ / Chấm năng lực (57 mục)
- **Vấn đề ban đầu**: 5 mẫu lời mời mang tính áp lực, đo lường năng lực ("đòi hỏi bạn phải", "xem ai nhớ nhanh và chính xác hơn nào", "sẽ kiểm tra khả năng...") vi phạm nguyên tắc non-punitive và tinh thần bè bạn ("mình - bạn") trong PRD.
- **Kết quả rà soát hiện tại**: Toàn bộ 5 cụm từ gây áp lực đã biến mất hoàn toàn trên cả 57 mục và toàn bộ 1.460 mục phát hành đầu.
- **5 mẫu lời mời thay thế thân thiện đã được áp dụng**:
  1. `g02-t1` (13 mục): *"Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha!"*
  2. `g03-t1` (11 mục): *"Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha!"*
  3. `g05-t3` (12 mục): *"Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào!"*
  4. `g01-t3` (12 mục): *"Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé!"*
  5. `g08-t1` (9 mục): *"Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé!"*
- **Đánh giá văn phong**: Tự nhiên, nhẹ nhàng, tôn trọng trẻ em, loại bỏ hoàn toàn so sánh tốc độ hay thi đua giữa các trẻ.

### 4.2 Nhóm 2: g04-t2 Khung ký hiệu quy tắc ván chơi (15 mục gốc, 62 mục catalog)
- **Vấn đề ban đầu**: Suy luận Nếu - Thì dựa trên các liên tưởng đời sống (ví dụ "mặt trời" -> "buổi sáng") bị hiểu nhầm là quy luật nhân quả tất yếu phổ quát, gây phản cảm khi đối chiếu với thực tế (buổi chiều vẫn có mặt trời).
- **Kết quả rà soát hiện tại**: Toàn bộ các kho từ vựng (cả 4 pool: mây/mưa/áo mưa, nắng gắt/khát nước/uống nước, mặt trời/buổi sáng/đánh răng, hạt mầm/cây non/bông hoa) đều được đóng khung rõ ràng ngay từ đầu:
  - **Tutorial**: Bắt đầu bằng câu quy chuẩn: *"Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này."*
  - **Explanation**: Bắt đầu bằng quy tắc ký hiệu cụ thể của ván: *"Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: [thẻ A] → [thẻ B]... Từ thẻ [tiền đề], áp dụng luật để suy ra thẻ [kết luận]."*
- **Đánh giá logic & rò rỉ**: Các quy tắc được hiểu chính xác là quy ước nội bộ trò chơi; giải thích khớp 100% với các bước suy luận trên bàn cờ; không có hiện tượng rò rỉ đáp án sớm trong tutorial.

### 4.3 Nhóm 3: g06-t2 Công khai toàn bộ ràng buộc thứ tự trước khi chơi (21 mục gốc, 60 mục catalog)
- **Vấn đề ban đầu**: Bài toán bắt buộc một thứ tự duy nhất cho các hành động đời thực có thể hoán đổi (Xới cơm trước Múc canh hay Múc canh trước Xới cơm), đồng thời ẩn các luật ràng buộc khiến trẻ bối rối.
- **Kết quả rà soát hiện tại**:
  - **Tutorial công khai đầy đủ mọi ràng buộc**: *"Luật riêng của ván này (→ là làm trước): [Bước A] → [Bước B]; ... Mọi thứ tự giữ đủ luật đều được."*
  - **Khẳng định tính hợp lệ của mọi thứ tự thỏa mãn luật**: Cụm từ *"Mọi thứ tự giữ đủ luật đều được"* khẳng định trò chơi chấp nhận bất kỳ thứ tự nào giữ đúng các liên kết mũi tên đã nêu.
  - **Explanation trung thực**: Nêu rõ *"Một thứ tự theo luật của ván này là: [thứ tự giải pháp]"* thay vì khẳng định đây là trật tự đời sống duy nhất đúng.
  - Toàn bộ các cạnh `boardData.before` được ánh xạ chính xác qua tên lệnh và hiển thị 100% trong cả tutorial và explanation.

### 4.4 Nhóm 4: g08-t3 Khớp nối chính xác cảnh, đặc điểm và quy tắc (12 mục gốc, 60 mục catalog)
- **Vấn đề ban đầu**: Tình huống vi phạm vạch kẻ an toàn (qua đường ngoài vạch) bị gán nhãn đặc điểm lệch là "đi sai hướng", gây mâu thuẫn với quy tắc chuẩn "đi đúng vạch".
- **Kết quả rà soát hiện tại**:
  - Cảnh vi phạm vạch kẻ ("Bạn chạy băng qua bên ngoài vạch kẻ an toàn") được cập nhật thuộc tính chính xác thành `"đi ngoài vạch"`.
  - Lời giải thích đối chiếu chuẩn xác: *"Tình huống 2: "Bạn chạy băng qua bên ngoài vạch kẻ an toàn" có đặc điểm "đi ngoài vạch", trong khi luật của ván này yêu cầu "đi đúng vạch"."*
  - Cả 12 mục gốc và 60 mục `g08-t3` trên toàn catalog đều trích dẫn nguyên văn tình huống, đúng đặc điểm vi phạm và đúng luật đối chiếu của ván.

## 5. Khảo sát ngữ liệu đặc thù (Mechanics Distinct Corpus: g04-t2, g06-t2, g08-t3)

### g04-t2 (Tổng số: 62 mục trên initial1460)
- **Số hướng dẫn (tutorials) đặc thù**: 6
  - `[122 ký tự, 11 mục, ví dụ D004-main-vi68]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Bạn xem những điều đã biết và luật Nếu - Thì để tìm kết luận đúng nhé.
  - `[127 ký tự, 10 mục, ví dụ D004-main-vi912]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Kiểm tra từng bước suy nghĩ và chọn kết luận chắc chắn đúng, không thể sai.
  - `[120 ký tự, 9 mục, ví dụ D017-bonus-vi68]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Nếu có điều này thì sẽ có điều kia; bạn nối tiếp để tìm kết quả nha.
  - `[136 ký tự, 10 mục, ví dụ D017-bonus-vi912]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Đọc các câu "nếu ... thì ..." và những điều đã biết, rồi suy ra điều chắc chắn đúng.
  - `[120 ký tự, 11 mục, ví dụ D028-main-vi68]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Dùng gợi ý có sẵn và luật dẫn đường để tìm ra điều chắc chắn xảy ra.
  - `[134 ký tự, 11 mục, ví dụ D041-bonus-vi912]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Nối từng câu "nếu ... thì ..." với nhau, đi từ điều đã biết đến kết quả cuối cùng.
- **Số lời giải thích (explanations) đặc thù**: 13
  - `[132 ký tự, 7 mục, ví dụ D004-main-vi68]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "mây" → "mưa"; "mưa" → "áo mưa". Từ thẻ "mây", áp dụng luật để suy ra thẻ "mưa".
  - `[184 ký tự, 10 mục, ví dụ D004-main-vi912]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "nắng gắt" → "khát nước"; "khát nước" → "uống nước"; "uống nước" → "mát mẻ". Từ thẻ "nắng gắt", áp dụng luật để suy ra thẻ "mát mẻ".
  - `[163 ký tự, 10 mục, ví dụ D017-bonus-vi68]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "nắng gắt" → "khát nước"; "khát nước" → "uống nước". Từ thẻ "nắng gắt", áp dụng luật để suy ra thẻ "khát nước".
  - `[176 ký tự, 3 mục, ví dụ D017-bonus-vi912]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "hạt mầm" → "cây non"; "cây non" → "nụ hoa"; "nụ hoa" → "bông hoa". Từ thẻ "hạt mầm", áp dụng luật để suy ra thẻ "bông hoa".
  - `[188 ký tự, 6 mục, ví dụ D028-main-vi912]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "mặt trời" → "buổi sáng"; "buổi sáng" → "thức dậy"; "thức dậy" → "đánh răng". Từ thẻ "mặt trời", áp dụng luật để suy ra thẻ "đánh răng".
  - `[187 ký tự, 5 mục, ví dụ D076-main-vi68]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "mặt trời" → "buổi sáng"; "buổi sáng" → "thức dậy"; "mặt trời" → "thức dậy". Từ thẻ "mặt trời", áp dụng luật để suy ra thẻ "buổi sáng".
  - `[198 ký tự, 3 mục, ví dụ D076-main-vi912]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "hạt mầm" → "cây non"; "cây non" → "nụ hoa"; "nụ hoa" → "bông hoa"; "hạt mầm" → "nụ hoa". Từ thẻ "hạt mầm", áp dụng luật để suy ra thẻ "bông hoa".
  - `[152 ký tự, 3 mục, ví dụ D124-main-vi68]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "hạt mầm" → "cây non"; "cây non" → "nụ hoa". Từ thẻ "hạt mầm", áp dụng luật để suy ra thẻ "cây non".
  - `[150 ký tự, 5 mục, ví dụ D124-main-vi912]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "mây" → "mưa"; "mưa" → "áo mưa"; "áo mưa" → "ủng". Từ thẻ "mây", áp dụng luật để suy ra thẻ "ủng".
  - `[150 ký tự, 2 mục, ví dụ D172-main-vi68]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "mây" → "mưa"; "mưa" → "áo mưa"; "mây" → "áo mưa". Từ thẻ "mây", áp dụng luật để suy ra thẻ "mưa".
  - `[210 ký tự, 2 mục, ví dụ D185-bonus-vi912]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "nắng gắt" → "khát nước"; "khát nước" → "uống nước"; "uống nước" → "mát mẻ"; "nắng gắt" → "uống nước". Từ thẻ "nắng gắt", áp dụng luật để suy ra thẻ "mát mẻ".
  - `[162 ký tự, 4 mục, ví dụ D209-bonus-vi68]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "mặt trời" → "buổi sáng"; "buổi sáng" → "thức dậy". Từ thẻ "mặt trời", áp dụng luật để suy ra thẻ "buổi sáng".
  - `[168 ký tự, 2 mục, ví dụ D281-bonus-vi912]`: Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này: "mây" → "mưa"; "mưa" → "áo mưa"; "áo mưa" → "ủng"; "mây" → "áo mưa". Từ thẻ "mây", áp dụng luật để suy ra thẻ "ủng".

### g06-t2 (Tổng số: 60 mục trên initial1460)
- **Số hướng dẫn (tutorials) đặc thù**: 12
  - `[135 ký tự, 4 mục, ví dụ D006-main-vi68]`: Luật riêng của ván này (→ là làm trước): Lấy bát → Xới cơm; Xới cơm → Múc canh; Múc canh → Mời cả nhà. Mọi thứ tự giữ đủ luật đều được.
  - `[156 ký tự, 6 mục, ví dụ D006-main-vi912]`: Luật riêng của ván này (→ là làm trước): Bật đèn → Ngồi xuống; Ngồi xuống → Mở sách; Mở sách → Đọc bài; Đọc bài → Gấp sách. Mọi thứ tự giữ đủ luật đều được.
  - `[129 ký tự, 5 mục, ví dụ D019-bonus-vi68]`: Luật riêng của ván này (→ là làm trước): Mở hộp → Lấy đồ; Lấy đồ → Đóng hộp; Đóng hộp → Cất hộp. Mọi thứ tự giữ đủ luật đều được.
  - `[150 ký tự, 8 mục, ví dụ D019-bonus-vi912]`: Luật riêng của ván này (→ là làm trước): Pha màu → Nhúng cọ; Nhúng cọ → Vẽ tranh; Vẽ tranh → Tô màu; Tô màu → Rửa cọ. Mọi thứ tự giữ đủ luật đều được.
  - `[132 ký tự, 6 mục, ví dụ D030-main-vi68]`: Luật riêng của ván này (→ là làm trước): Lấy hạt → Đào đất; Đào đất → Gieo hạt; Gieo hạt → Lấp đất. Mọi thứ tự giữ đủ luật đều được.
  - `[156 ký tự, 7 mục, ví dụ D030-main-vi912]`: Luật riêng của ván này (→ là làm trước): Lấy bát → Xới cơm; Xới cơm → Múc canh; Múc canh → Mời cả nhà; Mời cả nhà → Ăn cơm. Mọi thứ tự giữ đủ luật đều được.
  - `[140 ký tự, 7 mục, ví dụ D067-bonus-vi68]`: Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa tay; Rửa tay → Xoa xà phòng; Xoa xà phòng → Rửa sạch. Mọi thứ tự giữ đủ luật đều được.
  - `[148 ký tự, 4 mục, ví dụ D067-bonus-vi912]`: Luật riêng của ván này (→ là làm trước): Mở hộp → Lấy đồ; Lấy đồ → Đóng hộp; Đóng hộp → Cất hộp; Cất hộp → Dọn bàn. Mọi thứ tự giữ đủ luật đều được.
  - `[160 ký tự, 3 mục, ví dụ D102-main-vi912]`: Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa tay; Rửa tay → Xoa xà phòng; Xoa xà phòng → Rửa sạch; Rửa sạch → Lau khô. Mọi thứ tự giữ đủ luật đều được.
  - `[136 ký tự, 6 mục, ví dụ D115-bonus-vi68]`: Luật riêng của ván này (→ là làm trước): Bật đèn → Ngồi xuống; Ngồi xuống → Mở sách; Mở sách → Đọc bài. Mọi thứ tự giữ đủ luật đều được.
  - `[133 ký tự, 2 mục, ví dụ D139-bonus-vi68]`: Luật riêng của ván này (→ là làm trước): Pha màu → Nhúng cọ; Nhúng cọ → Vẽ tranh; Vẽ tranh → Tô màu. Mọi thứ tự giữ đủ luật đều được.
  - `[153 ký tự, 2 mục, ví dụ D139-bonus-vi912]`: Luật riêng của ván này (→ là làm trước): Lấy hạt → Đào đất; Đào đất → Gieo hạt; Gieo hạt → Lấp đất; Lấp đất → Tưới nước. Mọi thứ tự giữ đủ luật đều được.
- **Số lời giải thích (explanations) đặc thù**: 12
  - `[182 ký tự, 4 mục, ví dụ D006-main-vi68]`: Luật riêng của ván này (→ là làm trước): Lấy bát → Xới cơm; Xới cơm → Múc canh; Múc canh → Mời cả nhà. Một thứ tự theo luật của ván này là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà.
  - `[213 ký tự, 6 mục, ví dụ D006-main-vi912]`: Luật riêng của ván này (→ là làm trước): Bật đèn → Ngồi xuống; Ngồi xuống → Mở sách; Mở sách → Đọc bài; Đọc bài → Gấp sách. Một thứ tự theo luật của ván này là: Bật đèn → Ngồi xuống → Mở sách → Đọc bài → Gấp sách.
  - `[171 ký tự, 5 mục, ví dụ D019-bonus-vi68]`: Luật riêng của ván này (→ là làm trước): Mở hộp → Lấy đồ; Lấy đồ → Đóng hộp; Đóng hộp → Cất hộp. Một thứ tự theo luật của ván này là: Mở hộp → Lấy đồ → Đóng hộp → Cất hộp.
  - `[203 ký tự, 8 mục, ví dụ D019-bonus-vi912]`: Luật riêng của ván này (→ là làm trước): Pha màu → Nhúng cọ; Nhúng cọ → Vẽ tranh; Vẽ tranh → Tô màu; Tô màu → Rửa cọ. Một thứ tự theo luật của ván này là: Pha màu → Nhúng cọ → Vẽ tranh → Tô màu → Rửa cọ.
  - `[176 ký tự, 6 mục, ví dụ D030-main-vi68]`: Luật riêng của ván này (→ là làm trước): Lấy hạt → Đào đất; Đào đất → Gieo hạt; Gieo hạt → Lấp đất. Một thứ tự theo luật của ván này là: Lấy hạt → Đào đất → Gieo hạt → Lấp đất.
  - `[212 ký tự, 7 mục, ví dụ D030-main-vi912]`: Luật riêng của ván này (→ là làm trước): Lấy bát → Xới cơm; Xới cơm → Múc canh; Múc canh → Mời cả nhà; Mời cả nhà → Ăn cơm. Một thứ tự theo luật của ván này là: Lấy bát → Xới cơm → Múc canh → Mời cả nhà → Ăn cơm.
  - `[188 ký tự, 7 mục, ví dụ D067-bonus-vi68]`: Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa tay; Rửa tay → Xoa xà phòng; Xoa xà phòng → Rửa sạch. Một thứ tự theo luật của ván này là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch.
  - `[200 ký tự, 4 mục, ví dụ D067-bonus-vi912]`: Luật riêng của ván này (→ là làm trước): Mở hộp → Lấy đồ; Lấy đồ → Đóng hộp; Đóng hộp → Cất hộp; Cất hộp → Dọn bàn. Một thứ tự theo luật của ván này là: Mở hộp → Lấy đồ → Đóng hộp → Cất hộp → Dọn bàn.
  - `[218 ký tự, 3 mục, ví dụ D102-main-vi912]`: Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa tay; Rửa tay → Xoa xà phòng; Xoa xà phòng → Rửa sạch; Rửa sạch → Lau khô. Một thứ tự theo luật của ván này là: Mở vòi → Rửa tay → Xoa xà phòng → Rửa sạch → Lau khô.
  - `[182 ký tự, 6 mục, ví dụ D115-bonus-vi68]`: Luật riêng của ván này (→ là làm trước): Bật đèn → Ngồi xuống; Ngồi xuống → Mở sách; Mở sách → Đọc bài. Một thứ tự theo luật của ván này là: Bật đèn → Ngồi xuống → Mở sách → Đọc bài.
  - `[177 ký tự, 2 mục, ví dụ D139-bonus-vi68]`: Luật riêng của ván này (→ là làm trước): Pha màu → Nhúng cọ; Nhúng cọ → Vẽ tranh; Vẽ tranh → Tô màu. Một thứ tự theo luật của ván này là: Pha màu → Nhúng cọ → Vẽ tranh → Tô màu.
  - `[209 ký tự, 2 mục, ví dụ D139-bonus-vi912]`: Luật riêng của ván này (→ là làm trước): Lấy hạt → Đào đất; Đào đất → Gieo hạt; Gieo hạt → Lấp đất; Lấp đất → Tưới nước. Một thứ tự theo luật của ván này là: Lấy hạt → Đào đất → Gieo hạt → Lấp đất → Tưới nước.

### g08-t3 (Tổng số: 60 mục trên initial1460)
- **Số hướng dẫn (tutorials) đặc thù**: 6
  - `[67 ký tự, 15 mục, ví dụ D013-bonus-vi68]`: Xem các bức tranh và chỉ ra bạn nhỏ nào đang làm hành động khác lạ.
  - `[70 ký tự, 12 mục, ví dụ D013-bonus-vi912]`: Tìm tình huống có chỗ vô lý hoặc không hợp với quy tắc chung của nhóm.
  - `[63 ký tự, 8 mục, ví dụ D024-main-vi68]`: Bạn tìm tình huống có chi tiết chưa đúng với quy tắc chung nhé.
  - `[65 ký tự, 10 mục, ví dụ D037-bonus-vi912]`: Xem từng chi tiết có hợp lý không, và mỗi thứ nên thuộc nhóm nào.
  - `[63 ký tự, 8 mục, ví dụ D048-main-vi912]`: Chỉ ra bức tranh có chi tiết lạ, không hợp với bối cảnh của nó.
  - `[71 ký tự, 7 mục, ví dụ D085-bonus-vi68]`: Tìm chi tiết không cùng nhóm hoặc không đúng cách thức thường ngày nha.
- **Số lời giải thích (explanations) đặc thù**: 15
  - `[124 ký tự, 4 mục, ví dụ D013-bonus-vi68]`: Tình huống 2: "Bạn mang bánh ngọt và nước có ga vào chơi" có đặc điểm "đồ ăn", trong khi luật của ván này yêu cầu "đồ chơi".
  - `[124 ký tự, 4 mục, ví dụ D013-bonus-vi912]`: Tình huống 3: "Bạn mang bánh ngọt và nước có ga vào chơi" có đặc điểm "đồ ăn", trong khi luật của ván này yêu cầu "đồ chơi".
  - `[141 ký tự, 6 mục, ví dụ D037-bonus-vi68]`: Tình huống 4: "Bạn chạy ngược chiều dòng người đang bước tới" có đặc điểm "đi sai hướng", trong khi luật của ván này yêu cầu "đi đúng hướng".
  - `[141 ký tự, 7 mục, ví dụ D048-main-vi68]`: Tình huống 2: "Bạn chạy ngược chiều dòng người đang bước tới" có đặc điểm "đi sai hướng", trong khi luật của ván này yêu cầu "đi đúng hướng".
  - `[141 ký tự, 2 mục, ví dụ D048-main-vi912]`: Tình huống 3: "Bạn chạy ngược chiều dòng người đang bước tới" có đặc điểm "đi sai hướng", trong khi luật của ván này yêu cầu "đi đúng hướng".
  - `[133 ký tự, 6 mục, ví dụ D061-bonus-vi68]`: Tình huống 3: "Bạn đặt cốc trà sữa kem phô mai lên tập vở" có đặc điểm "đồ ăn", trong khi luật của ván này yêu cầu "đồ dùng học tập".
  - `[139 ký tự, 4 mục, ví dụ D085-bonus-vi68]`: Tình huống 2: "Bạn chạy băng qua bên ngoài vạch kẻ an toàn" có đặc điểm "đi ngoài vạch", trong khi luật của ván này yêu cầu "đi đúng vạch".
  - `[139 ký tự, 4 mục, ví dụ D096-main-vi68]`: Tình huống 3: "Bạn chạy băng qua bên ngoài vạch kẻ an toàn" có đặc điểm "đi ngoài vạch", trong khi luật của ván này yêu cầu "đi đúng vạch".
  - `[124 ký tự, 8 mục, ví dụ D109-bonus-vi68]`: Tình huống 4: "Bạn mang bánh ngọt và nước có ga vào chơi" có đặc điểm "đồ ăn", trong khi luật của ván này yêu cầu "đồ chơi".
  - `[133 ký tự, 6 mục, ví dụ D157-bonus-vi68]`: Tình huống 4: "Bạn đặt cốc trà sữa kem phô mai lên tập vở" có đặc điểm "đồ ăn", trong khi luật của ván này yêu cầu "đồ dùng học tập".
  - `[133 ký tự, 3 mục, ví dụ D157-bonus-vi912]`: Tình huống 2: "Bạn đặt cốc trà sữa kem phô mai lên tập vở" có đặc điểm "đồ ăn", trong khi luật của ván này yêu cầu "đồ dùng học tập".
  - `[139 ký tự, 3 mục, ví dụ D181-bonus-vi68]`: Tình huống 4: "Bạn chạy băng qua bên ngoài vạch kẻ an toàn" có đặc điểm "đi ngoài vạch", trong khi luật của ván này yêu cầu "đi đúng vạch".
  - `[141 ký tự, 1 mục, ví dụ D229-bonus-vi912]`: Tình huống 5: "Bạn chạy ngược chiều dòng người đang bước tới" có đặc điểm "đi sai hướng", trong khi luật của ván này yêu cầu "đi đúng hướng".
  - `[133 ký tự, 1 mục, ví dụ D253-bonus-vi912]`: Tình huống 5: "Bạn đặt cốc trà sữa kem phô mai lên tập vở" có đặc điểm "đồ ăn", trong khi luật của ván này yêu cầu "đồ dùng học tập".
  - `[139 ký tự, 1 mục, ví dụ D277-bonus-vi912]`: Tình huống 5: "Bạn chạy băng qua bên ngoài vạch kẻ an toàn" có đặc điểm "đi ngoài vạch", trong khi luật của ván này yêu cầu "đi đúng vạch".

## 6. Góp ý bổ sung tách biệt (Optional Suggestions)

### SUGG-01 (g06-t2): Introduce partial orders with branching for older age track (age_9_12) in future iterations
- **Mức độ**: `suggestion` (Không ảnh hưởng đến điều kiện nghiệm thu đợt phát hành này).
- **Mô tả**: Currently all g06-t2 puzzles use linear total orders where all pairwise edges are disclosed before play. This is clear, supportive, and effective for 6-8. For older children (9-12), future content drops could introduce partial orders with branching steps (multiple valid topological sorts) to provide deeper algorithmic planning challenges.
- **Khuyến nghị**: Optional future enhancement; no change required for current release.

### SUGG-02 (g04-t2): Consider abstract or fantasy tokens for conditional reasoning in future expansions
- **Mức độ**: `suggestion` (Không ảnh hưởng đến điều kiện nghiệm thu đợt phát hành này).
- **Mô tả**: The game-local symbolic framing "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này." completely decouples logical deduction from real-world causality. In future expansions, using playful fictional tokens (e.g. thẻ phép thuật, huy hiệu hiệp sĩ) could make the arbitrary nature of game-local rules even more immediately intuitive to young children.
- **Khuyến nghị**: Optional future enhancement; current symbolic framing fully satisfies all acceptance criteria.

## 7. Bảng kiểm tra toàn bộ 105 mục lỗi gốc & Mã băm Projection (Per-ID Projection Table)

| STT | ID | Track | Loại trò chơi | Nhóm lỗi gốc | Trạng thái | Mã băm Projection SHA-256 (6 ký tự đầu..cuối) | Bằng chứng hiện tại |
|---|---|---|---|---|:---:|---|---|
| 1 | `D002-main-vi68` | age_6_8 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `2efd1f3d...622312e4` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 2 | `D006-main-vi68` | age_6_8 | `g06-t2` | `rice_before_soup` | **PASS** | `b9558db0...86ab10b7` | Tutorial: "Luật riêng của ván này (→ là làm trước): Lấy bát → Xới c... |
| 3 | `D016-bonus-vi68` | age_6_8 | `g03-t1` | `g03-t1_ai_nho_nhanh` | **PASS** | `076d1efa...45a42507` | Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha! |
| 4 | `D021-main-vi68` | age_6_8 | `g05-t3` | `g05-t3_kiem_tra` | **PASS** | `0bad0406...f76818e2` | Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào! |
| 5 | `D021-main-vi912` | age_9_12 | `g05-t3` | `g05-t3_kiem_tra` | **PASS** | `3985da23...b9a9f6a3` | Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào! |
| 6 | `D026-main-vi912` | age_9_12 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `6580c8ce...6eead972` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 7 | `D028-main-vi912` | age_9_12 | `g04-t2` | `sun_morning_rule` | **PASS** | `0945f01a...1553fcd3` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Kiểm... |
| 8 | `D030-main-vi912` | age_9_12 | `g06-t2` | `rice_before_soup` | **PASS** | `ec717057...6c97c252` | Tutorial: "Luật riêng của ván này (→ là làm trước): Lấy bát → Xới c... |
| 9 | `D034-bonus-vi68` | age_6_8 | `g05-t3` | `g05-t3_kiem_tra` | **PASS** | `e2034576...e4736209` | Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào! |
| 10 | `D040-bonus-vi68` | age_6_8 | `g03-t1` | `g03-t1_ai_nho_nhanh` | **PASS** | `718dc90b...77ddb13f` | Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha! |
| 11 | `D046-bonus-vi912` | age_9_12 | `g01-t3` | `g01-t3_kiem_tra` | **PASS** | `c514a881...031ff348` | Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé! |
| 12 | `D051-main-vi912` | age_9_12 | `g03-t1` | `g03-t1_ai_nho_nhanh` | **PASS** | `8e199237...5a9aa2f1` | Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha! |
| 13 | `D052-main-vi912` | age_9_12 | `g04-t2` | `sun_morning_rule` | **PASS** | `7a0046bb...f917e06b` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Đọc ... |
| 14 | `D053-bonus-vi912` | age_9_12 | `g08-t1` | `g08-t1_kiem_tra` | **PASS** | `071ae7fd...2d38f4e7` | Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé! |
| 15 | `D054-main-vi68` | age_6_8 | `g06-t2` | `rice_before_soup` | **PASS** | `31d25dfa...95d9bad0` | Tutorial: "Luật riêng của ván này (→ là làm trước): Lấy bát → Xới c... |
| 16 | `D054-main-vi912` | age_9_12 | `g06-t2` | `rice_before_soup` | **PASS** | `1d7669f5...46cba852` | Tutorial: "Luật riêng của ván này (→ là làm trước): Lấy bát → Xới c... |
| 17 | `D063-bonus-vi68` | age_6_8 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `359a7b25...38fcdcbb` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 18 | `D063-bonus-vi912` | age_9_12 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `db82c0af...1b922687` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 19 | `D064-main-vi68` | age_6_8 | `g08-t1` | `g08-t1_kiem_tra` | **PASS** | `e7f47f01...89bbf888` | Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé! |
| 20 | `D067-bonus-vi68` | age_6_8 | `g06-t2` | `wash_hands_twice` | **PASS** | `b29e3bf7...232c1d49` | Tutorial: "Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa ta... |
| 21 | `D075-main-vi68` | age_6_8 | `g03-t1` | `g03-t1_ai_nho_nhanh` | **PASS** | `b7c94364...a310ff18` | Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha! |
| 22 | `D075-main-vi912` | age_9_12 | `g03-t1` | `g03-t1_ai_nho_nhanh` | **PASS** | `a0353f9a...801e24f2` | Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha! |
| 23 | `D076-main-vi68` | age_6_8 | `g04-t2` | `sun_morning_rule` | **PASS** | `d96b72d3...61b6a008` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Dùng... |
| 24 | `D078-main-vi68` | age_6_8 | `g06-t2` | `rice_before_soup` | **PASS** | `b7775a72...734c2072` | Tutorial: "Luật riêng của ván này (→ là làm trước): Lấy bát → Xới c... |
| 25 | `D081-main-vi912` | age_9_12 | `g01-t3` | `g01-t3_kiem_tra` | **PASS** | `575fe169...0138d564` | Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé! |
| 26 | `D082-bonus-vi68` | age_6_8 | `g05-t3` | `g05-t3_kiem_tra` | **PASS** | `d9ffe460...4af74dc9` | Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào! |
| 27 | `D082-bonus-vi912` | age_9_12 | `g05-t3` | `g05-t3_kiem_tra` | **PASS** | `3d06a020...ae2176c3` | Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào! |
| 28 | `D085-bonus-vi68` | age_6_8 | `g08-t3` | `wrong_direction_vs_crosswalk` | **PASS** | `e236d51c...8fe52912` | Explanation: "Tình huống 2: "Bạn chạy băng qua bên ngoài vạch kẻ an... |
| 29 | `D085-bonus-vi912` | age_9_12 | `g08-t3` | `wrong_direction_vs_crosswalk` | **PASS** | `3548ecfe...044dac3e` | Explanation: "Tình huống 2: "Bạn chạy băng qua bên ngoài vạch kẻ an... |
| 30 | `D088-bonus-vi68` | age_6_8 | `g03-t1` | `g03-t1_ai_nho_nhanh` | **PASS** | `418135d6...473e0c2d` | Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha! |
| 31 | `D089-bonus-vi68` | age_6_8 | `g04-t2` | `sun_morning_rule` | **PASS** | `304954d9...08783f06` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Nếu ... |
| 32 | `D096-main-vi68` | age_6_8 | `g08-t3` | `wrong_direction_vs_crosswalk` | **PASS** | `c05390d9...01733c99` | Explanation: "Tình huống 3: "Bạn chạy băng qua bên ngoài vạch kẻ an... |
| 33 | `D096-main-vi912` | age_9_12 | `g08-t3` | `wrong_direction_vs_crosswalk` | **PASS** | `d0943815...f3b7edf8` | Explanation: "Tình huống 3: "Bạn chạy băng qua bên ngoài vạch kẻ an... |
| 34 | `D098-main-vi912` | age_9_12 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `6853aeab...2b991252` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 35 | `D102-main-vi912` | age_9_12 | `g06-t2` | `wash_hands_twice` | **PASS** | `465b8d0e...525da2d1` | Tutorial: "Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa ta... |
| 36 | `D106-bonus-vi68` | age_6_8 | `g05-t3` | `g05-t3_kiem_tra` | **PASS** | `f228a949...cbb8c69b` | Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào! |
| 37 | `D112-bonus-vi68` | age_6_8 | `g03-t1` | `g03-t1_ai_nho_nhanh` | **PASS** | `75a735f6...9f7cf284` | Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha! |
| 38 | `D126-main-vi912` | age_9_12 | `g06-t2` | `rice_before_soup` | **PASS** | `3be0bef4...454aef0e` | Tutorial: "Luật riêng của ván này (→ là làm trước): Lấy bát → Xới c... |
| 39 | `D130-bonus-vi912` | age_9_12 | `g05-t3` | `g05-t3_kiem_tra` | **PASS** | `be6ee870...5f3ab6b6` | Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào! |
| 40 | `D136-bonus-vi68` | age_6_8 | `g03-t1` | `g03-t1_ai_nho_nhanh` | **PASS** | `8bed9c63...e1ae0fab` | Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha! |
| 41 | `D136-main-vi68` | age_6_8 | `g08-t1` | `g08-t1_kiem_tra` | **PASS** | `2b2afec4...95185235` | Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé! |
| 42 | `D137-bonus-vi912` | age_9_12 | `g04-t2` | `sun_morning_rule` | **PASS** | `b3dc0e3f...84f88c38` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Nối ... |
| 43 | `D153-main-vi68` | age_6_8 | `g01-t3` | `g01-t3_kiem_tra` | **PASS** | `8176314f...156a9ae5` | Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé! |
| 44 | `D154-bonus-vi912` | age_9_12 | `g05-t3` | `g05-t3_kiem_tra` | **PASS** | `d4546fab...9015ec7d` | Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào! |
| 45 | `D161-bonus-vi912` | age_9_12 | `g04-t2` | `sun_morning_rule` | **PASS** | `875917e2...bc45fda3` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Nối ... |
| 46 | `D163-bonus-vi68` | age_6_8 | `g06-t2` | `wash_hands_twice` | **PASS** | `2dfb7c9e...3e74963a` | Tutorial: "Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa ta... |
| 47 | `D163-bonus-vi912` | age_9_12 | `g06-t2` | `rice_before_soup` | **PASS** | `99567a65...51697224` | Tutorial: "Luật riêng của ván này (→ là làm trước): Lấy bát → Xới c... |
| 48 | `D166-bonus-vi68` | age_6_8 | `g01-t3` | `g01-t3_kiem_tra` | **PASS** | `5c54c593...9d00e33d` | Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé! |
| 49 | `D177-main-vi68` | age_6_8 | `g01-t3` | `g01-t3_kiem_tra` | **PASS** | `db63e27e...6dffc679` | Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé! |
| 50 | `D177-main-vi912` | age_9_12 | `g01-t3` | `g01-t3_kiem_tra` | **PASS** | `0e0e3cce...7aab7b1d` | Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé! |
| 51 | `D181-bonus-vi68` | age_6_8 | `g08-t3` | `wrong_direction_vs_crosswalk` | **PASS** | `760f0100...31321ba7` | Explanation: "Tình huống 4: "Bạn chạy băng qua bên ngoài vạch kẻ an... |
| 52 | `D181-bonus-vi912` | age_9_12 | `g08-t3` | `wrong_direction_vs_crosswalk` | **PASS** | `12d14c54...656e1f96` | Explanation: "Tình huống 4: "Bạn chạy băng qua bên ngoài vạch kẻ an... |
| 53 | `D183-bonus-vi912` | age_9_12 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `fcaba74f...146bb953` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 54 | `D184-main-vi912` | age_9_12 | `g08-t1` | `g08-t1_kiem_tra` | **PASS** | `da451ed4...81312ce3` | Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé! |
| 55 | `D189-main-vi68` | age_6_8 | `g05-t3` | `g05-t3_kiem_tra` | **PASS** | `261293eb...30b30c2e` | Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào! |
| 56 | `D190-bonus-vi912` | age_9_12 | `g01-t3` | `g01-t3_kiem_tra` | **PASS** | `a34de341...14c74868` | Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé! |
| 57 | `D192-main-vi68` | age_6_8 | `g08-t3` | `wrong_direction_vs_crosswalk` | **PASS** | `cae55dce...590ed6c4` | Explanation: "Tình huống 4: "Bạn chạy băng qua bên ngoài vạch kẻ an... |
| 58 | `D192-main-vi912` | age_9_12 | `g08-t3` | `wrong_direction_vs_crosswalk` | **PASS** | `f5ef072a...0236bbe6` | Explanation: "Tình huống 3: "Bạn chạy băng qua bên ngoài vạch kẻ an... |
| 59 | `D196-main-vi912` | age_9_12 | `g04-t2` | `sun_morning_rule` | **PASS** | `c5dcb9f8...25e595d4` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Kiểm... |
| 60 | `D208-bonus-vi68` | age_6_8 | `g03-t1` | `g03-t1_ai_nho_nhanh` | **PASS** | `d5713cf1...29f008ac` | Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha! |
| 61 | `D209-bonus-vi68` | age_6_8 | `g04-t2` | `sun_morning_rule` | **PASS** | `4e252ff1...e52b57e4` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Dùng... |
| 62 | `D211-bonus-vi68` | age_6_8 | `g06-t2` | `wash_hands_twice` | **PASS** | `67496e6e...268dd4c9` | Tutorial: "Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa ta... |
| 63 | `D213-main-vi68` | age_6_8 | `g05-t3` | `g05-t3_kiem_tra` | **PASS** | `7b4f9bf2...4c1319fe` | Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào! |
| 64 | `D218-main-vi68` | age_6_8 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `38d4a23e...b51ae352` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 65 | `D220-main-vi68` | age_6_8 | `g04-t2` | `sun_morning_rule` | **PASS** | `e4474ceb...169c4cf1` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Bạn ... |
| 66 | `D221-bonus-vi68` | age_6_8 | `g08-t1` | `g08-t1_kiem_tra` | **PASS** | `d26bc3d0...30060754` | Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé! |
| 67 | `D222-main-vi912` | age_9_12 | `g06-t2` | `rice_before_soup` | **PASS** | `a6024da8...b4efe23b` | Tutorial: "Luật riêng của ván này (→ là làm trước): Lấy bát → Xới c... |
| 68 | `D231-bonus-vi912` | age_9_12 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `ba1fc74a...8b096dc5` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 69 | `D232-main-vi912` | age_9_12 | `g08-t1` | `g08-t1_kiem_tra` | **PASS** | `6630e825...27783ee8` | Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé! |
| 70 | `D233-bonus-vi68` | age_6_8 | `g04-t2` | `sun_morning_rule` | **PASS** | `6f7dd8b5...eacdb6a7` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Nếu ... |
| 71 | `D238-bonus-vi912` | age_9_12 | `g01-t3` | `g01-t3_kiem_tra` | **PASS** | `ee34f69e...a2ea698e` | Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé! |
| 72 | `D246-main-vi68` | age_6_8 | `g06-t2` | `wash_hands_twice` | **PASS** | `5d0b60b8...e6c8e9b7` | Tutorial: "Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa ta... |
| 73 | `D246-main-vi912` | age_9_12 | `g06-t2` | `rice_before_soup` | **PASS** | `2366b0cd...06745258` | Tutorial: "Luật riêng của ván này (→ là làm trước): Lấy bát → Xới c... |
| 74 | `D255-bonus-vi912` | age_9_12 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `bebcb10f...927a3b91` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 75 | `D259-bonus-vi68` | age_6_8 | `g06-t2` | `rice_before_soup` | **PASS** | `81ca842a...cc3429ef` | Tutorial: "Luật riêng của ván này (→ là làm trước): Lấy bát → Xới c... |
| 76 | `D268-main-vi68` | age_6_8 | `g04-t2` | `sun_morning_rule` | **PASS** | `eff492e2...82efe972` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Dùng... |
| 77 | `D269-bonus-vi68` | age_6_8 | `g08-t1` | `g08-t1_kiem_tra` | **PASS** | `f6697fa0...e4bdec4a` | Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé! |
| 78 | `D273-main-vi912` | age_9_12 | `g01-t3` | `g01-t3_kiem_tra` | **PASS** | `c585298d...5c5d2cac` | Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé! |
| 79 | `D277-bonus-vi68` | age_6_8 | `g08-t3` | `wrong_direction_vs_crosswalk` | **PASS** | `057c26ef...aa44ce89` | Explanation: "Tình huống 2: "Bạn chạy băng qua bên ngoài vạch kẻ an... |
| 80 | `D277-bonus-vi912` | age_9_12 | `g08-t3` | `wrong_direction_vs_crosswalk` | **PASS** | `cb4344f5...80200791` | Explanation: "Tình huống 5: "Bạn chạy băng qua bên ngoài vạch kẻ an... |
| 81 | `D281-bonus-vi68` | age_6_8 | `g04-t2` | `sun_morning_rule` | **PASS** | `89682ba9...16b8f00f` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Dùng... |
| 82 | `D283-bonus-vi912` | age_9_12 | `g06-t2` | `rice_before_soup` | **PASS** | `4eb46674...68ca7734` | Tutorial: "Luật riêng của ván này (→ là làm trước): Lấy bát → Xới c... |
| 83 | `D288-main-vi68` | age_6_8 | `g08-t3` | `wrong_direction_vs_crosswalk` | **PASS** | `f4281846...6873ec4c` | Explanation: "Tình huống 2: "Bạn chạy băng qua bên ngoài vạch kẻ an... |
| 84 | `D288-main-vi912` | age_9_12 | `g08-t3` | `wrong_direction_vs_crosswalk` | **PASS** | `8e843e65...63f77db6` | Explanation: "Tình huống 3: "Bạn chạy băng qua bên ngoài vạch kẻ an... |
| 85 | `D294-main-vi68` | age_6_8 | `g06-t2` | `wash_hands_twice` | **PASS** | `adf7e3ed...9aeeada7` | Tutorial: "Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa ta... |
| 86 | `D294-main-vi912` | age_9_12 | `g06-t2` | `wash_hands_twice` | **PASS** | `eef86548...71b8e408` | Tutorial: "Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa ta... |
| 87 | `D297-main-vi912` | age_9_12 | `g01-t3` | `g01-t3_kiem_tra` | **PASS** | `e84303a5...44f04d02` | Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé! |
| 88 | `D304-bonus-vi68` | age_6_8 | `g03-t1` | `g03-t1_ai_nho_nhanh` | **PASS** | `4f9f41ba...dde6ca40` | Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha! |
| 89 | `D304-bonus-vi912` | age_9_12 | `g03-t1` | `g03-t1_ai_nho_nhanh` | **PASS** | `d9a1eefd...607509b9` | Hôm nay mình cùng nhớ một chuỗi nhé, bạn cứ từ từ quan sát nha! |
| 90 | `D305-bonus-vi912` | age_9_12 | `g04-t2` | `sun_morning_rule` | **PASS** | `b1d34d2b...8caafc3c` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Nối ... |
| 91 | `D314-main-vi912` | age_9_12 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `e86e3813...cb567a11` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 92 | `D317-bonus-vi68` | age_6_8 | `g08-t1` | `g08-t1_kiem_tra` | **PASS** | `ace46e33...a488dabe` | Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé! |
| 93 | `D318-main-vi68` | age_6_8 | `g06-t2` | `wash_hands_twice` | **PASS** | `0fd9aa16...42a254c2` | Tutorial: "Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa ta... |
| 94 | `D318-main-vi912` | age_9_12 | `g06-t2` | `wash_hands_twice` | **PASS** | `b43aebf5...4e83b113` | Tutorial: "Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa ta... |
| 95 | `D327-bonus-vi912` | age_9_12 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `91e4ae0a...66658e64` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 96 | `D331-bonus-vi68` | age_6_8 | `g06-t2` | `wash_hands_twice` | **PASS** | `f3890829...8cdb7aa6` | Tutorial: "Luật riêng của ván này (→ là làm trước): Mở vòi → Rửa ta... |
| 97 | `D340-main-vi68` | age_6_8 | `g04-t2` | `sun_morning_rule` | **PASS** | `58257e1b...395567d7` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Dùng... |
| 98 | `D341-bonus-vi68` | age_6_8 | `g08-t1` | `g08-t1_kiem_tra` | **PASS** | `cdeaca18...84a7294a` | Hôm nay mình cùng tìm điểm khác nhau giữa hai bức tranh nhé! |
| 99 | `D345-main-vi68` | age_6_8 | `g01-t3` | `g01-t3_kiem_tra` | **PASS** | `5bb7a34c...0da7753f` | Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé! |
| 100 | `D346-bonus-vi912` | age_9_12 | `g05-t3` | `g05-t3_kiem_tra` | **PASS** | `8b3b082b...5141ed4e` | Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào! |
| 101 | `D351-bonus-vi912` | age_9_12 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `bf856430...08099a03` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 102 | `D357-main-vi912` | age_9_12 | `g05-t3` | `g05-t3_kiem_tra` | **PASS** | `9c64ff2e...2a7e3f3f` | Hôm nay mình cùng gom đủ số mục tiêu nhé, bạn cộng nhẩm thử xem nào! |
| 103 | `D358-bonus-vi68` | age_6_8 | `g01-t3` | `g01-t3_kiem_tra` | **PASS** | `c1c21502...a1b9f35c` | Hôm nay mình cùng đoán xem chiếc máy biến đổi số thế nào nhé! |
| 104 | `D362-main-vi68` | age_6_8 | `g02-t1` | `g02-t1_doi_hoi` | **PASS** | `7b1e2b26...7095609f` | Hôm nay mình cùng ghép bóng nhé, bạn nhìn thật kỹ từng ô nhỏ nha! |
| 105 | `D364-main-vi68` | age_6_8 | `g04-t2` | `sun_morning_rule` | **PASS** | `ce61de6a...6664b49e` | Tutorial: "Các từ là thẻ ký hiệu. Luật chỉ dùng trong ván này. Bạn ... |

## 8. Kết luận nghiệm thu độc lập (Independent AI Review Verdict)

- **105/105 lỗi gốc**: ĐÃ ĐƯỢC KHẮC PHỤC HOÀN TOÀN (100% Pass, 0 Block, 0 Fix).
- **Cơ chế g04-t2, g06-t2, g08-t3**: Đạt chuẩn về đóng khung ký hiệu, công khai ràng buộc, đối chiếu cảnh/luật và độ dài văn phong.
- **Văn phong tiếng Việt**: Thân thiện, tự nhiên, tôn trọng trẻ, tuyệt đối không gây áp lực thi đua hay rò rỉ đáp án.
- **Trách nhiệm tiếp theo**: Chờ đợt tái tạo hoàn tất từ lane Tiêu đề / Gợi ý (Titles & Hints) để kiểm tra khớp nối snapshot cuối cùng trước khi đóng PR.
