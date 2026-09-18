import crypto from 'crypto';
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

export function isPayOSConfigured(): boolean {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  return !!(
    clientId &&
    clientId.trim().length > 0 &&
    clientId !== 'your-payos-client-id' &&
    apiKey &&
    apiKey.trim().length > 0 &&
    apiKey !== 'your-payos-api-key' &&
    checksumKey &&
    checksumKey.trim().length > 0 &&
    checksumKey !== 'your-payos-checksum-key'
  );
}

/**
 * Generate HMAC SHA256 signature for PayOS Create Payment Request
 * Formula: sort alphabetically amount, cancelUrl, description, orderCode, returnUrl
 */
export function createPayOSSignature(data: {
  amount: number;
  cancelUrl: string;
  description: string;
  orderCode: number;
  returnUrl: string;
}): string {
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY || '';
  const sortedData = `amount=${data.amount}&cancelUrl=${data.cancelUrl}&description=${data.description}&orderCode=${data.orderCode}&returnUrl=${data.returnUrl}`;
  return crypto.createHmac('sha256', checksumKey).update(sortedData).digest('hex');
}

/**
 * Verify PayOS Webhook Signature
 */
export function verifyPayOSWebhook(data: Record<string, unknown>, signature: string): boolean {
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY || '';
  if (!checksumKey) return false;

  // Sort keys alphabetically
  const sortedKeys = Object.keys(data).sort();
  const sortedData = sortedKeys
    .map((key) => `${key}=${data[key] !== null && data[key] !== undefined ? data[key] : ''}`)
    .join('&');

  const calculatedSignature = crypto.createHmac('sha256', checksumKey).update(sortedData).digest('hex');
  return calculatedSignature === signature;
}

export interface CreatePaymentParams {
  planId: 'monthly' | 'yearly' | 'lifetime';
  orderCode?: number;
  returnUrl?: string;
  cancelUrl?: string;
  userId?: string;
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
  isMock: boolean;
  planId: string;
}

/**
 * Main create payment function
 */
export async function createPaymentOrder(params: CreatePaymentParams): Promise<PaymentResult> {
  const plan = getPricingPlan(params.planId);
  const orderCode =
    params.orderCode ||
    Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 900 + 100));

  // PayOS description max 25 characters, alphanumeric without accents
  const description = `KIDHABIT ${orderCode}`.slice(0, 25);
  const amount = plan.price;

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  const returnUrl = params.returnUrl || `${origin}/?payment=success&orderCode=${orderCode}`;
  const cancelUrl = params.cancelUrl || `${origin}/?payment=cancel&orderCode=${orderCode}`;

  if (isPayOSConfigured()) {
    try {
      const clientId = process.env.PAYOS_CLIENT_ID!;
      const apiKey = process.env.PAYOS_API_KEY!;

      const signature = createPayOSSignature({
        amount,
        cancelUrl,
        description,
        orderCode,
        returnUrl,
      });

      const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
        method: 'POST',
        headers: {
          'x-client-id': clientId,
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderCode,
          amount,
          description,
          returnUrl,
          cancelUrl,
          items: [
            {
              name: plan.name,
              quantity: 1,
              price: amount,
            },
          ],
          signature,
        }),
      });

      const json = await response.json();

      if (json.code === '00' && json.data) {
        const d = json.data;
        const vietQrUrl = `https://img.vietqr.io/image/${d.bin}-${d.accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
          description
        )}&accountName=${encodeURIComponent(d.accountName)}`;

        return {
          orderCode,
          amount,
          description,
          accountNumber: d.accountNumber,
          accountName: d.accountName,
          bin: d.bin,
          bankName: 'VietinBank / MBBank',
          qrCode: d.qrCode,
          vietQrUrl,
          checkoutUrl: d.checkoutUrl,
          isMock: false,
          planId: params.planId,
        };
      } else {
        console.warn('PayOS API returned non-00 code, falling back to demo VietQR:', json);
      }
    } catch (err) {
      console.error('Error calling PayOS API, falling back to demo VietQR:', err);
    }
  }

  // Demo / Mock mode fallback with real standard VietQR image
  // MBBank (BIN: 970422), account demo
  const mockBin = '970422';
  const mockAccountNumber = '0988888688';
  const mockAccountName = 'KIDHABIT HERO VIET NAM';
  const mockVietQrUrl = `https://img.vietqr.io/image/MB-${mockAccountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    description
  )}&accountName=${encodeURIComponent(mockAccountName)}`;

  return {
    orderCode,
    amount,
    description,
    accountNumber: mockAccountNumber,
    accountName: mockAccountName,
    bin: mockBin,
    bankName: 'MBBank (Ngân Hàng Quân Đội)',
    qrCode: `00020101021238570010A000000727012700069704220113${mockAccountNumber}0208QRIBFTTA5303704540${amount}5802VN62${description.length}${description}6304`,
    vietQrUrl: mockVietQrUrl,
    checkoutUrl: '#mock-payos',
    isMock: true,
    planId: params.planId,
  };
}
