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

> **Dự án Supabase production** (từ 02/10/2026): `evkwelozdcmsmwdzhlxz`, vùng Singapore (`ap-southeast-1`), gần Worker và người dùng ở Việt Nam. Dự án cũ `osvsvegqietxcfoabdhx` (Sydney) được giữ vài ngày làm đường lui rồi xóa. Dùng khóa API dạng JWT (tab *Legacy API keys*), vì phần kiểm tra sức khỏe gọi REST bằng `Authorization: Bearer`. Một dự án Supabase mới không dựng được chỉ từ `supabase/migrations`: migration đầu tiên giả định các bảng gốc đã có, nên chuyển dự án phải dùng `pg_dump` (cấu trúc và dữ liệu), rồi đặt lại quyền `anon`/`authenticated`/`service_role` y như dự án cũ (pg_dump không ghi quyền mặc định mà dự án mới tự cấp) và chạy toàn bộ `supabase/preflight/*.verify.sql` để xác nhận.

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

### Thứ tự phát hành app và marketing

Mỗi lần merge vào `main`, `ci.yml` (app) và `marketing.yml` (site marketing) chạy song song. Bản dựng marketing ghi `release.json` chứa mã commit; job deploy app chờ tối đa khoảng 6 phút cho tới khi `https://kidhabithero.com/release.json` khớp `GITHUB_SHA` rồi mới triển khai, nên app không bao giờ lên trước các trang mà nó liên kết tới. Nếu site marketing không cập nhật, job dừng với thông báo nó vẫn đang phục vụ bản nào.

Site marketing gửi tiêu đề bảo mật qua tệp `_headers` do bản dựng tạo (CSP chỉ cho phép script nội tuyến của trang theo mã băm).

## First setup

1. Tạo hai Workers service độc lập trong cùng Cloudflare account: `goodhabittracking` cho app và `kidhabit-home` cho static marketing.
2. App build/deploy: `npm run build:cloudflare` và `npm run deploy:cloudflare`.
3. Marketing build/deploy: `npm run build:marketing`, `npm run verify:marketing-release -- --dir dist/marketing --app-origin https://app.kidhabithero.com --marketing-origin https://kidhabithero.com`, rồi `npm run deploy:marketing`. Wrangler 4.135 chuyển Pages project mới sang Workers Static Assets; không dùng lại root `wrangler.jsonc` của app cho service marketing.

Các lệnh Cloudflare luôn loại server secret khỏi môi trường build để chúng chỉ tồn tại dưới dạng Worker secrets lúc chạy. Không đặt `PAYOS_*`, `SUPABASE_SERVICE_ROLE_KEY` hoặc `PAIRING_RATE_LIMIT_SECRET` trong `.env.local`; wrapper sẽ chặn build nếu phát hiện giá trị.
4. Khai báo public variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MARKETING_URL` và `NEXT_PUBLIC_DEPLOY_TARGET=app` trong **môi trường build app**. Marketing build chỉ nhận `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MARKETING_URL` và `NEXT_PUBLIC_DEPLOY_TARGET=marketing`.
5. Khai báo encrypted secrets: `SUPABASE_SERVICE_ROLE_KEY`, `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAIRING_RATE_LIMIT_SECRET`, `PARENT_UNLOCK_SECRET`, và khi bật lifecycle email: `RESEND_API_KEY`, `LIFECYCLE_EMAIL_FROM`, `CRON_SECRET`.

Trang `/admin` và mọi API quản trị lấy quyền từ `admin_memberships`, áp dụng vai trò, ngày hết hạn, thu hồi tức thời và AAL2. Thao tác ghi bắt buộc có lý do và tạo audit bất biến đã tối thiểu dữ liệu. `ADMIN_EMAILS` không cấp quyền vận hành thông thường: chỉ dùng khôi phục khẩn cấp cùng `ADMIN_BOOTSTRAP_EXPIRES_AT`, tối đa 24 giờ, cho email đã xác minh và chỉ để tài khoản đó tự tạo DB membership có hạn qua `/admin/security`. Sau đó phải xóa hai biến bootstrap. Không dùng parent PIN thay MFA.

Lifecycle email dùng migration `202609280001_lifecycle_revenue_operations.sql` và mặc định tắt. Nhà cung cấp mặc định là Resend; đặt `LIFECYCLE_EMAIL_PROVIDER=brevo` cùng secret `BREVO_API_KEY` (API key v3 tạo ở Brevo → SMTP & API → API Keys, khác SMTP key của Supabase) để gửi qua Brevo (`POST https://api.brevo.com/v3/smtp/email`; `LIFECYCLE_EMAIL_FROM` dạng `KidHabit Hero <no-reply@kidhabithero.com>` và địa chỉ này phải được xác thực trong Brevo). Brevo không có khóa chống gửi lặp như Resend nên chống trùng chỉ dựa vào outbox; webhook thoái đăng ký/bounce hiện chỉ có cho Resend, với Brevo hãy theo dõi bounce và complaint trong bảng điều khiển Brevo (Brevo tự chặn địa chỉ hard bounce). Đổi nhà cung cấp là đổi biến Worker, không cần build lại. Trước khi đặt `LIFECYCLE_EMAILS_ENABLED=true`, cần xác minh domain gửi tại Resend, duyệt processor/privacy và retention, đặt `RESEND_API_KEY`, `LIFECYCLE_EMAIL_FROM`, `CRON_SECRET`, `RESEND_WEBHOOK_SECRET`, đồng thời tạo GitHub secret `LIFECYCLE_CRON_SECRET` có cùng giá trị với Worker secret. Workflow `lifecycle-dispatch.yml` gọi outbox mỗi giờ; workflow `production-observability.yml` dùng cùng secret để đọc các tổng hợp sự cố đã làm sạch dữ liệu mỗi 15 phút. Endpoint từ chối request thiếu secret. Đăng ký Resend webhook tới `/api/internal/lifecycle/provider-webhook` cho `email.bounced`, `email.complained` và `email.suppressed`; endpoint chỉ ghi suppression sau khi chữ ký Svix hợp lệ. Chạy một email giao dịch thật tới inbox kiểm thử, xác minh chỉ có một thư khi replay cùng dedupe key và kiểm tra dead-letter trước khi bật rộng.

