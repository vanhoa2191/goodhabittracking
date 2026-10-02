# 1. Bắt đầu

[← Mục lục](README.md) · [Tiếp: 2. Màn hình của bé →](02-man-hinh-be.md)

## Trong tài liệu này

[Ba cách vào ứng dụng](#cach-vao) · [Đăng nhập](#dang-nhap) · [Thiết lập gia đình](#thiet-lap) · [Thông tin khách hàng](#thong-tin) · [Vai trò](#vai-tro) · [Bản demo](#demo) · [Ngôn ngữ](#ngon-ngu) · [Tìm trợ giúp ngay trong ứng dụng](#tro-giup) · [Liên quan](#lien-quan)

<a id="cach-vao"></a>
## Ba cách vào ứng dụng

Khi mở `app.kidhabithero.com` lần đầu, màn hình "Bạn muốn vào KidHabit theo cách nào?" đưa ra ba lối. Khu phụ huynh và khu của bé được tách riêng: bé không thấy thanh toán hay cài đặt gia đình.

| Lối vào | Dành cho | Điều xảy ra |
|---|---|---|
| **Phụ huynh đăng nhập Google** | Ba mẹ, người giám hộ | Vào bảng quản lý gia đình ([3](03-hom-nay-va-duyet-viec.md)). Lần đầu sẽ qua [thiết lập gia đình](#thiet-lap). |
| **Trẻ quét QR hoặc nhập mã** | Bé | Thiết bị được ghép với đúng một bé và mở thẳng [màn hình của bé](02-man-hinh-be.md). Bé không cần tài khoản. |
| **Khám phá bản demo** | Ai cũng được | Dùng dữ liệu mẫu, không cần tài khoản ([bản demo](#demo)). |

Phụ huynh đã đăng nhập vào thẳng bảng quản lý; muốn xem lại trang giới thiệu thì chọn "Trang chủ" hoặc "Xem trang giới thiệu". Thiết bị của bé sau khi đã ghép sẽ luôn mở thẳng giao diện của bé, không hiện bảng phụ huynh hay trang bán hàng.

<a id="dang-nhap"></a>
## Đăng nhập

- **Google** là cách đăng nhập chính của phụ huynh.
- **Mã một lần gửi qua email** là cách thứ hai, hiện **đang tắt** cho đến khi được bật<!--op--> (cờ `emailCodeLogin`, [hướng dẫn bật](../deployment.md))<!--/op-->. Khi bật, ô "Hoặc nhận mã đăng nhập qua email" xuất hiện cạnh nút Google. Ba mẹ nhập email, nhận mã vài chữ số, nhập lại để vào. Gửi lại mã được sau vài giây; gửi quá nhiều lần sẽ phải chờ vài phút.
- Đăng nhập lỗi sẽ hiện thông báo ngắn và nút thử lại, không có thay đổi nào được lưu.

Phụ huynh đăng nhập từ một liên kết giới thiệu (`?ref=`) được ghi nhận giới thiệu tự động ([8](08-gioi-thieu-ban-be.md#ghi-nhan)). Người được mời làm người chăm sóc đăng nhập Google rồi chấp nhận lời mời ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="thiet-lap"></a>
## Thiết lập gia đình (hai bước)

Lần đầu vào, cửa sổ "Đăng ký và cá nhân hóa theo lứa tuổi" dẫn đi hai bước:

1. **Thông tin người nuôi dưỡng**: tên ba mẹ (để ứng dụng xưng hô), vai trò (Mẹ, Bố, Ông/Bà, Người giám hộ), số điện thoại (9 đến 15 chữ số, dùng để hỗ trợ tài khoản và thanh toán, chỉ nhập một lần) và tùy chọn nhận hướng dẫn, ưu đãi.
2. **Thông tin bé và lộ trình theo tuổi**: họ tên bé, biệt danh, độ tuổi, linh vật may mắn. Ứng dụng đề xuất sáu thói quen khởi đầu theo bốn nhóm tuổi (0–3, 3–6, 6–12, 12–18) để nạp ngay; ba mẹ sửa lại sau cũng được.

Bắt buộc **xác nhận là cha mẹ hoặc người giám hộ hợp pháp** và đồng ý để KidHabit lưu hồ sơ, thói quen, tiến độ của bé. Việc đồng ý được ghi theo phiên bản chính sách ([9](09-bao-mat-va-rieng-tu.md#dong-thuan)). Bảng xếp hạng công khai mặc định tắt.

Nếu gia đình chưa có gói, bước hoàn tất sẽ **tự bắt đầu 7 ngày dùng thử** (nút ghi "Bắt đầu dùng thử"). Dùng thử chỉ có một lần cho mỗi gia đình ([7](07-goi-va-thanh-toan.md#dung-thu)).

Có thể vào thẳng trang `/start` ("Bắt đầu 7 ngày dùng thử") từ website: đăng nhập Google, thiết lập gia đình rồi bấm bắt đầu.

<a id="thong-tin"></a>
## Thông tin khách hàng

Sau đăng nhập, nếu hồ sơ còn thiếu họ tên hoặc số điện thoại, hộp thoại "Hoàn thiện thông tin của bạn" hiện ra một lần. Ba mẹ sửa lại sau ở `Gia đình → Cài đặt → Tài khoản` ([5](05-gia-dinh-va-cai-dat.md#tai-khoan)). Có thể bật hoặc tắt nhận ưu đãi bất cứ lúc nào; tắt thì thư quảng bá dừng ngay ([7](07-goi-va-thanh-toan.md#email)).

<a id="vai-tro"></a>
## Vai trò trong gia đình

| Vai trò | Làm được | Không làm được |
|---|---|---|
| **Chủ gia đình** (người tạo) | Mọi thứ của phụ huynh, thanh toán, xóa dữ liệu gia đình | Không |
| **Phụ huynh, người giám hộ** | Quản lý bé, việc, quà, duyệt, thiết bị | Thao tác chỉ dành cho chủ (xóa gia đình) |
| **Người chăm sóc** | Xem tiến độ ở "Góc người chăm sóc" | Sửa hồ sơ, việc, điểm, gói |
| **Bé** (thiết bị đã ghép) | Làm việc của chính bé, xin đổi quà, ghi nhật ký | Thấy thanh toán, cài đặt, hồ sơ bé khác |

Chỉ phụ huynh trong gia đình mới bắt đầu dùng thử hoặc thanh toán. Thao tác nhạy cảm còn cần [mã PIN](05-gia-dinh-va-cai-dat.md#pin).

<a id="demo"></a>
## Bản demo

"Khám phá bản demo" mở ứng dụng với ba bé mẫu (8 tuổi, 4 tuổi và 1 tuổi) và việc, quà, nhóm mẫu. Dữ liệu demo lưu trong tab đang mở nên tải lại trang vẫn còn; khi bạn thiết lập gia đình thật hoặc đăng nhập, dữ liệu demo bị xóa và **không** lẫn vào dữ liệu thật. Demo không gửi gì lên máy chủ và không cần thanh toán.

<a id="ngon-ngu"></a>
## Ngôn ngữ

Ứng dụng có chín ngôn ngữ: Việt, Anh, Pháp, Đức, Ý, Tây Ban Nha, Trung, Nhật, Hàn. Ngôn ngữ ban đầu được chọn theo thứ tự: lựa chọn đã lưu của bạn, quốc gia (từ Cloudflare), ngôn ngữ trình duyệt, rồi tiếng Anh. Đổi bằng nút chọn ngôn ngữ trên thanh trên cùng; lựa chọn lưu lại để trang, tiêu đề và giao diện luôn cùng một ngôn ngữ.

Một số nội dung chi tiết (lộ trình theo tuổi, màn hình Hôm nay) chưa dịch đủ chín thứ tiếng và sẽ hiện tiếng Anh ở ngôn ngữ chưa có bản dịch.

<a id="tro-giup"></a>
## Tìm trợ giúp ngay trong ứng dụng

Bộ hướng dẫn này nằm sẵn trong ứng dụng, ở hai dạng:

- **Dấu ? cạnh từng mục.** Ở khu phụ huynh, cạnh tiêu đề của mỗi tính năng (duyệt việc, tín hiệu, mã PIN, mã ghép, thanh toán…) có một dấu **?** nhỏ. Rê chuột, chạm hoặc dùng phím Tab tới đó để đọc giải thích ngắn một hai câu. Bấm **Xem chi tiết** để mở đúng phần liên quan của hướng dẫn ngay trên màn hình, không rời khỏi chỗ đang làm; trong cửa sổ đó, bấm vào liên kết tới phần khác để đọc tiếp và nút **Quay lại** để trở về. Nhấn **Esc** hoặc chạm ra ngoài để đóng giải thích.
- **Trang tài liệu riêng.** Nút **Tài liệu** trên thanh trên cùng (hoặc `Gia đình → Cài đặt → Mở tài liệu hướng dẫn`) mở trang `/docs`: danh sách các chương, ô **tìm kiếm** (gõ có dấu hay không dấu đều được), nhóm lối tắt **"Tôi muốn…"** cho các việc hay làm, và từng chương có mục lục riêng. Nút **Mở hướng dẫn đầy đủ** trong cửa sổ chi tiết cũng dẫn tới đúng vị trí trên trang này.

Hướng dẫn đầy đủ hiện có bằng tiếng Việt; ở ngôn ngữ khác, dấu ? vẫn giải thích bằng tiếng Anh và có bản tóm tắt nhanh, còn phần chi tiết đọc bằng tiếng Việt.

<a id="lien-quan"></a>
## Liên quan

- Tạo bé và ghép máy cho bé: [5. Hồ sơ các con và ghép thiết bị](05-gia-dinh-va-cai-dat.md#ho-so).
- Bé làm gì sau khi vào: [2. Màn hình của bé](02-man-hinh-be.md).
- Gói dùng thử và giá: [7. Gói và thanh toán](07-goi-va-thanh-toan.md).
- Quyền riêng tư của dữ liệu bé: [9. Bảo mật và riêng tư](09-bao-mat-va-rieng-tu.md).
- Trang giới thiệu trên website: [11. Website và trang công khai](11-website-va-trang-cong-khai.md).
