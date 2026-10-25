# Báo cáo Lane E3 — Bổ sung E2E còn thiếu (`daily-living-restore.spec.ts`)

## 1. Tóm tắt kết quả
- Toàn bộ **3/3 kịch bản E2E mới** trong `tests/e2e/daily-living-restore.spec.ts` đã chạy **PASS** (`--project=chromium`).
- Các kịch bản được phủ đầy đủ theo yêu cầu:
  1. Mục đã lưu trữ (archived) -> nút Khôi phục đưa về Đang dùng.
  2. Mục graduated -> nút Luyện lại đưa về Đang dùng và bỏ trạng thái tốt nghiệp.
  3. Thêm cùng một mục từ hai tab trình duyệt cùng lúc (hai page cùng context/auth) -> chỉ còn 1 activity (không trùng).
- Không sửa mã nguồn sản phẩm (toàn bộ data-testid và logic khôi phục/luyện lại/chống trùng đã có sẵn đầy đủ trong `DailyLivingHabitLibrary.tsx` và `activity-actions.ts`).
- Kiểm tra tĩnh (`npx eslint` và `npx tsc --noEmit`) đạt 100% sạch, không có lỗi hay cảnh báo.

---

## 2. Lệnh đã chạy & Kết quả thật từng test

### Lệnh chạy toàn bộ suite
```bash
timeout 900 npx playwright test tests/e2e/daily-living-restore.spec.ts --project=chromium --reporter=list > /tmp/dlh2/e3-run.log 2>&1
```

### Kết quả chi tiết 3 kịch bản (`3 passed (1.1m)`)

1. **`Mục đã lưu trữ (archived) -> nút Khôi phục đưa về Đang dùng`** — **PASS** (`21.3s`)
   - **Mục tiêu**: Xác thực khi một thói quen sinh hoạt đã ở trạng thái lưu trữ (`is_active: false`, `graduated_at: null`), thẻ trong Thư viện hiển thị trạng thái `archived`, nút "Khôi phục" (`daily-living-restore`) bấm được và đưa thói quen trở lại trạng thái hoạt động trong "Đang dùng".
   - **Các bước thực thi**:
     - Cài đặt cloud fixture với mục `WIT-DLY-01` có `is_active: false` và `graduated_at: null`.
     - Mở Thư viện sinh hoạt, chọn bé ("Bé Cloud").
     - Thẻ `WIT-DLY-01` hiển thị `data-status="archived"` và nút `daily-living-restore` chứa chữ "Khôi phục".
     - Bấm nút "Khôi phục" → mutation `update` gửi lên với `isActive: true`.
     - Thông báo `daily-living-saved-notice` hiển thị với nội dung "Đã khôi phục thói quen".
     - Nút trên thẻ tự động cập nhật sang `daily-living-added` ("Đã thêm").
     - Chuyển sang tab "Đang dùng" → mục `Mã việc: WIT-DLY-01` xuất hiện với nhãn "Đang hoạt động".

2. **`Mục graduated -> nút Luyện lại đưa về Đang dùng và bỏ trạng thái tốt nghiệp`** — **PASS** (`21.3s`)
   - **Mục tiêu**: Xác thực khi một thói quen sinh hoạt đã tốt nghiệp (`graduated_at` có giá trị), thẻ trong Thư viện hiển thị trạng thái `graduated`, có huy hiệu "Bé đã tự làm" và nút "Luyện lại" (`daily-living-practice-again`). Khi bấm, thói quen được đưa về "Đang dùng", xóa `graduatedAt`, và xóa huy hiệu tốt nghiệp.
   - **Các bước thực thi**:
     - Cài đặt cloud fixture với mục `WIT-DLY-01` có `is_active: false` và `graduated_at: '2026-10-01T00:00:00.000Z'`.
     - Mở Thư viện sinh hoạt, chọn bé ("Bé Cloud").
     - Thẻ `WIT-DLY-01` hiển thị `data-status="graduated"`, huy hiệu `daily-living-graduated-badge` ("Bé đã tự làm") và nút `daily-living-practice-again` ("Luyện lại").
     - Bấm nút "Luyện lại" → mutation `update` gửi lên với `isActive: true, graduatedAt: null`.
     - Thông báo `daily-living-saved-notice` hiển thị với nội dung "Đã đặt lại thói quen để luyện tập".
     - Huy hiệu `daily-living-graduated-badge` biến mất khỏi thẻ, nút cập nhật thành `daily-living-added` ("Đã thêm").
     - Chuyển sang tab "Đang dùng" → mục `Mã việc: WIT-DLY-01` xuất hiện với trạng thái "Đang hoạt động".

