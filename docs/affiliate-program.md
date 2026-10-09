# Chương trình giới thiệu bạn bè

Phụ huynh tham gia trong ứng dụng (Cài đặt, mục Giới thiệu bạn bè), nhận liên kết `https://kidhabithero.com/?ref=<MÃ>` và được hoa hồng **30%** trên mỗi khoản thanh toán của gia đình được giới thiệu. Trang điều khoản công khai: `/gioi-thieu/` trên site marketing.

## Quy tắc mặc định (bảng `affiliate_settings`, đổi bằng SQL, không cần sửa mã)

| Cột | Giá trị | Ý nghĩa |
|---|---|---|
| `commission_bps` | 3000 | 30% số tiền thực trả, làm tròn xuống |
| `attribution_days` | 60 | tài khoản người dùng phải được tạo trong 60 ngày gần nhất và chưa từng trả tiền mới ghi nhận được; cũng là hạn của cookie |
| `earning_window_days` | 365 | chỉ đơn trong 12 tháng đầu kể từ ngày tạo tài khoản người dùng được giới thiệu sinh hoa hồng |
| `hold_days` | 40 | hoa hồng mới giữ 40 ngày từ thanh toán thành công, bao phủ hạn hoàn tiền 30 ngày và thời gian xử lý; ngày hết hạn giữ đã lưu của hoa hồng cũ không đổi |
| `min_payout_vnd` | 200000 | mức rút tối thiểu |
| `referred_discount_bps` | 1000 | giảm 10% gói năm đầu tiên của gia đình được giới thiệu (xem bên dưới) |
| `enabled` | true | tắt thì ẩn thẻ, không ghi nhận, không sinh hoa hồng mới |

Đổi tỉ lệ chỉ áp dụng cho hoa hồng sinh sau đó (mỗi dòng lưu `rate_bps` của lúc sinh). Cập nhật `terms_version` khi điều khoản đổi.

## Luồng

1. **Ghi nhận.** Trang marketing đọc `?ref=` và đặt cookie `kidhabit_ref` (60 ngày, domain `kidhabithero.com`, chỉ nhận mã 8 ký tự hợp lệ). Sau khi phụ huynh đăng nhập, `ReferralClaimer` ưu tiên mã hợp lệ trên URL hiện tại hơn cookie cũ rồi gửi tới `POST /api/referral/claim`; hàm `claim_referral` quyết định (`claimed`, `self`, `invalid`, `expired`, `already_referred`, `disabled`) và cookie được xóa khi có câu trả lời cuối.
   **Nhập mã thủ công.** Tài khoản người dùng còn đủ điều kiện (mới trong thời hạn ghi nhận tính từ ngày tạo tài khoản, chưa từng trả tiền, chưa được giới thiệu) thấy ô "Có mã giới thiệu từ bạn bè?" trong Cài đặt và trong cửa sổ thanh toán. Ô này gọi cùng `POST /api/referral/claim`; `GET` cùng đường dẫn trả `referral_claim_state()` (`eligible`, `referred`, `closed`, `disabled`) để ẩn ô khi không còn áp dụng. Nhập thủ công và cookie dùng chung luật của `claim_referral`, nên không thể ghi nhận hai lần. Xóa hoặc tạo lại gia đình không đặt lại ghi nhận, lịch sử thanh toán hay cửa sổ 12 tháng. Mã chỉ ghi nhận được trước khi tài khoản có đơn đầu tiên được thanh toán.
2. **Sinh hoa hồng.** `process_payos_webhook` gọi `accrue_referral_commission` sau khi đơn chuyển PAID: một khoản cho mỗi đơn (`order_code` duy nhất), trạng thái `pending`, thời điểm hết hạn giữ tính từ thanh toán thành công. Hoa hồng mới giữ 40 ngày; `available_at` đã lưu của hoa hồng cũ không đổi. Lỗi ở bước này chỉ cảnh báo, không bao giờ làm hỏng thanh toán.
3. **Rút tiền.** Người giới thiệu lưu thông tin ngân hàng và bấm yêu cầu (cả hai cần gia đình đã đặt mã PIN phụ huynh và mã đã được nhập trên trình duyệt này; gia đình chưa đặt PIN được yêu cầu đặt trước). `request_affiliate_payout` gom các khoản đã hết hạn giữ thành một yêu cầu `requested`, nhưng loại khoản của đơn có ca hỗ trợ hoàn tiền hoặc thanh toán còn mở; các khoản này tiếp tục đóng băng cho đến khi ca đóng.
4. **Chi trả (admin).** Trang `/admin`, mục Chương trình giới thiệu. Một quản trị viên bấm "Nhận xử lý" trước khi chuyển khoản (quyền xử lý hết hạn sau 2 giờ; người khác không thể trả hay từ chối khi quyền còn hiệu lực), rồi chuyển khoản thủ công tới tài khoản trong yêu cầu và bấm "Đã chuyển khoản" kèm mã giao dịch và lý do (bắt buộc, cần MFA, vai trò finance hoặc super admin, ghi nhật ký). Yêu cầu có đơn bị chặn hiển thị cảnh báo và mã đơn; không thể nhận xử lý hoặc đánh dấu đã chuyển trên giao diện. Database kiểm tra lại ca đang mở (`billing_case_open`) và đơn đã xác nhận hoàn tiền (`refund_confirmed`) ngay khi đánh dấu đã chuyển, kể cả nếu trang admin đã cũ. Hệ thống cũng từ chối khi tổng hoa hồng gắn với yêu cầu khác số tiền (`amount_mismatch`). "Từ chối" trả các khoản về `pending`. Danh sách luôn hiện đủ mọi yêu cầu đang chờ; lịch sử đã xử lý giới hạn 50 dòng gần nhất trong 60 ngày.
5. **Hoàn tiền và ca hỗ trợ.** Ca hỗ trợ hoàn tiền hoặc thanh toán còn mở của một đơn chặn rút và chi trả hoa hồng của đơn đó, kể cả khi đã hết hạn giữ hoặc đã vào yêu cầu rút. Việc thu hồi chạy trước khi ca được đánh dấu hoàn tất: nếu hàm thu hồi lỗi, ca chưa được hoàn tất để thử lại. Nếu hoa hồng đã `requested`, hàm trả `in_payout`; ca có thể đã đóng nhưng mã `manual_refund_confirmed` vẫn chặn chi trả bền vững. Admin phải từ chối yêu cầu rút trước rồi xử lý lại ca để thu hồi khoản đã trở về `pending`. Ca hoàn tiền cần mã đơn để khớp hoa hồng. Nếu hoa hồng đã `paid`, liên hệ người giới thiệu để thống nhất hoàn trả, không tự động trừ vào khoản sau.

