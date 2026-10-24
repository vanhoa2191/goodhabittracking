# Ma trận nghiệm thu — coordinator, 24/10/2026

Bằng chứng do coordinator tự chạy lại (không dựa vào báo cáo worker). Bản của lane V (`v-report.md`, `v-acceptance-matrix-DISCARDED.md`) bị loại: nhiều kết luận sai (khẳng định thiếu rollback và có khoảng trắng thừa, trong khi cả hai đều không đúng).

Lệnh đã chạy trên `vanhoa2191/daily-living-habits`: `npm run lint` (sạch), `npm run typecheck` (sạch), `npx vitest run` (3834 pass / 0 fail), `npm run verify:habit-framework` (47 bản ghi), `npm run verify:habit-framework-translation`, `git diff --check origin/main..HEAD` (sạch), `npx playwright test daily-living-habits habit-programs-start activity-mutation --project=chromium` (13/13 pass), `npm run test:sql` + runtime DLY trên PostgreSQL 18 dùng một lần (lane B, báo cáo `B-report.md`; coordinator chưa chạy lại do cần Docker).

| # | Tiêu chí (plan.md mục 6 / 10) | Trạng thái | Bằng chứng | Khoảng trống |
|---|---|---|---|---|
| 1 | Thư viện thấy "Sinh hoạt hằng ngày", tìm được đánh răng/rửa mặt | ĐẠT | E2E "Thư viện…" (daily-living-habits.spec.ts) | — |
| 2 | 12 mục, ID duy nhất, bộ chỉ tham chiếu ID hợp lệ, hai mục cũ dùng ID cũ | ĐẠT một phần | `tests/unit/daily-living-habits.test.ts` | Không có bản sao khi thêm từ hai đường khác nhau: chỉ chắc trong cùng tab (store) và qua `legacyTemplateId`/matcher; chấp nhận rủi ro hai tab (execution-plan 10.1) |
| 3 | Chọn lẻ/chọn bộ cùng loại activity, mặc định đúng bé; "cả nhà" phải chọn rõ | ĐẠT | E2E thư viện, bộ, "Hai bé" | — |
| 4 | Sáng không hoàn thành tối; mỗi mục/ngày một lần điểm; hoàn tác đúng mục; rửa tay không là log từng bữa | ĐẠT | E2E "Sáng/tối độc lập"; unit `daily-living-parent-ui.test.ts`; ghi chú rửa tay trong thẻ | — |
| 5 | Áp lại bộ, bấm hai lần, gửi lại sau timeout: không trùng | ĐẠT một phần | E2E "Bấm nhanh hai lần"; `tests/api/activity-mutations.test.ts` (23505 idempotent, ID lạ vẫn 409); PostgreSQL 2 kết nối đồng thời (B) | Chưa có E2E hai tab thật; timeout → "Lưu chưa được xác nhận" chỉ kiểm bằng unit/logic |
| 6 | Chọn một mục trong bộ, sửa lịch/sao trước khi xác nhận; hủy không tạo; mặc định 1–2 việc | ĐẠT | E2E "Bộ thói quen" | — |
| 7 | Bộ có mục đã tồn tại chỉ thêm phần thiếu; bé A không chặn bé B; mục chung tính cho cả hai | ĐẠT | E2E "Bộ thói quen", "Hai bé"; unit `dailyLivingStatus` | — |
| 8 | Mẫu đánh răng gộp được giữ; chuyển đổi chủ động, không mất log | CHƯA LÀM | — | Thuộc Wave 5 (PR riêng). MVP không đụng `WIT-PHY-02`, nên mẫu gộp đương nhiên được giữ nguyên |
| 9 | Đổi tên, chỉnh lịch, lưu trữ/khôi phục, sync lại vẫn giữ định danh | ĐẠT một phần | Unit status (archived/graduated); roundtrip mapper→backup→pairing (B) | Khôi phục/Luyện lại chưa có E2E; sync cloud thật chưa chạy |
| 10 | Local/demo, API, child session, backup/restore giữ lịch, scope, ID, điểm; cross-family bị từ chối | ĐẠT một phần | E2E (demo); `tests/api`, PG runtime cross-family (B) | Chưa thử trên Supabase thật |
| 11 | 47 framework, 20 program, ID template cũ vẫn pass; dịch cũ không đổi | ĐẠT | verify:habit-framework(-translation); vitest toàn bộ | — |
| 12 | 375px và desktop không tràn ngang; bàn phím; focus; thông báo đọc được | ĐẠT một phần | E2E a11y 375px + axe (serious/critical = 0) trên thư viện và modal | Chưa duyệt bằng trình đọc màn hình thật |
| O | Onboarding: chỉ đánh răng sáng + rửa mặt → đúng 2 mục ở Đang dùng và màn hình bé | ĐẠT | E2E "Onboarding"; `onboarding-wizard.test.ts` | — |
| F | Cờ tắt: hành vi cũ giữ nguyên | ĐẠT (gián tiếp) | Toàn bộ test cũ vẫn pass với cờ mặc định tắt (vitest); E2E hồi quy chạy với cờ bật | Chưa chạy E2E cũ với cờ tắt |
| M | Migration additive, có preflight/rollback có guard | ĐẠT | `supabase/{migrations,preflight,rollbacks}/202610250001_*`; PG runtime (B) | Chưa áp lên Supabase production |
