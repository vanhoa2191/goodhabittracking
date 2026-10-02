export const navigation = [
  { href: '/framework/', label: 'Khung thói quen', anchor: '#chan-dung' },
  { href: '/science/', label: 'Cơ sở khoa học' },
  { href: '/roadmaps/', label: 'Lộ trình' },
  { href: '/pricing/', label: 'Bảng giá', anchor: '#bang-gia' },
  { href: '/blog/', label: 'Blog' },
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
    description: 'Mỗi nhiệm vụ có cách làm cụ thể, để con dễ hiểu việc cần làm và ba mẹ đỡ phải giải thích lại.',
  },
  {
    icon: 'trend-up',
    title: 'Xem lại những việc con đã làm',
    description: 'Cả nhà xem được chuỗi ngày, điểm thưởng và những việc nhỏ con đã hoàn thành.',
  },
];

export const plans = [
  {
    id: 'solo_monthly',
    amount: 29000,
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
    amount: 49000,
    period: 'Tháng',
    name: 'Gói Cao cấp',
    label: 'Linh hoạt theo tháng',
    price: '49.000',
    cadence: '/ tháng',
    summary: 'Phù hợp gia đình có nhiều bé hoặc muốn dùng trọn bộ tính năng.',
    features: ['Nhiều hồ sơ bé', 'Toàn bộ khung thói quen', 'Lộ trình theo độ tuổi', 'Theo dõi tiến bộ gia đình'],
    cta: 'Chọn gói theo tháng',
  },
  {
    id: 'yearly',
    amount: 399000,
    period: 'Năm',
    name: 'Gói Cao cấp',
    label: 'Tiết kiệm nhất',
    price: '399.000',
    cadence: '/ năm',
    summary: 'Duy trì hành trình đủ lâu để những việc nhỏ trở thành nếp sống.',
    features: ['Đầy đủ quyền lợi Cao cấp', 'Nhiều hồ sơ bé', 'Thanh toán một lần cho 12 tháng', 'Không tự động gia hạn'],
    cta: 'Chọn gói theo năm',
    featured: true,
  },
];

export const mascots = [
  { id: 'leo', name: 'Leo', species: 'sư tử', trait: 'Tập dũng cảm từ việc nhỏ' },
  { id: 'bunny', name: 'Bunny', species: 'thỏ', trait: 'Biết quan tâm mọi người' },
  { id: 'panda', name: 'Panda', species: 'gấu trúc', trait: 'Bình tĩnh để nhìn rõ hơn' },
  { id: 'fox', name: 'Fox', species: 'cáo', trait: 'Tò mò trước điều mới' },
  { id: 'turtle', name: 'Turtle', species: 'rùa', trait: 'Kiên nhẫn đi cùng bé' },
  { id: 'bee', name: 'Bee', species: 'ong', trait: 'Vui khi cả nhà giúp nhau' },
];

export const trustPoints = ['7 ngày dùng thử', 'Không cần thẻ', 'Hoàn tiền 30 ngày'];

export const comparison = {
  beforeTitle: 'Khi chỉ dựa vào nhắc nhở',
  before: [
    '7 giờ sáng: giục dậy, nhắc đánh răng, nhắc soạn cặp, rồi nhắc lại lần nữa.',
    '9 giờ tối: nhắc dọn đồ, nhắc học bài. Con né tránh, ba mẹ mệt và căng thẳng.',
    'Con làm vì bị nhắc, chưa hiểu vì sao nên làm.',
  ],
  afterTitle: 'Với KidHabit',
  after: [
    '7 giờ sáng: con mở danh sách việc hôm nay, đọc cách làm và tự đánh dấu từng việc.',
    '9 giờ tối: ba mẹ duyệt những việc con đã làm và khen đúng việc.',
    'Cuối ngày, cả nhà nhìn lại những điều con đã làm tốt.',
  ],
};

