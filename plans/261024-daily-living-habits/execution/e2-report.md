# Báo cáo Lane E2 — E2E Playwright `daily-living-habits.spec.ts`

## 1. Tóm tắt kết quả
- Toàn bộ **8/8 bài kiểm thử** trong `tests/e2e/daily-living-habits.spec.ts` đã chạy **PASS** (`--project=chromium`).
- Đã phát hiện và sửa **1 lỗi sản phẩm thật** trong luồng Onboarding (`src/components/onboarding/HabitsStep.tsx`).
- Kiểm tra tĩnh (`npx eslint` và `npx tsc --noEmit`) sạch 100% không có lỗi hay cảnh báo.

## 2. Lệnh đã chạy & Kết quả thật từng test

### Lệnh chạy Playwright E2E
```bash
timeout 900 npx playwright test tests/e2e/daily-living-habits.spec.ts --project=chromium --reporter=list > /tmp/dlh/e2-run.log 2>&1
```

### Kết quả chi tiết 8 kịch bản (`8 passed (1.6m)`)
1. **`Thư viện: Sinh hoạt hằng ngày mặc định, có Đánh răng buổi sáng và Rửa mặt; thêm Đánh răng sáng → thông báo lưu, nút thành Đã thêm; tải lại vẫn Đã thêm`** — **PASS** (`20.1s`)
   - Xác nhận tab `library-tab-daily` có `aria-pressed="true"` mặc định.
   - Thẻ `WIT-DLY-01` ("Đánh răng buổi sáng") và `WIT-DLY-03` ("Rửa mặt") hiển thị đầy đủ.
   - Chọn bé, bấm `daily-living-add` trên `WIT-DLY-01` → hiện `daily-living-saved-notice` ("Đã lưu thói quen sinh hoạt"), nút chuyển sang `daily-living-added` ("Đã thêm").
   - Tải lại trang (`page.reload()`), mở lại thư viện và chọn lại bé → vẫn giữ trạng thái `Đã thêm`.
2. **`Sáng/tối độc lập: thêm cả Đánh răng sáng và tối; hoàn thành sáng không làm tối; hoàn tác chỉ mục đó; mục sáng/tối nằm đúng nhóm`** — **PASS** (`15.2s`)
   - Thêm cả `WIT-DLY-01` (sáng) và `WIT-DLY-02` (tối).
   - Ở danh sách `Đang dùng` của phụ huynh, hai mục hiển thị đúng nhãn buổi (`Buổi sáng` / `Buổi tối`).
   - Sang màn hình của bé (`KidDashboard`), hai mục nằm đúng nhóm `Buổi sáng` và `Buổi tối`.
   - Đánh dấu hoàn thành `Đánh răng buổi sáng` → chỉ `WIT-DLY-01` đổi `data-complete="true"`, `WIT-DLY-02` vẫn `data-complete="false"`.
   - Đóng hộp thoại chúc mừng huy hiệu đầu tiên (`badge-celebration`), bấm hoàn tác `WIT-DLY-01` → `WIT-DLY-01` trở về `data-complete="false"`, `WIT-DLY-02` giữ nguyên `data-complete="false"`.
