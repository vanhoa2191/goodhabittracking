import { PricingPlan, SubscriptionPlan } from '@/types';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gói Miễn Phí',
    badge: 'STARTER',
    price: 0,
    periodLabel: 'Vĩnh viễn',
    description: 'Bắt đầu thói quen nền tảng cho 1 bé, lưu trên thiết bị',
    features: [
      'Quản lý tối đa 1 bé',
      'Thói quen hàng ngày cơ bản',
      'Đổi quà & Tích điểm thưởng',
      'Lưu trữ cục bộ an toàn trên máy',
    ],
    ctaText: 'Đang sử dụng',
  },
  {
    id: 'trial',
    name: 'Dùng Thử 7 Ngày',
    badge: '🎁 MIỄN PHÍ 0Đ',
    price: 0,
    periodLabel: '7 ngày Pro',
    description: 'Mở khóa trọn bộ tính năng Pro, không cần thẻ tín dụng',
    features: [
      'Không giới hạn số lượng bé',
      'Mở khóa trọn bộ 50+ thói quen & 7 Bố thí',
      'Lộ trình 4 tuần & 12 tháng chuyên sâu',
      'Đồng bộ Cloud Supabase đa thiết bị',
      'Bảng xếp hạng & Thử thách nhóm',
      'Không tự động trừ tiền khi hết hạn',
    ],
    ctaText: 'Kích hoạt 7 ngày dùng thử',
  },
  {
    id: 'monthly',
    name: 'Gói Siêu Nhân',
    badge: 'LINH HOẠT',
    price: 49000,
    periodLabel: '/ tháng',
    dailyEquivalent: '~1.600đ / ngày',
    description: 'Chỉ bằng 1/2 ly trà sữa, tạo dựng nếp sống vững chắc cho con',
    features: [
      'Không giới hạn số lượng bé',
      'Đồng bộ tức thì Cloud Supabase đa thiết bị',
      'Mở khóa toàn bộ Thư viện thói quen & Lộ trình',
      'Báo cáo phân tích chuyên sâu hàng tuần',
      'Bảng xếp hạng thi đua gia đình & liên minh',
      'Hỗ trợ kỹ thuật nhanh chóng',
    ],
    ctaText: 'Nâng cấp Gói Tháng (49k)',
  },
  {
    id: 'yearly',
    name: 'Gói Đồng Hành',
    badge: '👑 KHUYÊN DÙNG • TIẾT KIỆM 35%',
    popular: true,
    price: 399000,
    originalPrice: 588000,
    savings: 'Tiết kiệm 35%',
    periodLabel: '/ năm',
    dailyEquivalent: '~33.000đ / tháng (~1.100đ/ngày)',
    description: 'Lựa chọn tốt nhất và kinh tế nhất cho cả năm rèn luyện nếp sống',
    features: [
      'Tất cả quyền lợi của Gói Siêu Nhân',
      'Quản lý không giới hạn số bé',
      'Tặng Ebook: Cẩm nang nuôi dạy con & 7 Bố thí',
      'Quyền ưu tiên tham gia giải đấu mùa hè',
      'Hỗ trợ ưu tiên 1-1 qua Zalo từ chuyên gia',
      'Tiết kiệm 189.000đ so với trả từng tháng',
    ],
    ctaText: 'Chọn Gói Năm (399k - Khuyên Dùng)',
  },
  {
    id: 'lifetime',
    name: 'Gói Trọn Đời',
    badge: '💎 HERO VIP TRỌN ĐỜI',
    price: 799000,
    originalPrice: 1500000,
    savings: 'Tiết kiệm 50%',
    periodLabel: 'Trọn đời',
    description: 'Đầu tư 1 lần duy nhất, con và cả gia đình sử dụng mãi mãi',
    features: [
      'Sở hữu vĩnh viễn toàn bộ tính năng Pro',
      'Không bao giờ phải gia hạn thêm bất kỳ khoản phí nào',
      'Cập nhật miễn phí mọi tính năng mới trong tương lai',
      'Tặng trọn bộ tài liệu độc quyền & Chứng chỉ KidHero',
      'Kênh hỗ trợ VIP trọn đời',
    ],
    ctaText: 'Sở hữu Trọn Đời (799k)',
  },
];

export function getPricingPlan(planId: SubscriptionPlan): PricingPlan {
  return PRICING_PLANS.find((p) => p.id === planId) || PRICING_PLANS[0];
}

export interface PaymentResult {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  accountName: string;
  bin: string;
  bankName: string;
  qrCode: string;
  vietQrUrl: string;
  checkoutUrl: string;
  planId: string;
}
