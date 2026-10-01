# Chương trình giới thiệu bạn bè

Phụ huynh tham gia trong ứng dụng (Cài đặt, mục Giới thiệu bạn bè), nhận liên kết `https://kidhabithero.com/?ref=<MÃ>` và được hoa hồng **30%** trên mỗi khoản thanh toán của gia đình được giới thiệu. Trang điều khoản công khai: `/gioi-thieu/` trên site marketing.

## Quy tắc mặc định (bảng `affiliate_settings`, đổi bằng SQL, không cần sửa mã)

| Cột | Giá trị | Ý nghĩa |
|---|---|---|
| `commission_bps` | 3000 | 30% số tiền thực trả, làm tròn xuống |
| `attribution_days` | 60 | gia đình phải được tạo trong 60 ngày gần nhất và chưa trả tiền mới ghi nhận được; cũng là hạn của cookie |
| `earning_window_days` | 365 | chỉ đơn trong 12 tháng đầu kể từ ngày tạo gia đình sinh hoa hồng |
| `hold_days` | 35 | giữ qua hạn hoàn tiền 30 ngày rồi mới rút được |
| `min_payout_vnd` | 200000 | mức rút tối thiểu |
| `enabled` | true | tắt thì ẩn thẻ, không ghi nhận, không sinh hoa hồng mới |

Đổi tỉ lệ chỉ áp dụng cho hoa hồng sinh sau đó (mỗi dòng lưu `rate_bps` của lúc sinh). Cập nhật `terms_version` khi điều khoản đổi.

## Luồng

1. **Ghi nhận.** Trang marketing đọc `?ref=` và đặt cookie `kidhabit_ref` (60 ngày, domain `kidhabithero.com`, chỉ nhận mã 8 ký tự hợp lệ). Sau khi phụ huynh đăng nhập, `ReferralClaimer` gửi mã tới `POST /api/referral/claim`; hàm `claim_referral` quyết định (`claimed`, `self`, `invalid`, `expired`, `already_referred`, `disabled`) và cookie được xóa khi có câu trả lời cuối.
2. **Sinh hoa hồng.** `process_payos_webhook` gọi `accrue_referral_commission` sau khi đơn chuyển PAID: một khoản cho mỗi đơn (`order_code` duy nhất), trạng thái `pending`, `available_at = now() + hold`. Lỗi ở bước này chỉ cảnh báo, không bao giờ làm hỏng thanh toán.
3. **Rút tiền.** Người giới thiệu lưu thông tin ngân hàng và bấm yêu cầu (cả hai cần mã PIN phụ huynh đã xác minh ở máy chủ). `request_affiliate_payout` gom các khoản đã hết hạn giữ thành một yêu cầu `requested`.
4. **Chi trả (admin).** Trang `/admin`, mục Chương trình giới thiệu: chuyển khoản thủ công tới tài khoản trong yêu cầu, rồi bấm "Đã chuyển khoản" kèm mã giao dịch và lý do (bắt buộc, cần MFA, vai trò finance hoặc super admin, ghi nhật ký). "Từ chối" trả các khoản về `pending`.
5. **Hoàn tiền.** Khi ca hoàn tiền được đánh dấu `completed` với mã `manual_refund_confirmed`, hoa hồng của đơn đó bị thu hồi nếu còn `pending`. Nếu đã `requested`, từ chối yêu cầu rút trước rồi xử lý lại ca; nếu đã `paid`, xử lý tay (trừ vào khoản sau hoặc thu lại).

## Bảo mật và riêng tư

- Các bảng `affiliate_*`, `referrals`, `referral_commissions` bật và ép RLS, không client nào đọc hay ghi trực tiếp; chỉ hàm `security definer` truy cập. Hàm của admin và hàm tính hoa hồng chỉ cấp cho `service_role`.
- Người giới thiệu chỉ thấy số lượng và số tiền (xem `affiliate_overview`); không có tên, email hay mã gia đình của người được giới thiệu. Số tài khoản chỉ trả về 4 số cuối.
- Chặn tự giới thiệu (cùng tài khoản hoặc cùng gia đình), ghi nhận một lần cho mỗi gia đình, giới hạn thời hạn, không ghi nhận gia đình đã trả tiền.
- Thông tin ngân hàng nằm ở `affiliate_accounts` và `affiliate_payouts` (bản chụp lúc yêu cầu); chỉ admin có quyền xem qua `admin_affiliate_overview`.

## Kiểm chứng

`npm run verify:live-affiliate` chạy trên production với dữ liệu tổng hợp tự dọn: đăng ký, tự giới thiệu bị từ chối, gia đình quá hạn, 399.000 đ sinh 119.700 đ, thông báo thanh toán lặp không tính hai lần, giữ hạn, thu hồi, yêu cầu rút, từ chối rồi chi trả, không lộ người được giới thiệu. Chạy lại sau mỗi lần sửa hàm hoặc migration liên quan.

## Chưa làm / cần quyết định

- **Rà soát pháp lý và thuế** trước khi công bố rộng: điều khoản trong `/gioi-thieu/` là bản nháp hợp lý, chưa qua luật sư; cách khấu trừ thuế thu nhập cá nhân tùy tình trạng người nhận (cá nhân hay doanh nghiệp) và mức chi trả.
- Chuyển khoản tự động qua ngân hàng hoặc cổng chi hộ (hiện thủ công).
- Thông báo email cho người giới thiệu khi có hoa hồng đầu tiên hoặc khi đã chuyển khoản (cần cấu hình email vòng đời).
- Tạm khóa một người giới thiệu: đặt `affiliate_accounts.status = 'suspended'` bằng SQL (không sinh hoa hồng mới, không rút được); giao diện admin cho việc này chưa có.
