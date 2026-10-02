# 10. Quản trị và vận hành

[← 9. Bảo mật và riêng tư](09-bao-mat-va-rieng-tu.md) · [Mục lục](README.md) · [Tiếp: 11. Website và trang công khai →](11-website-va-trang-cong-khai.md)

## Trong tài liệu này

[Vào trang quản trị](#admin) · [Vai trò và quyền](#quyen) · [Tổng quan](#tong-quan-admin) · [Khách hàng](#khach-hang) · [Thanh toán và hỗ trợ](#thanh-toan-admin) · [Coupon](#coupon-admin) · [Giới thiệu](#gioi-thieu-admin) · [Phễu kích hoạt](#pheu) · [Cấp quyền quản trị](#cap-quyen) · [Tác vụ chạy nền](#tac-vu-nen) · [Theo dõi sức khỏe](#suc-khoe) · [Cờ phát hành và cấu hình](#co-phat-hanh) · [Phát hành và cơ sở dữ liệu](#phat-hanh) · [Liên quan](#lien-quan)

Tài liệu này dành cho đội vận hành và hỗ trợ. Trang quản trị khác hoàn toàn với khu phụ huynh: phụ huynh quản lý một gia đình, quản trị viên hỗ trợ nhiều khách hàng.

<a id="admin"></a>
## Vào trang quản trị

Địa chỉ `app.kidhabithero.com/admin` (đúng tài khoản đã được cấp quyền mới vào được). Mỗi tài khoản quản trị phải bật **xác minh hai bước** (ứng dụng TOTP như Google Authenticator, 1Password, Authy):

1. Chưa có quyền → hiện "Không có quyền truy cập".
2. Có quyền nhưng chưa xác minh hai bước → "Cần xác minh hai bước", nút dẫn tới `Bảo mật quản trị` (`/admin/security`): **Tạo mã thiết lập**, quét QR (hoặc nhập mã tay nếu không quét được), nhập mã 6 số, **Xác minh và tiếp tục**.
3. Xong → vào "Quản trị khách hàng" với 6 tab, hiện vai trò và email bạn đang dùng.

Mọi thao tác thay đổi dữ liệu đều **cần xác minh hai bước, một lý do bắt buộc (5 đến 500 ký tự)** và được ghi vào nhật ký quản trị theo ba giai đoạn (bắt đầu, thành công hoặc thất bại). Nhật ký chỉ lưu các trường đã được cho phép (không có tên, email, ghi chú hay số điện thoại).

<a id="quyen"></a>
## Vai trò và quyền

| Việc | Hỗ trợ (`support`) | Tài chính (`finance`) | Quản trị cấp cao (`super_admin`) |
|---|---|---|---|
| Xem khách hàng, gói, ca hỗ trợ | Có | Có | Có |
| Sửa hồ sơ khách hàng (tên, điện thoại, thẻ, ghi chú, đồng ý nhận ưu đãi) | Có | Không | Có |
| Mở ca hỗ trợ, hoàn tiền, hủy | Có | Có | Có |
| Xử lý ca (duyệt, từ chối, hoàn tất, hủy link, hủy gói) | Không | Có | Có |
| Đổi gói đăng ký | Không | Có | Có |
| Quản lý coupon | Không | Có | Có |
| Chi trả hoa hồng giới thiệu | Không | Có | Có |
| Cấp hoặc thu hồi quyền quản trị | Không | Không | Có |

Quyền quản trị luôn có **ngày hết hạn** và thu hồi được ngay.

<a id="tong-quan-admin"></a>
## Tab Tổng quan

Mở đầu bằng khối **Cần xử lý**, mỗi mục là một liên kết mở đúng tab: yêu cầu rút hoa hồng đang chờ (kèm tổng tiền), ca hỗ trợ đang mở (đã tiếp nhận, đang xem xét, đã chấp thuận) và đơn thanh toán đang chờ trong 24 giờ qua. Kế tiếp là **Tình hình gói**: số gia đình đang trả phí (còn hạn hoặc trọn đời), đang dùng thử và **sắp hết hạn trong 7 ngày**. Số nào không đọc được sẽ hiện "không có số liệu", không hiện 0. Nếu cả tổng quan lỗi, các tab khác vẫn dùng được.

<a id="khach-hang"></a>
## Tab Khách hàng

- Danh sách khách hàng có ô tìm kiếm và **bộ lọc**: Tất cả, Trả phí, Dùng thử, Sắp hết hạn, Chưa có gói (kèm số lượng); mỗi dòng cho biết còn bao lâu hết hạn. Chọn một khách hàng để xem và chỉnh gói, hồ sơ chăm sóc.
- **Gói đăng ký**: chọn Chưa có gói, Dùng thử, Gói Một Bé, Gói Gia Đình · Tháng, Gói Gia Đình · Năm hoặc Trọn đời; trạng thái Đang hoạt động hoặc Chưa hoạt động; ngày hết hạn. Chọn gói mà để trạng thái cũ sẽ được tự bật và khởi tạo một kỳ đầy đủ. Lưu bằng "Lưu gói đăng ký" kèm lý do. Hệ thống phát hiện chỉnh sửa trùng (người khác vừa đổi) và yêu cầu tải lại.
- **Hồ sơ khách hàng**: tên hiển thị, điện thoại, thẻ khách hàng, ghi chú nội bộ, đồng ý nhận ưu đãi.
- Gói **Trọn đời** chỉ cấp được ở đây (không có nút mua) và ảnh hưởng tới [số bé](07-goi-va-thanh-toan.md#cac-goi).

<a id="thanh-toan-admin"></a>
## Tab Thanh toán

Nơi xử lý các yêu cầu liên quan tới tiền của khách. Đơn đang chờ và gói không kích hoạt được tra ở [Tổng quan](#tong-quan-admin) và [đối soát](07-goi-va-thanh-toan.md#kich-hoat); mọi thay đổi gói thì làm ở [tab Khách hàng](#khach-hang).

<a id="phieu-ho-tro"></a>
### Hỗ trợ thanh toán và hoàn tiền

Mỗi yêu cầu là một **ca** (hồ sơ hỗ trợ), gắn với khách hàng, gia đình và (nếu có) mã đơn:

| Loại ca | Lý do thường gặp |
|---|---|
| Hỗ trợ | Cần cung cấp thông tin |
| Hoàn tiền | Thanh toán trùng, chọn nhầm gói, vấn đề dịch vụ, thay đổi nhu cầu |
| Hủy link hoặc hủy gói | Link thanh toán còn chờ, hoặc hủy gói đang dùng |

Trạng thái: Đã tiếp nhận → Đang xem xét → Đã chấp thuận hoặc Từ chối → Hoàn tất.

- **Hủy link thanh toán đang chờ**: hệ thống gọi PayOS trước; chỉ đánh dấu đã hủy sau khi PayOS xác nhận. Nếu PayOS không xác nhận thì ca giữ mở để đối soát trong bảng điều khiển PayOS.
- **Hoàn tiền**: PayOS không có đường hoàn tiền tự động trong hợp đồng đang dùng; **không đánh dấu hoàn tất chỉ vì đã chấp thuận**. Chính sách công bố: trong 30 ngày kể từ ngày thanh toán thì coi là đủ điều kiện, chỉ cần kiểm tra đơn tồn tại, đã trả và chưa hoàn. Quy trình: tạo ca → đang xem xét → chấp thuận (cần hoàn thủ công) → hoàn tiền thủ công và kiểm chứng độc lập → đánh dấu "Hoàn tiền thủ công đã xác nhận" mới hoàn tất. Ca hoàn tất đã đóng thì không đổi lại.
- Khi hoàn tiền được xác nhận, **hoa hồng giới thiệu** của đơn tự động bị thu hồi nếu còn đang giữ; ca không có mã đơn thì bị cảnh báo để xử lý tay ([8](08-gioi-thieu-ban-be.md#hoan-tien-hoa-hong)).
- Ca đổi trạng thái sẽ gửi [email cập nhật](07-goi-va-thanh-toan.md#email) cho khách.

Chi tiết: [Vận hành email và hoàn tiền](../runbooks/lifecycle-and-refunds.md).

<a id="coupon-admin"></a>
## Tab Coupon

Tạo mã tặng ngày dùng: nhập **mã** (8 đến 32 ký tự chữ hoa, số, `-`, `_`), **số ngày tặng** (mặc định 30; 1 đến 3.650), **số lượt tối đa** (để trống là không giới hạn) và **ngày hết hạn** rồi bấm **Tạo coupon** (kèm lý do). Danh sách bên dưới hiện mỗi mã với số ngày, số lượt đã dùng trên tối đa, đang hoạt động hay đã tắt, ngày hết hạn. Tạo mã trùng bị từ chối. Phía API còn hỗ trợ mã giảm phần trăm và cập nhật mã có sẵn, nhưng khách chỉ nhập được mã có **số ngày tặng** ([7](07-goi-va-thanh-toan.md#coupon)). Vai trò tài chính hoặc cấp cao.

<a id="gioi-thieu-admin"></a>
## Tab Giới thiệu

Tổng quan chương trình [giới thiệu](08-gioi-thieu-ban-be.md): người giới thiệu, hoa hồng theo trạng thái, hàng đợi **yêu cầu rút tiền**.

1. Một quản trị viên bấm **Nhận xử lý** (giữ quyền xử lý **2 giờ**; người khác không trả hay từ chối khi quyền còn hiệu lực).
2. Chuyển khoản **thủ công** tới tài khoản trong yêu cầu.
3. Bấm **Đã chuyển khoản** kèm mã giao dịch và lý do. Hệ thống từ chối nếu tổng hoa hồng gắn với yêu cầu khác số tiền (`amount_mismatch`). Hoặc **Từ chối** để trả hoa hồng về trạng thái đang giữ.

Vai trò hỗ trợ không thấy đầy đủ số tài khoản ngân hàng. Mọi bước cần xác minh hai bước.

<a id="pheu"></a>
## Tab Phễu kích hoạt

Bảng theo **ngày đăng ký** (cohort), đếm số gia đình (30 ngày gần nhất) đã: tạo hồ sơ bé, ghép thiết bị, có lần hoàn thành đầu tiên, dùng thử, thanh toán, kèm tỷ lệ giữa các bước. Kèm khối **giữ chân**: số gia đình hoạt động trong 7 ngày và 30 ngày gần nhất, tổng số gia đình, số có hồ sơ bé, số đang trả. Chỉ có **số đếm**, không tên, email hay mã. Hai khoảng 7 và 30 ngày được tính đúng theo ngày lịch.

<a id="cap-quyen"></a>
## Cấp quyền quản trị

Chỉ quản trị cấp cao. Cấp hoặc thay quyền cho một tài khoản với **ngày hết hạn** và lý do, thu hồi ngay khi cần; luôn kiểm tra lại người thao tác ở thời điểm thực hiện. Có lối khẩn cấp hẹp: người đầu tiên tự cấp cho mình khi chưa tồn tại quản trị cấp cao nào. Luôn có nhật ký.

<a id="tac-vu-nen"></a>
## Tác vụ chạy nền

| Tác vụ | Chu kỳ | Làm gì |
|---|---|---|
| **Đối soát thanh toán** | mỗi 10 phút | Hỏi PayOS về các đơn còn chờ và kích hoạt gói nếu đã trả |
| **Gửi email vòng đời** | mỗi giờ | Gửi hàng đợi email đã tạo ([email](07-goi-va-thanh-toan.md#email)), không gửi trùng, thử lại khi nhà cung cấp lỗi |
| **Giám sát sản xuất** | mỗi 15 phút | Đọc số liệu tổng hợp đã làm sạch; vượt ngưỡng thì mở một issue |
| **CI và phát hành** | mỗi lần vào `main` | Lint, kiểm thử, ngân sách hiệu năng, trình duyệt, triển khai |
| **Website giới thiệu** | mỗi lần đổi nội dung | Dựng và phát hành site tĩnh |

Các tác vụ nền gọi điểm cuối nội bộ có khóa bí mật; thiếu khóa là bị từ chối.

<a id="suc-khoe"></a>
## Theo dõi sức khỏe hệ thống

- `/api/health` công khai: ứng dụng, cơ sở dữ liệu, thanh toán, ghép thiết bị. Báo `ready` khi mọi thứ ổn.
- Điểm cuối nội bộ chỉ trả **số tổng hợp**, không hàng sự kiện hay dữ liệu người dùng. Ngưỡng cảnh báo mỗi 15 phút: lỗi xử lý webhook thanh toán 3; lỗi sửa hồ sơ bé 5; lỗi ghép thiết bị 20; email chết 1; email bị khóa quá 15 phút 1.
- Quy trình: [Giám sát sản xuất](../runbooks/production-observability.md), [Ứng phó sự cố](../runbooks/incident-response.md), [Khôi phục dữ liệu](../data-recovery.md).

<a id="co-phat-hanh"></a>
## Cờ phát hành và cấu hình

Tính năng thử nghiệm được bật bằng cờ lúc dựng bản (biến repository). Hiện đang **bật**: thư buổi sáng, nhật ký một câu, thành phố ước mơ, chương trình thói quen thích ứng, giao diện theo tuổi, nhắc việc cho phụ huynh, trang pháp lý đã duyệt. Đang **tắt**: đăng nhập bằng mã email. Đổi cờ rồi chạy lại CI trên `main` để có hiệu lực; chi tiết từng cờ và điều kiện trước khi bật nằm ở [Triển khai](../deployment.md) (ví dụ phải áp migration tương ứng trước).

Tên miền: ứng dụng `app.kidhabithero.com`, website `kidhabithero.com`; hai artifact phát hành riêng ([kiến trúc](../architecture.md)).

<a id="phat-hanh"></a>
## Phát hành và cơ sở dữ liệu

- Mọi thay đổi cấu trúc nằm trong `supabase/migrations`; trước khi áp trên production: chạy kiểm tra trong `supabase/preflight`, sao lưu, áp theo thứ tự, thử hai tài khoản gia đình độc lập. Không reset cơ sở dữ liệu production.
- Dự án Supabase production hiện là `evkwelozdcmsmwdzhlxz` (Singapore).
- Kiểm tra trực tiếp trên production: các lệnh `npm run verify:live-*` (giới thiệu, gia đình, trải nghiệm) chạy trên dữ liệu tổng hợp tự dọn.
- Cloudflare Workers qua OpenNext; Smart Placement đặt Worker gần cơ sở dữ liệu.

<a id="lien-quan"></a>
## Liên quan

- Việc quản trị tác động tới gói và quyền lợi: [7. Gói và thanh toán](07-goi-va-thanh-toan.md).
- Giới thiệu bạn bè phía quản trị: [8. Giới thiệu bạn bè](08-gioi-thieu-ban-be.md).
- Bảo mật, nhật ký, vai trò: [9. Bảo mật và riêng tư](09-bao-mat-va-rieng-tu.md).
- Tài liệu kỹ thuật: [Triển khai](../deployment.md), [Kiến trúc](../architecture.md), [ADR 0001](../adr/0001-family-tenancy-and-rls.md), [ADR 0002](../adr/0002-transactional-email-outbox.md).
