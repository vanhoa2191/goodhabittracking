# Khảo sát AI bằng Cloudflare Workers AI (gói miễn phí) và nhắc đẩy (R5)

Trạng thái: **khảo sát và điều kiện cần có**, chưa viết mã tính năng. Chủ dự án đã chọn dùng **Cloudflare Workers AI, gói miễn phí** (04/10/2026) cho phần AI; nhắc đẩy (Web Push) chỉ khảo sát.

## Việc AI được dùng làm

Chỉ hai việc, đều cho **phụ huynh**, không bao giờ cho bé thấy trực tiếp:

1. **Chia nhỏ việc** cho một thói quen tự tạo (thói quen của khung 47 đã có bản hai phút viết sẵn, không cần AI).
2. **Tóm tắt tuần** bằng lời tự nhiên từ các số liệu tuần đã tổng hợp.

Không dùng AI để chấm bé, dán nhãn, chẩn đoán hay quyết định thay phụ huynh. Mọi đầu ra là gợi ý, có nút bỏ qua, và phải qua cùng bộ quy tắc ngôn từ như nội dung khác (`docs/claims-ledger.md`).

## Vì sao Workers AI hợp với dự án

- Chạy trên Cloudflare, nền tảng đang chạy ứng dụng (OpenNext trên Workers), nên **không thêm nhà cung cấp mới** nhận dữ liệu và không cần khóa API ngoài: chỉ thêm một binding trong `wrangler.jsonc` (`"ai": { "binding": "AI" }`).
- Có hạn mức miễn phí theo ngày; vượt hạn mức thì dừng, không phát sinh phí bất ngờ nếu ta chặn trước.

## Điều kiện phải đạt trước khi bật

1. **Đồng ý riêng của phụ huynh** (mặc định tắt), tách khỏi đồng ý lưu hồ sơ; ghi theo phiên bản chính sách như `consent`; rút lại được; rút thì dừng ngay.
2. **Chỉ gửi dữ liệu đã ẩn danh hóa**: không tên, biệt danh, nhật ký, văn bản tự do của bé hay của phụ huynh về bé. Với "chia nhỏ việc" chỉ gửi **tiêu đề việc** do phụ huynh tạo, sau khi phụ huynh bấm; với "tóm tắt tuần" chỉ gửi **số đếm** (số lần tự làm, cần nhắc, làm cùng theo tuần).
3. **Xác minh điều khoản hiện hành của Cloudflare** về việc dữ liệu gửi qua Workers AI có được dùng để huấn luyện hay không và nơi xử lý, bằng tài liệu của Cloudflare tại thời điểm làm, rồi ghi vào `docs/security-privacy.md`. Nếu điều khoản không rõ, không bật.
4. **Cập nhật chính sách quyền riêng tư và danh sách bên xử lý** (việc của chủ dự án, cần bản tiếng Việt và Anh đã duyệt pháp lý) trước khi bật cho người dùng.
5. **Hạn mức theo gia đình** (ví dụ 10 lượt mỗi ngày mỗi gia đình, 3 lượt mỗi phút) lưu ở cơ sở dữ liệu hoặc KV; hết hạn mức chung trong ngày thì tính năng tự ẩn và báo "thử lại ngày mai".
6. **Không chặn đường chính**: lỗi hoặc chậm thì tính năng ẩn đi, ứng dụng vẫn dùng bình thường; thời gian chờ tối đa 8 giây.
7. **Chọn mô hình** bằng thử thực tế với tiếng Việt và tiếng Anh trên bộ câu mẫu (20 thói quen), chấm bằng quy tắc ngôn từ; chọn mô hình nhỏ nhất đạt. Không chọn trước ở tài liệu này vì danh sách mô hình thay đổi.
8. **Chống lạm dụng và chèn lệnh**: đầu vào là tiêu đề ngắn (≤ 80 ký tự) đã lọc; đầu ra được ép về cấu trúc JSON cố định rồi kiểm lại độ dài, ngôn từ cấm và tuổi phù hợp trước khi hiển thị.
9. **Đo lường**: không ghi nội dung; chỉ đếm số lượt và số lần lỗi ở mức tổng.

## Kế hoạch kỹ thuật khi các điều kiện đạt

- `src/app/api/ai/breakdown/route.ts` và `weekly-summary/route.ts` (chỉ phụ huynh đăng nhập, kiểm PIN, kiểm cờ và đồng ý, kiểm hạn mức, gọi `env.AI.run`).
- Hàm thuần kiểm tra đầu vào/đầu ra có test bảng (độ dài, ngôn từ cấm, JSON hợp lệ).
- Cờ `NEXT_PUBLIC_PARENT_AI` mặc định tắt; giao diện tải lười.
- Test: hợp đồng đồng ý (không gọi AI khi chưa đồng ý), hạn mức, lỗi mô hình, đầu ra bẩn.

## Nhắc đẩy (Web Push): chỉ khảo sát

- Cần service worker nhận push, khóa VAPID, tác vụ gửi theo lịch ở máy chủ, lưu đăng ký theo thiết bị, và đồng ý riêng cho thiết bị của bé (trẻ em: cần rà soát COPPA/GDPR-K).
- iOS chỉ hỗ trợ khi ứng dụng web đã cài lên màn hình chính (từ iOS 16.4).
- Trước khi quyết định, thu số liệu tỷ lệ phụ huynh bật nhắc việc hiện có (`parentReengagement`) để biết nhu cầu thật.

## Việc cần ở chủ dự án

- Xác nhận cho phép bắt đầu khi điều kiện 3 và 4 xong (hoặc giao cho bên pháp lý).
- Duyệt văn bản đồng ý AI (vi/en).
