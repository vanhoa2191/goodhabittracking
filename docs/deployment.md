# Deployment

## Platform

Repository tạo hai bản phát hành độc lập:

- Website giới thiệu: HTML/CSS/JS tĩnh tại `dist/marketing`, triển khai bằng Cloudflare Workers Static Assets với service `kidhabit-home`; tên miền chính thức là `https://kidhabithero.com`.
- Ứng dụng: Next.js full-stack tại `https://app.kidhabithero.com`, triển khai bằng OpenNext lên Cloudflare Workers. Origin này giữ auth, QR, PWA, API, PayOS và dữ liệu gia đình.

Không chuyển route động sang Pages, không chia sẻ phiên đăng nhập giữa hai origin (chỉ một cookie gợi ý `kh_member`, không chứa thông tin, để trang giới thiệu biết phụ huynh đã đăng nhập) và không đặt Supabase/PayOS secret trong marketing build. Xem [Cloudflare OpenNext guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/).

## Tên miền riêng

| Bề mặt | Tên miền | Worker |
|---|---|---|
| Website giới thiệu | `https://kidhabithero.com` | `kidhabit-home` |
| Ứng dụng | `https://app.kidhabithero.com` | `goodhabittracking` |

Tên miền gắn vào Worker trong Cloudflare (Workers & Pages → service → Settings → Domains & Routes). Hai địa chỉ `*.workers.dev` cũ vẫn chạy trong giai đoạn chuyển tiếp: trang được xây bằng địa chỉ chuẩn mới nên `canonical`, sitemap, Open Graph và liên kết chéo đều trỏ về tên miền riêng, còn app vẫn `noindex`. Tắt `workers.dev` sau khi mọi thiết bị của bé đã ghép lại ở địa chỉ mới.

Danh sách bàn giao khi đổi địa chỉ (làm ở ngoài repo):

1. **Supabase Auth → URL Configuration:** đặt Site URL là `https://app.kidhabithero.com` và thêm `https://app.kidhabithero.com/**` vào Redirect URLs. Giữ địa chỉ `workers.dev` cũ trong giai đoạn chuyển tiếp. Thiếu bước này, đăng nhập Google sẽ quay về địa chỉ sai.
2. **PayOS:** đổi webhook thành `https://app.kidhabithero.com/api/payment/webhook`. URL trả về và hủy được tạo theo từng đơn từ `NEXT_PUBLIC_APP_URL`, không cần cấu hình riêng.
3. **Cloudflare (vùng `kidhabithero.com`):** bật *Always Use HTTPS*; tạo bản ghi `www` (CNAME có proxy) kèm Redirect Rule `www.kidhabithero.com` → `https://kidhabithero.com`.
4. **Thiết bị của bé và PWA:** phiên ghép thiết bị và bản cài PWA gắn với từng địa chỉ. Bé ghép ở `workers.dev` vẫn dùng được ở địa chỉ cũ; để chuyển sang địa chỉ mới, phụ huynh làm mới mã ghép và bé quét lại.
5. **GitHub Actions:** `NEXT_PUBLIC_APP_URL` và `NEXT_PUBLIC_MARKETING_URL` đã đặt trong `ci.yml` và `marketing.yml`; các workflow theo dõi (`production-observability`, `lifecycle-dispatch`) gọi `https://app.kidhabithero.com`.

## Tên miền riêng

| Bề mặt | Tên miền | Worker |
|---|---|---|
| Website giới thiệu | `https://kidhabithero.com` | `kidhabit-home` |
| Ứng dụng | `https://app.kidhabithero.com` | `goodhabittracking` |

Tên miền gắn vào Worker trong Cloudflare (Workers & Pages → service → Settings → Domains & Routes). Hai địa chỉ `*.workers.dev` cũ vẫn chạy trong giai đoạn chuyển tiếp: trang được xây bằng địa chỉ chuẩn mới nên `canonical`, sitemap, Open Graph và liên kết chéo đều trỏ về tên miền riêng, còn app vẫn `noindex`. Tắt `workers.dev` sau khi mọi thiết bị của bé đã ghép lại ở địa chỉ mới.

