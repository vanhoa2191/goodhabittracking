# KidHabit Hero

Ứng dụng xây dựng thói quen cho gia đình, gồm giao diện trẻ em, quản trị phụ huynh, ghép nối thiết bị theo từng bé, đồng bộ Supabase và thanh toán PayOS.

## Chạy local

Yêu cầu Node.js 24 và npm.

```bash
git clone https://github.com/vanhoa2191/goodhabittracking.git
cd goodhabittracking
npm ci
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`. Không commit `.env.local`.

## Biến môi trường

| Tên | Phạm vi | Mục đích |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server | URL dự án Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server | Public anon key, RLS vẫn là ranh giới bảo mật |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret | Webhook và tác vụ quản trị billing |
| `NEXT_PUBLIC_APP_URL` | Build/server | Origin chuẩn cho callback PayOS |
| `PAYOS_CLIENT_ID` | Server secret | Merchant client ID |
| `PAYOS_API_KEY` | Server secret | PayOS API key |
| `PAYOS_CHECKSUM_KEY` | Server secret | Ký request và xác minh webhook |
| `PAIRING_RATE_LIMIT_SECRET` | Server secret | HMAC fingerprint cho rate limiting |

Các cờ legacy/simulation trong `.env.example` bị khóa ở production và không thể bật lại endpoint pairing cũ.

## Cấu trúc thư mục

| Thư mục | Nội dung |
|---|---|
| `src/app` | Route của Next.js App Router. `api/` là route handler (mọi thao tác ghi đều qua `rejectCrossSiteRequest`), còn lại là trang của ứng dụng. |
| `src/components` | Giao diện React. Màn hình bé (`KidDashboard`), màn hình phụ huynh (`ParentDashboard` và các tab), hộp thoại dùng `ui/ModalShell`. |
| `src/lib/store.tsx`, `src/lib/store/` | Trạng thái ứng dụng. `store.tsx` ghép các nhóm hành động trong `store/` (thói quen, phần thưởng, hồ sơ, ghép thiết bị, đồng bộ đám mây…). |
| `src/lib/i18n` | Bản dịch theo từng màn hình, 9 ngôn ngữ, mỗi tệp `*-copy.ts` xuất hàm `get…Copy(language)`. |
| `src/lib/security`, `src/lib/auth`, `src/lib/supabase` | Kiểm tra nguồn gốc yêu cầu, mở khóa PIN phụ huynh, quyền quản trị, các client Supabase. |
| `src/lib/habit-framework`, `src/lib/habit-programs`, `src/data` | Khung 47 thói quen và các chương trình nhỏ (dữ liệu JSON kèm kiểm tra nguồn). |
| `apps/marketing` | Site marketing tĩnh (trang chủ, bảng giá, blog…) dựng bằng `scripts/build-marketing.mjs`, không chứa mã ứng dụng. |
| `supabase/migrations`, `supabase/preflight` | Thay đổi schema theo thứ tự và SQL kiểm tra sau mỗi migration. |
| `scripts` | Dựng marketing, kiểm tra phát hành, kiểm tra live trên production (`verify-live-*`), quét bí mật, ngân sách hiệu năng. |
| `tests` | `unit`, `api`, `integration` (hợp đồng migration), `e2e` (Playwright). Mỗi pull request chạy Chromium; workflow `webkit-nightly` chạy mỗi đêm (và theo yêu cầu) các spec nhạy với Safari trên WebKit desktop và iPhone, không phải kiểm tra bắt buộc. |
| `docs` | Tài liệu kiến trúc, bảo mật, triển khai, sổ kiểm chứng nội dung và hướng dẫn đăng blog. Bộ [hướng dẫn sử dụng toàn bộ tính năng](docs/huong-dan/README.md) nằm ở `docs/huong-dan`. |

Bắt đầu đọc từ [`docs/architecture.md`](docs/architecture.md). Muốn đóng góp, xem [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Kiểm tra chất lượng

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check:performance
npm run test:e2e
npm run test:a11y
```

`npm run ci` chạy lint, typecheck, unit/integration/API tests, build và ngân sách bundle.

## Database

Mọi thay đổi schema nằm trong [`supabase/migrations`](supabase/migrations). `supabase/schema.sql` chỉ là manifest chạy tuần tự các migration. Trước production:

1. chạy preflight trong `supabase/preflight/`;
2. sao lưu database;
3. chạy migration theo thứ tự;
4. chạy smoke/RLS tests bằng hai tài khoản gia đình độc lập;
5. dùng rollback không phá dữ liệu nếu gate thất bại.

Không dùng `supabase db reset` trên production.

## Triển khai Cloudflare

Ứng dụng có route handlers động nên phải chạy trên Cloudflare Workers, không phải Pages static export. Cấu hình dùng OpenNext để giữ nguyên Next.js 16 trong khi Cloudflare khuyến nghị đánh giá vinext trước lần nâng cấp nền tảng tiếp theo.

```bash
npm run preview:cloudflare
npm run deploy:cloudflare
```

Thiết lập `NEXT_PUBLIC_*` trong môi trường chạy lệnh build/deploy; chỉ tạo Worker runtime secret là chưa đủ vì các giá trị này phải được đóng vào browser bundle. Server secrets tiếp tục được lưu riêng trong Workers. Chi tiết tại [`docs/deployment.md`](docs/deployment.md).

## Tài liệu

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/habit-framework-data-contract.md`](docs/habit-framework-data-contract.md)
- [`docs/security-privacy.md`](docs/security-privacy.md)
- [`docs/product-analytics.md`](docs/product-analytics.md)
- [`docs/data-recovery.md`](docs/data-recovery.md)
- [`docs/claims-ledger.md`](docs/claims-ledger.md)
- [`docs/runbooks/incident-response.md`](docs/runbooks/incident-response.md)

## Mô hình dữ liệu và trải nghiệm

- Chế độ demo/local chỉ lưu trên thiết bị và không ghi production.
- Chế độ cloud cần tài khoản, dùng family tenancy và RLS.
- Mã ghép nối cố định cho từng bé tới khi phụ huynh làm mới, có giới hạn thử và chỉ cấp phiên cho đúng bé đó.
- Client không tự cấp Pro; webhook PayOS đã xác minh chữ ký mới kích hoạt entitlement qua transaction idempotent.
- Bảng xếp hạng công khai mặc định tắt: chỉ hiện bé khi phụ huynh bật cho gia đình và bé tham gia, bằng biệt danh; không bao giờ hiện tên thật, tuổi hay mã hồ sơ.
- Thao tác nhạy cảm (xóa gia đình, thu hồi thiết bị, mã ghép, thanh toán, duyệt việc và quà) cần mã PIN phụ huynh đã được máy chủ xác minh (xem [`docs/security-privacy.md`](docs/security-privacy.md)).
