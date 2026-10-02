# 6. Khoa học thói quen

[← 5. Gia đình và cài đặt](05-gia-dinh-va-cai-dat.md) · [Mục lục](README.md) · [Tiếp: 7. Gói và thanh toán →](07-goi-va-thanh-toan.md)

## Trong tài liệu này

[Nguyên tắc](#nguyen-tac) · [Khung 47 thói quen](#khung) · [16 chân dung và 7 bố thí](#chan-dung) · [Bốn pha của một thói quen](#bon-pha) · [Logic gợi ý trong ứng dụng](#logic) · [Bảng luật gợi ý](#goi-y) · [Điều ứng dụng không tuyên bố](#khong-tuyen-bo) · [Các tính năng dùng những kiến thức này](#ung-dung) · [Liên quan](#lien-quan)

Tài liệu này giải thích **vì sao** ứng dụng làm như vậy, để ba mẹ hiểu các gợi ý và biết khi nào nên làm khác. Bản đầy đủ có dẫn nguồn nằm ở [Khoa học thói quen và logic thích ứng](../habit-science-and-adaptive-logic.md); mọi nội dung công khai được đối chiếu ở [sổ kiểm chứng](../claims-ledger.md).

<a id="nguyen-tac"></a>
## Nguyên tắc

1. **Không có con số "21 ngày".** Nghiên cứu cho thấy thời gian để một hành vi gần như tự động rất khác nhau giữa người với người (từ vài tuần đến vài tháng), và chủ yếu đo ở người lớn. Ứng dụng không hứa thói quen hình thành sau một số ngày cố định.
2. **Tín hiệu quan trọng hơn ý chí.** Một câu "nếu… thì…" cụ thể ("Sau khi đánh răng, con đọc một trang sách") và một hoàn cảnh ổn định giúp bé bắt đầu dễ hơn ([tín hiệu](04-thiet-ke-thoi-quen.md#chuong-trinh)).
3. **Bỏ lỡ một lần không làm hỏng thói quen.** Hôm sau cứ làm tiếp, không phạt, không bắt làm lại từ đầu. Bỏ lỡ nhiều lần liền là dấu hiệu cần chỉnh cách làm, không phải bé "lười".
4. **Hỗ trợ đúng mức rồi rút dần**: làm cùng → nhắc → bé tự làm.
5. **Ghi nhận cụ thể tốt hơn thưởng có điều kiện.** Nói rõ điều bé vừa làm được; giữ thưởng vật chất nhẹ và giảm dần. Sao, chuỗi ngày và huy hiệu chỉ để tạo động lực, **không** đánh giá phẩm chất hay so sánh các bé.
6. **Đừng ôm quá nhiều thói quen mới cùng lúc.** Ứng dụng đưa cảnh báo mềm theo tuổi (quy ước thiết kế, không có bằng chứng trực tiếp về con số).
7. **Giấc ngủ là nền** cho mọi thói quen khác.

Các ngưỡng cụ thể (7/10 lần, 8/10 lần, 60%…) được ghi trong tài liệu gốc ở mức tin cậy **thấp**: là giả thuyết cần kiểm chứng bằng dữ liệu thật, không phải sự thật khoa học.

<a id="khung"></a>
## Khung 47 thói quen

Khung là bộ **47 thói quen cho trẻ 0–18 tuổi**, tổ chức theo hai trục:

**Năm giai đoạn** (khoảng tuổi chỉ là gợi ý, không phải bài kiểm tra):

| Giai đoạn | Tuổi | Tên | Vai trò người lớn |
|---|---|---|---|
| GD1 | 0–3 | Nền tảng an toàn và giác quan | Làm mẫu và mô tả |
| GD2 | 3–6 | Khám phá và ý chí | Làm cùng và nhắc |
| GD3 | 6–12 | Cần cù và kỹ năng | Giám sát và cùng làm |
| GD4 | 12–15 | Bản sắc và cảm xúc | Đồng hành, cùng tuân luật chung |
| GD5 | 15–18 | Định hướng và trách nhiệm | Cố vấn và hậu thuẫn |

**Năm lĩnh vực**: Nội tâm, Sức khỏe, Mối quan hệ, Học tập, Tài chính.

Mỗi thói quen có **ý nghĩa dành cho bé**, **cách đồng hành dành cho người lớn**, dấu hiệu tiến bộ, và các thẻ khái niệm (chân dung, bố thí). Hồ sơ bé thì dùng **bốn nhóm tuổi** (0–3, 3–6, 6–12, 12–18) cho gói thói quen khởi đầu và giao diện; [lộ trình](04-thiet-ke-thoi-quen.md#lo-trinh) và [thư viện](04-thiet-ke-thoi-quen.md#khung-47) dùng năm giai đoạn trên. Hợp đồng dữ liệu và quy trình biên tập: [Hợp đồng dữ liệu khung](../habit-framework-data-contract.md).

Khung có tại ứng dụng ([thư viện](04-thiet-ke-thoi-quen.md#khung-47)) và trên website ([trang Khung thói quen](11-website-va-trang-cong-khai.md#trang-khung)).

<a id="chan-dung"></a>
## 16 chân dung và 7 bố thí

**16 chân dung** là *hướng trưởng thành*, không phải kiểu tính cách để gắn nhãn cho bé: Trí Tuệ Học Giả, Tâm Thái An Vui, Nhân Cách Kiện Toàn, Phẩm Chất Ưu Tú, Năng Lực Xuất Chúng, Thể Hình Cân Đối, Sức Khỏe Người Sắt, Quảng Bá Siêu Phàm, Giao Tiếp Thông Thái, Luật Sắt Bản Thân, Tầm Nhìn Thấu Suốt, Thấu Hiểu Nhân Sinh, Bác Ái Lĩnh Chúng, Đức Hành Thiên Hạ, Lục Lộc Đại Thuận và **Làm Người Thành Công** (chân dung thứ 16, đích tổng hợp). Chúng chia ở bốn nhóm: nhân cách, phẩm chất, năng lực, tầm nhìn.

- Mỗi chân dung là một [huy hiệu](02-man-hinh-be.md#huy-hieu) mở khi bé làm đủ số lần các việc gắn với nó; chân dung 16 mở khi giữ đủ các chân dung còn lại.

**7 bố thí** là bảy cách cho đi giản dị mà ai cũng làm được mỗi ngày: **nụ cười** (Nhan thí), **ánh mắt** (Nhãn thí), **lời nói** (Ngôn thí), **lòng biết ơn** (Tâm thí), **lòng bao dung** (Phòng thí), **hành động nhân ái** (Thân thí), **sự nhường nhịn** (Tọa thí). Ứng dụng dùng câu chữ đời thường, không hứa công đức hay kết quả tâm linh.

**Cẩm nang 16 chân dung và 7 bố thí** (nút trên thanh trên cùng) có ba thẻ:

1. **16 chân dung và 4 giai đoạn**: chọn lứa tuổi của con, xem hành động chi tiết cho từng chân dung, rồi **"Áp dụng cho bé (tên)"** để thêm bộ hành động vào lịch.
2. **7 cách cho đi**: ý nghĩa và cách thực hành mỗi ngày.
3. **Làm gương và 6 nguyên tắc**: nghệ thuật *thân giáo* ("Đừng chỉ nói về đạo lý, hãy sống điều mình muốn con học"), **công thức 6 chữ vàng của cha mẹ** (đơn giản, vui vẻ, tin tưởng, nhẹ nhàng, thường xuyên, dụng tâm) và **checklist 5 câu tự vấn mỗi tối** (dành 2 phút trước khi ngủ).

Với bé **0–3 tuổi**, trẻ học chủ yếu bằng quan sát nên màn hình hiện "Nhật ký làm gương của ba mẹ": ba mẹ thực hành 16 hành động nhân cách mỗi ngày để làm gương cho con, và ghi nhận theo ba mẹ chứ không thưởng cho bé.

<a id="bon-pha"></a>
## Bốn pha của một thói quen

Mỗi thói quen của mỗi bé đi qua bốn pha. Pha được xác định bằng **điều bé thực sự làm**, không bằng số ngày.

| Pha | Việc chính | Người lớn làm gì |
|---|---|---|
| 1. **Neo tín hiệu** (đang chọn tín hiệu) | Chọn hoàn cảnh và câu "nếu… thì…" | Cùng con quyết định, ghi lại |
| 2. **Xây nếp** | Lặp lại đều trong cùng hoàn cảnh | Làm cùng hoặc nhắc, khen cụ thể |
| 3. **Giảm hỗ trợ** | Đi từ làm cùng sang nhắc sang tự làm | Rút dần từng bước |
| 4. **Thành nếp** | Kiểm tra thưa dần | Ghi nhận bằng lời, ít can thiệp |

Chuyển pha: 1→2 khi đã có kế hoạch tín hiệu và bé thử ít nhất 3 lần; 2→3 khi hoàn thành ít nhất 7 trong 10 lần gần nhất (thói quen hằng tuần: 5 trong 6); 3→4 khi ít nhất 8 trong 10 lần gần nhất bé **tự làm một mình** (hằng tuần: 5 trong 6); quay lại pha 3 nếu dưới 6 trong 10 lần. Bỏ lỡ một lần không đổi pha.

<a id="logic"></a>
## Logic gợi ý trong ứng dụng

Pha và gợi ý được **tính** từ dữ liệu quan sát, không lưu cứng. Mỗi lần thói quen đến hạn là một *cơ hội*, với kết quả: tự làm, cần nhắc, làm cùng, chưa ghi cách làm, bỏ lỡ, hoặc bé chọn để sau (không tính là bỏ lỡ). Ngày gia đình [tạm nghỉ](05-gia-dinh-va-cai-dat.md#tam-nghi) bị loại khỏi cơ hội. "Chưa ghi cách làm" tính là hoàn thành nhưng **không** tính là tự làm, vì vậy việc [ghi cách bé làm](03-hom-nay-va-duyet-viec.md#muc-ho-tro) giúp gợi ý chính xác hơn.

Ba lớp độ khó (đơn giản, vừa, phức tạp) chỉ dùng để hiện câu "thường cần vài tuần / vài tuần đến vài tháng / vài tháng" và làm ngưỡng gợi ý "có thể đang kẹt"; trẻ dưới 6 tuổi nhân thêm 1,5. Theo tuổi, ai xác nhận mức hỗ trợ cũng khác: 0–3 do ba mẹ; 3–12 phụ huynh xác nhận; 12–15 phụ huynh xác nhận và bé cùng thiết kế; từ 15 bé tự xác nhận mức làm một mình.

<a id="goi-y"></a>
### Bảng luật gợi ý

| Gợi ý | Khi nào xuất hiện | Nội dung |
|---|---|---|
| **Kẹt ở pha xây nếp** | Số tuần ở pha 2 vượt ngưỡng của lớp độ khó | Làm nhỏ hơn, đổi tín hiệu hoặc giờ, thêm phương án cuối tuần và ngày bận |
| **Phụ thuộc nhắc** | Ở pha 3, từ 6/10 lần gần nhất là "cần nhắc" | Chuyển sang tín hiệu hình ảnh hoặc để bé tự đặt nhắc |
| **Quá tải thói quen mới** | Số thói quen pha 1–2 vượt giới hạn tuổi | Tạm hoãn bớt một thói quen |
| **Sắp thành nếp** | Đạt ngưỡng sang pha 4 | Chuyển sang ghi nhận bằng lời, giảm dần sao |
| **Lùi một bậc** | 3 lần bỏ lỡ trong 5 lần gần nhất ở pha 3 | Quay lại bậc hỗ trợ trước |
| **Kiểm tra cách làm** | 3 lần bỏ lỡ liên tiếp ở pha 2 | Xem lại tín hiệu, độ lớn, cuối tuần |
| **Ghi cách bé làm** | Hơn một nửa số lần gần nhất chưa ghi cách làm và thói quen sắp đủ ngưỡng đổi pha | Nhắc nhẹ "Con làm thế nào?" |

Giới hạn thói quen mới đồng thời (cảnh báo mềm, không chặn): 0–3 tuổi 1; 3–6 tuổi 2; 6–15 tuổi 3; từ 15 tuổi 4. Tối đa 3 gợi ý mỗi bé mỗi lần; gợi ý "Để sau" ẩn 14 ngày. Phân tích này **chỉ để gợi ý cho phụ huynh**, không dùng xếp hạng hay so sánh các bé.

<a id="khong-tuyen-bo"></a>
## Điều ứng dụng không tuyên bố

- Không nói thói quen hình thành sau số ngày cố định, không hứa kết quả (học tốt hơn, ngoan hơn) cho một đứa trẻ cụ thể.
- Không nói huy hiệu, chuỗi ngày hay sao "đã được chứng minh" làm tăng động lực.
- Không dùng nhãn cho trẻ ("chậm", "yếu", "lười") và không so sánh giữa các bé.
- Nội dung sức khỏe không thay tư vấn của bác sĩ hay nhà tâm lý.
- Nội dung triết lý của khung được diễn đạt đời thường, không phải kết luận khoa học.

<a id="ung-dung"></a>
## Các tính năng dùng những kiến thức này

| Kiến thức | Tính năng |
|---|---|
| Tín hiệu "nếu… thì…" | [Tín hiệu và chương trình](04-thiet-ke-thoi-quen.md#chuong-trinh) |
| Bốn pha, rút hỗ trợ | [Ghi cách bé làm](03-hom-nay-va-duyet-viec.md#muc-ho-tro), [Tiến triển và gợi ý](03-hom-nay-va-duyet-viec.md#tien-trien), [Nhìn lại tuần](03-hom-nay-va-duyet-viec.md#nhin-lai-tuan) |
| Bỏ lỡ một lần không sao | [Chuỗi ngày](02-man-hinh-be.md#sao-cap-chuoi), [để sau](02-man-hinh-be.md#hoan-thanh), [tạm nghỉ](05-gia-dinh-va-cai-dat.md#tam-nghi) |
| Ít thói quen mới cùng lúc | [Lộ trình theo tuổi](04-thiet-ke-thoi-quen.md#lo-trinh) (mỗi bước thêm một thói quen), cảnh báo giới hạn |
| Ghi nhận bằng lời | [Lời khen](02-man-hinh-be.md#hoan-thanh), [thư buổi sáng](02-man-hinh-be.md#thu-buoi-sang), [kho quà ưu tiên trải nghiệm](04-thiet-ke-thoi-quen.md#kho-qua) |
| 16 chân dung, 7 bố thí | [Huy hiệu](02-man-hinh-be.md#huy-hieu), [khung 47](04-thiet-ke-thoi-quen.md#khung-47), cẩm nang |
| Làm gương | Bé 0–3 tuổi, hồ sơ "Ba Mẹ làm gương" ở thanh trên cùng |

<a id="lien-quan"></a>
## Liên quan

- Dùng khung và chương trình trong thực tế: [4. Thiết kế thói quen](04-thiet-ke-thoi-quen.md).
- Xem gợi ý và tiến triển: [3. Hôm nay và duyệt việc](03-hom-nay-va-duyet-viec.md).
- Bài viết cho ba mẹ trên website: [11. Website và trang công khai](11-website-va-trang-cong-khai.md#blog).
- Quy tắc về dữ liệu của trẻ: [9. Bảo mật và riêng tư](09-bao-mat-va-rieng-tu.md).
