# Security and Privacy

## Dữ liệu được bảo vệ

Ứng dụng lưu hồ sơ trẻ, thói quen, tiến độ, điểm, phần thưởng, thiết bị ghép nối, subscription và thông tin liên hệ tùy chọn của phụ huynh. Không đưa dữ liệu trẻ, session token, PIN, PayOS key hoặc payload webhook vào telemetry.

## Kiểm soát chính

- Family tenancy và strict RLS; không có anonymous ownership bypass.
- Vai trò trong gia đình: `owner`/`parent`/`guardian` quản lý và đọc mọi dữ liệu gia đình. `caregiver` chỉ đọc tiến độ qua `caregiver_progress_snapshot`: tên bé (kèm mã hồ sơ, hình đại diện, màu giao diện), tiêu đề, mô tả và quy tắc lặp (loại lặp, các ngày trong tuần, ngày tạo) của thói quen đang hoạt động, tổng số lượt hoàn thành hoặc đã duyệt của từng bé, và số lượt hoàn thành hoặc đã duyệt của từng bé theo ngày trong 7 ngày gần nhất (hàm nhận ngày của trình duyệt qua tham số tùy chọn `local_today`, chỉ chấp nhận trong khoảng ±1 ngày so với ngày máy chủ, ngoài khoảng thì dùng ngày máy chủ; gọi không tham số vẫn trả dạng cũ). Hàm không trả từng lượt làm, mã thói quen của từng lượt, giờ làm, ghi chú minh chứng, tuổi, biệt danh, mã người dùng, điểm, huy hiệu, quà, lượt đổi quà, lời khen, nhóm, mã mời, trạng thái gói hay cài đặt. RLS yêu cầu `can_manage_family` khi đọc trực tiếp các bảng dữ liệu gia đình; người chăm sóc chỉ đọc được tên gia đình và membership của chính mình, cùng consent do chính mình ghi. Mỗi tài khoản thuộc đúng một gia đình (unique index trên `family_memberships.user_id`).
- Trình duyệt chỉ nhận các cột mà ứng dụng thực sự đọc: `family_snapshot` và các truy vấn dự phòng liệt kê cột tường minh (cùng danh sách với schema trong `src/lib/supabase/mappers.ts` và `src/lib/experience-state.ts`, có test đối chiếu), nên cột mới thêm vào bảng không tự lộ ra.
- UUID canonical, foreign key cùng family và transaction row locks.
- Mã ghép nối cố định theo từng bé, lưu dưới dạng digest; phụ huynh có thể chủ động làm mới mã, thu hồi từng thiết bị và hệ thống vẫn áp dụng rate limit: mỗi nguồn gọi 10 lần/10 phút (kiểm tra trước), và ngân sách chung 120 lần/phút chỉ tính các lần nhập mã tay. Quét QR (token 32 byte ngẫu nhiên) không bị ngân sách chung chặn, nên một nguồn spam không khóa được việc ghép đôi của gia đình khác.
- PayOS fail-closed: bắt buộc cấu hình, strict webhook schema, HMAC timing-safe, amount/description/owner check và idempotency key.
- Trial chỉ dùng một lần; entitlement và giới hạn số bé được kiểm tra ở database.
- Leaderboard gia đình/công khai mặc định riêng tư; projection công khai không có family/user ID hoặc thời điểm tạo.
- Mã PIN phụ huynh được máy chủ kiểm tra: khi nhập đúng, trình duyệt nhận cookie `kidhabit_parent_unlock` (HttpOnly, SameSite=Strict, ký HMAC, gắn với phụ huynh, gia đình và phiên bản PIN hiện tại, hiệu lực 2 giờ, xóa khi khóa lại). Đổi PIN ở bất kỳ đâu làm mọi cookie mở khóa cũ mất hiệu lực ngay. Cookie ký bằng `PARENT_UNLOCK_SECRET` (bắt buộc ở production, tối thiểu 32 ký tự; môi trường khác dùng `PAIRING_RATE_LIMIT_SECRET` khi chưa đặt). Các thao tác nhạy cảm (xóa gia đình, thu hồi thiết bị, xem hoặc đổi mã ghép của bé, tạo thanh toán, duyệt việc và quà) trả 403 `parent_pin_required` nếu gia đình có PIN mà cookie thiếu hoặc hết hạn; giao diện khi đó quay lại màn hình khóa. Việc bé chạm hoàn thành trên máy phụ huynh không cần PIN.
- Các hàm cơ sở dữ liệu của những thao tác cần PIN **chỉ vai trò máy chủ được gọi** (người dùng đăng nhập không gọi thẳng được từ trình duyệt, vì cookie PIN chỉ có tác dụng ở tầng API). Tuyến API kiểm PIN rồi gọi bản `<tên>_as(actor_user_id, ...)` bằng khóa dịch vụ với mã phụ huynh đã xác thực; hàm bọc đặt danh tính đó cho đúng một giao dịch (`public.act_as_user`) rồi chạy hàm gốc không đổi, nên kiểm tra thành viên gia đình, khóa, cộng điểm và hoàn điểm giữ nguyên. Áp dụng cho duyệt thói quen (đơn lẻ và hàng loạt), duyệt đổi quà, cộng/trừ sao thủ công, thu hồi thiết bị, xem và đổi mã ghép, xóa gia đình và hạn mức AI. **Triển khai hai giai đoạn** (kiểm tra sức khỏe sau deploy đòi cơ sở dữ liệu có phiên bản migration bằng hoặc mới hơn bản mã, nên migration luôn áp trước): (1) migration thêm các hàm bọc, rồi deploy mã dùng chúng; các hàm gốc vẫn mở nên bản mã cũ chưa hỏng; (2) khi mã mới đã chạy ổn, migration thứ hai (`202610050002`) thu hồi quyền của các hàm gốc với mọi vai trò API (các hàm bọc vẫn chạy được vì chúng chạy với quyền chủ sở hữu hàm). Thêm hàm cần PIN mới thì làm theo cùng cách, đừng cấp `execute` cho `authenticated`.
- Mọi API ghi bằng cookie từ chối yêu cầu khác nguồn gốc (`Origin`/`Sec-Fetch-Site`).
- Vai trò `anon` chỉ gọi được các hàm nhận mã thiết bị của bé, đổi mã ghép đôi và bảng xếp hạng công khai; hàm thanh toán, hàng đợi email và ghép đôi chỉ dành cho service role. Hàm mới mặc định đóng.
- CSP, deny framing, restrictive permissions policy và referrer policy.
- `/api/health` công khai chỉ trả `status` và `version`; chi tiết từng thành phần (database, phiên bản schema, payOS, secret ghép đôi) chỉ hiện khi gửi `Authorization: Bearer $CRON_SECRET`. Chỉ báo `ready` khi database đã áp dụng ít nhất migration mới nhất của bản build; `schema_version` chỉ cho service role thực thi.
- GitHub Actions ghim theo commit SHA; Dependabot (`.github/dependabot.yml`) cập nhật action và gói npm hằng tuần.

