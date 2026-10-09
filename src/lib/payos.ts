import { PLAN_PRICES } from '@/lib/billing/plan-catalog';
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
      'Tối đa 5 bé',
      'Mời người thân cùng theo dõi',
      'Mở khóa trọn bộ 40+ thói quen & 7 Bố thí',
      'Lộ trình theo độ tuổi',
      'Đồng bộ đám mây trên nhiều thiết bị',
      'Bảng xếp hạng & Thử thách nhóm',
      'Không tự động trừ tiền khi hết hạn',
    ],
    ctaText: 'Kích hoạt 7 ngày dùng thử',
  },
  {
    id: 'solo_monthly',
    name: 'Gói Cơ bản · Tháng',
    badge: 'Khởi đầu nhẹ nhàng',
    price: PLAN_PRICES.solo.month,
    periodLabel: '/ tháng',
    dailyEquivalent: '~1.300đ / ngày',
    description: 'Đầy đủ trải nghiệm cốt lõi cho hành trình của một bé',
    features: [
      'Quản lý 1 hồ sơ bé',
      'Mời người thân cùng theo dõi',
      'Đồng bộ đám mây trên nhiều thiết bị',
      'Toàn bộ thư viện thói quen, lộ trình và phần thưởng',
    ],
    ctaText: 'Chọn Gói Cơ bản · Tháng',
  },
  {
    id: 'solo_yearly',
    name: 'Gói Cơ bản · Năm',
    badge: 'Tiết kiệm cho một bé',
    price: PLAN_PRICES.solo.year,
    originalPrice: PLAN_PRICES.solo.month * 12,
    savings: 'Tiết kiệm 69.000đ (15%)',
    periodLabel: '/ năm',
    dailyEquivalent: '~33.300đ / tháng (~1.090đ/ngày)',
    description: 'Cả năm đồng hành cùng một bé với giá tốt hơn trả từng tháng',
    features: [
      'Tất cả quyền lợi của Gói Cơ bản · Tháng',
      'Quản lý 1 hồ sơ bé',
      'Tiết kiệm 69.000đ so với trả từng tháng',
    ],
    ctaText: 'Chọn Gói Cơ bản · Năm',
  },
  {
    id: 'monthly',
    name: 'Gói Pro · Tháng',
    badge: 'Phổ biến nhất',
    popular: true,
    price: PLAN_PRICES.pro.month,
    periodLabel: '/ tháng',
    dailyEquivalent: '~1.970đ / ngày',
    description: 'Chỉ bằng 1/2 ly trà sữa, tạo dựng nếp sống vững chắc cho con',
    features: [
      'Tối đa 5 bé',
      'Mời người thân cùng theo dõi',
      'Đồng bộ tức thì trên nhiều thiết bị',
      'Mở khóa toàn bộ Thư viện thói quen & Lộ trình',
      'Bảng xếp hạng thi đua gia đình & liên minh',
      'Hỗ trợ kỹ thuật nhanh chóng',
    ],
    ctaText: 'Chọn Gói Pro · Tháng',
  },
  {
    id: 'yearly',
    name: 'Gói Pro · Năm',
    badge: 'Tiết kiệm nhất',
    price: PLAN_PRICES.pro.year,
    originalPrice: PLAN_PRICES.pro.month * 12,
    savings: 'Tiết kiệm 118.000đ (17%)',
    periodLabel: '/ năm',
    dailyEquivalent: '~49.200đ / tháng (~1.620đ/ngày)',
    description: 'Lựa chọn tốt nhất và kinh tế nhất cho cả năm rèn luyện nếp sống',
    features: [
      'Tất cả quyền lợi của Gói Pro · Tháng',
      'Tối đa 5 bé',
      'Tiết kiệm 118.000đ so với trả từng tháng',
    ],
    ctaText: 'Chọn Gói Pro · Năm',
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
