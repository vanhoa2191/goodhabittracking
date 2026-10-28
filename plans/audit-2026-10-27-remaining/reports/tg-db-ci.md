# Audit DB + CI: thinking games và migration song song

Phạm vi: `origin/main` tại `ba93504`; đối chiếu các file chưa commit trong worktree nhánh `vanhoa2191/audit-all-project-areas` (`../emperor`). Chỉ đọc, không áp migration, không truy cập production.

## Phát hiện

### P1 — Hai migration ghi đè cùng RPC, khiến một trong hai bảo vệ bị mất

- **Vị trí:** `supabase/migrations/202610210001_thinking_games.sql:996-1060`; `../emperor/supabase/migrations/202610260002_parent_role_activity_guard.sql:3-153`; `supabase/schema.sql:72-75`.
- **Bằng chứng:** `202610210001` định nghĩa lại `complete_habit_command` và `complete_child_habit_command`, thêm khóa game và gọi `sync_thinking_game_bonus_for_child` sau khi ghi log, nhưng không kiểm tra `activity.is_parent_role`. `202610260002` cũng định nghĩa lại đúng hai chữ ký này, có kiểm tra `is_parent_role` tại dòng 30-32 và 103-105, nhưng không gọi khóa game hay đồng bộ bonus. Production đã tới `202610250001`, nên áp `202610260002` sau đó sẽ thay thế triển khai thinking games. Trên DB mới nếu áp theo thứ tự tên file, `202610210001` lại thay thế guard của `202610260002`.
- **Kịch bản:** trên production, lệnh hoàn thành thói quen không kích hoạt bonus game; trên DB mới, hoạt động `is_parent_role=true` có thể được hoàn thành và nhận điểm qua hai RPC. Trigger bonus tự động cũng đã bị xóa ở `202610210001:993-994`, nên không bù được sự thiếu đồng bộ trên production.
- **Sửa:** tạo một migration mới có version lớn hơn `202610270001` định nghĩa hai RPC một lần, giữ cả guard `is_parent_role`, khóa game và đồng bộ bonus; thêm test PostgreSQL cho cả hai thứ tự upgrade và DB mới. Không sửa migration đã áp production.

### P2 — Start trả puzzle cho entitlement bonus đã bị thu hồi

- **Vị trí:** `supabase/migrations/202610210001_thinking_games.sql:155-199`, `:461-485`, `:507-528`.
- **Bằng chứng:** khi một thói quen đã hoàn thành bị hoàn tác, `sync_thinking_game_bonus_for_child` đặt entitlement bonus thành `revoked_unused` hoặc `revoked_after_use`. `thinking_game_start` lại trả `ok:true`, `status:'available'` hoặc `'started'` cùng `public_payload` cho **mọi** entitlement có state khác `granted` trước khi tới kiểm tra `bonus_enabled` và điều kiện thói quen ở dòng 507-528. Các test race hiện có kiểm tra state sau undo (`thinking-games-authority-races-runtime.mjs:772-828`) nhưng không gọi start lần nữa.
- **Kịch bản:** bé đã mở khóa bonus, phụ huynh hoàn tác thói quen, rồi bé gọi `/api/child/thinking-games/start`; API nhận phản hồi thành công chứa puzzle của bonus đã bị thu hồi. Với attempt cũ, phản hồi còn mang attempt ID dù entitlement đã revoked.
- **Sửa:** xử lý riêng các state revoked/expired trước nhánh trả puzzle; chỉ cho resume các state hợp lệ sau khi kiểm tra lại quyền bonus. Thêm regression sau undo rồi start.

### P2 — Rollback thinking games bỏ sót bốn function đã tạo

- **Vị trí:** `supabase/migrations/202610210001_thinking_games.sql:293`, `:341`, `:424-425`, `:683-685`; `supabase/rollbacks/202610210001_thinking_games.rollback.sql:5-26`.
- **Bằng chứng:** migration tạo `thinking_game_resolve_age_track_for_child(uuid,uuid)`, `thinking_game_rollover_child(uuid,uuid,date)`, bản 5 tham số của `thinking_game_start`, và bản 6 tham số của `thinking_game_parent_start_as`. Rollback chỉ drop bản 4/5 tham số tương ứng của hai start RPC và không drop hai helper. Bài test rollback trong `thinking-games-security-runtime.mjs:69-72` chỉ xác nhận table audit bị xóa và `activity_logs` còn tồn tại.
- **Kịch bản:** rollback xong vẫn còn function game trong schema `public`; các RPC start còn grant từ migration, nhưng truy cập bảng đã drop sẽ lỗi. Việc áp lại migration có thể gặp trạng thái ACL/hàm tồn dư khó dự đoán.
- **Sửa:** drop đầy đủ chữ ký theo thứ tự phụ thuộc và mở rộng test rollback để kiểm tra `pg_proc` không còn function `thinking_game%`.

