import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicInfoPage } from '@/components/PublicInfoPage';
import { getPublicPolicyConfig, publicPolicyVersion } from '@/lib/public-policy';

export function generateMetadata(): Metadata {
  const { approved } = getPublicPolicyConfig();
  return {
    title: 'Quyền riêng tư | KidHabit Hero',
    description: 'KidHabit Hero thu thập và sử dụng dữ liệu gia đình như thế nào, cùng các lựa chọn dành cho phụ huynh.',
    robots: { index: approved, follow: approved },
  };
}

export default function PrivacyPage() {
  const { approved } = getPublicPolicyConfig();
  return (
    <PublicInfoPage
      title="Quyền riêng tư của gia đình"
      description="Bản giải thích bằng ngôn ngữ dễ hiểu về dữ liệu KidHabit cần để vận hành ứng dụng. Đây không phải tuyên bố chứng nhận tuân thủ một chế độ pháp lý cụ thể."
      approved={approved}
    >
      <p className="text-sm font-semibold">Phiên bản nội dung: {publicPolicyVersion}</p>

      <section aria-labelledby="privacy-controller">
        <h2 id="privacy-controller">1. Ai quản lý dữ liệu của bé?</h2>
        <p>Người lớn đăng nhập và tạo gia đình là người quản lý hồ sơ của bé trong KidHabit. Trẻ chỉ truy cập hồ sơ đã được phụ huynh ghép với thiết bị. Không nên để trẻ tự gửi thông tin liên hệ hoặc thông tin thanh toán.</p>
      </section>

      <section aria-labelledby="privacy-data">
        <h2 id="privacy-data">2. Dữ liệu được lưu</h2>
        <ul>
          <li>Thông tin tài khoản phụ huynh: email từ đăng nhập, tên hiển thị, số điện thoại tùy chọn và lựa chọn nhận thông tin.</li>
          <li>Dữ liệu gia đình và hồ sơ bé: tên hoặc biệt danh, năm sinh, ảnh đại diện, màu hiển thị và thiết bị đã ghép.</li>
          <li>Nội dung sử dụng: thói quen, nhiệm vụ, tiến độ, điểm, phần thưởng, lời khen và nội dung nhật ký nếu gia đình bật tính năng đó.</li>
          <li>Dữ liệu gói sử dụng và giao dịch: gói, trạng thái kích hoạt, mã đơn, số tiền và trạng thái thanh toán. KidHabit không lưu khóa bí mật ngân hàng của người dùng.</li>
          <li>Lựa chọn đồng thuận và dữ liệu kỹ thuật tối thiểu để bảo vệ đăng nhập, ghép thiết bị, giới hạn lần thử và xử lý lỗi.</li>
        </ul>
      </section>

      <section aria-labelledby="privacy-purpose">
        <h2 id="privacy-purpose">3. Dữ liệu được dùng vào việc gì?</h2>
        <ul>
          <li>Đồng bộ trải nghiệm gia đình, hiển thị nhiệm vụ đúng cho từng bé và ghi nhận tiến độ.</li>
          <li>Ghép và thu hồi thiết bị của trẻ, bảo vệ khu vực phụ huynh và ngăn truy cập sai gia đình.</li>
          <li>Tạo đơn thanh toán, xác minh giao dịch và kích hoạt đúng gói.</li>
          <li>Gửi nội dung tiếp thị chỉ khi phụ huynh chủ động đồng ý. Lựa chọn này có thể thay đổi trong hồ sơ.</li>
          <li>Đo lường ẩn danh chỉ khi phụ huynh bật lựa chọn đo lường. Nội dung nhật ký của trẻ không được dùng cho đo lường.</li>
        </ul>
      </section>

      <section aria-labelledby="privacy-sharing">
        <h2 id="privacy-sharing">4. Dịch vụ hỗ trợ vận hành</h2>
        <p>KidHabit dùng nhà cung cấp đăng nhập, hạ tầng đồng bộ đám mây và cổng thanh toán để cung cấp dịch vụ. Mỗi dịch vụ chỉ nhận phần dữ liệu cần cho nhiệm vụ của họ. KidHabit không bán dữ liệu trẻ để quảng cáo nhắm mục tiêu.</p>
      </section>

      <section aria-labelledby="privacy-retention">
        <h2 id="privacy-retention">5. Lưu giữ và xóa</h2>
        <p>Dữ liệu gia đình được giữ trong khi gia đình còn hoạt động. Chủ gia đình có thể xóa vĩnh viễn hồ sơ bé, thói quen, tiến độ, phần thưởng và thiết bị đã ghép trong khu vực quản lý. KidHabit hiện chưa áp dụng thời hạn tự động xóa do không hoạt động. Bản ghi giao dịch tách khỏi nội dung của trẻ có thể được giữ để đối soát giao dịch; phụ huynh có thể hỏi phạm vi hiện tại qua trang <Link href="/contact">Liên hệ</Link>.</p>
      </section>

      <section aria-labelledby="privacy-rights">
        <h2 id="privacy-rights">6. Lựa chọn của phụ huynh</h2>
        <ul>
          <li>Xem và chỉnh sửa hồ sơ phụ huynh hoặc hồ sơ bé trong ứng dụng.</li>
          <li>Bật hoặc tắt đo lường ẩn danh, nhắc việc và nhận thông tin tiếp thị ở từng mục riêng.</li>
          <li>Xuất nhật ký của trẻ thành CSV khi tính năng nhật ký được bật; yêu cầu bản sao dữ liệu khác qua hỗ trợ.</li>
          <li>Thu hồi thiết bị đã ghép hoặc xóa toàn bộ dữ liệu gia đình bằng bước xác nhận dành cho chủ gia đình.</li>
        </ul>
      </section>

      <section aria-labelledby="privacy-contact">
        <h2 id="privacy-contact">7. Câu hỏi hoặc yêu cầu về dữ liệu</h2>
        <p>Dùng trang <Link href="/contact">Liên hệ</Link> và chọn chủ đề quyền riêng tư. Không gửi mã PIN phụ huynh, mã ghép thiết bị, nội dung nhật ký của trẻ hoặc thông tin ngân hàng trong yêu cầu hỗ trợ.</p>
      </section>
    </PublicInfoPage>
  );
}
