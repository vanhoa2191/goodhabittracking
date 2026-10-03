# 8. Giới thiệu bạn bè

[← 7. Gói và thanh toán](07-goi-va-thanh-toan.md) · [Mục lục](README.md) · [Tiếp: 9. Bảo mật và riêng tư →](09-bao-mat-va-rieng-tu.md)

<!--op-->## Trong tài liệu này

[Tổng quan](#tong-quan) · [Cho người giới thiệu: tham gia và chia sẻ](#tham-gia) · [Cho gia đình được giới thiệu](#giam-10) · [Ghi nhận](#ghi-nhan) · [Hoa hồng](#hoa-hong) · [Rút tiền](#rut-tien) · [Hoàn tiền và hoa hồng](#hoan-tien-hoa-hong) · [Quy tắc và giới hạn](#quy-tac) · [Liên quan](#lien-quan)<!--/op-->

<a id="tong-quan"></a>
## Tổng quan

Chương trình có hai phía, kết nối với nhau qua một **mã giới thiệu 8 ký tự** gắn với liên kết `https://kidhabithero.com/?ref=<MÃ>`:

| Phía | Được gì |
|---|---|
| **Người giới thiệu** (một phụ huynh đang dùng KidHabit) | **Hoa hồng 30%** trên số tiền thực trả của gia đình được giới thiệu |
| **Gia đình được giới thiệu** | **Giảm 10%** khi mua Gói Năm lần đầu (399.000đ còn 359.100đ) |

Điều khoản công khai: trang `/gioi-thieu/` trên [website](11-website-va-trang-cong-khai.md#trang-chinh). <!--op-->Quy tắc kỹ thuật và vận hành: [Chương trình giới thiệu bạn bè](../affiliate-program.md).<!--/op-->

<a id="tham-gia"></a>
## Cho người giới thiệu: tham gia và chia sẻ

1. Vào `Gia đình → Cài đặt → Tài khoản và đồng bộ`, thẻ **Giới thiệu bạn bè**. Đọc các quy tắc, tick đồng ý điều khoản và bấm **Tham gia chương trình**.
2. Sao chép hoặc **Chia sẻ** "Liên kết giới thiệu của bạn". Mã giới thiệu có thể được gửi dưới dạng liên kết hoặc nói miệng để bạn bè nhập tay.
3. Theo dõi các số: gia đình đã đăng ký, gia đình đã trả tiền, tiền **đang giữ**, **có thể rút**, **đã yêu cầu rút**, **đã chuyển**, và danh sách hoa hồng gần đây với trạng thái Đang giữ, Có thể rút, Đã yêu cầu rút, Đã chuyển, Đã thu hồi.

Bạn **không** thấy tên, email hay mã gia đình của người được giới thiệu; chỉ thấy số lượng và số tiền.

<a id="giam-10"></a>
## Cho gia đình được giới thiệu

- Mở liên kết `?ref=` của bạn bè rồi đăng nhập và thiết lập gia đình như bình thường, hoặc **nhập mã tay** ở ô "Có mã giới thiệu từ bạn bè?" (trong `Cài đặt` hoặc ngay trong cửa sổ thanh toán).
- Gia đình được ghi nhận và nhìn thấy "Bạn được giảm 10% khi mua gói năm lần đầu".
- Khi thanh toán **Gói Năm** lần đầu, màn thanh toán hiện giá đã giảm và dòng "Đã giảm 10% nhờ mã giới thiệu". Gói tháng và gói trọn đời không giảm.
- Điều kiện: gia đình còn mới (trong 60 ngày từ lúc tạo), chưa có đơn nào đã trả, chưa được giới thiệu, và đây không phải mã của chính bạn.

<a id="ghi-nhan"></a>
## Ghi nhận

Có hai cách đưa mã vào, dùng chung một luật nên không thể ghi nhận hai lần:

1. **Liên kết**: website đọc `?ref=` và lưu cookie `kidhabit_ref` (60 ngày). Sau khi phụ huynh đăng nhập, ứng dụng gửi mã đi ghi nhận rồi xóa cookie.
2. **Nhập tay**: ô nhập mã trong Cài đặt hoặc cửa sổ thanh toán.

Kết quả hiện ngay: đã ghi nhận; mã không đúng; không thể dùng mã của chính mình; gia đình đã có mã được ghi nhận; mã chỉ áp dụng cho gia đình mới chưa thanh toán; chương trình đang tạm dừng. Chỉ phụ huynh có quyền quản lý gia đình mới nhập mã được.

<a id="hoa-hong"></a>
## Hoa hồng

- **30%** số tiền thực trả (đã trừ giảm giá), cho mọi thanh toán trong **12 tháng đầu** kể từ lúc gia đình được giới thiệu tạo. Ví dụ Gói Năm đã giảm 359.100đ cho 107.730đ hoa hồng.
- Mỗi khoản **giữ 35 ngày** (qua hạn hoàn tiền 30 ngày) rồi mới chuyển sang "Có thể rút".
- Hệ thống tự sinh hoa hồng khi đơn thành công ([kích hoạt gói](07-goi-va-thanh-toan.md#kich-hoat)); lỗi ở bước này không bao giờ làm hỏng việc kích hoạt gói của khách.

<a id="rut-tien"></a>
## Rút tiền

1. Đặt [mã PIN phụ huynh](05-gia-dinh-va-cai-dat.md#pin) (bắt buộc), nhập PIN trên trình duyệt này.
2. Ở thẻ **Nhận tiền hoa hồng**, nhập ngân hàng, số tài khoản và tên chủ tài khoản, bấm **Lưu thông tin**. Số tài khoản chỉ hiện 4 số cuối. Đổi thông tin nhận tiền thì phải đợi **24 giờ** mới yêu cầu rút được.
3. Khi số "Có thể rút" đạt **tối thiểu 200.000đ**, bấm **Yêu cầu rút tiền**.
4. Đội vận hành chuyển khoản **thủ công** và báo lại; yêu cầu chuyển sang "Đã chuyển". <!--op-->Việc xử lý phía quản trị: [10. Quản trị](10-quan-tri-va-van-hanh.md#gioi-thieu-admin).<!--/op-->

Hoa hồng có thể thuộc diện chịu thuế thu nhập cá nhân; người nhận tự chịu trách nhiệm kê khai.

<a id="hoan-tien-hoa-hong"></a>
## Hoàn tiền và hoa hồng

Khi một đơn được hoàn tiền (xác nhận thủ công), hoa hồng của đơn đó được **thu hồi** nếu còn trong thời gian giữ (trạng thái "Đã thu hồi"). Nếu hoa hồng đã nằm trong yêu cầu rút hoặc đã chi, đội vận hành xử lý tay. Xem [hoàn tiền](07-goi-va-thanh-toan.md#hoan-tien).

<a id="quy-tac"></a>
## Quy tắc và giới hạn

- Không tự giới thiệu mình, không gửi thư rác. Chặn tự giới thiệu cùng tài khoản hoặc cùng gia đình.
- Mỗi gia đình được ghi nhận một lần; chỉ gia đình mới và chưa trả tiền.
- Một người có thể tạo hai tài khoản để tự giới thiệu; hệ thống không chặn hoàn toàn, nhưng chuyển khoản là thủ công nên được rà soát trước khi chi.
- Tài khoản giới thiệu có thể bị tạm khóa khi vi phạm (hiện thực hiện bằng thao tác của quản trị viên).
- Phần trăm hoa hồng và giảm giá, thời hạn giữ, mức rút tối thiểu nằm trong bảng cấu hình của chương trình và có thể thay đổi; hoa hồng đã sinh giữ tỉ lệ lúc sinh.
- Một số việc còn chờ: rà soát pháp lý và thuế, thông báo email cho người giới thiệu, chuyển khoản tự động.

<a id="lien-quan"></a>
## Liên quan

- Giảm giá trên màn thanh toán: [7. Gói và thanh toán](07-goi-va-thanh-toan.md#giam-gia).
- PIN: [5. Cài đặt](05-gia-dinh-va-cai-dat.md#pin).
- Quyền riêng tư của chương trình: [9. Bảo mật và riêng tư](09-bao-mat-va-rieng-tu.md#gioi-thieu-rieng-tu).
- Duyệt và chi trả phía vận hành: [10. Quản trị và vận hành](10-quan-tri-va-van-hanh.md#gioi-thieu-admin).
