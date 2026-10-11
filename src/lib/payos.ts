import { ADDON_PRICES } from '@/lib/billing/addon-catalog';
import { PLAN_PRICES } from '@/lib/billing/plan-catalog';
import type { AddonId } from '@/lib/billing/addon-catalog';
import { PricingPlan, SubscriptionPlan } from '@/types';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'trial',
    name: 'Dùng Thử 7 Ngày',
    badge: '🎁 MIỄN PHÍ 0Đ',
    price: 0,
    periodLabel: '7 ngày Pro',
    description: 'Mở khóa trọn bộ tính năng Pro, không cần thẻ tín dụng',
    features: [],
    ctaText: 'Kích hoạt 7 ngày dùng thử',
  },
  {
    id: 'solo_monthly',
    name: 'Gói Cơ bản · Tháng',
    badge: 'Khởi đầu nhẹ nhàng',
    price: PLAN_PRICES.solo.month,
    periodLabel: '/ tháng',
    dailyEquivalent: '~1.630đ / ngày',
    description: 'Đầy đủ trải nghiệm cốt lõi cho hành trình của một bé',
    features: [],
    ctaText: 'Chọn Gói Cơ bản · Tháng',
  },
  {
    id: 'solo_yearly',
    name: 'Gói Cơ bản · Năm',
    badge: 'Tiết kiệm cho một bé',
    price: PLAN_PRICES.solo.year,
    originalPrice: PLAN_PRICES.solo.month * 12,
    savings: 'Tiết kiệm 189.000đ (32%)',
    periodLabel: '/ năm',
    dailyEquivalent: '~33.300đ / tháng (~1.090đ/ngày)',
    description: 'Cả năm đồng hành cùng một bé với giá tốt hơn trả từng tháng',
    features: [],
    ctaText: 'Chọn Gói Cơ bản · Năm',
  },
  {
    id: 'monthly',
    name: 'Gói Pro · Tháng',
    badge: 'Phổ biến nhất',
    popular: true,
    price: PLAN_PRICES.pro.month,
    periodLabel: '/ tháng',
    dailyEquivalent: '~2.300đ / ngày',
    description: 'Đồng hành cùng gia đình với tối đa 5 hồ sơ bé',
    features: [],
    ctaText: 'Chọn Gói Pro · Tháng',
  },
  {
    id: 'yearly',
    name: 'Gói Pro · Năm',
    badge: 'Tiết kiệm nhất',
    price: PLAN_PRICES.pro.year,
    originalPrice: PLAN_PRICES.pro.month * 12,
    savings: 'Tiết kiệm 238.000đ (29%)',
    periodLabel: '/ năm',
    dailyEquivalent: '~49.200đ / tháng (~1.620đ/ngày)',
    description: 'Lựa chọn tốt nhất và kinh tế nhất cho cả năm rèn luyện nếp sống',
    features: [],
    ctaText: 'Chọn Gói Pro · Năm',
  },
  {
    id: 'pro_plus_monthly',
    name: 'Gói Pro Plus · Tháng',
    badge: 'Có AI',
    price: PLAN_PRICES.pro_plus.month,
    periodLabel: '/ tháng',
    dailyEquivalent: '~2.630đ / ngày',
    description: 'Mọi tính năng Pro cùng gợi ý AI 10 lượt mỗi ngày',
    features: [],
    ctaText: 'Chọn Gói Pro Plus · Tháng',
  },
  {
    id: 'pro_plus_yearly',
    name: 'Gói Pro Plus · Năm',
    badge: 'Có AI, tiết kiệm nhất',
    price: PLAN_PRICES.pro_plus.year,
    originalPrice: PLAN_PRICES.pro_plus.month * 12,
    savings: 'Tiết kiệm 158.000đ (17%)',
    periodLabel: '/ năm',
    dailyEquivalent: '~65.800đ / tháng (~2.160đ/ngày)',
    description: 'Cả năm có AI đồng hành cùng gia đình với giá tốt hơn trả từng tháng',
    features: [],
    ctaText: 'Chọn Gói Pro Plus · Năm',
  },
  {
    id: 'ai_addon_monthly',
    name: 'Add-on AI',
    price: ADDON_PRICES.ai_addon_monthly,
    periodLabel: '/ tháng',
    description: 'Thêm gợi ý AI 10 lượt mỗi ngày cho gói Cơ bản hoặc Pro',
    features: [],
    ctaText: 'Thêm Add-on AI',
  },
  {
    id: 'printables',
    name: 'Printable & Ebook',
    price: ADDON_PRICES.printables,
    periodLabel: 'một lần',
    description: 'Bộ Printable và Ebook, mua một lần dùng mãi',
    features: [],
    ctaText: 'Mua Printable & Ebook',
  },
];

export function getPricingPlan(planId: SubscriptionPlan | AddonId): PricingPlan {
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
  /** Set when a referral discount was applied: the list price, the amount taken off it and who referred the family. */
  listPrice?: number;
  discountAmount?: number;
  referrerName?: string | null;
}
