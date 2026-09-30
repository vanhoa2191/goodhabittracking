import type { Cadence, ComplexityClass } from './types';

export type HabitTraits = {
  readonly complexity: ComplexityClass;
  readonly cadence: Cadence;
};

/**
 * How hard each framework habit is to make automatic and how often it comes round.
 * Draft classification awaiting the project owner's review; see the design spec, appendix A.
 * Framework cadences "daily" and "several times a week" both follow the habit's own schedule (`due-day`).
 */
export const FRAMEWORK_HABIT_TRAITS: Readonly<Record<string, HabitTraits>> = {
  'GD1-NT-01': { complexity: 'medium', cadence: 'due-day' }, // Vòng lặp phát–đáp
  'GD1-NT-02': { complexity: 'medium', cadence: 'due-day' }, // Nếp ngày êm và tự trấn an
  'GD1-SK-01': { complexity: 'medium', cadence: 'due-day' }, // Ngủ lành, ngủ đủ
  'GD1-SK-02': { complexity: 'simple', cadence: 'due-day' }, // Vận động thô và vui chơi
  'GD1-MQH-01': { complexity: 'simple', cadence: 'due-day' }, // Ba nghi thức lễ nền
  'GD1-MQH-02': { complexity: 'medium', cadence: 'due-day' }, // Sẻ chia và luân phiên
  'GD1-HT-01': { complexity: 'simple', cadence: 'due-day' }, // Ngôn ngữ sống và sách mỗi ngày
  'GD1-TC-01': { complexity: 'medium', cadence: 'due-day' }, // Trật tự và chờ đợi ngắn
  'GD2-NT-01': { complexity: 'medium', cadence: 'due-day' }, // Gọi tên cảm xúc và 3 nhịp thở
  'GD2-NT-02': { complexity: 'complex', cadence: 'due-day' }, // Nói thật và dũng cảm nhận lỗi
  'GD2-SK-01': { complexity: 'medium', cadence: 'due-day' }, // Ngủ đủ và nghi thức tắt màn hình
  'GD2-SK-02': { complexity: 'medium', cadence: 'due-day' }, // Vận động 180 phút và kỹ năng thể chất
  'GD2-MQH-01': { complexity: 'simple', cadence: 'due-day' }, // Bảy bố thí phiên bản mầm
  'GD2-MQH-02': { complexity: 'medium', cadence: 'due-day' }, // Xin phép, chọn bạn, hòa giải
  'GD2-HT-01': { complexity: 'medium', cadence: 'due-day' }, // Đọc, kể lại, hỏi "vì sao"
  'GD2-TC-01': { complexity: 'medium', cadence: 'weekly' }, // Ba lọ tiền đầu tiên
  'GD2-HT-02': { complexity: 'simple', cadence: 'due-day' }, // Việc nhà thuộc về con
  'GD3-NT-01': { complexity: 'medium', cadence: 'due-day' }, // Nhật ký biết ơn và lời khen tối
  'GD3-NT-02': { complexity: 'complex', cadence: 'due-day' }, // Tự đặt mục tiêu và giữ một thói quen
  'GD3-SK-01': { complexity: 'medium', cadence: 'due-day' }, // Ngủ 9–12 giờ, không màn hình
  'GD3-SK-02': { complexity: 'medium', cadence: 'due-day' }, // 60 phút vận động và một môn có chỉ số
  'GD3-MQH-01': { complexity: 'complex', cadence: 'due-day' }, // Giao tiếp thông thái
  'GD3-MQH-02': { complexity: 'complex', cadence: 'weekly' }, // Nhận diện 9 dạng người, giữ nhân duyên
  'GD3-HT-01': { complexity: 'complex', cadence: 'due-day' }, // Phương pháp học chủ động
  'GD3-HT-02': { complexity: 'medium', cadence: 'due-day' }, // Học sâu 25 phút và ngân hàng thời gian
  'GD3-TC-01': { complexity: 'medium', cadence: 'weekly' }, // Ngân sách 4 phong bì
  'GD3-TC-02': { complexity: 'complex', cadence: 'weekly' }, // Việc lớn hơn và kiếm tiền bằng giá trị
  'GD4-NT-01': { complexity: 'complex', cadence: 'due-day' }, // Nhật ký nhận thức
  'GD4-NT-02': { complexity: 'complex', cadence: 'due-day' }, // Luật sắt bản thân (cấp 1)
  'GD4-NT-03': { complexity: 'complex', cadence: 'due-day' }, // Tự điều hòa cảm xúc dưới áp lực
  'GD4-SK-01': { complexity: 'medium', cadence: 'due-day' }, // Ngủ 8–10 giờ, giờ ngủ trước 23h
  'GD4-SK-02': { complexity: 'complex', cadence: 'due-day' }, // Tập sức mạnh và dinh dưỡng cơ bản
  'GD4-MQH-01': { complexity: 'complex', cadence: 'weekly' }, // Dẫn dắt một nhóm nhỏ
  'GD4-MQH-02': { complexity: 'complex', cadence: 'due-day' }, // Xin lỗi, cảm ơn, phản hồi 3 lớp
  'GD4-HT-01': { complexity: 'complex', cadence: 'due-day' }, // Học tự chủ: kế hoạch, tự đánh giá
  'GD4-HT-02': { complexity: 'complex', cadence: 'due-day' }, // Đọc sâu, tranh luận hai phía
  'GD4-TC-01': { complexity: 'complex', cadence: 'weekly' }, // Tài chính teen: ghi chép, thu nhập đầu
  'GD5-NT-01': { complexity: 'complex', cadence: 'weekly' }, // Luật sắt bản thân (cấp 2)
  'GD5-NT-02': { complexity: 'complex', cadence: 'weekly' }, // Nhận thức sứ mệnh, ước mơ đủ lớn
  'GD5-NT-03': { complexity: 'complex', cadence: 'weekly' }, // Thấu hiểu nhân sinh, bố thí có chủ đích
  'GD5-SK-01': { complexity: 'complex', cadence: 'due-day' }, // Sức khỏe cấp vận động viên
  'GD5-SK-02': { complexity: 'complex', cadence: 'due-day' }, // Quản trị thân và hình thể
  'GD5-MQH-01': { complexity: 'complex', cadence: 'weekly' }, // Trở thành duyên lành
  'GD5-MQH-02': { complexity: 'complex', cadence: 'weekly' }, // Truyền thông cá nhân
  'GD5-HT-01': { complexity: 'complex', cadence: 'due-day' }, // Tự học chuyên sâu và sản phẩm tri thức
  'GD5-TC-01': { complexity: 'complex', cadence: 'weekly' }, // Quản trị tài chính cá nhân
  'GD5-HT-03': { complexity: 'complex', cadence: 'weekly' }, // Lộ trình nghề ước mơ
};

/** Habits the family made themselves are treated as medium and follow their own schedule. */
export const DEFAULT_HABIT_TRAITS: HabitTraits = { complexity: 'medium', cadence: 'due-day' };

export function habitTraits(frameworkHabitId: string | undefined): HabitTraits {
  return (frameworkHabitId && FRAMEWORK_HABIT_TRAITS[frameworkHabitId]) || DEFAULT_HABIT_TRAITS;
}
