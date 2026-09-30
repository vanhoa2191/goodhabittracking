# Đóng góp vào KidHabit Hero

## Trước khi bắt đầu

- Dự án dùng Next.js 16 với nhiều thay đổi so với các phiên bản cũ. Đọc [`AGENTS.md`](AGENTS.md) và hướng dẫn trong `node_modules/next/dist/docs/` trước khi viết mã.
- Đọc [`docs/architecture.md`](docs/architecture.md) và [`docs/security-privacy.md`](docs/security-privacy.md). Dự án chứa dữ liệu của trẻ em: mặc định là riêng tư và tối thiểu.
- Nội dung công khai (trang marketing, blog, mô tả tính năng) phải khớp [`docs/claims-ledger.md`](docs/claims-ledger.md): mô tả điều sản phẩm làm và điều nghiên cứu cho biết, không hứa kết quả cho một em bé.

## Quy trình

1. Tạo nhánh từ `main`, mỗi nhánh một thay đổi. Commit theo Conventional Commits (`feat(scope): …`, `fix(scope): …`).
2. Viết test trước cho hành vi mới hoặc lỗi cần sửa và chạy thấy nó thất bại.
3. Chạy `npm run lint && npm run typecheck && npm test`. Thay đổi đụng giao diện hoặc bundle thì chạy thêm `npm run build:cloudflare && npm run check:performance` (ngân sách JavaScript nằm ở `config/performance-budget.json`).
4. Mở PR. CI chạy lint, typecheck, test, quét bí mật, `npm audit`, build và kiểm tra trình duyệt. Chỉ merge khi tất cả xanh.

## Thêm một thứ thường gặp

- **Chuỗi giao diện mới:** thêm vào tệp `src/lib/i18n/<màn-hình>-copy.ts` đủ 9 ngôn ngữ (`vi, en, fr, de, it, es, zh, ja, ko`). Bộ test kiểm tra đủ khóa và chỗ giữ tham số.
- **Migration:** tạo `supabase/migrations/<năm-tháng-ngày-số>_ten.sql`, thêm dòng vào `supabase/schema.sql` và danh sách trong `tests/integration/migrations/family-tenancy.test.ts`, viết `supabase/preflight/<cùng tên>.verify.sql` và một test hợp đồng. Mọi hàm `security definer` phải có `set search_path = ''`, tự kiểm quyền và `revoke … from public, anon` rồi chỉ `grant` cho vai trò cần. Áp dụng lên production bằng Supabase MCP `apply_migration`, sau đó đổi số phiên bản trong `supabase_migrations.schema_migrations` cho khớp tên tệp, chạy SQL preflight và các script `npm run verify:live-*`.
- **Route API ghi dữ liệu:** gọi `rejectCrossSiteRequest(request)` ở đầu mỗi handler `POST/PUT/PATCH/DELETE` (test sẽ báo nếu thiếu). Thao tác nhạy cảm của phụ huynh gọi thêm `requireParentUnlock`.
- **Bài blog:** xem [`docs/blog-guide.md`](docs/blog-guide.md).
- **Cờ tính năng:** cờ `NEXT_PUBLIC_*` được đóng vào bundle lúc build; bật/tắt bằng biến repository trong GitHub (xem [`docs/deployment.md`](docs/deployment.md)).

## Không làm

- Không commit bí mật, tệp `.env*`, khóa dịch vụ hay dữ liệu thật của gia đình (`npm run check:secrets` chạy trong CI).
- Không đặt số kế hoạch, mã giai đoạn hay nhãn kiểm toán trong mã, tên migration, tên test hoặc commit; hãy mô tả trực tiếp hành vi.
- Không gọi trực tiếp bảng bằng client của trình duyệt để ghi; đi qua route hoặc hàm SQL có kiểm quyền.
