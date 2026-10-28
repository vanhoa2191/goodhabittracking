# Audit: daily-living habits and toothbrushing split

Ngày: 27/10/2026  
Phạm vi: catalog `daily-living-habits`, thư viện/bộ/onboarding, WIT-PHY-02 conversion, i18n/flag, API/store contract, migration `202610250001`, rollback/preflight, và tests hiện có.

## Tóm tắt

- P0: 0
- P1: 0
- P2: 1
- P3: 1

Đã xác nhận migration mở rộng namespace WIT-DLY ở cả API validator và DB CHECK; preflight kiểm tra constraint đã validate và rollback chặn khi còn hàng DLY. Catalog có 12 mục, 4 bộ; bộ/onboarding chỉ dùng khi `NEXT_PUBLIC_DAILY_LIVING_HABITS=true` và locale `vi`. Chuyển đổi đánh răng giữ activity cũ và không chép log; test chuyển đổi xác nhận các nhánh shared, điểm tùy chỉnh, starter theo tuổi và trạng thái khôi phục.

## Phát hiện

### P2 — Thêm mục shared có thể chồng lên activity riêng của một bé

**Vị trí:** `src/lib/store/activity-actions.ts:11-24`; `src/lib/daily-living-habits.ts:243-260`.

**Bằng chứng:** Khi candidate là shared (`childId === null`), `overlapsDailyLivingAssignment` gọi `dailyLivingStatus(template, '', existing)` và chỉ từ chối nếu kết quả là `sharedCovers`. `dailyLivingStatus` lọc activity liên quan bằng `a.childId === childId || a.childId === null`, nên với scope rỗng nó loại toàn bộ activity đang gán riêng cho bé. Cùng template vì thế vẫn được thêm dưới dạng shared dù một bé đã có bản riêng; hai activity cũng có ID khác do ID DLY bao gồm scope (`src/lib/daily-living-habits-id.ts:88-101`).

**Kịch bản lỗi:** Phụ huynh thêm “Đánh răng sáng” riêng cho bé A, sau đó chọn “Cả nhà” cho cùng mục. Bé A nhận hai activity cùng ngày và có thể hoàn thành/nhận sao hai lần; các bé khác cần thêm riêng vẫn nên được phép.

**Đề xuất:** Khi chọn shared, kiểm tra mọi assignment đang hoạt động của cùng template trước khi insert; nếu có assignment riêng, yêu cầu xác nhận chuyển phạm vi hoặc giữ mục riêng. Bổ sung test cho child-existing → shared-add và kiểm tra xử lý đồng thời ở server nếu cần đảm bảo invariant giữa nhiều tab.

### P3 — Câu gợi ý có lẫn tiếng Trung

**Vị trí:** `src/data/daily-living-habits-v1.vi.json:95`.

**Bằng chứng:** Cue của `WIT-DLY-07` là `Sau khi thay đồ睡觉`; phần `睡觉` là chữ Trung, trong khi catalog khai báo `language: "vi"` và ngôn ngữ đang bật cho tính năng là tiếng Việt.

**Kịch bản lỗi:** Khi mở phần hướng dẫn của mục cất quần áo bẩn, người dùng Việt nhìn thấy cue bị lỗi ngôn ngữ.

**Đề xuất:** Thay bằng câu tiếng Việt phù hợp, ví dụ “Sau khi thay đồ” hoặc “Trước khi đi ngủ”, rồi thêm kiểm tra copy catalog để bắt ký tự ngoài ngôn ngữ dự kiến.

## Kiểm chứng

- `npm test -- tests/unit/daily-living-habits.test.ts tests/unit/daily-living-habits-id.test.ts tests/unit/daily-living-toothbrushing.test.ts tests/unit/daily-living-toothbrushing-ui.test.ts tests/unit/daily-living-parent-ui.test.ts tests/api/activity-mutations.test.ts tests/integration/migrations/daily-living-template-refs.test.ts`: **7 file, 138 test pass**.
- `npm run typecheck`: pass (`tsc --noEmit`).
- `npm run lint`: pass (`eslint . --max-warnings=0`).
- Integration test migration hiện parse SQL và kiểm tra nội dung migration/preflight/rollback; không chạy harness migration runtime. E2E cùng scope có kịch bản hai tab đồng thời, nhưng không bao phủ child-existing → shared-add.
- Không sửa mã sản phẩm, không chạy migration hoặc script `verify-live-*`. Chỉ tạo báo cáo audit này.