## Đồng thuận và vòng đời

Trong projection tiến độ theo ngày của người chăm sóc, thời điểm tạo thói quen là `created_at` (ISO timestamptz), thay cho `created_on` bị cắt theo UTC; trình duyệt đổi sang ngày địa phương trước khi tính số việc đến hạn. Số hoàn thành theo ngày chỉ đếm log của thói quen đang hoạt động, đến hạn vào ngày log và đang gán cho chính bé đó hoặc dùng chung. Tổng "Từ trước đến nay" vẫn giữ ý nghĩa lịch sử, kể cả khi thói quen đã chuyển bé hoặc đổi lịch. Gọi không tham số vẫn trả dạng cũ, không có các trường lặp, thời điểm tạo hay tiến độ theo ngày.

Cloud onboarding yêu cầu người lớn xác nhận quyền quản lý dữ liệu của bé; consent lưu theo policy version. Phụ huynh tải được nhật ký của bé dưới dạng CSV và bản sao toàn bộ dữ liệu gia đình dưới dạng JSON (thẻ "Dữ liệu gia đình", `src/components/FamilyDataCard.tsx`; gồm cả nhật ký, danh sách ước, việc hoãn, kế hoạch tín hiệu và mức hỗ trợ đã ghi). Cả hai file chứa dữ liệu của bé nên cần được giữ riêng tư. Khôi phục từ file JSON chỉ có khi dữ liệu nằm trên máy (chế độ cục bộ, chưa đăng nhập); với gia đình trên cloud, giao diện không cho ghi đè dữ liệu cloud từ file. Owner có thể xóa toàn bộ family sau confirmation phrase; cascade xóa domain data và session đã ghép nối.

Bộ thói quen thích ứng lưu hai loại dữ liệu theo gia đình: kế hoạch tín hiệu của từng thói quen (câu tín hiệu, giờ, nơi) và ghi nhận cách bé hoàn thành từng lần ("tự làm", "được nhắc", "làm cùng"). Cả hai bảng bật và ép RLS, chỉ người quản lý gia đình đọc được (người chăm sóc không đọc), chỉ ghi qua hàm có kiểm tra quyền (phụ huynh, hoặc thiết bị bé đã ghép đôi cho chính bản ghi của bé) và bị xóa cùng bé hoặc gia đình. Dữ liệu này chỉ để hiển thị và gợi ý điều chỉnh cho phụ huynh, không dùng cho xếp hạng hay so sánh giữa các bé. Bản sao JSON của gia đình có gồm các dòng này (xem đoạn trên).

