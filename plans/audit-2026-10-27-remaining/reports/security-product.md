# Audit security + product logic — 2026-10-28

**Phạm vi:** reward/PIN management, thao tác khóa, thói quen vai trò cha mẹ ở GD1 và hồi quy pha duy trì trên `origin/main` tại nhánh `vanhoa2191/audit-remaining`. Chỉ đọc source/test và chạy test mục tiêu; không sửa code, migration, không truy cập DB/prod.

## Phát hiện

### SEC-AUTH-01 — P2 — Quản lý phần thưởng không kiểm PIN trước khi ghi

- **Vị trí:** `src/app/api/domain/rewards/route.ts:78-100`; RLS tại `supabase/migrations/202609190001_family_tenancy.sql:400-424`; danh sách revoke tại `supabase/migrations/202609300004_authoritative_command_hardening.sql:390-403`.
- **Bằng chứng:** sau xác thực parent và validate body, route gọi insert/update/delete trên `rewards` bằng authenticated server client mà không gọi `requireParentUnlock`. Các policy insert/update/delete tạo theo `can_manage_family(family_id)`; migration revoke DML sau đó không gồm `rewards`. Test API hiện dựng request không có unlock cookie và vẫn kỳ vọng create/update/delete trả 200 (`tests/api/reward-mutations.test.ts:75-108`). Đây xác nhận đường đi của route; audit này không truy cập DB để xác nhận ACL thực tế đã deploy.
- **Kịch bản lỗi:** phụ huynh có phiên đăng nhập nhưng không mở khóa PIN trên trình duyệt gửi request cùng nguồn để thay/xóa phần thưởng; route thực hiện ghi vì chỉ yêu cầu membership/role.
- **Đề xuất:** kiểm tra `requireParentUnlock` rồi chuyển DML sang service-role server client với tenancy lấy từ parent context; thêm migration mới thu hồi DML `authenticated` trên `rewards` và test guard cho create/update/delete cùng grant.

### SEC-AUTH-02 — P2 — Giao diện báo khóa trước khi server xóa unlock cookie

- **Vị trí:** `src/lib/store.tsx:603-607`; xóa cookie tại `src/app/api/parent-pin/route.ts:58-63`; TTL và kiểm tra cookie tại `src/lib/security/parent-unlock.ts:76-93`, `:100-118`.
- **Bằng chứng:** `lockParent` chuyển ngay sang `kid`, rồi gọi `void fetch(...).catch(...)`; không chờ phản hồi, kiểm tra `response.ok` hoặc báo lỗi. Route xóa cookie bằng `Set-Cookie`; helper kiểm chữ ký HMAC, family/user, phiên bản PIN và hạn dùng hai giờ, không có trạng thái thu hồi phía server. HTTP 4xx/5xx không làm `fetch` reject nên `.catch` không xử lý các phản hồi đó.
- **Kịch bản lỗi:** kết nối lỗi hoặc server trả 503 khi phụ huynh bấm khóa; UI vẫn hiện chế độ bé trong khi cookie cũ vẫn dùng được cho tới hết hạn.
- **Đề xuất:** chỉ chuyển giao diện sau khi DELETE trả thành công; lúc chờ chặn thao tác phụ huynh, khi lỗi giữ nguyên parent mode và hiển thị lựa chọn thử lại. Nếu sản phẩm cần thu hồi tức thì ngay cả khi phản hồi bị mất, cookie tự chứa HMAC cần cơ chế thu hồi server-side.

### PROD-LOGIC-01 — P2 — Hoạt động do cha mẹ làm có thể cộng tiến độ và sao cho hồ sơ bé

