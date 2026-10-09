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
| `terms_version` | `2026-10-09` | người đã tham gia phải đồng ý lại trước khi chia sẻ liên kết hoặc yêu cầu rút |

Đổi tỉ lệ chỉ áp dụng cho hoa hồng sinh sau đó (mỗi dòng lưu `rate_bps` của lúc sinh). Khi đổi `terms_version`, `affiliate_overview` trả `termsAccepted = false` cho tài khoản chưa chấp nhận bản mới. Thẻ trong ứng dụng hiện lại điều khoản và ô đồng ý thay cho liên kết và nút rút; `affiliate_enroll(true)` cập nhật `affiliate_accounts.terms_version` cùng `terms_accepted_at`, không đổi mã hoặc earnings. RPC rút tiền trả `terms_required` nếu bản chấp nhận đã cũ.

## Luồng

1. **Ghi nhận.** Trang marketing đọc `?ref=` và đặt cookie `kidhabit_ref` (60 ngày, domain `kidhabithero.com`, chỉ nhận mã 8 ký tự hợp lệ). Sau khi phụ huynh đăng nhập, `ReferralClaimer` ưu tiên mã hợp lệ trên URL hiện tại hơn cookie cũ rồi gửi tới `POST /api/referral/claim`; hàm `claim_referral` quyết định (`claimed`, `self`, `invalid`, `expired`, `already_referred`, `disabled`) và cookie được xóa khi có câu trả lời cuối.
   **Nhập mã thủ công.** Tài khoản người dùng còn đủ điều kiện (mới trong thời hạn ghi nhận tính từ ngày tạo tài khoản, chưa từng trả tiền, chưa được giới thiệu) thấy ô "Có mã giới thiệu từ bạn bè?" trong Cài đặt và trong cửa sổ thanh toán. Ô này gọi cùng `POST /api/referral/claim`; `GET` cùng đường dẫn trả `referral_claim_state()` (`eligible`, `referred`, `closed`, `disabled`) để ẩn ô khi không còn áp dụng. Nhập thủ công và cookie dùng chung luật của `claim_referral`, nên không thể ghi nhận hai lần. Xóa hoặc tạo lại gia đình không đặt lại ghi nhận, lịch sử thanh toán hay cửa sổ 12 tháng. Mã chỉ ghi nhận được trước khi tài khoản có đơn đầu tiên được thanh toán.
2. **Sinh hoa hồng.** `process_payos_webhook` gọi `accrue_referral_commission` sau khi đơn chuyển PAID: một khoản cho mỗi đơn (`order_code` duy nhất), trạng thái `pending`, thời điểm hết hạn giữ tính từ thanh toán thành công. Đơn phải thuộc gia đình có membership `owner` là `referrals.referred_user_id`; phụ huynh/guardian nào trả tiền không ảnh hưởng. Người được giới thiệu trả cho gia đình không sở hữu không sinh hoa hồng. Cửa sổ 365 ngày tính từ `auth.users.created_at` của chủ gia đình; xóa/tạo lại gia đình giữ nguyên attribution và cửa sổ đó. Claim của người quản lý gia đình ghi nhận tài khoản chủ gia đình và được khóa bằng `pg_advisory_xact_lock(hashtext(owner::text))`, không khóa hàng GoTrue. Hoa hồng mới giữ 40 ngày; `available_at` đã lưu của hoa hồng cũ không đổi. Lỗi ở bước này chỉ cảnh báo, không bao giờ làm hỏng thanh toán.
3. **Rút tiền.** Người giới thiệu lưu thông tin ngân hàng và bấm yêu cầu (cả hai cần gia đình đã đặt mã PIN phụ huynh và mã đã được nhập trên trình duyệt này; gia đình chưa đặt PIN được yêu cầu đặt trước). `request_affiliate_payout` gom các khoản đã hết hạn giữ thành một yêu cầu `requested`, nhưng loại khoản của đơn có ca hỗ trợ hoàn tiền hoặc thanh toán còn mở; các khoản này tiếp tục đóng băng cho đến khi ca đóng.
4. **Chi trả (admin).** Trang `/admin`, mục Chương trình giới thiệu. Admin nhận xử lý (quyền có hiệu lực 2 giờ), chuyển khoản thủ công rồi xác nhận kèm mã giao dịch và lý do (MFA, finance/super_admin, audit log). Yêu cầu bị chặn hiển thị cảnh báo và mã đơn; database kiểm tra lại `billing_case_open`/`refund_confirmed` ngay khi chi trả, kể cả trang admin đã cũ, và từ chối nếu tổng hoa hồng không khớp (`amount_mismatch`). Từ chối trả khoản chưa hoàn tiền về `pending`, nhưng chuyển khoản có `refund_confirmed_at` sang `reversed` và lưu `reversed_at`. Danh sách hiện đủ yêu cầu chờ; lịch sử giới hạn 50 dòng trong 60 ngày.
5. **Hoàn tiền và ca hỗ trợ.** Ca hỗ trợ mở chặn rút/chi trả. `admin_reverse_referral_commission(bigint,text)` lưu `referral_commissions.refund_confirmed_at` và lý do trước khi trả `in_payout` hoặc `already_paid`; dữ liệu này không mất khi xóa gia đình/tài khoản khách hàng hoặc ca hỗ trợ. `in_payout` tiếp tục chặn chi trả và tự động trở thành `reversed` khi admin từ chối yêu cầu rút, không cần xử lý lại ca đã đóng. Khoản `paid` giữ trạng thái và bằng chứng để thu hồi thủ công với người giới thiệu, không tự trừ vào khoản sau. Signature và return codes giữ nguyên cho billing RPC.

### SQL regression scenarios

`tests/integration/migrations/affiliate-account-privacy-freeze.scenarios.sql` chạy trên PostgreSQL cô lập, sau affiliate migrations và fixture có users/families/orders, với ngày release gốc trong `test_original_release`. Kiểm chứng: ca mở bị loại khỏi payout; hoàn tiền trong payout rồi từ chối tự thu hồi; xóa gia đình/account không xóa block; khoản paid giữ bằng chứng manual recovery; hold mới 40 ngày và release cũ giữ nguyên; guardian trả cho gia đình được giới thiệu sinh hoa hồng; payer trả cho gia đình không sở hữu không sinh; tạo lại gia đình không reset; bản điều khoản cũ chặn rút và đồng ý lại giữ mã.

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

Khi hồ sơ hỗ trợ bị xoá cùng gia đình mà hoa hồng còn đóng băng, finance/super admin dùng mục hoa hồng đóng băng trong trang quản trị. Chỉ bỏ đóng băng sau khi kiểm tra chứng từ, xác nhận tranh chấp đã giải quyết không hoàn tiền và ghi lý do. Hệ thống không cho bỏ chặn đơn đã hoàn tiền hoặc còn hồ sơ đang mở; hành động được audit trong cùng giao dịch và giữ nguyên ngày có thể rút.
