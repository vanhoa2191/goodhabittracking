# Security and Privacy

## Dữ liệu được bảo vệ

Ứng dụng lưu hồ sơ trẻ, thói quen, tiến độ, điểm, phần thưởng, thiết bị ghép nối, subscription và thông tin liên hệ tùy chọn của phụ huynh. Không đưa dữ liệu trẻ, session token, PIN, PayOS key hoặc payload webhook vào telemetry.

## Kiểm soát chính

- Family tenancy và strict RLS; không có anonymous ownership bypass.
- UUID canonical, foreign key cùng family và transaction row locks.
- Mã ghép nối cố định theo từng bé, lưu dưới dạng digest; phụ huynh có thể chủ động làm mới mã, thu hồi từng thiết bị và hệ thống vẫn áp dụng rate limit.
- PayOS fail-closed: bắt buộc cấu hình, strict webhook schema, HMAC timing-safe, amount/description/owner check và idempotency key.
- Trial chỉ dùng một lần; entitlement và giới hạn số bé được kiểm tra ở database.
- Leaderboard gia đình/công khai mặc định riêng tư; projection công khai không có family/user ID hoặc thời điểm tạo.
- CSP, deny framing, restrictive permissions policy và referrer policy.

## Đồng thuận và vòng đời

Cloud onboarding yêu cầu người lớn xác nhận quyền quản lý dữ liệu của bé; consent lưu theo policy version. Export tạo bản sao JSON. Owner có thể xóa toàn bộ family sau confirmation phrase; cascade xóa domain data và session đã ghép nối.

Khôi phục tài khoản Supabase Auth không đồng nghĩa khôi phục dữ liệu đã xóa. Backup operator và quy trình phục hồi nằm trong [`data-recovery.md`](data-recovery.md).

## Phạm vi pháp lý

Các mặc định được thiết kế bảo thủ cho dữ liệu trẻ, nhưng đây không phải chứng nhận COPPA/GDPR-K. Trước khi mở social/public leaderboard tại thị trường cụ thể, cần legal review về tuổi đồng thuận, retention, DPA, quyền truy cập/xóa và quy trình báo cáo nội dung.

## Báo cáo sự cố

Không gửi secret hoặc dữ liệu trẻ qua issue công khai. Dùng kênh support riêng của operator và cung cấp correlation ID, thời điểm, route và reason code.