### P2 — Schema version tối đa không chứng nhận đủ migration bắt buộc

- **Vị trí:** `supabase/migrations/202610030001_caregiver_progress_projection.sql:88-98`; `src/app/api/health/route.ts:39-45`; `../emperor/src/lib/schema-version.ts:1`; `../emperor/supabase/migrations/202610270001_billing_lifecycle_recovery.sql:1`.
- **Bằng chứng:** `schema_version()` trả `max(version)` của migration ledger; health chỉ kiểm tra giá trị đó `>= EXPECTED_SCHEMA_VERSION`. Nhánh song song nâng kỳ vọng lên `202610270001`, cao hơn `202610260001/202610260002`. Không có kiểm tra các version bắt buộc hiện diện trong ledger.
- **Kịch bản:** ghi nhận/áp `202610270001` nhưng bỏ sót hai migration `20261012000x` vẫn cho `/api/health` báo schema sẵn sàng; deploy gate ở `.github/workflows/ci.yml:180-205` đi qua dù guard hoạt động phụ huynh hoặc ACL reward chưa được áp.
- **Sửa:** release preflight kiểm tra tập version bắt buộc (hoặc capability/ACL cụ thể), đặc biệt các migration backfill version thấp hơn max; đừng dùng `max(version)` làm bằng chứng duy nhất.

### P2 — CI PostgreSQL chỉ chạy smoke/security, bỏ qua hành vi game và parity

- **Vị trí:** `package.json:41`; `.github/workflows/ci.yml:26-50`; `tests/e2e/thinking-games-real-api.spec.ts:55-60`.
- **Bằng chứng:** `test:sql` chỉ chạy hai script thinking games: `thinking-games-security-runtime.mjs` và `thinking-games-settings-read-runtime.mjs`. Các script có sẵn về habit parity, integration, gameplay, admission, day gates và authority races không nằm trong job SQL. Job browser thinking games không provision Supabase/GoTrue/PostgREST; `thinking-games-real-api.spec.ts` tự skip trong CI khi thiếu `PLAYWRIGHT_REAL_STACK=1`.
- **Kịch bản:** một thay đổi làm hỏng bonus sync, attribution `user_id`, khóa/race hoặc kết quả gameplay vẫn có thể qua các gate CI hiện tại. `thinking-games-security-runtime.mjs` kiểm tra grant và rollback bề mặt, không thực thi các đường hành vi trên.
- **Sửa:** thêm tập SQL runtime quan trọng vào job `sql` theo thời gian chạy đo được, tối thiểu parity, integration, game state/start/finish và case thu hồi bonus; giữ test real-stack opt-in nếu chưa provision được.

## Kiểm tra và điểm không thấy lỗi

- `npx vitest run tests/unit/schema-version.test.ts tests/unit/thinking-games/release-bundle-build.test.ts`: **2 file, 5 test đạt**.
- `node scripts/check-thinking-games-release-bundle.mjs`: **đạt**, digest pin khớp, `1460` item qua release profile.
- `202610240001_thinking_games_settings_read.sql` chỉ cấp `SELECT` cho `authenticated` sau khi xác nhận forced RLS và family policy; test PostgreSQL riêng có các case cách ly tenant (`thinking-games-settings-read-runtime.mjs:13-49`).
- `202610210001` dùng `CREATE OR REPLACE` và không đổi ACL của sáu habit RPC cũ (`:1179-1184`); security runtime kiểm tra PIN-gated review RPC không mở cho `authenticated` (`thinking-games-security-runtime.mjs:38-58`). Attribution `auth.uid()`/`null` nằm tại `:1013-1015` và `:1051-1053`; parity runtime có assert tương ứng nhưng hiện không ở CI.
- Không có PostgreSQL/`psql` trong môi trường audit này, nên không chạy test SQL runtime. Không chạy lint/typecheck toàn repo vì chỉ ghi báo cáo và đã có kiểm tra mục tiêu; không chạy script live.

**Tổng: P0 0 · P1 1 · P2 4 · P3 0.**
