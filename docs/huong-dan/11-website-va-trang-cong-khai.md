# 11. Website và trang công khai

[← 10. Quản trị và vận hành](10-quan-tri-va-van-hanh.md) · [Mục lục](README.md) · [Tiếp: 12. Bản đồ liên kết và tình huống →](12-ban-do-lien-ket.md)

<!--op-->## Trong tài liệu này

[Hai nơi, hai việc](#hai-noi) · [Các trang chính](#trang-chinh) · [Trang Khung thói quen](#trang-khung) · [Blog](#blog) · [Nút mua hàng nối sang ứng dụng](#cta) · [Pháp lý và hỗ trợ](#phap-ly-web) · [Chính xác của nội dung](#chinh-xac) · [Trang công khai trên ứng dụng](#tren-ung-dung) · [Liên quan](#lien-quan)<!--/op-->

<a id="hai-noi"></a>
## Hai nơi, hai việc

| | Website giới thiệu | Ứng dụng |
|---|---|---|
| Địa chỉ | `kidhabithero.com` | `app.kidhabithero.com` |
| Việc chính | Giới thiệu, thuyết phục, giải thích khoa học, hướng dẫn, bài viết | Đăng nhập, quản lý gia đình, bé làm việc, thanh toán |
| Công nghệ | Trang tĩnh phát hành riêng; **không** chứa mã đăng nhập, PayOS hay cơ sở dữ liệu | Ứng dụng đầy đủ |
| Tìm kiếm | Có lập chỉ mục; sở hữu sitemap, robots và đường dẫn chuẩn | **Luôn không lập chỉ mục** |
| Dùng thử, mua | Nút đưa sang `app.kidhabithero.com/checkout?plan=…` hoặc `/start` | Thực hiện thật |

Hai bên có thể phát hành độc lập; thứ tự phát hành và quay lui nằm ở [Triển khai](../deployment.md).

<a id="trang-chinh"></a>
## Các trang chính

| Trang | Địa chỉ | Nội dung |
|---|---|---|
| **Trang chủ** | `/` | Thông điệp chính ("Từng thói quen nhỏ vẽ nên chân dung tốt đẹp của con"), lợi ích (biết nên rèn gì, giao việc rõ, xem lại việc con làm), so sánh "chỉ nhắc nhở" với KidHabit, ba bước (chọn lộ trình, bé làm việc, ba mẹ duyệt) kèm ảnh màn hình thật, sáu linh vật, điểm an toàn (PIN, mỗi gia đình một không gian, chia sẻ công khai mặc định tắt, ba mẹ quyết định giữ hay xóa), bảng giá rút gọn, câu hỏi thường gặp |
| **Bảng giá** | `/pricing/` | Ba gói, dùng thử 7 ngày, không tự động trừ tiền, hoàn tiền 30 ngày ([7](07-goi-va-thanh-toan.md)) |
| **Khung thói quen** | `/framework/` | 47 thói quen theo giai đoạn ([bên dưới](#trang-khung)) |
| **Cơ sở khoa học** | `/science/` | Điều nghiên cứu cho biết, điều chưa biết, giới hạn bằng chứng ([6](06-khoa-hoc-thoi-quen.md)) |
| **Lộ trình** | `/roadmaps/` | Lộ trình ba bước theo tuổi: bắt đầu với một việc, giữ nhịp đều, mở rộng khi đã vững ([4](04-thiet-ke-thoi-quen.md#lo-trinh)) |
| **Hướng dẫn** | `/docs/` | Bốn bước: tạo không gian gia đình, thiết lập cho con, ghép thiết bị, theo dõi và khích lệ (tóm lược của bộ tài liệu này) |
| **Blog** | `/blog/` | Bài viết cho ba mẹ ([bên dưới](#blog)) |
| **Giới thiệu bạn bè** | `/gioi-thieu/` | Điều khoản chương trình hoa hồng ([8](08-gioi-thieu-ban-be.md)) |
| **Liên hệ** | `/contact/` | Cách liên hệ hỗ trợ: gửi gì khi lỗi hoặc cần hỗ trợ thanh toán, và điều **không** nên gửi (mật khẩu, PIN, mã ghép còn hiệu lực) |
| **Quyền riêng tư, Điều khoản** | `/privacy/`, `/terms/` | Văn bản pháp lý ([bên dưới](#phap-ly-web)) |

Website hiện viết bằng **tiếng Việt**; ứng dụng mới có đủ [chín ngôn ngữ](01-bat-dau.md#ngon-ngu). Tên gói trên website là "Gói Cơ bản" và "Gói Cao cấp" ([khác tên trong ứng dụng](07-goi-va-thanh-toan.md#cac-goi)).

<a id="trang-khung"></a>
## Trang Khung thói quen

Trang viết cho ba mẹ dễ hình dung, không phô hết chi tiết. Phần đầu nêu bốn nguyên tắc (không bắt đầu từ danh sách dài; mỗi giai đoạn vai trò của ba mẹ khác nhau; việc nhỏ nói bằng lời của con; ba mẹ vẫn là người quyết định). Mỗi trong **5 giai đoạn** (0–3, 3–6, 6–12, 12–15, 15–18) có một đoạn ngắn về bé ở giai đoạn đó và vai trò của ba mẹ, kèm **ba ví dụ thói quen** và số thói quen còn lại; danh sách đầy đủ 47 thói quen nằm trong ứng dụng ([thư viện khung](04-thiet-ke-thoi-quen.md#khung-47)). Cuối trang có nút **mua hàng hoặc dùng thử** dẫn sang ứng dụng. Giải thích khung ở [6](06-khoa-hoc-thoi-quen.md#khung).

<a id="blog"></a>
## Blog

Chín bài viết đời thường cho ba mẹ, mỗi bài kết bằng lời mời dùng thử và liên kết nội bộ tới khoa học, khung, lộ trình:

1. Nên bắt đầu với mấy thói quen mới cùng lúc?
2. Con không chịu làm thói quen mới: ba mẹ nên thử gì trước?
3. Con quên nhiều ngày liên tiếp: bắt đầu lại thế nào?
4. Cùng con đặt mục tiêu tuần: một cách làm đơn giản
5. Đặt tín hiệu "nếu… thì…" để con dễ bắt đầu một thói quen
6. Xây thói quen cho trẻ mất bao lâu? Vì sao không có con số "21 ngày"
7. Thói quen buổi sáng cho bé đi học: bắt đầu từ đâu?
8. Nên thưởng cho con khi hoàn thành thói quen không?
9. Việc nhỏ cho bé 3–6 tuổi: những gợi ý vừa sức

Có trang theo chủ đề (`thoi-quen`, `phu-huynh`, `khoa-hoc`), nguồn RSS và mục trong sitemap. Mỗi bài là một tệp Markdown; cách đăng, định dạng phần đầu và quy tắc nội dung xem [Hướng dẫn đăng blog](../blog-guide.md). Các bài trên chính là diễn giải của các [nguyên tắc ở 6](06-khoa-hoc-thoi-quen.md#nguyen-tac) và hướng dẫn dùng [tín hiệu](04-thiet-ke-thoi-quen.md#chuong-trinh), [lộ trình](04-thiet-ke-thoi-quen.md#lo-trinh).

<a id="cta"></a>
## Nút mua hàng nối sang ứng dụng

Mọi nút dùng thử hoặc chọn gói trên website đưa sang ứng dụng:

- **Dùng thử 7 ngày** → `/start` ([7](07-goi-va-thanh-toan.md#dung-thu)).
- **Chọn gói** → `/checkout?plan=solo_monthly|monthly|yearly` ([7](07-goi-va-thanh-toan.md#noi-mua)).
- **Liên kết giới thiệu** `?ref=` → website lưu cookie giới thiệu rồi ứng dụng ghi nhận sau khi đăng nhập ([8](08-gioi-thieu-ban-be.md#ghi-nhan)).
- **Xem bản demo** → bản demo của ứng dụng ([1](01-bat-dau.md#demo)).

<a id="phap-ly-web"></a>
## Pháp lý và hỗ trợ

`Quyền riêng tư`, `Điều khoản`, `Liên hệ` và `Giới thiệu bạn bè` là văn bản của dự án. Khi chưa được duyệt pháp lý, các trang này ở dạng **bản nháp**: không lập chỉ mục, không hiện ở chân trang và lúc thanh toán. Trạng thái được bật bằng một cờ phát hành ([10](10-quan-tri-va-van-hanh.md#co-phat-hanh)). Điều khoản giới thiệu và thuế thu nhập cá nhân của người nhận cần rà soát pháp lý trước khi công bố rộng ([8](08-gioi-thieu-ban-be.md#quy-tac)). Về dữ liệu của trẻ: [9](09-bao-mat-va-rieng-tu.md).

<a id="chinh-xac"></a>
## Chính xác của nội dung

Mọi câu trên website phải khớp sản phẩm đang chạy và không hứa kết quả cho một em bé. Có **sổ kiểm chứng** ([claims-ledger](../claims-ledger.md)) ghi từng tuyên bố, nguồn và ngày rà soát; bộ kiểm thử chặn các từ cam kết quá mức. "Nhận xét khách hàng" chỉ hiển thị khi có lời thật, có đồng ý và còn hạn rà soát; hiện **chưa có** nhận xét nào được hiển thị.

<a id="tren-ung-dung"></a>
## Trang công khai trên ứng dụng

Ứng dụng cũng phục vụ một số trang công khai (`/pricing`, `/framework`, `/roadmaps`, `/science`, `/docs`, `/privacy`, `/terms`, `/contact`, `/checkout`, `/start`, `/invite/caregiver`) với điều hướng quay lại website cho phần giới thiệu. Chúng **không lập chỉ mục**; website mới là nơi tìm kiếm tìm thấy. Riêng `/checkout`, `/start` và `/invite/caregiver` là các bước thao tác thật ([7](07-goi-va-thanh-toan.md), [5](05-gia-dinh-va-cai-dat.md#nguoi-cham-soc)). Ứng dụng cũng có `/docs`, là bản hướng dẫn **đầy đủ** dành cho phụ huynh (các chương của bộ tài liệu này, có tìm kiếm và liên kết từ dấu ? trong khu phụ huynh; xem [1](01-bat-dau.md#tro-giup)), và `/admin` ([10](10-quan-tri-va-van-hanh.md)).

<a id="lien-quan"></a>
## Liên quan

- Nội dung khoa học: [6. Khoa học thói quen](06-khoa-hoc-thoi-quen.md).
- Gói và thanh toán sau khi bấm nút: [7. Gói và thanh toán](07-goi-va-thanh-toan.md).
- Quy tắc đăng bài: [Hướng dẫn đăng blog](../blog-guide.md); tuyên bố nội dung: [Sổ kiểm chứng](../claims-ledger.md).
