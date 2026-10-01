# Claims Ledger

| Claim/surface | Evidence | Status |
|---|---|---|
| Đồng bộ cloud đa thiết bị | Supabase family queries, domain RPC và E2E isolation | Qualified: chỉ khi đăng nhập và migration production đã áp dụng |
| PayOS VietQR tự động | Signed create request, verified webhook, idempotent entitlement RPC | Qualified: chỉ khi Worker secrets và webhook đã cấu hình |
| Dùng thử 7 ngày, không tự trừ tiền | One-time trial RPC; không có recurring charge API | Verified by code/tests |
| Leaderboard bảo vệ tên thật | Bảng công khai chỉ hiện những bé mà cả gia đình lẫn bé đồng ý (mặc định tắt); chỉ trả biệt danh hoặc "Bé Siêu Nhân", hình đại diện, điểm kiếm được trong kỳ và chuỗi ngày, không trả mã hay tên thật (`supabase/migrations/202609300002_public_leaderboard.sql`, `scripts/verify-live-experience.mjs`) | Verified by migration tests và kiểm tra live; sự lựa chọn của gia đình được ghi thành consent `leaderboard`. Không mô tả như xếp hạng công bằng hay khuyến khích thi đua giữa trẻ |
| 50+ thói quen | Static catalog count cần kiểm tra khi nội dung thay đổi | Product-owned; không dùng như outcome guarantee |
| Cải thiện phẩm chất/kết quả giáo dục | Không có nghiên cứu sản phẩm kiểm chứng | Không được trình bày như cam kết kết quả |
| An toàn/bảo mật tuyệt đối | Không thể chứng minh tuyệt đối | Dùng mô tả kiểm soát cụ thể, không dùng claim tuyệt đối |
| Testimonials/số gia đình sử dụng | Chưa có nguồn consented trong repo | Không hiển thị số liệu/testimonial không có ledger nguồn |
| Trang Cơ sở khoa học (`/science`) | Nội dung ở `src/data/science-content.json`; nguồn Lally 2010, Gollwitzer và Sheeran 2006, Wood và Rünger 2016, Deci, Koestner và Ryan 1999, Diamond 2013, Cengher 2018, Paruthi 2016. Ngày kiểm tra 30/09/2026: thông tin xuất bản của cả bảy nguồn đã đối chiếu; bản tóm tắt gốc đã xem cho Lally, Gollwitzer và Sheeran, Wood và Rünger; Diamond, Deci và cộng sự, Cengher, Paruthi mới xác nhận thông tin xuất bản | Qualified: chỉ mô tả điều nghiên cứu cho biết, luôn kèm giới hạn và mục "chưa biết"; không số liệu hiệu ứng; không hứa kết quả cho một em bé; nguồn về trẻ em còn hạn chế |
| Chương trình thói quen thích ứng (mô tả trên trang chủ marketing) | Tín hiệu, ghi nhận "con đã làm thế nào", gợi ý điều chỉnh và 20 chương trình có test đơn vị và Playwright; kiểm tra live ranh giới và vòng đời đạt ngày 30/09/2026 (`scripts/verify-live-family-boundaries.mjs`, `scripts/verify-live-family-lifecycle.mjs`) | Verified by code/tests: chỉ mô tả tính năng; gợi ý chỉ để ba mẹ tham khảo; không hứa kết quả cho một em bé; ngưỡng đổi pha là giả thuyết; chương trình hiện chỉ có tiếng Việt |

Public product proof is registered in [`src/lib/public-proof.ts`](../src/lib/public-proof.ts). Product entries require at least one repository evidence reference. Testimonials additionally require a source reference, recorded consent and a future review date; expired or incomplete entries are excluded by the publication filter. The current registry contains product proof only and no testimonial.

Mọi claim mới phải có owner, nguồn, ngày kiểm tra và phạm vi. UX copy phải phân biệt mô tả tính năng với kết quả giáo dục giả định.
| Chương trình giới thiệu | Hoa hồng 30% số tiền gia đình được giới thiệu thực trả, trong 12 tháng đầu, giữ 35 ngày, rút tối thiểu 200.000 đồng, chi trả thủ công; người giới thiệu không thấy thông tin gia đình được giới thiệu (`supabase/migrations/202609300010_affiliate_program.sql`, `scripts/verify-live-affiliate.mjs`, `docs/affiliate-program.md`). Không nêu mức thu nhập có thể kiếm được. |
