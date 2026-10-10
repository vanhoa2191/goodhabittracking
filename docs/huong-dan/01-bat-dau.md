# 1. Bắt đầu

[← Mục lục](README.md) · [Tiếp: 2. Màn hình của bé →](02-man-hinh-be.md)

<!--op-->## Trong tài liệu này

[Ba cách vào ứng dụng](#cach-vao) · [Đăng nhập](#dang-nhap) · [Thiết lập gia đình](#thiet-lap) · [Thông tin khách hàng](#thong-tin) · [Vai trò](#vai-tro) · [Bản demo](#demo) · [Ngôn ngữ](#ngon-ngu) · [Tìm trợ giúp ngay trong ứng dụng](#tro-giup) · [Liên quan](#lien-quan)<!--/op-->

<a id="cach-vao"></a>
## Ba cách vào ứng dụng

Khi mở `app.kidhabithero.com` lần đầu, màn hình "Bạn muốn vào KidHabit theo cách nào?" đưa ra ba lối: hai nút hiện ngay và một khối thu gọn cho bé. Khu phụ huynh và khu của bé được tách riêng: bé không thấy thanh toán hay cài đặt gia đình.

| Lối vào | Dành cho | Điều xảy ra |
|---|---|---|
| **Tiếp tục với tư cách phụ huynh** (đăng nhập bằng Google) | Ba mẹ, người giám hộ | Vào bảng quản lý gia đình ([3](03-hom-nay-va-duyet-viec.md)). Lần đầu sẽ qua [thiết lập gia đình](#thiet-lap). |
| **Đây là thiết bị của bé?** (mở ra, chọn "Nhập mã hoặc quét QR") | Bé | Thiết bị được ghép với đúng một bé và mở thẳng [màn hình của bé](02-man-hinh-be.md). Bé không cần tài khoản. |
| **Khám phá bản demo** (hiện ngay, dưới nút phụ huynh) | Ai cũng được | Dùng dữ liệu mẫu, không cần tài khoản ([bản demo](#demo)). |

Phụ huynh đã đăng nhập vào thẳng bảng quản lý; muốn xem lại trang giới thiệu thì chọn "Trang chủ" hoặc "Xem trang giới thiệu". Thiết bị của bé sau khi đã ghép sẽ luôn mở thẳng giao diện của bé, không hiện bảng phụ huynh hay trang bán hàng.

<a id="dang-nhap"></a>
## Đăng nhập

- **Google** là cách đăng nhập chính của phụ huynh.
- **Mã một lần gửi qua email** là cách thứ hai, hiện **đang tắt** cho đến khi được bật<!--op--> (cờ `emailCodeLogin`, [hướng dẫn bật](../deployment.md))<!--/op-->. Khi bật, mục thu gọn "Cách đăng nhập khác" xuất hiện dưới màn hình vào; mở ra sẽ thấy ô "Hoặc nhận mã đăng nhập qua email". Khi cờ tắt thì không có mục này. Ba mẹ nhập email, nhận mã vài chữ số, nhập lại để vào. Gửi lại mã được sau vài giây; gửi quá nhiều lần sẽ phải chờ vài phút.
- Đăng nhập lỗi sẽ hiện thông báo ngắn và nút thử lại, không có thay đổi nào được lưu.

Phụ huynh đăng nhập từ một liên kết giới thiệu (`?ref=`) được ghi nhận giới thiệu tự động ([8](08-gioi-thieu-ban-be.md#ghi-nhan)). Người được mời làm người chăm sóc đăng nhập Google rồi chấp nhận lời mời ([5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)).

<a id="thiet-lap"></a>
## Tạo hồ sơ bé đầu tiên

Lần đầu vào, cửa sổ thiết lập dẫn ba mẹ qua **5 bước**, vừa tạo hồ sơ vừa giải thích cách con làm việc, nhận sao và đổi quà:

1. **Bé của bạn.** Nhập họ tên bé (bắt buộc), biệt danh (tùy chọn), chọn tuổi (mặc định 5) và linh vật đồng hành (mặc định Leo). Thẻ giai đoạn tuổi đổi theo tuổi đã chọn: tuổi quyết định giao diện con thấy và các thói quen được gợi ý.
2. **Thói quen đầu tiên.** Xem sáu thói quen gợi ý theo tuổi; ứng dụng chọn sẵn 1–4 việc tùy tuổi để con dễ thành nếp. Ba mẹ chọn thêm hoặc bỏ bớt, xem bộ đếm mức khuyến nghị và chọn việc nào cần **Ba mẹ duyệt**. Con chạm Xong để nhận sao; việc cần duyệt chỉ cộng sao sau khi ba mẹ xác nhận. Với bé 0–3 tuổi, các việc là để ba mẹ làm gương nên không có công tắc duyệt. Bỏ chọn hết vẫn đi tiếp được; ba mẹ thêm việc sau ở **Thiết kế**.
3. **Quà để đổi sao.** Chọn trong ba quà trải nghiệm: chọn truyện và người kể tối nay, chọn món cho bữa cơm gia đình và 30 phút riêng cùng ba hoặc mẹ. Khi tạo bé đầu tiên, quà đầu tiên được chọn sẵn; quà gia đình đã có sẽ hiện là đã thêm và không thêm trùng. Ba mẹ sửa giá thành số sao nguyên từ 1 đến 1.000.000 hoặc bấm **Để sau** để chưa thêm quà. Nếu đã chọn thói quen và quà, ứng dụng ước tính sao mỗi ngày và số ngày để đổi quà. Con xin đổi quà → ba mẹ duyệt → trao quà; nếu từ chối, con được hoàn sao.
4. **Xác nhận & bắt đầu.** Kiểm tra tên, tuổi, số thói quen và quà, rồi **xác nhận là cha mẹ hoặc người giám hộ hợp pháp** và đồng ý để KidHabit lưu hồ sơ, thói quen, tiến độ của bé. Chỉ khi bấm nút ở bước này dữ liệu mới được lưu; ba mẹ có thể quay lại sửa các lựa chọn trước đó. Việc đồng ý được ghi theo phiên bản chính sách ([9](09-bao-mat-va-rieng-tu.md#dong-thuan)); bảng xếp hạng công khai mặc định tắt. Nếu đã đăng nhập và gia đình chưa có gói, nút **Bắt đầu 7 ngày dùng thử & tạo hồ sơ** tự bắt đầu dùng thử. Mỗi gia đình chỉ dùng thử một lần ([7](07-goi-va-thanh-toan.md#dung-thu)).
5. **Đưa app cho bé.** Chọn **Máy riêng của bé** để lấy mã kết nối và QR: mở app trên máy bé, chọn **Đây là thiết bị của bé?**, rồi quét QR hoặc nhập mã. Hoặc chọn **Dùng chung máy này**: đặt PIN phụ huynh 4 số để giữ khu phụ huynh khỏi tay bé, hoặc bỏ qua, rồi mở màn hình của bé. Khi chưa đăng nhập chỉ có lựa chọn dùng chung máy. Nút **Vào bảng phụ huynh** kết thúc thiết lập để ba mẹ xem tiến độ và duyệt ở **Hôm nay → Duyệt việc**; dấu **?** cạnh mỗi mục mở hướng dẫn.

Nếu chưa thêm được quà, ứng dụng vẫn cho đi tiếp và nhắc ba mẹ thêm lại ở **Thiết kế → Đổi quà**. Nếu chưa lấy được mã kết nối, ba mẹ lấy sau ở **Gia đình → Hồ sơ các con** hoặc dùng chung máy ngay.

Có thể vào thẳng trang `/start` ("Bắt đầu 7 ngày dùng thử") từ website: đăng nhập Google, thiết lập gia đình rồi bấm bắt đầu.

<a id="thong-tin"></a>
## Thông tin khách hàng

Ba mẹ chỉ cần nhập **họ tên và số điện thoại khi thanh toán**, trước bước đồng ý điều khoản và mã giới thiệu. Số điện thoại cần 9 đến 15 chữ số. Thông tin được lưu trên máy chủ cho các lần thanh toán sau; hồ sơ đã đủ sẽ được bỏ qua. Đăng nhập và tạo hồ sơ bé không bị chặn bởi yêu cầu này. Nhận hướng dẫn, ưu đãi là tùy chọn, mặc định tắt. Ba mẹ sửa lại sau ở `Gia đình → Cài đặt → Tài khoản` ([5](05-gia-dinh-va-cai-dat.md#tai-khoan)); tắt nhận ưu đãi thì thư quảng bá dừng ngay ([7](07-goi-va-thanh-toan.md#email)). Nếu tải hoặc lưu lỗi, bấm **Thử lại**.

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

Trên màn hình hẹp, các nút ở thanh trên cùng gom vào **Menu tiện ích** (nút ⋮). Menu có nhóm **Tài khoản**, nhóm **Cài đặt nhanh** (ngôn ngữ, giao diện sáng hoặc tối, cỡ chữ, âm thanh) và liên kết **Tài liệu sử dụng**; các mục ít dùng hơn (Bảng giá, nhập mã ghép máy của bé, cẩm nang 16 chân dung, thiết lập gia đình, Trang chủ, trạng thái lưu trữ) nằm trong mục **Thêm**, đóng sẵn cho đến khi bạn mở.

Một số nội dung chi tiết (lộ trình theo tuổi, màn hình Hôm nay) chưa dịch đủ chín thứ tiếng và sẽ hiện tiếng Anh ở ngôn ngữ chưa có bản dịch.

<a id="tro-giup"></a>
## Tìm trợ giúp ngay trong ứng dụng

Bộ hướng dẫn này nằm sẵn trong ứng dụng, ở hai dạng:

- **Dấu ? cạnh từng mục.** Ở khu phụ huynh, cạnh tiêu đề của mỗi tính năng (duyệt việc, tín hiệu, mã PIN, mã ghép, thanh toán…) có một dấu **?** nhỏ. Rê chuột, chạm hoặc dùng phím Tab tới đó để đọc giải thích ngắn một hai câu. Bấm **Xem chi tiết** để mở đúng phần liên quan của hướng dẫn ngay trên màn hình, không rời khỏi chỗ đang làm; trong cửa sổ đó, bấm vào liên kết tới phần khác để đọc tiếp và nút **Quay lại** để trở về. Nhấn **Esc** hoặc chạm ra ngoài để đóng giải thích.
- **Trang tài liệu riêng.** Nút **Tài liệu** trên thanh trên cùng (hoặc `Gia đình → Cài đặt → Mở tài liệu hướng dẫn`) mở trang `/docs`: danh sách các chương, ô **tìm kiếm** (gõ có dấu hay không dấu đều được), nhóm lối tắt **"Tôi muốn…"** cho các việc hay làm, và từng chương có mục lục riêng. Nút **Mở hướng dẫn đầy đủ** trong cửa sổ chi tiết cũng dẫn tới đúng vị trí trên trang này.

Hướng dẫn đầy đủ có tiếng Việt và các bản dịch (hiện có tiếng Anh); ngôn ngữ chưa có bản dịch thì dấu ? giải thích bằng tiếng Anh và phần chi tiết đọc bằng tiếng Việt, kèm một bản tóm tắt nhanh ở trang `/docs`.

<a id="lien-quan"></a>
## Liên quan

- Tạo bé và ghép máy cho bé: [5. Hồ sơ các con và ghép thiết bị](05-gia-dinh-va-cai-dat.md#ho-so).
- Bé làm gì sau khi vào: [2. Màn hình của bé](02-man-hinh-be.md).
- Gói dùng thử và giá: [7. Gói và thanh toán](07-goi-va-thanh-toan.md).
- Quyền riêng tư của dữ liệu bé: [9. Bảo mật và riêng tư](09-bao-mat-va-rieng-tu.md).
- Trang giới thiệu trên website: [11. Website và trang công khai](11-website-va-trang-cong-khai.md).
