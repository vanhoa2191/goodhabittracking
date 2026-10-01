import { PricingPlan, SubscriptionPlan } from '@/types';

export const PRICING_PLANS: PricingPlan[] = [
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
      'Đồng bộ đám mây trên nhiều thiết bị',
      'Bảng xếp hạng & Thử thách nhóm',
      'Không tự động trừ tiền khi hết hạn',
    ],
    ctaText: 'Kích hoạt 7 ngày dùng thử',
  },
  {
    id: 'solo_monthly',
    name: 'Gói Một Bé',
    badge: 'Khởi đầu nhẹ nhàng',
    price: 29000,
    periodLabel: '/ tháng',
    dailyEquivalent: '~970đ / ngày',
    description: 'Đầy đủ trải nghiệm cốt lõi cho hành trình của một bé',
    features: [
      'Quản lý 1 hồ sơ bé',
      'Đồng bộ đám mây trên nhiều thiết bị',
      'Toàn bộ thư viện thói quen, lộ trình và phần thưởng',
    ],
    ctaText: 'Chọn Gói Một Bé',
  },
  {
    id: 'monthly',
    name: 'Gói Gia Đình · Tháng',
    badge: 'Phổ biến nhất',
    popular: true,
    price: 49000,
    periodLabel: '/ tháng',
    dailyEquivalent: '~1.600đ / ngày',
    description: 'Chỉ bằng 1/2 ly trà sữa, tạo dựng nếp sống vững chắc cho con',
    features: [
      'Không giới hạn số lượng bé',
      'Đồng bộ tức thì trên nhiều thiết bị',
      'Mở khóa toàn bộ Thư viện thói quen & Lộ trình',
      'Báo cáo phân tích chuyên sâu hàng tuần',
      'Bảng xếp hạng thi đua gia đình & liên minh',
      'Hỗ trợ kỹ thuật nhanh chóng',
    ],
    ctaText: 'Chọn Gói Gia Đình · Tháng',
  },
  {
    id: 'yearly',
    name: 'Gói Gia Đình · Năm',
    badge: 'Tiết kiệm nhất',
    price: 399000,
    originalPrice: 588000,
    savings: 'Tiết kiệm 189.000đ (32%)',
    periodLabel: '/ năm',
    dailyEquivalent: '~33.000đ / tháng (~1.100đ/ngày)',
    description: 'Lựa chọn tốt nhất và kinh tế nhất cho cả năm rèn luyện nếp sống',
    features: [
      'Tất cả quyền lợi của Gói Gia Đình · Tháng',
      'Quản lý không giới hạn số bé',
      'Tặng Ebook: Cẩm nang nuôi dạy con & 7 Bố thí',
      'Quyền ưu tiên tham gia giải đấu mùa hè',
      'Hỗ trợ ưu tiên 1-1 qua Zalo từ chuyên gia',
      'Tiết kiệm 189.000đ so với trả từng tháng',
    ],
    ctaText: 'Chọn Gói Gia Đình · Năm',
  },
];

export function getPricingPlan(planId: SubscriptionPlan): PricingPlan {
  const plan = PRICING_PLANS.find((candidate) => candidate.id === planId);
  if (!plan) throw new Error('Unsupported pricing plan.');
  return plan;
}

export interface PaymentResult {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  accountName: string;
  bankBin: string;
  bankName: string;
  qrCode: string;
  vietQrUrl: string;
  checkoutUrl: string;
  planId: string;
  /** Set when a referral discount was applied: the list price and the percentage taken off it. */
  listPrice?: number;
  discountPercent?: number;
}
