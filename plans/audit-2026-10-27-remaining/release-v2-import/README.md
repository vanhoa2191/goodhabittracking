# Đưa thinking-games release-365-v2 lên production (chủ dự án chạy trong Supabase SQL editor)

Thứ tự bắt buộc, TRƯỚC khi merge PR:

1. Chạy lần lượt `batch-01-of-15.sql` … `batch-15-of-15.sql`. Mỗi file là một transaction độc lập: chỉ thêm hàng còn thiếu
   (id có tiền tố `E`, không đụng 1.460 hàng `release-365-v1`), rồi tự dừng nếu bất kỳ hàng nào đọc lại không khớp.
   Chạy lại một file là an toàn.
2. Chạy `verify-after-import.sql`. Kỳ vọng 4 dòng: age_6_8/age_9_12 × main/bonus, mỗi dòng 365 hàng, ngày 1–365.
3. Chạy `step-2-flip-and-verify.sql`. File này từ chối chạy nếu chưa đủ 1.460 hàng v2, đổi phiên bản release tin cậy sang
   `release-365-v2`, ghi sổ migration `202610290001` và kiểm tra lại.
4. Báo lại để merge PR; deploy ghim đúng digest `b38165f7…04b0` và `/api/health` kỳ vọng schema `202610290001`.

Rollback: chạy `supabase/rollbacks/202610290001_thinking_games_release_v2.rollback.sql` (chỉ đổi lại phiên bản tin cậy về v1;
hàng v1 không bị sửa) rồi deploy lại commit ghim digest v1.

Hiện chưa có gia đình nào bật thinking-games, chưa có journey/attempt/entitlement, nên việc đổi phiên bản không ảnh hưởng dữ liệu người dùng.
