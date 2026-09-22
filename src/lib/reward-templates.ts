export type RewardTemplateKind = 'experience' | 'material';

export type RewardTemplate = Readonly<{
  id: string;
  kind: RewardTemplateKind;
  title: string;
  description: string;
  icon: string;
  costPoints: number;
}>;

export const MEANINGFUL_REWARD_TEMPLATES: readonly RewardTemplate[] = [
  { id: 'experience-parent-time', kind: 'experience', title: '30 phút riêng cùng ba hoặc mẹ', description: 'Con chọn một hoạt động và có trọn thời gian riêng, không điện thoại.', icon: '♥', costPoints: 40 },
  { id: 'experience-family-choice', kind: 'experience', title: 'Chọn hoạt động gia đình cuối tuần', description: 'Con chọn công viên, trò chơi hoặc chuyến đi gần để cả nhà cùng tham gia.', icon: '★', costPoints: 80 },
  { id: 'experience-meal-choice', kind: 'experience', title: 'Chọn món cho bữa cơm gia đình', description: 'Con chọn một món phù hợp và cùng người lớn chuẩn bị.', icon: '◇', costPoints: 35 },
  { id: 'experience-bedtime-story', kind: 'experience', title: 'Chọn truyện và người kể tối nay', description: 'Con chọn cuốn sách và người thân sẽ đọc cùng trước giờ ngủ.', icon: '□', costPoints: 25 },
  { id: 'experience-friend-visit', kind: 'experience', title: 'Mời một người bạn đến chơi', description: 'Gia đình hỗ trợ con chuẩn bị một buổi chơi có thời gian và quy tắc rõ ràng.', icon: '○', costPoints: 90 },
  { id: 'experience-family-chef', kind: 'experience', title: 'Làm đầu bếp cùng người lớn', description: 'Cùng chọn công thức, chuẩn bị và trình bày một món đơn giản.', icon: '+', costPoints: 60 },
  { id: 'experience-living-room-camp', kind: 'experience', title: 'Cắm trại trong phòng khách', description: 'Cả nhà dựng lều nhỏ, kể chuyện và ngủ cùng trong một tối đặc biệt.', icon: '△', costPoints: 100 },
  { id: 'experience-skill-session', kind: 'experience', title: 'Một buổi học kỹ năng con chọn', description: 'Người lớn dành thời gian dạy hoặc cùng học một kỹ năng con đang tò mò.', icon: '↑', costPoints: 70 },
  { id: 'experience-family-dj', kind: 'experience', title: 'Làm người chọn nhạc cho gia đình', description: 'Con tạo danh sách nhạc phù hợp cho một buổi sinh hoạt chung.', icon: '♫', costPoints: 30 },
  { id: 'experience-plan-a-day', kind: 'experience', title: 'Lập kế hoạch nửa ngày cho cả nhà', description: 'Con đề xuất lịch trình và ngân sách nhỏ, người lớn cùng góp ý để thực hiện.', icon: '✓', costPoints: 120 },
  { id: 'material-book', kind: 'material', title: 'Một cuốn sách con tự chọn', description: 'Ưu tiên sách đúng sở thích để nuôi dưỡng việc đọc lâu dài.', icon: '□', costPoints: 120 },
  { id: 'material-art-kit', kind: 'material', title: 'Bộ dụng cụ sáng tạo nhỏ', description: 'Giấy, màu hoặc vật liệu thủ công để con tạo ra một sản phẩm cụ thể.', icon: '✦', costPoints: 150 },
  { id: 'material-sports-item', kind: 'material', title: 'Dụng cụ vận động phù hợp', description: 'Bóng, dây nhảy hoặc dụng cụ hỗ trợ môn con đang luyện tập.', icon: '●', costPoints: 180 },
  { id: 'material-plant', kind: 'material', title: 'Cây hoặc bộ hạt giống để chăm sóc', description: 'Con nhận trách nhiệm chăm cây và theo dõi sự phát triển mỗi tuần.', icon: '♧', costPoints: 90 },
  { id: 'material-board-game', kind: 'material', title: 'Trò chơi bàn cho cả gia đình', description: 'Chọn trò khuyến khích hợp tác, tư duy và thời gian chơi cùng nhau.', icon: '▦', costPoints: 220 },
  { id: 'material-saving-kit', kind: 'material', title: 'Bộ phong bì tiết kiệm của con', description: 'Dùng cho các mục Cho đi, Chi tiêu, Tiết kiệm và Học tập.', icon: '▣', costPoints: 100 },
  { id: 'material-learning-tool', kind: 'material', title: 'Dụng cụ cho dự án học tập', description: 'Một vật dụng cần thiết để hoàn thành dự án con đã cam kết.', icon: '⌁', costPoints: 200 },
  { id: 'material-giving-budget', kind: 'material', title: 'Ngân sách nhỏ để con làm việc tốt', description: 'Con chọn cách dùng khoản này để giúp một người hoặc một hoạt động cộng đồng.', icon: '♥', costPoints: 160 },
] as const;
