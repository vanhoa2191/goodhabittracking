# Worker process output archive

Provider: agy. This is actual stdout, not an implementation verification.

# Đánh giá Thiết kế & Bản tóm tắt Triển khai Phase 03 (Baseline Input)

> **Lưu ý nguyên tắc**: Tài liệu này đóng vai trò là dữ liệu đầu vào thiết kế cơ sở (baseline design input), căn cứ trên kế hoạch đã được phê duyệt. **Không tuyên bố Phase 00 hay Phase 03 đã được nghiệm thu (accepted)**. Bảo toàn nguyên vẹn nhận diện thương hiệu hiện hữu, hệ thống màu ngữ nghĩa Tailwind và các nhánh độ tuổi đã xác lập.

---

## 1. Phạm vi Bề mặt Được Duyệt (`approved_surface_scope`)

- **Bản sắc thương hiệu**: Biểu trưng `BrandMark` (mầm cây vươn lên trong ngôi sao dẫn đường mềm mại), typography gồm Plus Jakarta Sans (chính), Fraunces (tiêu đề/chào hỏi cảm xúc) và JetBrains Mono (mã ghép đôi, định danh).
- **Phân tách không gian**:
  - *Kid Mode*: Nền ấm áp (`amber-50`), nhấn thưởng sao (`amber-500/700`), ngôn ngữ khích lệ.
  - *Parent Mode*: Mặt phẳng cát (`sand-50`/`white`), hành động chỉ dẫn (`indigo-600`), cấu trúc rõ ràng, bình tĩnh.
- **Quy chuẩn kỹ thuật**: Không tạo thế giới thị giác mới; reflow mượt mà từ 375px không cuộn ngang; vùng chạm chính $\ge 44\text{px}$; tuân thủ WCAG 2.2 AA.

---

## 2. Bản đồ Tác tử & Phân nhánh Tuổi (Actor & Age-branch Mapping)

Giữ nguyên các nhánh hành vi hiện hữu, không áp dụng giả định sai lệch về năng lực người dùng:

1. **Nhánh 0–3 tuổi (Caregiver-led — BẮT BUỘC BẢO TOÀN)**:
   - **Tác tử chính (Primary Actor)**: Cha mẹ / người chăm sóc.
   - **Hành vi**: Người chăm sóc ghi nhận hoạt động, theo dõi nề nếp và nhật ký phát triển. Tuyệt đối **không** thiết kế checklist hay yêu cầu trẻ tự thao tác/tự đọc (loại bỏ tiêu chí child-self-action above-the-fold cho nhánh này).
2. **Nhánh 3–8 tuổi (Trẻ tự thao tác có hướng dẫn — Guided Self-Action)**:
   - **Tác tử chính**: Trẻ em thao tác nhiệm vụ hằng ngày; phụ huynh xét duyệt.
   - **Hành vi**: Trẻ bấm hoàn thành, chọn `Để sau` / `Làm ngay`, xem mascot đại diện (Leo, Bunny, Panda, Fox, Turtle, Bee) và thư buổi sáng (card ấm, không popup chặn).
3. **Nhánh 9–12 tuổi & 13+ (Trẻ tự chủ — Autonomous Self-Use)**:
   - **Tác tử chính**: Trẻ tự quản lý tiến độ, tích lũy điểm xây dựng Dream City, đổi thưởng gia đình; phụ huynh đóng vai trò đồng hành và kiểm duyệt cuối.
4. **Nhánh Tuổi Không Xác Định (Unknown-age Fallback)**:
   - Kích hoạt luồng an toàn mặc định theo logic hiện có; không tự động kích hoạt `ageTheme` thử nghiệm khi chưa có cấu hình cụ thể.

---

## 3. Cấu trúc Bố cục & Thứ bậc Nhận thức (Composition Hierarchy)