3. **`Thêm cùng một mục từ hai tab trình duyệt cùng lúc (hai page cùng context/auth) -> chỉ còn 1 activity (không trùng)`** — **PASS** (`22.2s`)
   - **Mục tiêu**: Xác thực xử lý đồng thời khi cùng một gia đình mở hai tab trình duyệt cùng lúc và bấm "Thêm" cùng một thói quen sinh hoạt (`WIT-DLY-01`), hệ thống tạo ID đơn định và xử lý deduplication/idempotency để đảm bảo danh sách hoạt động chỉ có đúng 1 bản ghi duy nhất, cả hai tab đều hiển thị "Đã thêm" và "Đang dùng" chỉ có 1 thẻ.
   - **Các bước thực thi**:
     - Khởi tạo 2 page (`page1`, `page2`) trong cùng một `BrowserContext` (chia sẻ cookie xác thực auth của gia đình).
     - Cả hai tab cùng điều hướng đến Thư viện sinh hoạt và chọn bé ("Bé Cloud").
     - Cả hai tab đều thấy thẻ `WIT-DLY-01` có nút "Thêm" khả dụng.
     - Kích hoạt đồng thời qua `Promise.all` việc bấm nút "Thêm" trên cả hai tab.
     - Cả hai tab nhận phản hồi thành công và nút chuyển sang `daily-living-added` ("Đã thêm").
     - Kiểm tra mảng lưu trữ hoạt động phía backend: `WIT-DLY-01` chỉ tồn tại đúng 1 activity (`toHaveLength(1)`).
     - Chuyển sang tab "Đang dùng" trên cả `page1` và `page2`: `Mã việc: WIT-DLY-01` mỗi tab chỉ xuất hiện đúng 1 lần (`toHaveCount(1)`).

---

## 3. Lệnh kiểm tra tĩnh (`eslint` & `tsc`)

```bash
npx eslint tests/e2e/daily-living-restore.spec.ts && npx tsc --noEmit
```
**Kết quả**: Thoát mã `0`, không có bất kỳ lỗi cú pháp, kiểu dữ liệu hay linting nào.

---

## 4. Lỗi sản phẩm (nếu có)
- **Không có lỗi sản phẩm nào phát sinh**.
- Toàn bộ cơ chế:
  - Khôi phục thói quen lưu trữ (`handleRestore` -> `updateActivity({ isActive: true })`)
  - Luyện lại thói quen đã tốt nghiệp (`handlePracticeAgain` -> `updateActivity({ graduatedAt: null, isActive: true })`)
  - ID đơn định và cơ chế xử lý xung đột đồng thời (`toHabitActivity` -> `dailyLivingActivityId` + idempotency khi trùng ID)
  đều hoạt động ổn định và chính xác theo thiết kế.

---

## 5. Tình trạng Workspace
- File thêm mới: `tests/e2e/daily-living-restore.spec.ts`
- File đã khôi phục: `AGENTS.md` (giữ sạch theo quy định).
- Thư mục tạm `test-results`: đã dọn sạch (`rm -rf test-results`).
- Cổng 3000: sạch, không có tiến trình treo.
- Không thực hiện `git commit` hay `git push` (chờ coordinator commit).