3. **`Bộ thói quen: "Buổi sáng gọn gàng" modal mặc định tick tối đa newHabitLimit mục chưa có, hiện tổng sao; hủy không tạo; xác nhận → về Đang dùng, lọc đúng bé, thông báo role=status có focus; mở lại bộ thì mục đã có hiện "Đã có" và không chọn được; bộ không còn mục thiếu báo rõ`** — **PASS** (`15.2s`)
   - Mở bộ `DLS-02` ("Buổi sáng gọn gàng"), chọn bé Nguyễn Mai Chi (4 tuổi, `newHabitLimit = 2`) → mặc định tick đúng 2 mục đầu tiên chưa có (`WIT-DLY-01`, `WIT-DLY-03`), hiện `Tổng sao: 10 ⭐`.
   - Bấm Hủy (`daily-living-set-cancel`) → đóng modal, không tạo hoạt động nào trong `Đang dùng`.
   - Mở lại `DLS-02`, chọn bé, bấm Xác nhận (`daily-living-set-confirm`) → chuyển về `Đang dùng`, bộ lọc `Lọc theo bé` chọn đúng bé, thông báo `program-started` (`role="status"`) hiển thị và nhận focus.
   - Mở lại `DLS-02` → `WIT-DLY-01` và `WIT-DLY-03` hiện trạng thái `Đã có` và checkbox bị `disabled`.
   - Mở bộ `DLS-01` ("Bắt đầu nhẹ nhàng" chỉ gồm `WIT-DLY-01` và `WIT-DLY-03`) → hiện thông báo `daily-living-set-all-added` ("Bé đã có đầy đủ các thói quen trong bộ này.") và nút xác nhận bị `disabled`.
4. **`Bấm nhanh hai lần nút Thêm / áp lại bộ: tổng số thói quen đúng, không trùng`** — **PASS** (`12.1s`)
   - Kích hoạt đồng thời hai lần `.click()` liên tiếp trên nút `daily-living-add` của `WIT-DLY-01`, sau đó áp tiếp bộ `DLS-01` (gồm `WIT-DLY-01` và `WIT-DLY-03`).
   - Kiểm tra trong `Đang dùng`: `Mã việc: WIT-DLY-01` và `Mã việc: WIT-DLY-03` mỗi mục chỉ xuất hiện đúng 1 lần (`toHaveCount(1)`).
5. **`Hai bé: bé A có mục không chặn thêm cho bé B; mục "Cả nhà" chỉ khi chọn rõ, rồi mọi bé thấy "Đã thêm (mục chung)"`** — **PASS** (`34.0s`)
   - Thêm `WIT-DLY-01` cho bé A → bé A hiện `Đã thêm`, chuyển sang bé B vẫn hiện nút `Thêm` khả dụng và thêm được cho bé B.
   - Chọn phạm vi `Cả nhà` (`shared`), kiểm tra hiển thị ghi chú `daily-living-shared-note`, thêm `WIT-DLY-03` → chuyển lần lượt sang bé A và bé B đều thấy `Đã thêm (mục chung)`.
6. **`Onboarding: phụ huynh mới chọn "Bắt đầu với sinh hoạt hằng ngày", giữ đánh răng sáng + rửa mặt, hoàn tất → đúng 2 mục ở Đang dùng và ở màn hình bé`** — **PASS** (`32.7s`)
   - Đi qua 5 bước Onboarding tại `/start`: nhập tên bé ở Bước 1, chọn nguồn `Bắt đầu với sinh hoạt hằng ngày` ở Bước 2 (giữ 2 mục mặc định `Đánh răng buổi sáng` + `Rửa mặt`), qua Bước 3, xác nhận ở Bước 4 (`Bé Test, 5 tuổi · 2 thói quen · 1 quà`), chọn `Dùng chung máy này` và `Bỏ qua, mở màn hình của bé` ở Bước 5.
   - Màn hình bé hiển thị đúng 2 thẻ nhiệm vụ (`Đánh răng buổi sáng` và `Rửa mặt`).
   - Mở chế độ Phụ huynh → `Đang dùng` hiển thị đúng `Đang dùng (2)` với `Mã việc: WIT-DLY-01` và `Mã việc: WIT-DLY-03`.
7. **`a11y 375px: viewport 375x800 không tràn ngang trên Thư viện sinh hoạt và modal bộ`** — **PASS** (`11.6s`)
   - Kiểm tra `document.documentElement.scrollWidth <= 375` trên cả màn hình `daily-living-library` và bên trong `DailyLivingSetModal`.
