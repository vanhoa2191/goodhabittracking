# Claims Ledger

| Claim/surface | Evidence | Status |
|---|---|---|
| Đồng bộ cloud đa thiết bị | Supabase family queries, domain RPC và E2E isolation | Qualified: chỉ khi đăng nhập và migration production đã áp dụng |
| PayOS VietQR tự động | Signed create request, verified webhook, idempotent entitlement RPC | Qualified: chỉ khi Worker secrets và webhook đã cấu hình |
| Dùng thử 7 ngày, không tự trừ tiền | One-time trial RPC; không có recurring charge API | Verified by code/tests |
| Leaderboard bảo vệ tên thật | Opt-in settings và public projection tối thiểu | Verified by migration; production deployment pending |
| 50+ thói quen | Static catalog count cần kiểm tra khi nội dung thay đổi | Product-owned; không dùng như outcome guarantee |
| Cải thiện phẩm chất/kết quả giáo dục | Không có nghiên cứu sản phẩm kiểm chứng | Không được trình bày như cam kết kết quả |
| An toàn/bảo mật tuyệt đối | Không thể chứng minh tuyệt đối | Dùng mô tả kiểm soát cụ thể, không dùng claim tuyệt đối |
| Testimonials/số gia đình sử dụng | Chưa có nguồn consented trong repo | Không hiển thị số liệu/testimonial không có ledger nguồn |

Mọi claim mới phải có owner, nguồn, ngày kiểm tra và phạm vi. UX copy phải phân biệt mô tả tính năng với kết quả giáo dục giả định.