Bảng xếp hạng công khai chỉ hiện một bé khi cả hai điều kiện cùng đúng: gia đình đã bật chia sẻ (mặc định tắt, chỉ phụ huynh đổi được, ghi thành consent `leaderboard` có thể thu hồi) và hồ sơ của bé được đánh dấu tham gia (bé mới mặc định riêng tư). Hàm công khai chỉ trả biệt danh hoặc "Bé Siêu Nhân", hình đại diện, điểm kiếm được trong kỳ, chuỗi ngày và hạng; không trả mã bé, mã gia đình, tên thật hay tuổi. Điểm là điểm kiếm được từ nhật ký đã xác nhận trong kỳ lịch của người xem, không phải số dư nên tiêu điểm không đổi thứ hạng. Bảng Gia đình và Nhóm chỉ dùng dữ liệu trong gia đình.

Chương trình giới thiệu lưu mã giới thiệu trong cookie `kidhabit_ref` (60 ngày, xóa khi đã ghi nhận) và thông tin ngân hàng của người giới thiệu (chỉ admin được phân quyền xem, số tài khoản chỉ hiện 4 số cuối cho chính chủ). Người giới thiệu không bao giờ thấy thông tin của gia đình được giới thiệu. Chi tiết và quy tắc: [`affiliate-program.md`](affiliate-program.md).

Khôi phục tài khoản Supabase Auth không đồng nghĩa khôi phục dữ liệu đã xóa. Backup operator và quy trình phục hồi nằm trong [`data-recovery.md`](data-recovery.md).

## Phạm vi pháp lý

Các mặc định được thiết kế bảo thủ cho dữ liệu trẻ, nhưng đây không phải chứng nhận COPPA/GDPR-K. Trước khi mở social/public leaderboard tại thị trường cụ thể, cần legal review về tuổi đồng thuận, retention, DPA, quyền truy cập/xóa và quy trình báo cáo nội dung.

## Báo cáo sự cố

Không gửi secret hoặc dữ liệu trẻ qua issue công khai. Dùng kênh support riêng của operator và cung cấp correlation ID, thời điểm, route và reason code.

## Chính sách nội dung (CSP)

Script chỉ được chạy khi mang nonce ngẫu nhiên theo từng yêu cầu (`src/middleware.ts`, kèm `strict-dynamic`); không còn `unsafe-inline` cho script. Style vẫn cho phép `unsafe-inline` vì thuộc tính `style` dựng ở máy chủ không gắn được nonce. Dùng middleware chạy trên edge chứ không phải `proxy.ts` vì bộ chuyển OpenNext cho Cloudflare chưa hỗ trợ proxy chạy Node.js; khi bộ chuyển hỗ trợ có thể đổi tên tệp. Mọi trang render theo yêu cầu nên không được cache ở CDN. Script nội tuyến mới phải lấy nonce từ tiêu đề `x-nonce` (xem `src/app/layout.tsx`).

## Gợi ý bằng AI

Chỉ cho phụ huynh, khi cờ `NEXT_PUBLIC_PARENT_AI` bật **và** phụ huynh đồng ý riêng (loại `parent_ai` trong `family_consents`, theo phiên bản văn bản `AI_POLICY_VERSION`, rút được; được kiểm lại ngay trước khi gọi mô hình). Bên xử lý: Cloudflare Workers AI (cùng nền tảng chạy ứng dụng). Gửi đi: (1) tên một thói quen phụ huynh vừa gõ, đã bỏ liên kết, email, số điện thoại, ký tự điều khiển và **tên/biệt danh của các bé trong gia đình**, cùng nhóm tuổi; hoặc (2) các số đếm theo tuần (không tên thói quen, không tên bé). Không gửi: tên bé, nhật ký, văn bản bé viết, ảnh, email phụ huynh. Tiêu đề có lời ra lệnh cho mô hình bị từ chối trước khi gửi. Đầu ra bị ép về JSON cố định rồi kiểm lại (độ dài, từ phán xét/chẩn đoán/hứa hẹn, liên kết, đồ vật nguy hiểm cho trẻ nhỏ, bước làm cùng người lớn cho trẻ dưới 6 tuổi) và chỉ là gợi ý có nhãn, phụ huynh chọn dùng hoặc bỏ. Nội dung gửi và nhận **không được ghi vào log** (logger chỉ giữ mã). Hạn mức do hàm `consume_ai_quota` đếm dưới khóa hàng; bảng đếm không có quyền truy cập từ client. Điều khoản dữ liệu của Cloudflare phải được xác minh lại trước khi bật cho người dùng (xem `docs/deployment.md`).