Danh sách bàn giao khi đổi địa chỉ (làm ở ngoài repo):

1. **Supabase Auth → URL Configuration:** đặt Site URL là `https://app.kidhabithero.com` và thêm `https://app.kidhabithero.com/**` vào Redirect URLs. Giữ địa chỉ `workers.dev` cũ trong giai đoạn chuyển tiếp. Thiếu bước này, đăng nhập Google sẽ quay về địa chỉ sai.
2. **PayOS:** đổi webhook thành `https://app.kidhabithero.com/api/payment/webhook`. URL trả về và hủy được tạo theo từng đơn từ `NEXT_PUBLIC_APP_URL`, không cần cấu hình riêng.
3. **Cloudflare (vùng `kidhabithero.com`):** bật *Always Use HTTPS*; tạo bản ghi `www` (CNAME có proxy) kèm Redirect Rule `www.kidhabithero.com` → `https://kidhabithero.com`.
4. **Thiết bị của bé và PWA:** phiên ghép thiết bị và bản cài PWA gắn với từng địa chỉ. Bé ghép ở `workers.dev` vẫn dùng được ở địa chỉ cũ; để chuyển sang địa chỉ mới, phụ huynh làm mới mã ghép và bé quét lại.
5. **GitHub Actions:** `NEXT_PUBLIC_APP_URL` và `NEXT_PUBLIC_MARKETING_URL` đã đặt trong `ci.yml` và `marketing.yml`; các workflow theo dõi (`production-observability`, `lifecycle-dispatch`) gọi `https://app.kidhabithero.com`.

## First setup

1. Tạo hai Workers service độc lập trong cùng Cloudflare account: `goodhabittracking` cho app và `kidhabit-home` cho static marketing.
2. App build/deploy: `npm run build:cloudflare` và `npm run deploy:cloudflare`.
3. Marketing build/deploy: `npm run build:marketing`, `npm run verify:marketing-release -- --dir dist/marketing --app-origin https://app.kidhabithero.com --marketing-origin https://kidhabithero.com`, rồi `npm run deploy:marketing`. Wrangler 4.135 chuyển Pages project mới sang Workers Static Assets; không dùng lại root `wrangler.jsonc` của app cho service marketing.