Trang quản trị có workflow hỗ trợ, hủy và hoàn tiền. Chỉ link PayOS trạng thái `PENDING` mới được hủy qua API. Giao dịch đã thanh toán không có API hoàn tiền trong contract tích hợp hiện tại; operator phải đối soát và hoàn tiền ngoài hệ thống, sau đó chọn `manual_refund_confirmed` mới được đánh dấu hoàn tất.
6. Đặt hai origin HTTPS khác nhau, không có path: `NEXT_PUBLIC_APP_URL` cho Worker và `NEXT_PUBLIC_MARKETING_URL` cho Pages.
7. Supabase Auth redirect allowlist chỉ cần app callback/origin. Không thêm Pages origin vào luồng OAuth vì marketing không đăng nhập.
8. Đăng ký PayOS webhook, return và cancel trên app origin; webhook là `https://<app-origin>/api/payment/webhook`. Pages không nhận callback thanh toán.

Các trang `/privacy`, `/terms`, `/contact` luôn build được ở trạng thái bản nháp nhưng mặc định `noindex` và không xuất hiện trong footer/checkout. Chỉ đặt `NEXT_PUBLIC_LEGAL_PAGES_APPROVED=true` sau khi chủ sản phẩm hoặc tư vấn pháp lý duyệt đúng phiên bản nội dung đang commit; đồng thời cấu hình `SUPPORT_EMAIL` bằng hộp thư hỗ trợ chính thức. Khi cờ bật, checkout yêu cầu phụ huynh mở và đồng ý điều khoản/quyền riêng tư trước khi tạo đơn PayOS. Bản deploy lấy cờ từ biến repo cùng tên (`gh variable set NEXT_PUBLIC_LEGAL_PAGES_APPROVED --body true`) và email hỗ trợ từ `ci.yml`; cờ được nhúng lúc build nên đổi biến xong phải deploy lại.