export const steps = [
  {
    image: 'parent-roadmap',
    alt: 'Màn hình phụ huynh chọn lộ trình theo độ tuổi: các giai đoạn 0–3, 3–6, 6–12, 12–15, 15–18 và vai trò của ba mẹ ở từng giai đoạn',
    caption: 'Chọn giai đoạn tuổi để thấy thói quen phù hợp và vai trò của ba mẹ.',
    bullets: ['Khung 47 thói quen, chia 5 giai đoạn từ 0 đến 18 tuổi', 'Mỗi thói quen có lời giải thích “vì sao” cho con và hướng dẫn cho ba mẹ', 'Ba mẹ chọn, sửa hoặc tự tạo nhiệm vụ'],
  },
  {
    image: 'kid-tasks',
    alt: 'Danh sách nhiệm vụ buổi sáng của bé trong KidHabit, có việc đã hoàn thành và số sao thưởng',
    caption: 'Mỗi việc có hướng dẫn rõ ràng và số sao thưởng. Ảnh là màn hình của bé.',
    bullets: ['Giao diện riêng cho bé, tự đổi theo ba dải tuổi: 3–8, 9–12 và từ 13 tuổi', 'Bé vào bằng mã QR hoặc mã nhập tay, không cần tài khoản riêng', 'Vuốt hoặc chạm để hoàn thành, có đồng hồ đếm giờ khi việc cần thời gian'],
  },
  {
    image: 'parent-approvals',
    alt: 'Màn hình phụ huynh có nhiệm vụ chờ bố mẹ duyệt với nút Duyệt và Từ chối',
    caption: 'Việc quan trọng chờ ba mẹ duyệt trước khi bé nhận sao.',
    bullets: ['Duyệt hoặc từ chối chỉ với một chạm', 'Xem chuỗi ngày, sao và huy hiệu của từng bé; đổi quà theo danh sách ba mẹ đã thống nhất', 'Gói Cao cấp: nhiều hồ sơ bé và mời người thân cùng theo dõi'],
  },
];

export const safetyPoints = [
  { icon: 'lock', title: 'Khu vực phụ huynh có mã PIN', text: 'Thanh toán và cài đặt gia đình nằm ngoài tầm với của bé.' },
  { icon: 'shield', title: 'Mỗi gia đình một không gian riêng', text: 'Dữ liệu được tách biệt, gia đình này không xem được gia đình khác.' },
  { icon: 'eye-off', title: 'Chia sẻ công khai mặc định tắt', text: 'Bảng xếp hạng công khai chỉ hiện bé khi ba mẹ bật và bé tham gia, bằng biệt danh. Tên thật và tuổi không bao giờ hiện.' },
  { icon: 'trash', title: 'Ba mẹ quyết định giữ hay xóa', text: 'Chủ gia đình có thể xóa toàn bộ dữ liệu gia đình trong ứng dụng.' },
];

// Only real, consented quotes belong here. An entry is shown when it has a
// quote, a name, recorded consent, a source and a review date still in the future.
export const testimonials = [];

export const faqs = [
  {
    question: 'Con bao nhiêu tuổi thì phù hợp?',
    answer: 'KidHabit phù hợp nhất với bé 4–12 tuổi tự xem việc và tự đánh dấu xong. Khung thói quen đi từ 0 đến 18 tuổi: với bé nhỏ, ba mẹ làm cùng; với bé lớn hơn, con chủ động hơn.',
  },
  {
    question: 'Tôi có cần nhập thẻ để dùng thử không?',
    answer: 'Không. Mỗi gia đình dùng thử 7 ngày một lần, không cần thẻ và không bị tự động trừ tiền khi hết hạn.',
  },
  {
    question: 'Hết 7 ngày dùng thử thì sao?',
    answer: 'Ba mẹ chọn một gói để tiếp tục ghi nhận việc của con. KidHabit không tự động trừ tiền.',
  },
  {
    question: 'KidHabit có thay thế việc ba mẹ dạy con không?',
    answer: 'Không. KidHabit là công cụ đồng hành: ba mẹ chọn thói quen, duyệt và khen. Ứng dụng không thay việc dạy con và không cam kết một kết quả phát triển cụ thể.',
  },
  {
    question: 'Giao diện của bé có đổi theo tuổi không?',
    answer: 'Có. Kích thước nút, cách khen và nhãn phần thưởng đổi theo ba dải tuổi: 3–8, 9–12 và từ 13 tuổi. Từ 13 tuổi, bạn tự chọn kiểu gọn hoặc có bạn đồng hành. Ba mẹ có thể ghim một dải cho từng bé hoặc giữ giao diện cũ. Bé dưới 3 tuổi, hoặc chưa có năm sinh, vẫn dùng giao diện mặc định.',
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
    question: 'Con có cần tài khoản riêng không?',
    answer: 'Không. Con vào bằng mã QR hoặc mã nhập tay do ba mẹ cấp và chỉ thấy hồ sơ của chính mình.',
  },
  {
    question: 'Có cần cài ứng dụng không?',
    answer: 'KidHabit chạy ngay trên trình duyệt điện thoại hoặc máy tính. Bạn có thể thêm vào màn hình chính để mở nhanh như một ứng dụng.',
  },
  {
    question: 'Tôi có thể dùng trên nhiều thiết bị không?',
    answer: 'Có. Dữ liệu gia đình được đồng bộ đám mây để ba mẹ và con tiếp tục đúng hành trình trên thiết bị đã ghép.',
  },
];