8. **`a11y Axe: không có serious/critical violations trên Thư viện sinh hoạt và modal bộ`** — **PASS** (`13.4s`)
   - Quét `AxeBuilder` trên `[data-testid="daily-living-library"]` và `[role="dialog"]` của `DailyLivingSetModal` → `0` lỗi `serious`/`critical`.
   - Nhấn `Escape` đóng modal và trả focus về đúng nút mở bộ `daily-living-set-start`.

### Lệnh kiểm tra tĩnh (`eslint` & `tsc`)
```bash
npx eslint tests/e2e/daily-living-habits.spec.ts src/components/DailyLiving*.tsx src/components/onboarding/HabitsStep.tsx
npx tsc --noEmit
```
- Kết quả: `0` lỗi, `0` cảnh báo.

## 3. Lỗi sản phẩm thật đã phát hiện và sửa

### Lỗi: Chọn nguồn "Bắt đầu với sinh hoạt hằng ngày" trong Onboarding vẫn giữ các thói quen theo độ tuổi ở trạng thái được chọn (`src/components/onboarding/HabitsStep.tsx`)
- **Hiện tượng**: Ở Bước 2 Onboarding (`HabitsStep`), khi phụ huynh chuyển radio từ nguồn mặc định (`Gợi ý theo độ tuổi của bé`) sang `Bắt đầu với sinh hoạt hằng ngày` (`switchSource('daily')`), hàm `switchSource` trước đây gộp `habits: [...ageHabits, ...dailyHabits]` nhưng vẫn giữ `selected: true` trên các thói quen theo độ tuổi (`ageHabits`). Hệ quả là:
  - Bước 4 (`ConfirmStep`) đếm tổng số thói quen có `selected: true` thành `4 thói quen` thay vì `2 thói quen`.
  - Khi gửi Onboarding (`submitOnboarding`), hệ thống tạo cả 2 thói quen theo độ tuổi lẫn 2 thói quen sinh hoạt hằng ngày (tổng cộng 4 việc thay vì 2 việc `WIT-DLY-01` và `WIT-DLY-03`).
- **Cách sửa**: Trong `src/components/onboarding/HabitsStep.tsx`, khi chuyển `habitSource` sang `'daily'`, đặt `habits: initialDailyHabitSelection(draft.childAge)`; khi chuyển về `'age'`, đặt `habits: initialHabitSelection(draft.childAge)`.

## 4. Các điều chỉnh trong spec E2E (`tests/e2e/daily-living-habits.spec.ts`)
- Sửa bộ chọn thẻ thư viện và nút mở bộ: `data-template-id` nằm trực tiếp trên cùng phần tử với `data-testid="daily-living-card"` (và `data-set-id` nằm trên cùng phần tử với `data-testid="daily-living-set-start"`), nên dùng `[data-testid="daily-living-card"][data-template-id="..."]` và `[data-testid="daily-living-set-start"][data-set-id="..."]` thay vì `.filter({ has: page.locator(...) })` (vốn chỉ tìm phần tử con).
- Sửa điều hướng vào thư viện/chương trình/đang dùng khớp với UI thật: tab cấp 1 `Thiết kế` → tab cấp 2 `Quản lý việc` → nút chế độ xem `Đang dùng` / `Chương trình` / `Thư viện`.
- Ở kịch bản 2 (`Sáng/tối độc lập`), đóng modal chúc mừng huy hiệu đầu tiên (`badge-celebration`) xuất hiện sau lần hoàn thành việc đầu tiên trước khi bấm hoàn tác nhiệm vụ buổi sáng.
- Ở kịch bản 6 (`Onboarding`), thiết lập đầy đủ fixture đám mây (`installCloudFamilyFixture`) và route mocks cho `/api/domain/profiles`, `/api/domain/activities`, `/api/domain/rewards`, `/api/entitlement/trial`, `/api/privacy/consent`, `/api/parent-pin`, đồng thời đi qua đúng 5 bước của `OnboardingWizard`.
