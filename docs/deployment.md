# Deployment

## Platform

Ứng dụng full-stack dùng Cloudflare Workers. Cloudflare Pages static export không chạy được route handlers cho pairing, PayOS và domain commands. Cấu hình hiện tại dùng `@opennextjs/cloudflare`; xem [Cloudflare OpenNext guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/).

## First setup

1. Tạo Workers project `goodhabittracking` nối GitHub repo.
2. Build command: `npm run build:cloudflare`.
3. Deploy command: `npx wrangler deploy` hoặc `npm run deploy:cloudflare` ở CI có token.

Các lệnh Cloudflare luôn loại server secret khỏi môi trường build để chúng chỉ tồn tại dưới dạng Worker secrets lúc chạy. Không đặt `PAYOS_*`, `SUPABASE_SERVICE_ROLE_KEY` hoặc `PAIRING_RATE_LIMIT_SECRET` trong `.env.local`; wrapper sẽ chặn build nếu phát hiện giá trị.
4. Khai báo public variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` trong **môi trường build** (Cloudflare Builds hoặc CI), không chỉ dưới dạng Worker runtime secrets. Next.js đóng các giá trị `NEXT_PUBLIC_*` vào browser bundle khi build; `npm run deploy:cloudflare` sẽ dừng trước khi build nếu thiếu một trong ba giá trị để tránh phát hành bản không thể đăng nhập.
5. Khai báo encrypted secrets: `SUPABASE_SERVICE_ROLE_KEY`, `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAIRING_RATE_LIMIT_SECRET` và `ADMIN_EMAILS` (danh sách email quản trị, phân cách bằng dấu phẩy).

Trang `/admin` chỉ trả dữ liệu khi tài khoản Google hiện tại có email nằm trong `ADMIN_EMAILS`. Quyền này được kiểm tra lại ở mọi API quản trị; không dựa vào việc ẩn/hiện liên kết trên giao diện. Sau migration `202609210005_customer_admin.sql`, quản trị viên có thể cập nhật gói, ghi chú chăm sóc khách hàng và tạo coupon tặng ngày sử dụng. Việc gửi quảng cáo chỉ áp dụng với khách hàng đã chủ động bật đồng ý nhận tin.
6. Đặt `NEXT_PUBLIC_APP_URL` đúng custom HTTPS origin.
7. Đăng ký webhook PayOS tới `https://<origin>/api/payment/webhook`.

Không đưa secret vào `wrangler.jsonc`, GitHub Actions log hoặc `NEXT_PUBLIC_*`.
`PAIRING_RATE_LIMIT_SECRET` phải là giá trị ngẫu nhiên tối thiểu 32 ký tự.

## Tự động phát hành từ `main`

Workflow CI chỉ phát hành Worker sau khi cả kiểm tra chất lượng lẫn kiểm tra trình duyệt đều đạt. Thiết lập một lần trong phần cấu hình của repository GitHub:

1. Secrets: `CLOUDFLARE_API_TOKEN` (quyền Workers deploy) và `CLOUDFLARE_ACCOUNT_ID`.
2. Variables: `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

`NEXT_PUBLIC_APP_URL` đã được cố định là origin production trong workflow. Khi thiếu một cấu hình bắt buộc, bước phát hành được bỏ qua; các job kiểm thử vẫn chạy bình thường. Không ghi các giá trị này vào workflow hoặc log CI.

Thư mascot hằng ngày được giữ sau cờ build `NEXT_PUBLIC_DAILY_MASCOT_LETTER=true`. Mặc định cờ tắt để chưa phát hành giao diện khi đường ghi của phiên thiết bị con chưa được kiểm chứng trên production. Chỉ bật ở môi trường build sau khi kiểm tra phiên hợp lệ và quyền family; cần build/deploy lại để thay đổi cờ.

Nhật ký một câu của trẻ dùng cờ build `NEXT_PUBLIC_DAILY_JOURNAL=true`, mặc định tắt. Trước khi bật, áp migration `202609260001_child_journal.sql` và kiểm tra phiên thiết bị con, quyền đọc trong gia đình, thao tác lưu, tải lại và xuất CSV. Thay đổi cờ cần build/deploy lại.

Sau migration production, chạy `npm run verify:live-boundaries`. Lệnh dùng quyền operator của Supabase CLI để tạo hai tài khoản tổng hợp, kiểm tra anonymous/same-family/cross-family RLS trên dữ liệu live và luôn dọn dữ liệu thử. Không chạy lệnh này trong CI công khai hoặc trên máy không được phép quản trị project.

Sau khi Worker và migration mới cùng được phát hành, chạy `npm run verify:live-lifecycle` để chứng nhận mã ghép nối cố định, làm mới mã không ngắt thiết bị cũ, child completion, parent approval, reward delivery, reconnect và revoke bằng dữ liệu tổng hợp tự dọn. Lệnh này cũng chỉ dành cho operator được phép quản trị project.

## Release candidate gate

Sau khi commit release candidate, export secrets vào shell cục bộ hoặc secret store của CI, đặt `RELEASE_SHA` bằng full SHA đang checkout, rồi chạy:

```bash
npm run release:verify
```

Lệnh từ chối worktree bẩn, SHA không khớp, URL không dùng HTTPS, feature mô phỏng/legacy chưa tắt, pairing secret yếu, thiếu cấu hình hoặc bất kỳ PayOS credential nào trùng fingerprint của bộ khóa đã lộ. Nếu preflight đạt, lệnh chạy CI, khởi động production bundle trên cổng 3420, yêu cầu `/api/health` trả `ready`, chạy toàn bộ Playwright desktop/mobile và tự dừng server.

`/api/health` không chỉ kiểm tra biến môi trường: trạng thái `ready` yêu cầu PostgREST chấp nhận service-role credential qua một request không đọc dữ liệu. Vì vậy URL/key hết hạn hoặc sai phải trả `503` với `databaseConnection: false`. Chế độ `--allow-dirty` chỉ dùng để kiểm tra working tree cục bộ và có thể tiếp tục khi dependency ngoài chưa sẵn sàng; kết quả đó không phải chứng nhận release. Release candidate sạch luôn yêu cầu live dependency readiness.

`--allow-dirty` chỉ dành cho kiểm tra harness trong quá trình phát triển. Kết quả đó được ghi là working-tree evidence và không phải chứng nhận release candidate.

## Database rollout

Production migration là gate thủ công vì thay đổi RLS và dữ liệu trẻ:

1. export logical backup;
2. chạy `supabase/preflight/202609190001_family_tenancy.preflight.sql`;
3. xem bảng quarantine dự kiến;
4. chạy `supabase/schema.sql` trong transaction-capable Supabase SQL environment;
5. xác minh anonymous reads bị từ chối và hai family không đọc chéo;
6. chạy pairing/payment/domain smoke tests;
7. chỉ sau đó promote Worker.

## Staged rollout

- Preview: health endpoint phải `ready`; chạy E2E desktop/mobile và webhook test mode.
- 10% traffic/canary: theo dõi 15 phút error rate, pairing denials và webhook mismatch.
- Promote khi không có P0/P1, API 5xx <1%, payment activation 100% với webhook hợp lệ.
- Rollback Worker ngay nếu cross-family read, entitlement sai, webhook unsigned accepted hoặc data loss.

## Rotation

PayOS credentials từng xuất hiện trong hội thoại đã được thay bằng channel production mới ngày 2026-09-21. Runtime và release preflight tiếp tục từ chối fingerprint của bộ khóa đã lộ. Với lần rotation tiếp theo, cập nhật Worker secrets và webhook verification, deploy, smoke test, rồi revoke key cũ.
