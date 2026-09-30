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
- Mã PIN phụ huynh được máy chủ kiểm tra: khi nhập đúng, trình duyệt nhận cookie `kidhabit_parent_unlock` (HttpOnly, SameSite=Strict, ký HMAC, gắn với phụ huynh và gia đình, hiệu lực 2 giờ, xóa khi khóa lại). Các thao tác nhạy cảm (xóa gia đình, thu hồi thiết bị, xem hoặc đổi mã ghép của bé, tạo thanh toán, duyệt việc và quà) trả 403 `parent_pin_required` nếu gia đình có PIN mà cookie thiếu hoặc hết hạn; giao diện khi đó quay lại màn hình khóa. Việc bé chạm hoàn thành trên máy phụ huynh không cần PIN.
- Mọi API ghi bằng cookie từ chối yêu cầu khác nguồn gốc (`Origin`/`Sec-Fetch-Site`).
- Vai trò `anon` chỉ gọi được các hàm nhận mã thiết bị của bé, đổi mã ghép đôi và bảng xếp hạng công khai; hàm thanh toán, hàng đợi email và ghép đôi chỉ dành cho service role. Hàm mới mặc định đóng.
- CSP, deny framing, restrictive permissions policy và referrer policy.

## Đồng thuận và vòng đời

Cloud onboarding yêu cầu người lớn xác nhận quyền quản lý dữ liệu của bé; consent lưu theo policy version. Giao diện chỉ cho tải nhật ký của bé dưới dạng CSV; file này chứa văn bản của bé nên cần được giữ riêng tư. Định dạng bản sao JSON của gia đình (gồm cả nhật ký, danh sách ước, việc hoãn, kế hoạch tín hiệu và mức hỗ trợ đã ghi) có sẵn trong mã nguồn nhưng chưa được giao diện gọi, nên chưa có export/import toàn bộ dữ liệu cho người dùng. Owner có thể xóa toàn bộ family sau confirmation phrase; cascade xóa domain data và session đã ghép nối.

Bộ thói quen thích ứng lưu hai loại dữ liệu theo gia đình: kế hoạch tín hiệu của từng thói quen (câu tín hiệu, giờ, nơi) và ghi nhận cách bé hoàn thành từng lần ("tự làm", "được nhắc", "làm cùng"). Cả hai bảng bật và ép RLS, chỉ thành viên gia đình đọc được, chỉ ghi qua hàm có kiểm tra quyền (phụ huynh, hoặc thiết bị bé đã ghép đôi cho chính bản ghi của bé) và bị xóa cùng bé hoặc gia đình. Dữ liệu này chỉ để hiển thị và gợi ý điều chỉnh cho phụ huynh, không dùng cho xếp hạng hay so sánh giữa các bé. Định dạng bản sao JSON của gia đình có gồm các dòng này, nhưng giao diện chưa gọi nó (xem đoạn trên).

Bảng xếp hạng công khai chỉ hiện một bé khi cả hai điều kiện cùng đúng: gia đình đã bật chia sẻ (mặc định tắt, chỉ phụ huynh đổi được, ghi thành consent `leaderboard` có thể thu hồi) và hồ sơ của bé được đánh dấu tham gia (bé mới mặc định riêng tư). Hàm công khai chỉ trả biệt danh hoặc "Bé Siêu Nhân", hình đại diện, điểm kiếm được trong kỳ, chuỗi ngày và hạng; không trả mã bé, mã gia đình, tên thật hay tuổi. Điểm là điểm kiếm được từ nhật ký đã xác nhận trong kỳ lịch của người xem, không phải số dư nên tiêu điểm không đổi thứ hạng. Bảng Gia đình và Nhóm chỉ dùng dữ liệu trong gia đình.

Khôi phục tài khoản Supabase Auth không đồng nghĩa khôi phục dữ liệu đã xóa. Backup operator và quy trình phục hồi nằm trong [`data-recovery.md`](data-recovery.md).

## Phạm vi pháp lý

Các mặc định được thiết kế bảo thủ cho dữ liệu trẻ, nhưng đây không phải chứng nhận COPPA/GDPR-K. Trước khi mở social/public leaderboard tại thị trường cụ thể, cần legal review về tuổi đồng thuận, retention, DPA, quyền truy cập/xóa và quy trình báo cáo nội dung.

## Báo cáo sự cố

Không gửi secret hoặc dữ liệu trẻ qua issue công khai. Dùng kênh support riêng của operator và cung cấp correlation ID, thời điểm, route và reason code.
