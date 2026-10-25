# W5 — Chuyển đánh răng gộp sang sáng/tối

Ngày: 25/10/2026. Nhánh: `vanhoa2191/daily-living-wave5`; HEAD lúc bắt đầu: `de0eb03` (PR #205). Thực hiện trực tiếp trong worktree được giao, không tạo agent/worktree phụ.

## Kết quả và file sửa

- `src/lib/daily-living-habits.ts`: thêm `getToothbrushingConversion`, hàm quyết định thuần theo phạm vi bé/cả nhà. Nhận `WIT-PHY-02` theo ID, hàng legacy shared qua matcher hiện có, và starter tuổi 3–6 còn nguyên cấu trúc qua generator gốc. Không suy luận chỉ từ tên.
- `src/components/DailyLivingHabitLibrary.tsx`: lựa chọn mặc định **Giữ nguyên**, lựa chọn **Chuyển sang sáng + tối** và nút xác nhận riêng, chỉ khi cờ `dailyLivingHabits` bật và locale `vi`. Xem trước tên, lịch, sao từng mục và tổng trước/sau; chặn Thêm trực tiếp hai mục này khi đang có mẫu gộp để tránh thêm chồng. Khóa bấm đôi và đổi phạm vi khi đang lưu; thông báo thành công/lỗi có role và nhận focus.
- Cùng component: `convertToothbrushing` chỉ tạo phần thiếu qua `toHabitActivity` + `createActivities`. Sau boolean thành công, đợi React commit dữ liệu store/sync rồi kiểm tra cả hai mục đang hoạt động, đúng phạm vi, tổng sao không đổi so với bản xem trước và các mục gộp ban đầu vẫn thuộc phạm vi đã chọn. Chỉ sau đó gọi `updateActivity(id, { isActive: false })`; không xóa, không chép/sửa log, không thay điểm hay thông tin cũ.
- `src/lib/i18n/daily-living-copy.ts`: toàn bộ copy mới, gồm shared, khôi phục, lỗi lưu và lỗi tạm dừng sau khi đã xác nhận cặp mới.
- `tests/unit/daily-living-toothbrushing.test.ts`: quyết định thuần, nhận diện cấu trúc, phạm vi, trùng, mục đã tạm dừng/ra trường và tổng sao.
- `tests/unit/daily-living-toothbrushing-ui.test.ts`: markup và handler UI trong Vitest/node, cùng các ca giả lập lưu/readback/tạm dừng lỗi, thiếu một nửa, retry, shared, bấm đôi và reset lựa chọn khi đổi phạm vi. Không dùng trình duyệt hoặc DOM mới.
- `plans/261024-daily-living-habits/execution/w5-report.md`: báo cáo này.

Tái sử dụng adapter, store actions, ID tất định, matcher và kiểu giao diện hiện có; không thêm dependency hoặc đường lưu riêng. Không sửa `WIT_HABIT_PACKS`, catalog 47 framework habits, 20 programs, schema hoặc migration.

## Phạm vi shared và khôi phục

- Đang chọn một bé mà mục gộp là shared: giữ nguyên mục shared, không tạo cặp mới qua chuyển đổi; hướng dẫn chọn rõ **Cả nhà**.
- Chọn **Cả nhà**: chỉ chuyển mục gộp shared thành hai mục shared; không tạm dừng mục gộp riêng của bé khác.
- Nếu tạo shared sẽ chồng lên DLY sáng/tối đã có riêng cho bé, chặn chuyển cả nhà và giải thích; không tự sửa/xóa các assignment của bé.
- Mục sáng/tối đang hoạt động được dùng lại nguyên trạng; chỉ thêm nửa thiếu. Mục đã tạm dừng/ra trường cần chủ động **Khôi phục/Luyện lại** bằng các nút sẵn có trước khi chuyển, không tự kích hoạt hoặc tạo bản trùng.
- Lưu thất bại/không xác nhận hoặc readback thiếu: không gọi cập nhật mục gộp. Dữ liệu xuất hiện sau đó không tự kích hoạt tạm dừng; cần xác nhận chuyển lại.
- Cặp mới đã xác nhận nhưng tạm dừng lỗi: thông báo riêng, giữ cặp mới; lần xác nhận sau dùng lại cặp hiện hữu và thử tạm dừng, không tạo trùng.

## Kiểm chứng đã thực thi

- Đã viết hai file test mới trước implementation, chạy `npx vitest run tests/unit/daily-living-toothbrushing.test.ts tests/unit/daily-living-toothbrushing-ui.test.ts`: **đỏ, 30 fail / 3 pass**, do chưa có hàm/UI chuyển đổi. Sau đó bổ sung các ca shared chồng assignment, handler UI và tổng sao thay đổi, quan sát đỏ trước khi thêm chốt tương ứng.
- `npx vitest run tests/unit/daily-living-toothbrushing.test.ts tests/unit/daily-living-toothbrushing-ui.test.ts tests/unit/daily-living-parent-ui.test.ts`: **47/47 pass** ở mốc trước khi thêm ca readback đổi tổng sao. Ca đổi tổng sao tiếp theo đã quan sát **1 fail / 24 pass** trước khi sửa implementation; kết quả cuối nằm trong lần chạy toàn bộ dưới đây.
- `npm run lint && npm run typecheck && npx vitest run`: **exit 0**; lint không lỗi/cảnh báo, typecheck pass, **351 file / 3.872 test pass**, 0 fail. Vitest chạy trong 177,73 giây; gồm toàn bộ 38 ca mới của W5 và các regression hiện hữu.
- `npm run verify:habit-framework`: **pass**, 47 bản ghi; source SHA-256 `85460efcafe42bc585582954dbb559969126b3e09da79c0929762563773f31d0`.
- `npm run verify:habit-framework-translation`: **pass**, 8 bản dịch, 47 habits × 5 stages.
- `/home/opc/.agents/skills/impeccable/scripts/impeccable detect --json src/components/DailyLivingHabitLibrary.tsx`: **exit 0**, kết quả `[]`; đây là detector cơ học, không phải nghiệm thu trình duyệt.
- `git diff --check` và `git diff --cached --check`: sạch sau khi hoàn thành báo cáo và stage đúng 6 đường dẫn W5.
- Đã dùng `git checkout -- AGENTS.md` để hoàn tác tiêu đề do Next sinh lại; file này không thuộc commit W5.

## Điểm chưa chắc và giới hạn

- Không chạy Playwright/E2E, không chiếm cổng 3000, không chạy SQL, không đặt biến repo, không push/merge/mở PR. Browser E2E, responsive 375px, keyboard/screen reader thật và live cloud thuộc lane nghiệm thu khác.
- Không có screenshot/reference cho visual-verdict; chưa có bằng chứng thị giác trên trình duyệt trong lane này.
- Đây là chuỗi tạo → readback → tạm dừng dùng API hiện có, không phải transaction xuyên nhiều request. Nếu lỗi sau tạo, cặp mới có thể đã tồn tại cùng mục gộp; thông báo yêu cầu kiểm tra đồng bộ và xác nhận lại. Nếu có nhiều mục gộp trùng sẵn, tạm dừng có thể thành công một phần; retry chỉ xử lý các mục gộp còn hoạt động.
- Readback kiểm tra dữ liệu store sau sync/commit; chưa kiểm thực tế với Supabase hoặc mất mạng. Thay đổi đồng thời từ tab khác sau lần readback cuối vẫn là giới hạn của API nhiều request hiện có.
- Starter tuổi đã bị chỉnh cấu trúc, hoặc custom activity chỉ trùng tiêu đề, không được tự nhận là mẫu gộp. Đây là lựa chọn bảo thủ để không tạm dừng nhầm.
- File E2E do lane khác tạo trong worktree được giữ nguyên và không thuộc commit W5.