Không đưa secret vào `wrangler.jsonc`, GitHub Actions log hoặc `NEXT_PUBLIC_*`.
`PAIRING_RATE_LIMIT_SECRET` phải là giá trị ngẫu nhiên tối thiểu 32 ký tự. Không xoay vòng secret này tùy tiện: mã ghép tay và QR của từng bé được suy ra từ nó, nên đổi secret làm mọi mã đã in/đã chia sẻ mất hiệu lực. `PARENT_UNLOCK_SECRET` (bắt buộc ở production, tối thiểu 32 ký tự; thiếu thì cookie mở khóa không được ký và kiểm tra phát hành sẽ chặn) tách việc ký cookie mở khóa PIN khỏi secret ghép đôi; đặt hoặc đổi nó chỉ khiến phụ huynh nhập lại PIN một lần. Môi trường không phải production vẫn dùng `PAIRING_RATE_LIMIT_SECRET` khi chưa đặt.

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
3. Kiểm tra `/api/health` trả HTTP 200, `status=ready` và `version` là 12 ký tự đầu của commit vừa deploy (CI build với `NEXT_PUBLIC_COMMIT_SHA` và chờ tới khi bản mới trả lời); từng dependency check chỉ hiện khi gửi `Authorization: Bearer $CRON_SECRET` và phải đều `true`. Sau đó kiểm tra guest, parent, child, PWA và payment return.
4. Rollback app bằng redeploy Worker commit trước. Rollback marketing bằng version Worker `kidhabit-home` trước hoặc build/deploy commit marketing trước. Không rollback schema bằng cách xóa dữ liệu.

Nếu website giới thiệu lỗi sau app cutover, app vẫn truy cập trực tiếp được ở Worker origin; khôi phục version `kidhabit-home` trước, không chuyển auth hoặc checkout sang website giới thiệu.

Thư mascot hằng ngày được giữ sau cờ build `NEXT_PUBLIC_DAILY_MASCOT_LETTER=true`. Mặc định cờ tắt để chưa phát hành giao diện khi đường ghi của phiên thiết bị con chưa được kiểm chứng trên production. Chỉ bật ở môi trường build sau khi kiểm tra phiên hợp lệ và quyền family; cần build/deploy lại để thay đổi cờ.

Nhật ký một câu của trẻ dùng cờ build `NEXT_PUBLIC_DAILY_JOURNAL=true`, mặc định tắt. Trước khi bật, áp migration `202609260001_child_journal.sql` và kiểm tra phiên thiết bị con, quyền đọc trong gia đình, thao tác lưu, tải lại và xuất CSV. Thay đổi cờ cần build/deploy lại.

Thành phố ước mơ dùng cờ build `NEXT_PUBLIC_DREAM_CITY=true`, mặc định tắt. Trước khi bật, áp migration `202609260002_dream_city.sql`; kiểm tra quyền gia đình và phiên thiết bị con, trừ điểm đúng một lần khi mua trùng hoặc đồng thời, giữ nguyên `total_earned`, và tải lại công trình đã xây. Không bật cờ hoặc deploy trước khi hoàn tất backup, preflight và kiểm thử cách ly gia đình. Thay đổi cờ cần build/deploy lại.

Nhắc phụ huynh dùng cờ build `NEXT_PUBLIC_PARENT_REENGAGEMENT=true`, mặc định tắt. Trước khi bật, áp migration `202609260003_parent_reminder_consent.sql`; kiểm tra mặc định tắt, bật/tắt đồng thuận, trạng thái quyền thông báo của thiết bị và lời nhắc trong ứng dụng. Phiên bản này không gửi push; quyền trình duyệt chỉ được yêu cầu sau thao tác rõ ràng của phụ huynh.

Giao diện của bé tự thích ứng theo tuổi (3 dải: 3–8, 9–12, 13+) dùng cờ build `NEXT_PUBLIC_AGE_THEME=true`, mặc định tắt và áp dụng cho mọi bé của bản build. Bản deploy production đọc giá trị từ biến repository `NEXT_PUBLIC_AGE_THEME` (đặt `true` để bật, xóa hoặc đặt `false` rồi chạy lại workflow CI trên `main` để tắt). Migration `202610020003_age_band_override.sql` phải được áp trước khi bật (có rollback ở `supabase/rollbacks/`); chạy `supabase/preflight/202610020003_age_band_override.verify.sql` sau khi áp. Deploy trước migration không gây lỗi vì cờ tắt thì không gửi trường mới và cột chưa có chỉ được đọc như "chưa chọn". Khi bật, bé đang dùng thấy một lời nhắn một lần với nút "Giữ giao diện cũ"; ba mẹ ghim hoặc tắt theo từng bé ở form sửa hồ sơ. Kế hoạch và bằng chứng nghiên cứu: `plans/261002-1500-age-adaptive-theme/plan.md`.