## Ưu đãi cho gia đình được giới thiệu

Gia đình đã được ghi nhận (qua liên kết hoặc nhập mã thủ công) được giảm `referred_discount_bps` (mặc định 10%) khi mua **một trong hai gói năm** (`yearly`, Gói Pro, hoặc `solo_yearly`, Gói Cơ bản) lần đầu, tức khi gia đình chưa có đơn nào `PAID`. Máy chủ quyết định giá: `/api/payment/create` gọi `referral_discount_bps(target_family)` (chỉ `service_role`), tạo đơn PayOS với số tiền đã giảm (Gói Pro · Năm 590.000 đ thành 531.000 đ; Gói Cơ bản · Năm 399.000 đ thành 359.100 đ) và trả về `listPrice`, `discountPercent` để màn thanh toán hiện "Đã giảm 10% nhờ mã giới thiệu". Các gói tháng và trọn đời không giảm. Vì hoa hồng tính trên số tiền thực trả, người giới thiệu nhận 30% số tiền thực trả cho đơn đó: 159.300 đ với Gói Pro · Năm đã giảm (531.000 đ), 107.730 đ với Gói Cơ bản · Năm đã giảm (359.100 đ). Nếu bạn đổi phần trăm trong bảng cài đặt, nhớ đổi cả câu chữ "10%" trong `src/lib/i18n/affiliate-copy.ts` và trang `/gioi-thieu/`.

## Bảo mật và riêng tư

- Các bảng `affiliate_*`, `referrals`, `referral_commissions` bật và ép RLS, không client nào đọc hay ghi trực tiếp; chỉ hàm `security definer` truy cập. Hàm của admin và hàm tính hoa hồng chỉ cấp cho `service_role`.
- Người giới thiệu chỉ thấy số lượng đăng ký, số đã trả tiền và tổng tiền hoa hồng theo nhóm trạng thái (xem `affiliate_overview`); không có lịch sử từng khoản, tên, email, mã gia đình, gói mua, thời điểm thanh toán hay trạng thái hoàn tiền của từng người được giới thiệu. Số tài khoản chỉ trả về 4 số cuối.
- Chặn tự giới thiệu (cùng tài khoản hoặc cùng gia đình), ghi nhận một lần cho mỗi tài khoản người dùng, giới hạn theo ngày tạo tài khoản, không ghi nhận tài khoản đã từng trả tiền; xóa hoặc tạo lại gia đình không đặt lại các giới hạn.
- Thông tin ngân hàng nằm ở `affiliate_accounts` và `affiliate_payouts` (bản chụp lúc yêu cầu); chỉ admin có quyền xem qua `admin_affiliate_overview`.

## Kiểm chứng

`npm run verify:live-affiliate` chạy trên production với dữ liệu tổng hợp tự dọn: đăng ký, tự giới thiệu bị từ chối, gia đình quá hạn, 399.000 đ sinh 119.700 đ, thông báo thanh toán lặp không tính hai lần, giữ hạn, thu hồi, yêu cầu rút, từ chối rồi chi trả, không lộ người được giới thiệu. Chạy lại sau mỗi lần sửa hàm hoặc migration liên quan.

## Giới hạn đã biết

- **Tự giới thiệu qua tài khoản thứ hai.** Một người có thể tạo hai tài khoản và dùng mã của tài khoản này cho tài khoản kia; hệ thống chỉ chặn cùng tài khoản hoặc cùng gia đình. Kết quả là hoàn 30% cho chính họ chứ không có lợi nhuận, và việc chuyển khoản là thủ công nên admin có thể rà soát (ví dụ tên chủ tài khoản nhận tiền trùng tên người trả) trước khi chuyển.
- **Tổng tiền lớn.** Mỗi yêu cầu rút bị giới hạn dưới 2.000.000.000 đ (cột số nguyên 32 bit); đạt mức đó thì trả về `amount_too_large` và cần xử lý tay.

## Chưa làm / cần quyết định

- **Rà soát pháp lý và thuế** trước khi công bố rộng: điều khoản trong `/gioi-thieu/` là bản nháp hợp lý, chưa qua luật sư; cách khấu trừ thuế thu nhập cá nhân tùy tình trạng người nhận (cá nhân hay doanh nghiệp) và mức chi trả.
- Chuyển khoản tự động qua ngân hàng hoặc cổng chi hộ (hiện thủ công).
- Thông báo email cho người giới thiệu khi có hoa hồng đầu tiên hoặc khi đã chuyển khoản (cần cấu hình email vòng đời).
- Tạm khóa một người giới thiệu: đặt `affiliate_accounts.status = 'suspended'` bằng SQL (không sinh hoa hồng mới, không rút được); giao diện admin cho việc này chưa có.
