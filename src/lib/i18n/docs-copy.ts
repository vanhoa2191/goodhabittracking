import type { Language } from '@/types';

const vi = [
  ['bat-dau', 'Bắt đầu nhanh', 'Khách mới thấy trang giới thiệu để chọn cách bắt đầu. Phụ huynh đã đăng nhập sẽ vào thẳng bảng quản lý; muốn xem lại trang giới thiệu, chọn Trang chủ. Tạo hồ sơ cho bé rồi chọn vài nhiệm vụ vừa sức. Bắt đầu ít, duy trì đều.'],
  ['ho-so', 'Hồ sơ và thói quen', 'Trong Thiết kế > Quản lý việc, xem các việc Đang dùng hoặc chọn thêm từ Thư viện. Có thể giao việc chung hay riêng cho từng bé, đặt số sao, thời gian và yêu cầu xác nhận. Hồ sơ từng bé nằm ở Gia đình > Hồ sơ các con.'],
  ['ket-noi', 'Kết nối thiết bị của bé', 'Mở mã QR tại Gia đình > Hồ sơ các con. Trên máy của bé, chọn Quét QR hoặc nhập mã thủ công. Sau khi ghép, thiết bị này vào thẳng giao diện trẻ khi mở lại; không hiện bảng phụ huynh hay trang giới thiệu. Chỉ làm mới mã khi nghi ngờ mã đã bị lộ.'],
  ['linh-vat', 'Linh vật và màu sắc', 'Bé có thể chọn linh vật trên màn hình của mình. Sau mỗi lần chọn, cần chờ đủ 7 ngày mới đổi sang linh vật khác; màn hình sẽ cho biết khi nào đổi tiếp được. Màu sắc có thể đổi bất cứ lúc nào. Nút loa trên màn hình của bé cho phép tắt âm thanh; từ 20:00 đến trước 07:00, âm lượng tự giảm một nửa.'],
  ['thu-buoi-sang', 'Thư buổi sáng', 'Từ 07:00 theo giờ thiết bị, bé có một lá thư mới từ linh vật mỗi ngày. Bé chạm “Mình đã đọc” để ghi nhận; thư vẫn ở đó để xem lại trong ngày. Gia đình đã đồng bộ sẽ thấy trạng thái đã đọc trên thiết bị khác của bé.'],
  ['hoan-thanh', 'Hoàn thành và xác nhận', 'Bé chạm vào nhiệm vụ để đọc ý nghĩa và cách làm, sau đó chạm dấu tròn khi hoàn thành. Việc cần xác nhận sẽ chờ phụ huynh duyệt.'],
  ['phan-thuong', 'Sao và phần thưởng', 'Mỗi nhiệm vụ hoàn thành mang lại số sao đã đặt. Trong mục Đổi quà, bé chạm biểu tượng mục tiêu trên một phần thưởng để theo dõi số sao cần tích lũy. Mục tiêu được lưu cho bé; xin đổi quà là thao tác riêng và phụ huynh là người xác nhận.'],
  ['thanh-toan', 'Thanh toán và kích hoạt', 'Kiểm tra chủ tài khoản, số tài khoản, số tiền và nội dung chuyển khoản. Quét QR hoặc mở trang thanh toán bảo mật. Gói được kích hoạt sau khi xác nhận.'],
  ['dong-bo', 'Đồng bộ, sao lưu và thiết bị', 'Đăng nhập để dùng dữ liệu trên nhiều thiết bị. Bạn cũng có thể tải bản sao lưu và thu hồi thiết bị không còn sử dụng.'],
  ['tro-giup', 'Khắc phục sự cố và FAQ', 'Nếu camera không mở, hãy cấp quyền camera, dùng kết nối an toàn hoặc nhập mã thủ công. Nếu thanh toán đang chờ, đừng thanh toán lại ngay.'],
] as const;
const en = [
  ['quick-start', 'Quick start', 'New visitors see the introduction and choose how to begin. Signed-in parents go straight to the parent dashboard; select Home to revisit the introduction. Create a child profile, then choose a few manageable tasks. Start small and stay consistent.'],
  ['profiles', 'Profiles and habits', 'Under Design > Habits, see tasks In use or choose more from the Library. Assign tasks to all children or one child, set stars, duration, and approval requirements. Child profiles are under Family > Children.'],
  ['connect', 'Connect a child device', 'Open the QR under Family > Children. On the child device, scan it or enter the code manually. Once paired, that device opens directly in the child view, without parent or sales navigation. Refresh the code only if it may have been exposed.'],
  ['mascot', 'Mascot and color', 'Children can choose a mascot on their own screen. After a choice, wait seven full days before changing to a different mascot; the screen shows the next available time. Colors can be changed anytime. The sound button on the child screen can mute effects; volume is halved from 20:00 until 07:00 local time.'],
  ['morning-letter', 'Morning letter', 'From 07:00 device time, each child gets one new letter from their mascot each day. Tap “I have read it” to record reading; the letter stays available to reread that day. Synced families can see the read state on another child device.'],
  ['complete', 'Complete and approve', 'Open a task to read its purpose and steps, then mark it complete. Tasks requiring approval wait for a parent.'],
  ['rewards', 'Stars and rewards', 'Completed tasks earn stars. In Rewards, children can select a gift as their savings goal and track the stars needed. The goal is saved for the child; requesting a reward is separate and parents confirm it.'],
  ['payment', 'Payment and activation', 'Check account holder, account number, amount, and memo. Scan the QR or open secure checkout. Activation follows verification.'],
  ['sync', 'Sync, backup, and devices', 'Sign in to use family data across devices. You can export a backup and revoke unused devices.'],
  ['help', 'Troubleshooting and FAQ', 'If camera scanning is unavailable, grant permission, use a secure connection, or enter the code manually.'],
] as const;
export function getDocsCopy(language: Language) { return language === 'vi' ? { title: 'Tài liệu sử dụng KidHabit', intro: 'Hướng dẫn ngắn gọn cho phụ huynh và bé.', back: 'Quay lại ứng dụng', sections: vi } : { title: 'KidHabit user guide', intro: 'A concise guide for parents and children.', back: 'Back to the app', sections: en }; }
