# 9. Bảo mật và riêng tư

[← 8. Giới thiệu bạn bè](08-gioi-thieu-ban-be.md) · [Mục lục](README.md) · [Tiếp: 10. Quản trị và vận hành →](10-quan-tri-va-van-hanh.md)

<!--op-->## Trong tài liệu này

[Dữ liệu nào được lưu](#du-lieu) · [Ai thấy gì](#ai-thay) · [Mã ghép của bé](#ma-ghep) · [Mã PIN](#pin) · [Đồng thuận](#dong-thuan) · [Bảng xếp hạng công khai](#bxh-cong-khai) · [Chia sẻ cột mốc](#chia-se) · [Chương trình giới thiệu](#gioi-thieu-rieng-tu) · [Đo lường và nhắc việc](#do-luong) · [Tải về, xóa dữ liệu](#xoa-du-lieu) · [Biện pháp kỹ thuật](#ky-thuat) · [Giới hạn pháp lý](#phap-ly) · [Liên quan](#lien-quan)<!--/op-->

Trang này giải thích bằng lời thường điều KidHabit làm để giữ an toàn cho dữ liệu của bé. Chi tiết kỹ thuật ở [Bảo mật và riêng tư](../security-privacy.md).

<a id="du-lieu"></a>
## Dữ liệu nào được lưu

Ứng dụng lưu hồ sơ bé (tên, biệt danh, tuổi), thói quen, tiến độ, điểm, phần thưởng, thiết bị đã ghép, gói đăng ký và thông tin liên hệ của phụ huynh (họ tên, số điện thoại, email). Với tính năng tùy chọn có thể có thêm nhật ký một câu, kế hoạch tín hiệu, cách bé làm từng lần, danh sách mong muốn. **Không** đưa dữ liệu của bé, mã phiên, mã PIN, khóa PayOS hay nội dung webhook vào bất kỳ hệ thống đo lường nào.

<a id="ai-thay"></a>
## Ai thấy gì

| Người | Thấy | Không thấy |
|---|---|---|
| Phụ huynh | Toàn bộ dữ liệu của gia đình mình | Dữ liệu gia đình khác |
| Người chăm sóc | Tên bé, thói quen đang hoạt động (kèm lịch lặp), tổng số lượt hoàn thành hoặc đã duyệt và số lượt theo ngày trong 7 ngày gần nhất, ở chế độ chỉ đọc | Không sửa được; không thấy từng lượt làm, giờ làm, ghi chú, tuổi, biệt danh, phần thưởng, nhóm, gói đăng ký, thanh toán, cài đặt hay thành viên khác |
| Bé (thiết bị đã ghép) | Dữ liệu của chính bé | Hồ sơ bé khác, thanh toán, cài đặt, mã PIN |
| Người vận hành | Hồ sơ phụ huynh (tên, email, điện thoại), gói đăng ký, đơn hàng; mọi thao tác đều ghi nhật ký | Hồ sơ bé, nhiệm vụ, nhật ký của bé |

Mỗi gia đình là một "ngăn" riêng ở tầng cơ sở dữ liệu: một tài khoản không đọc hay ghi được dữ liệu của gia đình khác, kể cả khi ứng dụng có lỗi giao diện. Mỗi dữ liệu thuộc về một `family_id`; gói và quyền lợi gắn với gia đình, không gắn với email.

<a id="ma-ghep"></a>
## Mã ghép của bé

- Mỗi mã chỉ mở **đúng một bé**, không chứa PIN hay dữ liệu gia đình. Cơ sở dữ liệu chỉ lưu bản băm của mã.
- Phiên của máy bé nằm trong cookie chỉ-HTTP, không đọc được bằng mã script của trang; mỗi lời gọi chỉ trả dữ liệu của một bé.
- Nhập mã sai nhiều lần bị **giới hạn tốc độ**.
- Phụ huynh có thể **làm mới mã** (mã cũ hết hiệu lực) và **thu hồi từng thiết bị** bất cứ lúc nào ([5](05-gia-dinh-va-cai-dat.md#ghep-thiet-bi)). Các thao tác xem, đổi mã và thu hồi cần PIN.

<a id="pin"></a>
## Mã PIN

PIN 4 chữ số do **máy chủ** kiểm tra. Nhập đúng thì trình duyệt nhận một cookie mở khóa có chữ ký, gắn với phụ huynh và gia đình, hiệu lực **2 giờ**, xóa khi khóa lại. Gia đình đã đặt PIN thì các thao tác nhạy cảm bị từ chối nếu chưa mở khóa: xóa gia đình, thu hồi thiết bị, xem hoặc đổi mã ghép, tạo thanh toán, duyệt việc và quà, thưởng hoặc trừ sao thủ công, thông tin nhận tiền giới thiệu. Bé chạm hoàn thành trên máy phụ huynh không cần PIN. Hướng dẫn đặt PIN: [5](05-gia-dinh-va-cai-dat.md#pin).

<a id="dong-thuan"></a>
## Đồng thuận

- Khi [thiết lập gia đình](01-bat-dau.md#thiet-lap), người lớn phải xác nhận là cha mẹ hoặc người giám hộ hợp pháp và đồng ý để lưu dữ liệu của bé. Đồng ý được lưu theo **phiên bản chính sách**.
- Bảng xếp hạng công khai, đo lường ẩn danh, nhắc việc và nhận ưu đãi đều là **lựa chọn riêng**, mặc định **tắt**, tắt lại được; việc thu hồi được giữ lại dưới dạng mốc thời gian chứ không xóa lịch sử đồng ý.
- Người chăm sóc chỉ vào gia đình qua lời mời một lần do phụ huynh tạo (hết hạn sau 72 giờ), thu hồi được ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="bxh-cong-khai"></a>
## Bảng xếp hạng công khai

Một bé chỉ xuất hiện trên bảng công khai khi **cả hai** điều sau cùng đúng: gia đình đã bật chia sẻ (mặc định tắt, chỉ phụ huynh đổi được) **và** hồ sơ của bé được đánh dấu tham gia (bé mới mặc định riêng tư). Bảng chỉ trả biệt danh (hoặc "Bé Siêu Nhân"), hình đại diện, điểm kiếm được trong kỳ, chuỗi ngày và hạng; **không** có mã bé, mã gia đình, tên thật hay tuổi. Điểm là điểm kiếm được từ nhật ký đã xác nhận trong kỳ, không phải số dư, nên tiêu sao đổi quà không đổi thứ hạng. Bảng Gia đình và Nhóm chỉ dùng dữ liệu trong phạm vi đó. Cài đặt: [5](05-gia-dinh-va-cai-dat.md#rieng-tu); trải nghiệm của bé: [2](02-man-hinh-be.md#bang-xep-hang).

<a id="chia-se"></a>
## Chia sẻ cột mốc

"Lan tỏa một cột mốc tích cực" ([3](03-hom-nay-va-duyet-viec.md#thong-ke)) luôn cho ba mẹ **xem trước và tự xác nhận** trước khi mở bảng chia sẻ của thiết bị. Nội dung mặc định không có tên, tuổi, ảnh hay nhiệm vụ của trẻ và không gắn mã theo dõi.

<a id="gioi-thieu-rieng-tu"></a>
## Chương trình giới thiệu

Mã giới thiệu được lưu trong cookie `kidhabit_ref` 60 ngày (xóa khi đã ghi nhận). Thông tin ngân hàng của người giới thiệu chỉ quản trị viên được phân quyền xem; chính chủ chỉ thấy 4 số cuối. Người giới thiệu **không bao giờ** thấy thông tin của gia đình được giới thiệu ([8](08-gioi-thieu-ban-be.md)).

<a id="do-luong"></a>
## Đo lường và nhắc việc

- **Đo lường ẩn danh** có ranh giới chặt: sự kiện không chứa tên, nội dung thói quen, mã bé/gia đình/người dùng, mã ghép, dữ liệu thanh toán hay thời điểm chính xác. **Hiện không có điểm đến thu thập nào được cấu hình**, nên không có gì rời khỏi thiết bị, kể cả khi phụ huynh đồng ý. Không số liệu nào (DAU, giữ chân, NPS…) được công bố nếu chưa đo thật. Xem [Phân tích sản phẩm](../product-analytics.md).
- **Nhắc việc** chỉ để báo việc cần duyệt, không dùng để quảng cáo.
- Dữ liệu cách bé làm từng lần và kế hoạch tín hiệu **chỉ để gợi ý cho phụ huynh**, không dùng xếp hạng hay so sánh các bé ([6](06-khoa-hoc-thoi-quen.md#logic)).

<a id="xoa-du-lieu"></a>
## Tải về, xóa dữ liệu

- **Tải về**: bản sao JSON dữ liệu gia đình ([5](05-gia-dinh-va-cai-dat.md#du-lieu)) và CSV nhật ký một câu ([3](03-hom-nay-va-duyet-viec.md#thong-ke)). Giữ riêng tư vì chứa dữ liệu của bé.
- **Xóa vĩnh viễn**: chỉ **chủ gia đình**, ở `Hôm nay → Thống kê`, gõ đúng `DELETE FAMILY` (cần PIN nếu đã đặt). Thao tác xóa hồ sơ bé, thói quen, tiến độ, phần thưởng, thiết bị đã ghép và phiên đã ghép; không thể hoàn tác. Khôi phục tài khoản đăng nhập **không** khôi phục dữ liệu đã xóa ([Khôi phục dữ liệu](../data-recovery.md)).

<a id="ky-thuat"></a>
## Biện pháp kỹ thuật

| Biện pháp | Ý nghĩa với bạn |
|---|---|
| Chia ngăn gia đình, khóa hàng trong giao dịch | Không lẫn dữ liệu giữa các gia đình |
| Mọi lệnh ghi bằng cookie từ chối yêu cầu khác nguồn | Trang lạ không thể làm thay bạn |
| PayOS "đóng khi lỗi": kiểm tra chữ ký, số tiền, nội dung, chủ đơn, chống xử lý lặp | Không kích hoạt gói bằng thông báo giả |
| Dùng thử chỉ một lần, kiểm tra gói ngay ở cơ sở dữ liệu | Không vượt giới hạn bằng cách sửa giao diện |
| Chính sách nội dung (CSP), chống nhúng khung, quyền trình duyệt tối thiểu | Giảm rủi ro mã độc |
| Hàm nhạy cảm chỉ dành cho máy chủ; hàm mới mặc định đóng | Giảm bề mặt bị lạm dụng |
| Quản trị viên cần xác minh hai bước và mọi thao tác được ghi nhật ký có lý do | Có truy vết, có kiểm soát |

<a id="phap-ly"></a>
## Giới hạn pháp lý

Các mặc định được thiết kế **bảo thủ** cho dữ liệu của trẻ, nhưng đây **không phải chứng nhận** COPPA hay GDPR-K. Trước khi mở bảng xếp hạng công khai ở một thị trường cụ thể cần rà soát pháp lý về tuổi đồng thuận, thời gian lưu giữ, quyền truy cập và xóa. Trang `Quyền riêng tư`, `Điều khoản` và `Liên hệ` ở [website](11-website-va-trang-cong-khai.md#phap-ly-web) có thể ở dạng bản nháp (không lập chỉ mục, không hiện ở chân trang và thanh toán) cho tới khi cờ duyệt pháp lý được bật. Báo sự cố: không gửi bí mật hay dữ liệu trẻ qua kênh công khai.

<a id="lien-quan"></a>
## Liên quan

- PIN, thiết bị, người chăm sóc: [5. Gia đình và cài đặt](05-gia-dinh-va-cai-dat.md).
- Bảng xếp hạng: [2. Màn hình của bé](02-man-hinh-be.md#bang-xep-hang).
- Quản trị và nhật ký thao tác: [10. Quản trị và vận hành](10-quan-tri-va-van-hanh.md).
- Ứng phó sự cố: [Incident response](../runbooks/incident-response.md).
