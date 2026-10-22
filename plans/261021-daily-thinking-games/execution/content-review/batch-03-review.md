# Báo cáo review nội dung - Batch 03 (Ngày 92-182)

## Tổng quan
- **Batch**: 3
- **File nguồn**: content/thinking-games/candidates/365-v2/batch-03-days-092-182.json
- **Số item đã review**: 364/364 (toàn bộ item age_6_8 và age_9_12, đã bỏ qua age_3_5 và age_13_plus)
- **Tổng số flag**: 94

## Thống kê theo mức độ
- **Block (phải sửa trước khi cho trẻ chơi)**: 62
- **Fix (nên sửa trước khi phát hành)**: 16
- **Nit (làm đẹp, không chặn phát hành)**: 16

## Thống kê theo danh mục
- **Copy (văn bản tiếng Việt)**: 78
- **Hint (gợi ý/giải thích)**: 16

## Các vấn đề Block (62 flags) - PHẢI SỬA

### 1. ID nội bộ lộ ra trong phần giải thích (46 items)
**Vấn đề**: Giải thích sử dụng ID kỹ thuật như `fact-a`, `item-1`, `fix-a`, `candidate-1`, `shape-a`, `turn-a`, `scene-3` thay vì mô tả bằng ngôn ngữ tự nhiên.

**Ví dụ**: `"Mình thêm một dữ kiện chỉ còn đúng một bạn khớp. Đáp án là fact-a."` → nên là `"Đáp án là hình tròn."`

**Game types bị ảnh hưởng**:
- g04-t3 (fact-a): 6 items
- g05-t3 (item-1, item-2): 6 items
- g06-t3 (fix-a/fix-b): 6 items
- g07-t1 (item-X): 6 items
- g08-t2 (item-X): 6 items
- g04-t1 (candidate-1): 4 items
- g02-t1 (shape-a): 4 items
- g02-t2 (turn-a): 4 items
- g08-t3 (scene-X): 4 items

**IDs liên quan**: D092-bonus-vi68, D092-bonus-vi912, D092-main-vi68, D092-main-vi912, D093-bonus-vi68, D093-bonus-vi912, D093-main-vi68, D093-main-vi912, D094-main-vi68, D094-main-vi912, D096-main-vi68, D096-main-vi912, D097-bonus-vi68, D097-bonus-vi912, D098-main-vi68, D098-main-vi912, D100-bonus-vi68, D100-bonus-vi912, D103-bonus-vi68, D103-bonus-vi912...

### 2. Từ tiếng Anh trong trò chơi g07-t2 (16 items)
**Vấn đề**: Các hướng `ahead`, `left`, `right`, `behind` xuất hiện trong đáp án và giải thích.

**Ví dụ**: `"Đáp án là ahead."` → nên là `"Đáp án là phía trước."`

**Tất cả 16 items g07-t2 (cả age_6_8 và age_9_12) bị ảnh hưởng**.

## Các vấn đề Fix (16 flags) - NÊN SỬA

### 3. Gợi ý chung chung không phù hợp với cơ chế trò chơi (12 game types)
**Vấn đề**: Cùng 2 gợi ý được dùng cho 198/364 items qua hầu như mọi game type:
1. `"Bạn thử so sánh từng lựa chọn với dấu hiệu chính trong hình."`
2. `"Mình gợi ý: loại dần những lựa chọn chưa khớp thay vì đoán ngay."`

Gợi ý nên chỉ dẫn cụ thể theo logic của từng cơ chế (ví dụ: g06-t1 nên gợi ý về tìm đường, g04-t2 về suy luận nếu-thì).

**Game types dùng gợi ý chung chung**: g02-t1, g02-t2, g02-t3, g03-t2, g04-t1, g04-t3, g06-t3, g07-t1, g07-t2, g07-t3, g08-t1, g08-t2, g08-t3

### 4. Mẫu giải thích y hệt cho mọi item cùng game type (3 game types)
**Vấn đề**: Tất cả items của cùng một game type dùng chung một câu giải thích, chỉ khác ID đáp án.
- g04-t1 (16 items): `"Mình loại từng bạn không khớp manh mối, còn lại một bạn. Đáp án là candidate-1."`
- g02-t1 (14 items): `"Mình so từng ô của bóng với hình mẫu, không chỉ nhìn đường viền. Đáp án là shape-a."`
- g02-t2 (14 items): `"Mình xoay hoặc lật hình mẫu đúng như yêu cầu rồi so các ô. Đáp án là turn-a."`

**Khuyến nghị**: Đa dạng hóa wording giải thích cho từng item.

## Các vấn đề Nit (16 flags) - LÀM ĐẸP

### 5. ID bước nội bộ trong g06-t2 (14 items)
**Vấn đề**: Giải pháp chứa `step-1, step-2...` - ID kỹ thuật.

### 6. Định dạng tọa độ trong g07-t3 (2 items mẫu)
**Vấn đề**: Giải thích hiển thị tọa độ `(0,0) → (1,0)...` có thể khó hiểu cho trẻ.

## Điểm tích cực
✅ **Khoảng cách lặp lại (spacing)**: Hoàn hảo 24 ngày giữa các lần xuất hiện của cùng game type cho cùng age/slot (đáp ứng yêu cầu ≥7 ngày).
✅ **Tiếng Việt tự nhiên**: Văn bản sử dụng đúng ngữ pháp, dấu câu, giọng "mình/bạn" nhất quán, không có từ lóng/máy dịch.
✅ **Phân biệt độ tuổi**: age_9_12 có boardData phức tạp hơn (nhiều item hơn, lưới lớn hơn) và targetSeconds lâu hơn so với age_6_8.
✅ **Chủ đề đa dạng**: Mỗi ngày có chủ đề riêng (Bưu điện, Công viên, Cửa hàng, Trạm xe...) tạo sự mới mẻ.
✅ **An toàn**: Không phát hiện nội dung bạo lực, tôn giáo, chính trị, định kiến giới, nhãn hàng, body shaming.
✅ **Đáp án đúng logic**: Kiểm tra mẫu boardData cho thấy giải pháp hợp lý với luật trò chơi.

## Kết luận & Quyết định
**❌ KHÔNG ĐỀ XUẤT DUYỆT** - Cần sửa các vấn đề Block trước.

### Yêu cầu bắt buộc trước khi duyệt:
1. **Thay thế tất cả ID nội bộ trong giải thích** bằng mô tả tiếng Việt tự nhiên (46 items block + 14 items nit)
2. **Việt hóa từ hướng trong g07-t2** (16 items block)
3. **Viết gợi ý chuyên biệt cho từng game type** (12 game types fix)
4. **Đa dạng hóa mẫu giải thích** cho g04-t1, g02-t1, g02-t2 (3 game types fix)

### Ước lượng công sức sửa:
- Vấn đề 1 & 2: Cần cập nhật template sinh nội dung / pipeline dữ liệu (~1-2 ngày dev)
- Vấn đề 3: Cần thiết kế gợi ý riêng cho 12 game types (~1 ngày content design)
- Vấn đề 4: Cập nhật template giải thích (~0.5 ngày)

**Đánh giá**: Batch 03 có nền tảng tốt (cấu trúc, spacing, tiếng Việt, độ tuổi) nhưng bị chặn bởi việc lộ ID kỹ thuật và gợi ý chung chung. Sau khi sửa các block items, batch có thể đạt chất lượng phát hành.
