import { vi } from './locales/vi';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { it } from './locales/it';
import { es } from './locales/es';
import { zh } from './locales/zh';
import { ja } from './locales/ja';
import { ko } from './locales/ko';

const checkoutCopy = {
  vi: {
    secureCheckoutAction: 'Mở trang thanh toán bảo mật',
    paymentReturnActivated: 'Thanh toán đã được xác nhận và gói của gia đình đã được kích hoạt.',
    paymentReturnPending: 'Thanh toán đang chờ xác nhận. Gói sẽ tự kích hoạt sau khi ngân hàng hoàn tất xử lý.',
    paymentReturnCancelled: 'Bạn đã hủy thanh toán. Không có gói nào được kích hoạt.',
    paymentReturnError: 'Chưa thể xác minh thanh toán. Vui lòng thử kiểm tra lại sau.',
  },
  en: {
    secureCheckoutAction: 'Open secure payment page',
    paymentReturnActivated: 'Payment verified. Your family plan is now active.',
    paymentReturnPending: 'Payment is awaiting verification. Your plan will activate after bank processing completes.',
    paymentReturnCancelled: 'Payment was cancelled. No plan was activated.',
    paymentReturnError: 'Payment could not be verified. Please check again later.',
  },
};

export const translations = {
  vi: { ...vi, ...checkoutCopy.vi },
  en: { ...en, ...checkoutCopy.en },
  fr: { ...fr, ...checkoutCopy.en },
  de: { ...de, ...checkoutCopy.en },
  it: { ...it, ...checkoutCopy.en },
  es: { ...es, ...checkoutCopy.en },
  zh: { ...zh, ...checkoutCopy.en },
  ja: { ...ja, ...checkoutCopy.en },
  ko: { ...ko, ...checkoutCopy.en },
};