Tiến độ theo ngày cho người chăm sóc ("Hôm nay x / y", "7 ngày gần đây") cần migration `202610030002_caregiver_daily_progress.sql` (có rollback ở `supabase/rollbacks/`); chạy `supabase/preflight/202610030002_caregiver_daily_progress.verify.sql` sau khi áp. Migration thay hàm `caregiver_progress_snapshot()` bằng `caregiver_progress_snapshot(local_today date default null)`; gọi không tham số vẫn trả đúng dạng cũ nên bản build cũ đang mở không hỏng. Nên áp migration trước rồi deploy; nếu deploy trước, ứng dụng nhận lỗi `PGRST202`, tự gọi lại không tham số và ẩn phần mới thay vì báo lỗi. `/api/health` báo schema chưa đủ cho tới khi migration được áp.

Bộ thói quen thích ứng dùng cờ build `NEXT_PUBLIC_HABIT_PROGRAMS=true`, mặc định tắt và áp dụng cho mọi người dùng của bản build (không bật riêng theo gia đình). Bản deploy production đọc giá trị từ biến repository `NEXT_PUBLIC_HABIT_PROGRAMS` (đặt `true` để bật, xóa hoặc đặt `false` rồi chạy lại workflow CI trên `main` để tắt). Migration `202609300001_habit_programs.sql` phải được áp trước khi bật; chạy `supabase/preflight/202609300001_habit_programs.verify.sql` sau khi áp. Khi bảng chưa tồn tại, ứng dụng đọc như "chưa có dữ liệu" nên deploy trước migration không gây lỗi, nhưng lưu tín hiệu hoặc ghi nhận sẽ thất bại. Trước khi bật, kiểm tra: phụ huynh đặt tín hiệu, ghi nhận "Con làm thế nào?" và xem tóm tắt tiến độ; bé từ 15 tuổi tự chọn còn bé nhỏ hơn không thấy câu hỏi; luồng "Chương trình" (chỉ tiếng Việt) thêm thói quen và tín hiệu; tải lại vẫn còn dữ liệu; hai gia đình không thấy dữ liệu của nhau. Luật "từ 15 tuổi" chỉ áp ở giao diện, không ép ở máy chủ. Thay đổi cờ cần build/deploy lại.

Bản deploy production đọc bốn cờ trải nghiệm từ biến repository cùng tên: `NEXT_PUBLIC_DAILY_MASCOT_LETTER`, `NEXT_PUBLIC_DAILY_JOURNAL`, `NEXT_PUBLIC_DREAM_CITY`, `NEXT_PUBLIC_PARENT_REENGAGEMENT` (đặt `true` để bật, xóa hoặc đặt `false` rồi chạy lại workflow CI trên `main` để tắt). Trước khi bật cần đạt `npm run verify:live-experience` (thư mascot, nhật ký, đồng ý nhắc phụ huynh và thành phố ước mơ với hai gia đình tổng hợp, tự dọn sạch) và `npm run verify:live-boundaries`. Nếu `~/.npm` có tệp thuộc root, đặt `npm_config_cache` sang một thư mục ghi được trước khi chạy các lệnh này.

Đăng nhập production hiện dùng Google (nhà cung cấp Email đang tắt trong Supabase cho tới khi bật đăng nhập bằng mã email, xem phần trên). Vì vậy các lệnh kiểm tra live không đăng nhập bằng mật khẩu: chúng tạo người dùng thử bằng API quản trị rồi lấy phiên từ một liên kết dùng một lần do quản trị viên cấp (`generateLink` và `verifyOtp`), và dọn sạch người dùng lẫn gia đình sau khi chạy. Nếu sau này có người dùng chỉ có danh tính email, họ cần liên kết Google trước khi tắt Email.

### Đăng nhập bằng mã một lần qua email

Cờ build `NEXT_PUBLIC_EMAIL_CODE_LOGIN=true` (biến repository cùng tên, mặc định tắt) hiện ô "nhận mã đăng nhập qua email" cạnh nút Google ở màn hình vào ứng dụng, `/start` và `/checkout`. Phụ huynh nhập email, nhận mã số trong thư, nhập mã là vào. Ứng dụng không tự gửi thư này: **Supabase Auth gửi**, nên phải cấu hình Supabase trước khi bật cờ.

