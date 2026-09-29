export const navigation = [
  { href: '/framework/', label: 'Khung thói quen' },
  { href: '/roadmaps/', label: 'Lộ trình' },
  { href: '/pricing/', label: 'Bảng giá' },
  { href: '/docs/', label: 'Hướng dẫn' },
];

export const outcomes = [
  {
    icon: 'compass',
    title: 'Biết nên rèn gì cho con',
    description: 'Chọn thói quen phù hợp với độ tuổi và mục tiêu của gia đình, không phải tự nghĩ mọi thứ từ đầu.',
  },
  {
    icon: 'list-checks',
    title: 'Giao việc rõ, con dễ làm',
    description: 'Mỗi nhiệm vụ có cách làm cụ thể để con hiểu, tự bắt đầu và bớt cần ba mẹ nhắc đi nhắc lại.',
  },
  {
    icon: 'trend-up',
    title: 'Thấy tiến bộ mỗi ngày',
    description: 'Cả nhà nhìn thấy chuỗi ngày, điểm thưởng và những bước nhỏ đang dần trở thành nếp tốt.',
  },
];

export const habitLoop = [
  {
    verb: 'Chọn cùng con',
    description: 'Ba mẹ chọn một thói quen vừa sức và nói rõ vì sao điều đó có ích.',
  },
  {
    verb: 'Con tự thực hiện',
    description: 'Con mở giao diện riêng, xem nhiệm vụ và đánh dấu khi đã hoàn thành.',
  },
  {
    verb: 'Cùng ghi nhận',
    description: 'Ba mẹ theo dõi tiến bộ, khen đúng lúc và đổi phần thưởng đã thống nhất.',
  },
];

export const plans = [
  {
    id: 'solo_monthly',
    name: 'Gói Cơ bản',
    label: 'Khởi đầu gọn nhẹ',
    price: '29.000',
    cadence: '/ tháng',
    summary: 'Dành cho gia đình bắt đầu cùng một bé.',
    features: ['1 hồ sơ bé', 'Khung thói quen theo độ tuổi', 'Nhiệm vụ, điểm và phần thưởng', 'Đồng bộ đám mây'],
    cta: 'Chọn gói Cơ bản',
  },
  {
    id: 'monthly',
    name: 'Gói Cao cấp',
    label: 'Linh hoạt theo tháng',
    price: '49.000',
    cadence: '/ tháng',
    summary: 'Phù hợp gia đình có nhiều bé hoặc muốn dùng trọn bộ tính năng.',
    features: ['Nhiều hồ sơ bé', 'Toàn bộ khung thói quen', 'Lộ trình tuần và tháng', 'Theo dõi tiến bộ gia đình'],
    cta: 'Chọn gói theo tháng',
    featured: true,
  },
  {
    id: 'yearly',
    name: 'Gói Cao cấp',
    label: 'Tiết kiệm nhất',
    price: '399.000',
    cadence: '/ năm',
    summary: 'Duy trì hành trình đủ lâu để những việc nhỏ trở thành nếp sống.',
    features: ['Đầy đủ quyền lợi Cao cấp', 'Nhiều hồ sơ bé', 'Thanh toán một lần cho 12 tháng', 'Không tự động gia hạn'],
    cta: 'Chọn gói theo năm',
  },
];

export const faqs = [
  {
    question: 'Tôi có cần nhập thẻ để dùng thử không?',
    answer: 'Không. Gia đình đủ điều kiện có thể trải nghiệm 7 ngày mà không cần thẻ và không bị tự động trừ tiền khi hết hạn.',
  },
  {
    question: 'Trẻ có dùng chung giao diện với phụ huynh không?',
    answer: 'Không. Trẻ có giao diện riêng chỉ tập trung vào nhiệm vụ, tiến độ và phần thưởng. Khu vực quản lý của phụ huynh được bảo vệ riêng.',
  },
  {
    question: 'Gói có tự động gia hạn không?',
    answer: 'Không. Mỗi lần thanh toán chỉ áp dụng cho kỳ đã chọn. Gia đình chủ động quyết định khi muốn tiếp tục.',
  },
  {
    question: 'Tôi có được hoàn tiền không?',
    answer: 'Có. Nếu chưa hài lòng, bạn có thể yêu cầu hoàn tiền trong 30 ngày kể từ ngày thanh toán bằng cách gửi mã đơn và thời điểm thanh toán tới email hỗ trợ.',
  },
  {
    question: 'Tôi có thể dùng trên nhiều thiết bị không?',
    answer: 'Có. Dữ liệu gia đình được đồng bộ đám mây để ba mẹ và con tiếp tục đúng hành trình trên thiết bị đã ghép.',
  },
];

