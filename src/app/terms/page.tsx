import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicInfoPage } from '@/components/PublicInfoPage';
import { getPublicPolicyConfig, publicPolicyVersion } from '@/lib/public-policy';

export function generateMetadata(): Metadata {
  const { approved } = getPublicPolicyConfig();
  return {
    title: 'Điều khoản sử dụng | KidHabit Hero',
    description: 'Điều kiện sử dụng, dùng thử và thanh toán của KidHabit Hero.',
    robots: { index: approved, follow: approved },
  };
}

export default function TermsPage() {
  const { approved } = getPublicPolicyConfig();
  return (
    <PublicInfoPage title="Điều khoản sử dụng" description="Các nguyên tắc cơ bản khi phụ huynh dùng KidHabit cho gia đình." approved={approved}>
      <p className="text-sm font-semibold">Phiên bản nội dung: {publicPolicyVersion}</p>

      <section><h2>1. Tài khoản phụ huynh</h2><p>Người tạo tài khoản cần là người lớn có quyền quản lý dữ liệu của bé. Phụ huynh chịu trách nhiệm bảo vệ tài khoản, mã PIN phụ huynh và các thiết bị đã ghép; hãy thu hồi ngay thiết bị bị mất hoặc không còn sử dụng.</p></section>

      <section><h2>2. Phạm vi dịch vụ</h2><p>KidHabit là công cụ giúp gia đình tổ chức thói quen, nhiệm vụ và phần thưởng. Nội dung trong ứng dụng không thay thế tư vấn y tế, tâm lý, giáo dục chuyên môn hoặc cam kết một kết quả phát triển cụ thể cho trẻ.</p></section>

      <section><h2>3. Dùng thử</h2><p>Mỗi gia đình đủ điều kiện có thể kích hoạt một lần dùng thử 7 ngày. Không cần thẻ tín dụng và KidHabit không tự động trừ tiền khi thời gian dùng thử kết thúc.</p></section>

      <section><h2>4. Gói trả phí và thanh toán</h2><ul><li>Gói Một Bé: 29.000 VNĐ cho một tháng và tối đa một hồ sơ bé.</li><li>Gói Gia Đình · Tháng: 49.000 VNĐ cho một tháng.</li><li>Gói Gia Đình · Năm: 399.000 VNĐ cho một năm.</li></ul><p>Giá, thời hạn và quyền lợi áp dụng cho đơn được hiển thị trước khi phụ huynh tạo mã thanh toán. Thanh toán hiện là khoản trả một lần cho kỳ đã chọn; ứng dụng không tự động gia hạn hoặc tự động ghi nợ kỳ tiếp theo.</p></section>

      <section><h2>5. Hủy và yêu cầu hoàn tiền</h2><p>Vì không có tự động gia hạn, phụ huynh không cần thao tác hủy để ngăn khoản thu kỳ sau. Ứng dụng chưa có nút hoàn tiền tự động. Nếu chuyển khoản nhầm, thanh toán trùng hoặc gói không được kích hoạt sau khi ngân hàng xác nhận, hãy gửi mã đơn và thời điểm giao dịch qua trang <Link href="/contact">Liên hệ</Link>. Yêu cầu sẽ được xác minh theo dữ liệu giao dịch và quyền bắt buộc theo quy định áp dụng; không gửi ảnh có đầy đủ số tài khoản hoặc dữ liệu của trẻ.</p></section>

      <section><h2>6. Hành vi không được phép</h2><ul><li>Truy cập dữ liệu của gia đình khác, chia sẻ phiên đăng nhập hoặc tìm cách vượt giới hạn bảo mật.</li><li>Dùng ứng dụng để quấy rối, làm nhục, ép buộc trẻ hoặc đăng nội dung xâm phạm quyền của người khác.</li><li>Can thiệp vào hệ thống thanh toán, giả mạo giao dịch, tự động gửi yêu cầu hoặc gây gián đoạn dịch vụ.</li></ul></section>

      <section><h2>7. Tạm dừng và thay đổi dịch vụ</h2><p>KidHabit có thể tạm dừng tính năng để bảo trì, xử lý sự cố hoặc bảo vệ gia đình. Khi thay đổi đáng kể nội dung điều khoản hoặc cách xử lý dữ liệu, phiên bản và ngày hiệu lực cần được cập nhật trước khi yêu cầu phụ huynh đồng ý lại.</p></section>

      <section><h2>8. Dữ liệu và chấm dứt sử dụng</h2><p>Chủ gia đình có thể xóa dữ liệu gia đình trong ứng dụng. Việc xóa là không thể khôi phục từ tài khoản người dùng. Xem thêm tại <Link href="/privacy">Quyền riêng tư</Link>.</p></section>
    </PublicInfoPage>
  );
}