export const publicPages = {
  framework: {
    eyebrow: 'Khung nội dung',
    mascot: 'panda',
    icons: ['list-checks', 'book', 'users'],
    title: 'Khung thói quen theo từng giai đoạn',
    description: 'Khung thói quen KidHabit gợi ý những việc nhỏ theo từng giai đoạn tuổi, để ba mẹ bắt đầu từ điều vừa sức thay vì một danh sách dài.',
    sections: [
      ['Không bắt đầu từ một danh sách dài', 'KidHabit giúp ba mẹ chọn một mục tiêu vừa sức, diễn giải rõ việc cần làm và tăng dần độ khó khi con đã sẵn sàng.'],
      ['Thói quen gắn với đời sống', 'Các gợi ý xoay quanh tự chăm sóc, học tập, vận động, kết nối gia đình và trách nhiệm phù hợp với từng giai đoạn.'],
      ['Ba mẹ vẫn là người quyết định', 'Khung gợi ý giúp tiết kiệm thời gian. Ba mẹ chọn, điều chỉnh hoặc tự tạo nhiệm vụ dựa trên nhu cầu thật của con.'],
    ],
  },
  science: {
    eyebrow: 'Cơ sở khoa học',
    title: 'Xây thói quen cho trẻ: điều đã biết và điều chưa biết',
    lede: 'KidHabit dựa trên nghiên cứu về hình thành thói quen để gợi ý cách đồng hành cùng con. Trang này nói rõ bằng chứng đến đâu và giới hạn ở đâu.',
    description: 'Những điều nghiên cứu về thói quen cho biết, những điều chưa biết, và cách KidHabit dùng chúng một cách thận trọng.',
    disclaimer: 'KidHabit là công cụ đồng hành cho gia đình. Chúng tôi không hứa kết quả cho từng em bé và không thay thế tư vấn của bác sĩ, nhà tâm lý hay chuyên gia giáo dục.',
  },
  roadmaps: {
    eyebrow: 'Lộ trình',
    mascot: 'fox',
    icons: ['check', 'clock', 'trend-up'],
    title: 'Lộ trình đủ nhỏ để bắt đầu',
    description: 'Lộ trình ba bước để xây thói quen cho con: bắt đầu với một việc, giữ nhịp đều rồi mở rộng khi con đã vững, cùng cách ghi nhận phù hợp.',
    sections: [
      ['Bắt đầu với một việc', 'Chọn một thói quen có thể hoàn thành trong vài phút và thống nhất cách ghi nhận với con.'],
      ['Duy trì nhịp đều', 'Theo dõi theo ngày, nhìn lại theo tuần và điều chỉnh khi nhiệm vụ quá dễ hoặc quá khó.'],
      ['Mở rộng khi đã vững', 'Khi con đã chủ động hơn, gia đình có thể thêm nhiệm vụ mới hoặc chuyển sang mục tiêu dài hơn.'],
    ],
  },
  docs: {
    eyebrow: 'Hướng dẫn',
    mascot: 'bee',
    layout: 'steps',
    title: 'Hướng dẫn sử dụng KidHabit',
    description: 'Hướng dẫn từng bước dùng KidHabit: tạo không gian gia đình, thiết lập thói quen, ghép thiết bị của bé và theo dõi tiến độ mỗi ngày.',
    sections: [
      ['Tạo không gian gia đình', 'Đăng nhập bằng tài khoản phụ huynh, hoàn thiện thông tin và tạo hồ sơ cho từng bé.'],
      ['Thiết lập cho con', 'Chọn thói quen, tạo nhiệm vụ, đặt điểm và thống nhất phần thưởng trước khi bắt đầu.'],
      ['Ghép thiết bị của trẻ', 'Dùng mã QR cố định hoặc nhập mã thủ công trên thiết bị của con. Ba mẹ có thể làm mới mã trong trang quản lý.'],
      ['Theo dõi và khích lệ', 'Xem tiến độ, xác nhận khi cần và dùng lời khen cụ thể để giúp con hiểu điều mình đã làm tốt.'],
    ],
  },
  contact: {
    eyebrow: 'Hỗ trợ',
    mascot: 'bunny',
    icons: ['alert', 'gift', 'shield'],
    title: 'Liên hệ hỗ trợ',
    description: 'Cách liên hệ hỗ trợ KidHabit nhanh và an toàn: cần gửi thông tin gì khi gặp lỗi hoặc cần hỗ trợ thanh toán, và điều gì không nên gửi.',
    sections: [
      ['Khi gặp lỗi', 'Gửi mã hỗ trợ, thời điểm và thao tác vừa thực hiện. Không gửi mật khẩu, mã PIN phụ huynh hoặc mã ghép thiết bị còn hiệu lực.'],
      ['Khi cần hỗ trợ thanh toán', 'Chỉ gửi mã đơn, gói đã chọn, số tiền và thời điểm. Hãy che số tài khoản không cần thiết trên ảnh xác nhận.'],
      ['Các chủ đề được hỗ trợ', 'KidHabit hỗ trợ đăng nhập, hồ sơ, thiết bị trẻ, kích hoạt gói, yêu cầu dữ liệu và báo cáo truy cập sai gia đình.'],
    ],
  },
};
