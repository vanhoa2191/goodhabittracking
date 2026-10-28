# Fix tg-db-ci

Phạm vi: `supabase/**`, `.github/workflows/ci.yml`, `tests/integration/migrations/**`, `src/lib/schema-version.ts`. Không commit, deploy, áp migration lên DB hay đụng production. Các chỉnh sửa ngoài phạm vi đang có trong worktree là của lane khác.

## Kết quả từng phát hiện

### P1 — Hai migration ghi đè hai habit RPC

**Xác nhận.** `202610210001_thinking_games.sql` định nghĩa cả hai RPC với khóa game và bonus sync nhưng thiếu `is_parent_role`; migration guard `202610120002` ở nhánh audit song song định nghĩa lại cùng chữ ký nhưng thiếu hai hành vi game. Tạo `202610280001_reconcile_thinking_games_guard.sql` sau các migration song song, định nghĩa hai RPC với cả guard, lock và sync. Test mới `thinking-games-reconcile-runtime.mjs` kiểm tra hai thứ tự upgrade và guard ở cả hai RPC; `thinking-games-habit-integration-runtime.mjs` kiểm tra guard và đường hoàn thành thường. Rollback migration mới **fail closed** (`unsafe_rollback_requires_forward_fix`) theo quyết định coordinator vì cả hai định nghĩa trước đó đều không an toàn để khôi phục.

### P2 — Start trả puzzle bonus đã thu hồi

**Xác nhận.** Start cũ trả entitlement ở mọi state khác `granted` trước khi kiểm tra điều kiện bonus. Migration mới chặn `revoked_unused`, `revoked_after_use`, `expired`; chỉ resume `started`/`finished`, và với bonus chỉ trả puzzle sau kiểm tra lại `bonus_enabled`, main entitlement và mandatory tasks. `thinking-games-authority-races-runtime.mjs` thêm hai case start sau undo (revoked_unused và revoked_after_use).

### P2 — Rollback game bỏ sót function

**Xác nhận.** Rollback `202610210001` thiếu hai helper và hai overload của start RPC. Đã thêm bốn DROP đúng chữ ký; `thinking-games-security-runtime.mjs` kiểm tra `pg_proc` không còn `thinking_game%` sau rollback.

### P2 — Schema version tối đa không chứng nhận backfill

**Xác nhận.** `schema_version()` cũ trả `max(version)`; health chỉ so sánh mốc. Migration mới chỉ trả mốc tối đa khi ledger có đủ `202610120001`, `202610120002`, `202610210001`, `202610240001`, `202610250001`, `202610270001`, `202610280001`; nếu thiếu trả `null`, khiến health báo chưa sẵn sàng. Preflight mới xác nhận tập version và hai RPC hợp nhất. `src/lib/schema-version.ts` nâng mốc lên `202610280001`; test integration kiểm tra ledger đủ/thiếu backfill. **Merge prerequisite:** ba migration `202610120001/002` và `202610270001` từ nhánh song song phải được gộp trước lane này; coordinator đã xác nhận. Coordinator xử lý xung đột `EXPECTED_SCHEMA_VERSION` khi merge.

### P2 — CI PostgreSQL thiếu hành vi game

**Xác nhận.** Job SQL trước đây chỉ chạy security/settings cho game. Đã thêm parity, habit integration, two-order reconciliation, gameplay, day gates, admission security và authority races; nâng timeout job từ 15 lên 30 phút. Real-stack Playwright vẫn opt-in theo hạ tầng hiện có.

## File đã đổi

- `.github/workflows/ci.yml`
- `src/lib/schema-version.ts`
- `supabase/migrations/202610280001_reconcile_thinking_games_guard.sql`
- `supabase/preflight/202610280001_reconcile_thinking_games_guard.verify.sql`
- `supabase/rollbacks/202610280001_reconcile_thinking_games_guard.rollback.sql`
- `supabase/rollbacks/202610210001_thinking_games.rollback.sql`
- `tests/integration/migrations/thinking-games-reconcile-runtime.mjs`
- `tests/integration/migrations/thinking-games-habit-integration-runtime.mjs`
- `tests/integration/migrations/thinking-games-authority-races-runtime.mjs`
- `tests/integration/migrations/thinking-games-security-runtime.mjs`

## Kiểm tra đã chạy

- `flock /tmp/emperor-heavy.lock npx vitest run tests/unit/schema-version.test.ts`: 1 file, 1 test đạt.
- `flock /tmp/emperor-heavy.lock npm run typecheck`: đạt.
- `flock /tmp/emperor-heavy.lock npx eslint` trên 5 file JS/TS thuộc lane: đạt.
- `node --check` trên 4 script integration đã đổi/thêm: đạt.
- `@libpg-query/parser` parse migration, preflight và hai rollback: đạt (chỉ xác nhận cú pháp SQL bên ngoài, không thực thi PL/pgSQL).
- `git diff --check` trên file tracked thuộc lane: đạt.

## Rủi ro còn lại

- Chưa chạy SQL runtime hoặc preflight trên PostgreSQL vì lệnh giao việc **không áp migration lên DB nào**. Các test mới cần được chạy sau khi gộp prerequisites, tại môi trường được phép dùng DB thử nghiệm.
- Worktree hiện chưa có ba migration prerequisite; test `thinking-games-reconcile-runtime.mjs` cố ý yêu cầu file `202610120002` và sẽ không chạy trước khi merge.
- Timeout 30 phút của job SQL là ước lượng bảo thủ vì không được phép đo runtime PostgreSQL trong lane này.
- Rollback migration hợp nhất cố ý từ chối downgrade; phục hồi cần forward fix hoặc kế hoạch thủ công được duyệt.