### Giao diện Phụ huynh (Parent Mode)
1. **Family Review Inbox (Hộp thư duyệt chung)**: Đặt ở vị trí **TRƯỚC** bộ chọn bé. Phạm vi bao quát toàn bộ trẻ trong gia đình (`all-family scope`), xử lý hàng đợi phê duyệt tập trung; không bị lọc ngầm theo bé được chọn.
2. **Child Summary Selector (Bộ chọn tóm tắt)**: Đặt ở khu vực phía sau, ghi rõ nhãn "Xem tổng quan của [Tên bé]" để đối soát dữ liệu cá nhân hóa mà không làm biến đổi hàng đợi chung.
3. **Hệ thống Điều hướng**: 3 phân vùng chính: `Today` (duyệt & thống kê), `Design` (thói quen, hành trình, phần thưởng), `Family` (hồ sơ & cài đặt).

### Giao diện Trẻ em (Kid Mode)
- **Lời chào & Mascot**: Ngắn gọn, ấm áp, tải đúng kích thước (không gây nhảy layout).
- **Thư buổi sáng (Morning letter)**: Card `amber-50` nằm ngay dưới phần chào mừng, gồm 3 câu dễ đọc và nút xác nhận $\ge 44\text{px}$, không dùng modal/popup ép buộc.
- **Nhiệm vụ & Tiến độ**:
  - Nút bấm trực quan `Hoàn thành`, kèm nút chuyển đổi `Để sau` / `Làm ngay`. Thao tác vuốt cảm ứng (phải: hoàn thành, trái: để sau) chỉ là phím tắt phụ trợ.
  - Các mục "Để sau" chuyển vào nhóm riêng trong ngày, không tích điểm thưởng.
- **Ngọn lửa thói quen trung thực (Habit Fire)**:
  - `Active`: Hoàn thành đã được phụ huynh xác thực hôm nay.
  - `Resting`: Hoàn thành đã được xác thực hôm qua.
  - `Fresh start`: Chưa hoàn thành hoặc gián đoạn.
  - Trạng thái chờ duyệt (`pending`) hiển thị độc lập, **không bao giờ** cộng gộp vào chuỗi ngày đã xác thực.

---

## 4. Sơ đồ Trạng thái Tương tác & Phục hồi Bất đồng bộ (State Map)

```
[Khởi tạo (Idle)] 
       │
       ▼
 [Đang lưu (Saving)] ──────── (Lỗi mạng / Sync chậm) ───► [Lỗi (Error)] ──► [Thử lại (Retry tại chỗ)]
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[Đã duyệt (Verified)]          [Chờ duyệt (Pending)]
(Cập nhật điểm & lửa)          (Tách biệt, không tính chuỗi)
```

- **Tính trung thực Async (D01)**: Mọi thao tác phê duyệt/từ chối hoặc trả thưởng phải trả về kết quả rõ ràng (awaitable outcome). Phân biệt rành mạch giữa kết quả thực thi lệnh và kết quả làm mới dữ liệu từ cloud; không tự ý suy đoán thành công khi sync bị trễ.
- **Phục hồi Thao tác Trẻ (D05)**: Giữ nguyên trạng thái card tại chỗ khi gặp lỗi lưu; không phát hiệu ứng khen thưởng (praise) hoặc haptic nếu authoritative save chưa thành công.

---

## 5. Tình trạng Quyết định Sản phẩm (Decisions Status)

- **Quyết định chặn triển khai (`blocking_decisions: []`)**:
  - **Không có quyết định chặn**. Việc người dùng duyệt kế hoạch được hiểu là đồng thuận với các mặc định kỹ thuật đã lập hồ sơ và bảo tồn các nhánh tuổi hiện hành (0–3 do người chăm sóc quản lý, trẻ tự thao tác chỉ áp dụng cho 3+).
- **Quyết định không chặn (`nonblocking_decisions`)**:
  - *Trọng tâm thương mại theo lứa tuổi (Commercial Age Focus)*: Đánh dấu là **NON-BLOCKING**, do toàn bộ hành vi kỹ thuật đa lứa tuổi và nhánh caregiver-led 0–3 tuổi vẫn được duy trì nguyên vẹn trong hệ thống.
