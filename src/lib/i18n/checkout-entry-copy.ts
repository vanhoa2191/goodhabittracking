import type { Language } from '@/types';

export type CheckoutEntryCopy = {
  readonly loginError: string;
  readonly resultTitle: string;
  readonly openApp: string;
  readonly invalidTitle: string;
  readonly invalidBody: string;
  readonly viewPricing: string;
  readonly home: string;
  readonly selectedPlan: string;
  readonly signIn: string;
  readonly parentOnly: string;
  readonly loading: string;
  readonly continue: string;
  readonly oneTime: string;
};

const COPY: Record<Language, CheckoutEntryCopy> = {
  vi: {
    loginError: 'Không thể mở đăng nhập Google. Vui lòng thử lại.',
    resultTitle: 'Kết quả thanh toán',
    openApp: 'Vào ứng dụng',
    invalidTitle: 'Gói thanh toán không hợp lệ',
    invalidBody: 'Liên kết có thể đã cũ hoặc thiếu thông tin gói. Hãy chọn lại gói phù hợp từ bảng giá KidHabit.',
    viewPricing: 'Xem bảng giá',
    home: 'Về trang chủ',
    selectedPlan: 'Gói bạn đã chọn',
    signIn: 'Đăng nhập để thanh toán',
    parentOnly: 'Chỉ phụ huynh trong gia đình mới có thể thanh toán.',
    loading: 'Đang tải thông tin gia đình để tiếp tục thanh toán…',
    continue: 'Tiếp tục thanh toán',
    oneTime: 'Thanh toán một lần qua PayOS. KidHabit không tự động gia hạn.',
  },
  en: {
    loginError: 'Google sign-in could not be opened. Please try again.',
    resultTitle: 'Payment result',
    openApp: 'Open the app',
    invalidTitle: 'This payment plan is not valid',
    invalidBody: 'The link may be old or missing the plan details. Please choose a plan again from the KidHabit pricing page.',
    viewPricing: 'See pricing',
    home: 'Back to home',
    selectedPlan: 'The plan you chose',
    signIn: 'Sign in to pay',
    parentOnly: 'Only a parent in the family can pay.',
    loading: 'Loading the family details so you can continue to payment…',
    continue: 'Continue to payment',
    oneTime: 'One payment through PayOS. KidHabit does not renew automatically.',
  },
  fr: {
    loginError: 'Google sign-in could not be opened. Please try again.',
    resultTitle: 'Payment result',
    openApp: 'Open the app',
    invalidTitle: 'This payment plan is not valid',
    invalidBody: 'The link may be old or missing the plan details. Please choose a plan again from the KidHabit pricing page.',
    viewPricing: 'See pricing',
    home: 'Back to home',
    selectedPlan: 'The plan you chose',
    signIn: 'Sign in to pay',
    parentOnly: 'Only a parent in the family can pay.',
    loading: 'Loading the family details so you can continue to payment…',
    continue: 'Continue to payment',
    oneTime: 'One payment through PayOS. KidHabit does not renew automatically.',
  },
  de: {
    loginError: 'Google sign-in could not be opened. Please try again.',
    resultTitle: 'Payment result',
    openApp: 'Open the app',
    invalidTitle: 'This payment plan is not valid',
    invalidBody: 'The link may be old or missing the plan details. Please choose a plan again from the KidHabit pricing page.',
    viewPricing: 'See pricing',
    home: 'Back to home',
    selectedPlan: 'The plan you chose',
    signIn: 'Sign in to pay',
    parentOnly: 'Only a parent in the family can pay.',
    loading: 'Loading the family details so you can continue to payment…',
    continue: 'Continue to payment',
    oneTime: 'One payment through PayOS. KidHabit does not renew automatically.',
  },
  it: {
    loginError: 'Google sign-in could not be opened. Please try again.',
    resultTitle: 'Payment result',
    openApp: 'Open the app',
    invalidTitle: 'This payment plan is not valid',
    invalidBody: 'The link may be old or missing the plan details. Please choose a plan again from the KidHabit pricing page.',
    viewPricing: 'See pricing',
    home: 'Back to home',
    selectedPlan: 'The plan you chose',
    signIn: 'Sign in to pay',
    parentOnly: 'Only a parent in the family can pay.',
    loading: 'Loading the family details so you can continue to payment…',
    continue: 'Continue to payment',
    oneTime: 'One payment through PayOS. KidHabit does not renew automatically.',
  },
  es: {
    loginError: 'Google sign-in could not be opened. Please try again.',
    resultTitle: 'Payment result',
    openApp: 'Open the app',
    invalidTitle: 'This payment plan is not valid',
    invalidBody: 'The link may be old or missing the plan details. Please choose a plan again from the KidHabit pricing page.',
    viewPricing: 'See pricing',
    home: 'Back to home',
    selectedPlan: 'The plan you chose',
    signIn: 'Sign in to pay',
    parentOnly: 'Only a parent in the family can pay.',
    loading: 'Loading the family details so you can continue to payment…',
    continue: 'Continue to payment',
    oneTime: 'One payment through PayOS. KidHabit does not renew automatically.',
  },
  zh: {
    loginError: 'Google sign-in could not be opened. Please try again.',
    resultTitle: 'Payment result',
    openApp: 'Open the app',
    invalidTitle: 'This payment plan is not valid',
    invalidBody: 'The link may be old or missing the plan details. Please choose a plan again from the KidHabit pricing page.',
    viewPricing: 'See pricing',
    home: 'Back to home',
    selectedPlan: 'The plan you chose',
    signIn: 'Sign in to pay',
    parentOnly: 'Only a parent in the family can pay.',
    loading: 'Loading the family details so you can continue to payment…',
    continue: 'Continue to payment',
    oneTime: 'One payment through PayOS. KidHabit does not renew automatically.',
  },
  ja: {
    loginError: 'Google sign-in could not be opened. Please try again.',
    resultTitle: 'Payment result',
    openApp: 'Open the app',
    invalidTitle: 'This payment plan is not valid',
    invalidBody: 'The link may be old or missing the plan details. Please choose a plan again from the KidHabit pricing page.',
    viewPricing: 'See pricing',
    home: 'Back to home',
    selectedPlan: 'The plan you chose',
    signIn: 'Sign in to pay',
    parentOnly: 'Only a parent in the family can pay.',
    loading: 'Loading the family details so you can continue to payment…',
    continue: 'Continue to payment',
    oneTime: 'One payment through PayOS. KidHabit does not renew automatically.',
  },
  ko: {
    loginError: 'Google sign-in could not be opened. Please try again.',
    resultTitle: 'Payment result',
    openApp: 'Open the app',
    invalidTitle: 'This payment plan is not valid',
    invalidBody: 'The link may be old or missing the plan details. Please choose a plan again from the KidHabit pricing page.',
    viewPricing: 'See pricing',
    home: 'Back to home',
    selectedPlan: 'The plan you chose',
    signIn: 'Sign in to pay',
    parentOnly: 'Only a parent in the family can pay.',
    loading: 'Loading the family details so you can continue to payment…',
    continue: 'Continue to payment',
    oneTime: 'One payment through PayOS. KidHabit does not renew automatically.',
  },
};

export function getCheckoutEntryCopy(language: Language): CheckoutEntryCopy {
  return COPY[language] ?? COPY.en;
}