Các lệnh Cloudflare luôn loại server secret khỏi môi trường build để chúng chỉ tồn tại dưới dạng Worker secrets lúc chạy. Không đặt `PAYOS_*`, `SUPABASE_SERVICE_ROLE_KEY` hoặc `PAIRING_RATE_LIMIT_SECRET` trong `.env.local`; wrapper sẽ chặn build nếu phát hiện giá trị.
4. Khai báo public variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MARKETING_URL` và `NEXT_PUBLIC_DEPLOY_TARGET=app` trong **môi trường build app**. Marketing build chỉ nhận `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MARKETING_URL` và `NEXT_PUBLIC_DEPLOY_TARGET=marketing`.
5. Khai báo encrypted secrets: `SUPABASE_SERVICE_ROLE_KEY`, `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAIRING_RATE_LIMIT_SECRET`, và khi bật lifecycle email: `RESEND_API_KEY`, `LIFECYCLE_EMAIL_FROM`, `CRON_SECRET`.

Trang `/admin` và mọi API quản trị lấy quyền từ `admin_memberships`, áp dụng vai trò, ngày hết hạn, thu hồi tức thời và AAL2. Thao tác ghi bắt buộc có lý do và tạo audit bất biến đã tối thiểu dữ liệu. `ADMIN_EMAILS` không cấp quyền vận hành thông thường: chỉ dùng khôi phục khẩn cấp cùng `ADMIN_BOOTSTRAP_EXPIRES_AT`, tối đa 24 giờ, cho email đã xác minh và chỉ để tài khoản đó tự tạo DB membership có hạn qua `/admin/security`. Sau đó phải xóa hai biến bootstrap. Không dùng parent PIN thay MFA.

Lifecycle email dùng migration `202609280001_lifecycle_revenue_operations.sql` và mặc định tắt. Trước khi đặt `LIFECYCLE_EMAILS_ENABLED=true`, cần xác minh domain gửi tại Resend, duyệt processor/privacy và retention, đặt `RESEND_API_KEY`, `LIFECYCLE_EMAIL_FROM`, `CRON_SECRET`, `RESEND_WEBHOOK_SECRET`, đồng thời tạo GitHub secret `LIFECYCLE_CRON_SECRET` có cùng giá trị với Worker secret. Workflow `lifecycle-dispatch.yml` gọi outbox mỗi giờ; workflow `production-observability.yml` dùng cùng secret để đọc các tổng hợp sự cố đã làm sạch dữ liệu mỗi 15 phút. Endpoint từ chối request thiếu secret. Đăng ký Resend webhook tới `/api/internal/lifecycle/provider-webhook` cho `email.bounced`, `email.complained` và `email.suppressed`; endpoint chỉ ghi suppression sau khi chữ ký Svix hợp lệ. Chạy một email giao dịch thật tới inbox kiểm thử, xác minh chỉ có một thư khi replay cùng dedupe key và kiểm tra dead-letter trước khi bật rộng.

Trang quản trị có workflow hỗ trợ, hủy và hoàn tiền. Chỉ link PayOS trạng thái `PENDING` mới được hủy qua API. Giao dịch đã thanh toán không có API hoàn tiền trong contract tích hợp hiện tại; operator phải đối soát và hoàn tiền ngoài hệ thống, sau đó chọn `manual_refund_confirmed` mới được đánh dấu hoàn tất.
6. Đặt hai origin HTTPS khác nhau, không có path: `NEXT_PUBLIC_APP_URL` cho Worker và `NEXT_PUBLIC_MARKETING_URL` cho Pages.
7. Supabase Auth redirect allowlist chỉ cần app callback/origin. Không thêm Pages origin vào luồng OAuth vì marketing không đăng nhập.
8. Đăng ký PayOS webhook, return và cancel trên app origin; webhook là `https://<app-origin>/api/payment/webhook`. Pages không nhận callback thanh toán.

Các trang `/privacy`, `/terms`, `/contact` luôn build được ở trạng thái bản nháp nhưng mặc định `noindex` và không xuất hiện trong footer/checkout. Chỉ đặt `NEXT_PUBLIC_LEGAL_PAGES_APPROVED=true` sau khi chủ sản phẩm hoặc tư vấn pháp lý duyệt đúng phiên bản nội dung đang commit; đồng thời cấu hình `SUPPORT_EMAIL` bằng hộp thư hỗ trợ chính thức. Khi cờ bật, checkout yêu cầu phụ huynh mở và đồng ý điều khoản/quyền riêng tư trước khi tạo đơn PayOS.

Không đưa secret vào `wrangler.jsonc`, GitHub Actions log hoặc `NEXT_PUBLIC_*`.
`PAIRING_RATE_LIMIT_SECRET` phải là giá trị ngẫu nhiên tối thiểu 32 ký tự.

## Tự động phát hành từ `main`

Luồng phát hành duy nhất: viết code trên máy → push lên GitHub → GitHub Actions kiểm thử → deploy lên Cloudflare Workers. Không deploy thủ công từ máy cá nhân trừ khi rollback khẩn cấp.

`ci.yml` kiểm tra và phát hành Worker `goodhabittracking` (app) sau khi quality/browser đạt. `marketing.yml` build, kiểm tra artifact rồi phát hành Worker `kidhabit-home` (website giới thiệu) độc lập. Thiết lập một lần trong phần cấu hình GitHub:

1. Secrets: `CLOUDFLARE_API_TOKEN` có quyền Workers deploy, cùng `CLOUDFLARE_ACCOUNT_ID`.
2. Variables: `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Hai origin tạm đã được cố định trong workflow, cùng `SUPPORT_EMAIL` công khai của trang liên hệ marketing. Khi thiếu Cloudflare credential hoặc public app configuration, bước phát hành tương ứng được bỏ qua; các job kiểm thử vẫn chạy. Không ghi secret vào workflow hoặc log CI.

Không dùng Cloudflare Pages cho dự án này. Project Pages cũ `goodhabittracking` (`goodhabittracking.pages.dev`) không phải production; phải ngắt kết nối Git hoặc xóa để không tạo check `Cloudflare Pages` lỗi trên mỗi pull request.

## Thứ tự rollout và rollback hai bề mặt

1. Build và deploy static marketing service trước; chạy verifier trên URL live, kiểm tra ba CTA mở đúng app checkout.
2. Chỉ khi marketing Worker xanh mới deploy Worker app có app gateway/noindex mới.
3. Kiểm tra `/api/health` trả HTTP 200, `status=ready` và mọi dependency check là `true`; sau đó kiểm tra guest, parent, child, PWA và payment return.
4. Rollback app bằng redeploy Worker commit trước. Rollback marketing bằng version Worker `kidhabit-home` trước hoặc build/deploy commit marketing trước. Không rollback schema bằng cách xóa dữ liệu.

Nếu website giới thiệu lỗi sau app cutover, app vẫn truy cập trực tiếp được ở Worker origin; khôi phục version `kidhabit-home` trước, không chuyển auth hoặc checkout sang website giới thiệu.

Thư mascot hằng ngày được giữ sau cờ build `NEXT_PUBLIC_DAILY_MASCOT_LETTER=true`. Mặc định cờ tắt để chưa phát hành giao diện khi đường ghi của phiên thiết bị con chưa được kiểm chứng trên production. Chỉ bật ở môi trường build sau khi kiểm tra phiên hợp lệ và quyền family; cần build/deploy lại để thay đổi cờ.

Nhật ký một câu của trẻ dùng cờ build `NEXT_PUBLIC_DAILY_JOURNAL=true`, mặc định tắt. Trước khi bật, áp migration `202609260001_child_journal.sql` và kiểm tra phiên thiết bị con, quyền đọc trong gia đình, thao tác lưu, tải lại và xuất CSV. Thay đổi cờ cần build/deploy lại.

Thành phố ước mơ dùng cờ build `NEXT_PUBLIC_DREAM_CITY=true`, mặc định tắt. Trước khi bật, áp migration `202609260002_dream_city.sql`; kiểm tra quyền gia đình và phiên thiết bị con, trừ điểm đúng một lần khi mua trùng hoặc đồng thời, giữ nguyên `total_earned`, và tải lại công trình đã xây. Không bật cờ hoặc deploy trước khi hoàn tất backup, preflight và kiểm thử cách ly gia đình. Thay đổi cờ cần build/deploy lại.

Nhắc phụ huynh dùng cờ build `NEXT_PUBLIC_PARENT_REENGAGEMENT=true`, mặc định tắt. Trước khi bật, áp migration `202609260003_parent_reminder_consent.sql`; kiểm tra mặc định tắt, bật/tắt đồng thuận, trạng thái quyền thông báo của thiết bị và lời nhắc trong ứng dụng. Phiên bản này không gửi push; quyền trình duyệt chỉ được yêu cầu sau thao tác rõ ràng của phụ huynh.

Bộ thói quen thích ứng dùng cờ build `NEXT_PUBLIC_HABIT_PROGRAMS=true`, mặc định tắt và áp dụng cho mọi người dùng của bản build (không bật riêng theo gia đình). Migration `202609300001_habit_programs.sql` phải được áp trước khi bật; chạy `supabase/preflight/202609300001_habit_programs.verify.sql` sau khi áp. Khi bảng chưa tồn tại, ứng dụng đọc như "chưa có dữ liệu" nên deploy trước migration không gây lỗi, nhưng lưu tín hiệu hoặc ghi nhận sẽ thất bại. Trước khi bật, kiểm tra: phụ huynh đặt tín hiệu, ghi nhận "Con làm thế nào?" và xem tóm tắt tiến độ; bé từ 15 tuổi tự chọn còn bé nhỏ hơn không thấy câu hỏi; luồng "Chương trình" (chỉ tiếng Việt) thêm thói quen và tín hiệu; tải lại vẫn còn dữ liệu; hai gia đình không thấy dữ liệu của nhau. Luật "từ 15 tuổi" chỉ áp ở giao diện, không ép ở máy chủ. Thay đổi cờ cần build/deploy lại.

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