- **Vị trí:** `src/lib/habit-framework/catalog.ts:162-171`; `src/lib/store/local-habit-actions.ts:129-168`; `supabase/migrations/202610210001_thinking_games.sql:1005-1022`, `:1037-1059`.
- **Bằng chứng:** GD1 activities được tạo với `isParentRole: true`, 10 điểm và không cần duyệt. Local toggle không loại `isParentRole`: nó ghi log, cộng điểm, streak và badge progress. Hai RPC hoàn thành cuối cùng trong migration thinking-games cũng không kiểm `activity.is_parent_role`; cả parent và child command ghi log/cộng điểm, rồi đồng bộ bonus game.
- **Kịch bản lỗi:** phụ huynh gán hoặc bắt đầu chương trình GD1 cho bé; khi hoạt động làm gương của phụ huynh được đánh dấu xong, hồ sơ bé tăng điểm/streak và có thể mở badge hoặc đổi thưởng.
- **Đề xuất:** chặn parent-role activity khỏi child-completion ở client và authoritative RPC trước khi tạo log; nếu muốn theo dõi hành vi phụ huynh thì lưu xác nhận riêng không tăng tiến độ/điểm. Regression cần phủ local, parent RPC và child-session RPC.

### PROD-LOGIC-02 — P2 — Pha duy trì có thể lùi trước đủ một cửa sổ cơ hội

- **Vị trí:** `src/lib/habit-programs/phase.ts:87-97`; hợp đồng `docs/habit-science-and-adaptive-logic.md:120-129`.
- **Bằng chứng:** code yêu cầu `inPhase >= windowSize` trước khi chuyển build→fade và fade→maintain, nhưng maintain→fade chỉ xét tỷ lệ hoàn thành của cửa sổ trượt. Evaluator đặt `inPhase = 0` khi vào maintain. Tài liệu quy định phải có N cơ hội trong pha trước khi xét chuyển (10 theo ngày, 6 theo tuần).
- **Kịch bản lỗi:** ngay sau khi vào maintain, vài lần bỏ lỡ kéo tỷ lệ cửa sổ gần nhất xuống dưới ngưỡng; evaluator lùi pha trước khi maintain tích lũy đủ 10/6 cơ hội và cửa sổ còn có thể chứa dữ liệu fade.
- **Đề xuất:** chỉ xét maintain→fade khi đủ `windowSize` cơ hội trong maintain; cửa sổ lúc đó sẽ chỉ gồm các cơ hội của pha hiện tại. Thêm test regression cho cadence ngày và tuần.

## Đối chiếu bản sửa song song

`../emperor` hiện có PIN guard cho route rewards, migration `202610260001_reward_pin_security.sql`, và migration `202610260002_parent_role_activity_guard.sql` có guard trước khi ghi log (`../emperor/supabase/migrations/202610260002_parent_role_activity_guard.sql:27-32`, `:96-105`). Nhưng trên nhánh audit này, `202610210001_thinking_games.sql` định nghĩa lại chính hai RPC completion đó mà không giữ guard (`supabase/migrations/202610210001_thinking_games.sql:1005-1022`, `:1037-1059`). Khi merge, thứ tự version sẽ chạy `202610260002` trước `202610210001`, nên bản sửa này không còn hiệu lực cuối cùng. Cần migration hợp nhất có version mới hơn `202610270001`, giữ đồng thời guard parent-role, khóa game và bonus sync; đây là cùng xung đột DB/CI đã ghi tại `reports/tg-db-ci.md`, không tính thành phát hiện thứ năm ở đây.

Migration thu hồi ghi `rewards` của `../emperor` cũng chưa có trong schema manifest của audit branch và chưa được áp/đối chiếu ACL thực tế. Việc nâng schema version tối đa không tự chứng minh migration `202610260001` đã được ghi nhận; theo dõi gate này trong `reports/tg-db-ci.md`.

## Kiểm chứng

- Chạy `flock /tmp/emperor-heavy.lock npx vitest run tests/api/reward-mutations.test.ts tests/api/parent-pin-unlock.test.ts tests/unit/local-habit-actions.test.ts tests/unit/habit-programs/phase.test.ts`: **4 file, 28 test pass**. Các test hiện hành không bao phủ đầy đủ nhánh PIN bị thiếu hoặc parent-role; test pass không phủ định findings.
- Đọc các migration hiện có và policy/function định nghĩa cuối cùng trong chuỗi source; không chạy PostgreSQL runtime, nên không xác nhận ACL/trạng thái migration thực tế của DB production.
- Không chạy lint/typecheck/build toàn repo, không chạy `verify-live-*`, không sửa code hay dữ liệu.

**Tổng:** P0 0 · P1 0 · P2 4 · P3 0.