1. **Thư đi bằng SMTP riêng.** SMTP có sẵn của Supabase chỉ để thử (chỉ gửi tới thành viên nhóm, vài thư mỗi giờ). Có ba lựa chọn; nhập vào Supabase → Authentication → Emails → SMTP Settings, người gửi là `KidHabit Hero <no-reply@kidhabithero.com>`. Khóa và mật khẩu do chủ dự án tự nhập, không đưa vào kho mã.
   - **Brevo (khuyến nghị cho giai đoạn đầu):** gói miễn phí gửi tối đa 300 thư mỗi ngày sau khi Brevo duyệt tài khoản gửi (theo trang giá của Brevo). Host `smtp-relay.brevo.com`, cổng `587` (hoặc `465` với SSL/TLS). Tên đăng nhập và **SMTP key** lấy ở Brevo → SMTP & API → tab SMTP; phải dùng SMTP key, không dùng API key. Trong Brevo, thêm và xác thực miền `kidhabithero.com` (bản ghi DKIM, DMARC, mã xác minh ở Cloudflare DNS) rồi thêm `no-reply@kidhabithero.com` làm người gửi. Kiểm tra thư mã đăng nhập không bị gắn chân trang "Sent with Brevo"; chân trang này chỉ gỡ được ở gói trả phí.
   - **Resend:** host `smtp.resend.com`, cổng `465`, user `resend`, mật khẩu là API key chỉ có quyền gửi; xác minh miền `kidhabithero.com` bằng SPF, DKIM. Đã dùng cho email vòng đời.
   - **Cloudflare Email Sending (beta):** host `smtp.mx.cloudflare.net`, cổng `465`, user `api_token`, mật khẩu là API token có quyền "Email Sending: Edit". Gửi tới người nhận bất kỳ cần gói Workers Paid (3.000 thư mỗi tháng đã gồm); gói Workers Free chỉ gửi được tới địa chỉ đã xác minh trong tài khoản nên không dùng được cho phụ huynh.
   Sau khi dùng SMTP riêng, Supabase có hạn mức thư mỗi giờ của chính nó (Authentication → Rate Limits); nâng lên cho khớp lượng đăng nhập dự kiến.
2. **Bật nhà cung cấp Email** (Authentication → Providers → Email) và để bật "Enable email signups" để người mới tạo được tài khoản bằng mã. Nhà cung cấp này cũng cho phép đăng nhập bằng mật khẩu qua API; giao diện không có mật khẩu nên tài khoản tạo bằng mã không có mật khẩu, và đăng ký có mật khẩu qua API cũng không vào được nếu giữ bật "Confirm email". Rủi ro còn lại: ai có khóa công khai vẫn có thể gọi API để tạo tài khoản chưa xác nhận (mỗi tài khoản sinh ra một gia đình trống); giới hạn này chỉ dựa vào hạn mức theo IP của Supabase. Nếu thấy lạm dụng, bật CAPTCHA (Cloudflare Turnstile) trong Supabase và bổ sung `captchaToken` vào `requestEmailCode`.
3. **Mẫu thư.** Dán các mẫu có sẵn trong [`supabase/email-templates/`](../supabase/email-templates/README.md) vào Authentication → Emails (bảng trong README ghi tiêu đề và mẫu tương ứng). Mẫu "Magic link" dùng cho cả mã đăng nhập: chỉ có dòng mã `{{ .Token }}`, không có liên kết. Đặt độ dài mã 6 chữ số, hiệu lực 10 phút (600 giây), giới hạn gửi theo email/giờ hợp lý (mặc định 60 giây giữa hai lần gửi).
4. **Tài khoản Google cũ.** Supabase liên kết danh tính theo email đã xác minh, nên người đã vào bằng Google rồi nhập cùng email để lấy mã sẽ vào đúng gia đình cũ.
5. Đặt biến repository `NEXT_PUBLIC_EMAIL_CODE_LOGIN=true`, chạy lại workflow CI trên `main`, rồi tự thử: gửi mã tới một email của bạn, nhập mã, kiểm tra thư không vào spam. Tắt bằng cách xóa biến hoặc đặt `false` rồi deploy lại.

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

### Bảng giá theo bậc và ưu đãi ra mắt (`202610070001`)

Migration `supabase/migrations/202610070001_pricing_tiers_launch_offer.sql` thêm gói `solo_yearly`, giới hạn 5 bé cho Gói Pro và dùng thử (trigger `enforce_family_child_limit`, hàm `family_child_limit`), bảng `launch_offer_claims` và RPC `launch_offer_remaining`, và áp giảm giá giới thiệu cho cả hai gói năm. Phiên bản schema là `202610070001`.

