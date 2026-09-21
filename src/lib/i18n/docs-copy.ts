import type { Language } from '@/types';

const vi = [
  ['bat-dau', 'Bắt đầu nhanh', 'Đăng nhập hoặc thiết lập trên thiết bị này, tạo hồ sơ cho bé rồi chọn vài nhiệm vụ vừa sức. Bắt đầu ít, duy trì đều.'],
  ['ho-so', 'Hồ sơ và thói quen', 'Phụ huynh có thể thêm từng bé, giao việc chung hoặc riêng, đặt số sao, thời gian và yêu cầu xác nhận.'],
  ['ket-noi', 'Kết nối thiết bị của bé', 'Mở mã QR trong trang quản lý của phụ huynh. Trên máy của bé, chọn Quét QR hoặc nhập mã thủ công. Chỉ làm mới mã khi nghi ngờ mã đã bị lộ.'],
  ['hoan-thanh', 'Hoàn thành và xác nhận', 'Bé chạm vào nhiệm vụ để đọc ý nghĩa và cách làm, sau đó chạm dấu tròn khi hoàn thành. Việc cần xác nhận sẽ chờ phụ huynh duyệt.'],
  ['phan-thuong', 'Sao và phần thưởng', 'Mỗi nhiệm vụ hoàn thành mang lại số sao đã đặt. Bé có thể dùng sao để xin đổi phần thưởng; phụ huynh là người xác nhận.'],
  ['thanh-toan', 'Thanh toán và kích hoạt', 'Kiểm tra chủ tài khoản, số tài khoản, số tiền và nội dung chuyển khoản. Quét QR hoặc mở trang thanh toán bảo mật. Gói được kích hoạt sau khi xác nhận.'],
  ['dong-bo', 'Đồng bộ, sao lưu và thiết bị', 'Đăng nhập để dùng dữ liệu trên nhiều thiết bị. Bạn cũng có thể tải bản sao lưu và thu hồi thiết bị không còn sử dụng.'],
  ['tro-giup', 'Khắc phục sự cố và FAQ', 'Nếu camera không mở, hãy cấp quyền camera, dùng kết nối an toàn hoặc nhập mã thủ công. Nếu thanh toán đang chờ, đừng thanh toán lại ngay.'],
] as const;
const en = [
  ['quick-start', 'Quick start', 'Sign in or set up this device, create a child profile, then choose a few manageable tasks. Start small and stay consistent.'],
  ['profiles', 'Profiles and habits', 'Parents can add children, assign tasks, set stars, duration, and approval requirements.'],
  ['connect', 'Connect a child device', 'Open the parent QR. On the child device, scan it or enter the code manually. Refresh only if it may have been exposed.'],
  ['complete', 'Complete and approve', 'Open a task to read its purpose and steps, then mark it complete. Tasks requiring approval wait for a parent.'],
  ['rewards', 'Stars and rewards', 'Completed tasks earn stars. Children can request a reward and parents confirm it.'],
  ['payment', 'Payment and activation', 'Check account holder, account number, amount, and memo. Scan the QR or open secure checkout. Activation follows verification.'],
  ['sync', 'Sync, backup, and devices', 'Sign in to use family data across devices. You can export a backup and revoke unused devices.'],
  ['help', 'Troubleshooting and FAQ', 'If camera scanning is unavailable, grant permission, use a secure connection, or enter the code manually.'],
] as const;
export function getDocsCopy(language: Language) { return language === 'vi' ? { title: 'Tài liệu sử dụng KidHabit', intro: 'Hướng dẫn ngắn gọn cho phụ huynh và bé.', back: 'Quay lại ứng dụng', sections: vi } : { title: 'KidHabit user guide', intro: 'A concise guide for parents and children.', back: 'Back to the app', sections: en }; }
