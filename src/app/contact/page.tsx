import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, ShieldAlert } from 'lucide-react';
import { PublicInfoPage } from '@/components/PublicInfoPage';
import { getPublicPolicyConfig } from '@/lib/public-policy';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const { approved } = getPublicPolicyConfig();
  return {
    title: 'Liên hệ hỗ trợ | KidHabit Hero',
    description: 'Cách gửi yêu cầu hỗ trợ tài khoản, thanh toán và quyền riêng tư cho KidHabit Hero.',
    robots: { index: approved, follow: approved },
  };
}

export default function ContactPage() {
  const { approved, supportEmail } = getPublicPolicyConfig();
  const subject = encodeURIComponent('[KidHabit] Yêu cầu hỗ trợ');
  return (
    <PublicInfoPage title="Liên hệ hỗ trợ" description="Chọn đúng thông tin cần gửi để đội ngũ hỗ trợ xử lý mà không thu thập dư thừa dữ liệu của trẻ." approved={approved}>
      <section><h2>Trước khi liên hệ</h2><ul><li>Tra cứu cách đăng nhập, ghép thiết bị, nhiệm vụ và phần thưởng trong <Link href="/docs">Tài liệu sử dụng</Link>.</li><li>Với lỗi có “Mã hỗ trợ”, hãy gửi mã đó cùng thời điểm và thao tác vừa thực hiện.</li><li>Với thanh toán, chỉ gửi mã đơn, gói đã chọn, số tiền và thời điểm. Che số tài khoản không cần thiết trên ảnh xác nhận.</li></ul></section>

      <section aria-labelledby="contact-channel"><h2 id="contact-channel">Kênh hỗ trợ</h2>{supportEmail ? <a href={`mailto:${supportEmail}?subject=${subject}`} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold !text-white !no-underline hover:bg-indigo-700"><Mail aria-hidden="true" className="h-5 w-5" /> Gửi email tới {supportEmail}</a> : <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Kênh email chính thức chưa được chủ sản phẩm cấu hình. Trang này sẽ không được đưa vào điều hướng công khai cho tới khi có địa chỉ hỗ trợ đã duyệt.</p>}<p className="mt-3 text-sm">KidHabit không mở form gửi ẩn danh trực tiếp vào hệ thống ở giai đoạn này, nhằm giảm spam và tránh thu thập dữ liệu trẻ không cần thiết.</p></section>

      <section><h2>Nội dung không được gửi</h2><p className="flex items-start gap-2"><ShieldAlert aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-rose-600" />Không gửi mật khẩu, mã PIN phụ huynh, mã ghép thiết bị còn hiệu lực, khóa bí mật, toàn bộ số tài khoản ngân hàng hoặc nội dung nhật ký riêng tư của trẻ.</p></section>

      <section><h2>Chủ đề được hỗ trợ</h2><ul><li>Đăng nhập, hồ sơ và thiết bị của trẻ.</li><li>Đơn thanh toán, kích hoạt gói hoặc giao dịch trùng.</li><li>Yêu cầu bản sao, chỉnh sửa hoặc xóa dữ liệu.</li><li>Báo cáo vấn đề an toàn hoặc truy cập sai gia đình.</li></ul><p>Chưa có thời gian phản hồi cam kết công khai. Sự cố nghi ngờ lộ dữ liệu hoặc truy cập sai gia đình được ưu tiên xử lý trước.</p></section>
    </PublicInfoPage>
  );
}