export const publicPages = {
  framework: {
    title: 'Khung thói quen theo từng giai đoạn',
    description: 'Bắt đầu từ điều phù hợp với độ tuổi, hoàn cảnh và nhịp sống của chính gia đình bạn.',
    sections: [
      ['Không bắt đầu từ một danh sách dài', 'KidHabit giúp ba mẹ chọn một mục tiêu vừa sức, diễn giải rõ việc cần làm và tăng dần độ khó khi con đã sẵn sàng.'],
      ['Thói quen gắn với đời sống', 'Các gợi ý xoay quanh tự chăm sóc, học tập, vận động, kết nối gia đình và trách nhiệm phù hợp với từng giai đoạn.'],
      ['Ba mẹ vẫn là người quyết định', 'Khung gợi ý giúp tiết kiệm thời gian. Ba mẹ chọn, điều chỉnh hoặc tự tạo nhiệm vụ dựa trên nhu cầu thật của con.'],
    ],
  },
  roadmaps: {
    title: 'Lộ trình đủ nhỏ để bắt đầu',
    description: 'Một hành trình tốt không cần hoàn hảo. Nó cần rõ ràng, đều đặn và có sự ghi nhận.',
    sections: [
      ['Bắt đầu với một việc', 'Chọn một thói quen có thể hoàn thành trong vài phút và thống nhất cách ghi nhận với con.'],
      ['Duy trì nhịp đều', 'Theo dõi theo ngày, nhìn lại theo tuần và điều chỉnh khi nhiệm vụ quá dễ hoặc quá khó.'],
      ['Mở rộng khi đã vững', 'Khi con đã chủ động hơn, gia đình có thể thêm nhiệm vụ mới hoặc chuyển sang mục tiêu dài hơn.'],
    ],
  },
  docs: {
    title: 'Hướng dẫn sử dụng KidHabit',
    description: 'Những bước cơ bản để gia đình bắt đầu, ghép thiết bị và duy trì thói quen.',
    sections: [
      ['Tạo không gian gia đình', 'Đăng nhập bằng tài khoản phụ huynh, hoàn thiện thông tin và tạo hồ sơ cho từng bé.'],
      ['Thiết lập cho con', 'Chọn thói quen, tạo nhiệm vụ, đặt điểm và thống nhất phần thưởng trước khi bắt đầu.'],
      ['Ghép thiết bị của trẻ', 'Dùng mã QR cố định hoặc nhập mã thủ công trên thiết bị của con. Ba mẹ có thể làm mới mã trong trang quản lý.'],
      ['Theo dõi và khích lệ', 'Xem tiến độ, xác nhận khi cần và dùng lời khen cụ thể để giúp con hiểu điều mình đã làm tốt.'],
    ],
  },
  privacy: {
    title: 'Quyền riêng tư của gia đình',
    description: 'Thông tin dễ hiểu về dữ liệu KidHabit cần để vận hành ứng dụng.',
    sections: [
      ['Dữ liệu được lưu', 'KidHabit lưu thông tin tài khoản phụ huynh, hồ sơ gia đình, thói quen, tiến độ, phần thưởng, thiết bị đã ghép và trạng thái gói sử dụng.'],
      ['Mục đích sử dụng', 'Dữ liệu được dùng để đồng bộ trải nghiệm gia đình, hiển thị đúng nhiệm vụ, bảo vệ khu vực phụ huynh và xác minh thanh toán.'],
      ['Lựa chọn của phụ huynh', 'Phụ huynh có thể chỉnh sửa hồ sơ, thu hồi thiết bị đã ghép, thay đổi lựa chọn nhận thông tin hoặc xóa dữ liệu gia đình trong ứng dụng.'],
      ['Dịch vụ hỗ trợ vận hành', 'KidHabit dùng dịch vụ đăng nhập, đồng bộ đám mây và cổng thanh toán. KidHabit không bán dữ liệu trẻ để quảng cáo nhắm mục tiêu.'],
    ],
  },
  terms: {
    title: 'Điều khoản sử dụng',
    description: 'Các nguyên tắc cơ bản khi phụ huynh dùng KidHabit cho gia đình.',
    sections: [
      ['Tài khoản phụ huynh', 'Người tạo tài khoản cần là người lớn có quyền quản lý dữ liệu của bé và chịu trách nhiệm bảo vệ tài khoản, mã PIN cùng thiết bị đã ghép.'],
      ['Phạm vi dịch vụ', 'KidHabit giúp gia đình tổ chức thói quen, nhiệm vụ và phần thưởng. Ứng dụng không thay thế tư vấn y tế, tâm lý hoặc giáo dục chuyên môn.'],
      ['Dùng thử và thanh toán', 'Gia đình đủ điều kiện có thể dùng thử một lần trong 7 ngày. Không cần thẻ, không tự động trừ tiền và mỗi khoản thanh toán chỉ áp dụng cho kỳ đã chọn.'],
      ['Hoàn tiền trong 30 ngày', 'Nếu chưa hài lòng, bạn có thể yêu cầu hoàn tiền trong vòng 30 ngày kể từ ngày thanh toán. Hãy gửi mã đơn và thời điểm thanh toán qua trang Liên hệ. Yêu cầu được xác minh theo dữ liệu giao dịch. Không gửi ảnh có đầy đủ số tài khoản hoặc dữ liệu của trẻ.'],
      ['Dữ liệu và chấm dứt sử dụng', 'Chủ gia đình có thể xóa dữ liệu gia đình trong ứng dụng. Việc xóa là không thể khôi phục từ tài khoản người dùng.'],
    ],
  },
  contact: {
    title: 'Liên hệ hỗ trợ',
    description: 'Chuẩn bị đúng thông tin để đội ngũ hỗ trợ xử lý nhanh mà không thu thập dư thừa dữ liệu của trẻ.',
    sections: [
      ['Khi gặp lỗi', 'Gửi mã hỗ trợ, thời điểm và thao tác vừa thực hiện. Không gửi mật khẩu, mã PIN phụ huynh hoặc mã ghép thiết bị còn hiệu lực.'],
      ['Khi cần hỗ trợ thanh toán', 'Chỉ gửi mã đơn, gói đã chọn, số tiền và thời điểm. Hãy che số tài khoản không cần thiết trên ảnh xác nhận.'],
      ['Các chủ đề được hỗ trợ', 'KidHabit hỗ trợ đăng nhập, hồ sơ, thiết bị trẻ, kích hoạt gói, yêu cầu dữ liệu và báo cáo truy cập sai gia đình.'],
    ],
  },
};