1. Trước `db push`, chạy truy vấn chỉ đọc sau để biết trước các gia đình đang ở Gói Pro (tháng/năm) hoặc dùng thử còn hạn mà có hơn 5 bé. Những gia đình này giữ nguyên hồ sơ (giới hạn chỉ chặn việc thêm mới):

   ```sql
   select subscription.family_id, subscription.plan, count(child.*) as children
   from public.user_subscriptions subscription
   join public.child_profiles child on child.family_id = subscription.family_id
   where subscription.status = 'active'
     and (
       (subscription.plan in ('monthly', 'yearly') and subscription.subscription_ends_at > now())
       or (subscription.plan = 'trial' and subscription.trial_ends_at > now())
     )
   group by subscription.family_id, subscription.plan
   having count(child.*) > 5;
   ```

2. Kiểm tra project ref là `evkwelozdcmsmwdzhlxz`, rồi áp migration (`db push`).
3. Sau khi áp, chạy `supabase/preflight/202610070001_pricing_tiers_launch_offer.verify.sql` bằng vai trò `postgres` qua `psql` hoặc Supabase CLI, trong khung giờ ít người dùng: tệp khóa dòng ưu đãi trong lúc chạy và hoàn tác toàn bộ (rollback) khi xong. Tệp dùng `launch_offers` và các hàm mới nên chỉ chạy được sau migration.
4. Sau đó deploy ứng dụng; trang marketing chỉ deploy sau khi app đã có migration, để giá công khai không đi trước dữ liệu.
5. Ứng dụng cần biến `NEXT_PUBLIC_MARKETING_URL` (origin của trang marketing, ví dụ `https://kidhabithero.com`): endpoint công khai trả số suất ưu đãi còn lại dùng nó cho CORS. Thiếu biến thì trang marketing không đọc được số suất thật.
6. Hoàn tiền một đơn Gói Pro năm đang giữ suất ưu đãi do quản trị viên xử lý thủ công trong admin; suất bị thu hồi cùng đơn.

## Staged rollout

- Preview: health endpoint phải `ready`; chạy E2E desktop/mobile và webhook test mode.
- 10% traffic/canary: theo dõi 15 phút error rate, pairing denials và webhook mismatch.
- Promote khi không có P0/P1, API 5xx <1%, payment activation 100% với webhook hợp lệ.
- Rollback Worker ngay nếu cross-family read, entitlement sai, webhook unsigned accepted hoặc data loss.

## Rotation

PayOS credentials từng xuất hiện trong hội thoại đã được thay bằng channel production mới ngày 2026-09-21. Runtime và release preflight tiếp tục từ chối fingerprint của bộ khóa đã lộ. Với lần rotation tiếp theo, cập nhật Worker secrets và webhook verification, deploy, smoke test, rồi revoke key cũ.

## Gợi ý bằng AI (Cloudflare Workers AI)

Cờ build `NEXT_PUBLIC_PARENT_AI=true` (mặc định tắt; biến repository cùng tên, đặt rồi chạy lại CI trên `main`). Cần: binding `AI` trong `wrangler.jsonc` (đã có), migration `202610040004_parent_ai.sql` đã áp (chạy `supabase/preflight/202610040004_parent_ai.verify.sql` sau khi áp; hoàn tác ở `supabase/rollbacks/`). Tên mô hình ở `src/lib/ai/config.ts` (`AI_MODEL`); hạn mức theo gia đình và toàn hệ thống ở `AI_LIMITS` (gói miễn phí chỉ có 10.000 Neurons/ngày cho cả tài khoản, nên `systemPerDay` là giới hạn thật).

- **Tắt khẩn cấp không cần build**: đặt biến Worker `AI_KILL_SWITCH=true` (dashboard Cloudflare hoặc `wrangler secret put AI_KILL_SWITCH`); mọi route AI trả 503 `ai_disabled`. Gỡ biến để bật lại.
- **Trước khi bật cho người dùng thật** phải xong: xác minh điều khoản Cloudflare về dữ liệu gửi qua Workers AI (ghi ngày và đường dẫn vào `docs/security-privacy.md`), cập nhật chính sách riêng tư và danh sách bên xử lý, duyệt văn bản đồng ý (đổi `AI_POLICY_VERSION` khi đổi văn bản để mọi người đồng ý lại). Thử chọn mô hình với bảng 20 thói quen mẫu vi/en.
- Theo dõi: Workers AI dashboard (Neurons); log của ứng dụng chỉ có mã (`model_timeout`, `quota_system_day`, `model_invalid_output`…), không có nội dung.
