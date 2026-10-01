import type { Language } from '@/types';

export type AffiliateCopy = {
  readonly title: string;
  readonly intro: (percent: number) => string;
  readonly rules: (input: { percent: number; holdDays: number; windowDays: number; minPayout: string }) => readonly string[];
  readonly terms: string;
  readonly termsLink: string;
  readonly join: string;
  readonly joining: string;
  readonly yourLink: string;
  readonly copy: string;
  readonly copied: string;
  readonly share: string;
  readonly shareText: string;
  readonly signups: string;
  readonly paying: string;
  readonly held: string;
  readonly available: string;
  readonly requested: string;
  readonly paid: string;
  readonly payoutTitle: string;
  readonly bank: string;
  readonly accountNumber: string;
  readonly accountName: string;
  readonly saveDetails: string;
  readonly editDetails: string;
  readonly requestPayout: string;
  readonly requesting: string;
  readonly recent: string;
  readonly noCommissions: string;
  readonly status: Readonly<Record<'pending' | 'available' | 'requested' | 'paid' | 'reversed', string>>;
  readonly plan: Readonly<Record<string, string>>;
  readonly tax: string;
  readonly entry: {
    readonly prompt: string;
    readonly hint: string;
    readonly label: string;
    readonly placeholder: string;
    readonly submit: string;
    readonly submitting: string;
    readonly referred: string;
    readonly results: Readonly<Record<'claimed' | 'invalid' | 'self' | 'already_referred' | 'expired' | 'disabled' | 'failed', string>>;
  };
  readonly messages: Readonly<Record<'saved' | 'invalidDetails' | 'requested' | 'belowMinimum' | 'missingDetails' | 'suspended' | 'failed' | 'loadFailed' | 'pinRequired', string>>;
};

const vi: AffiliateCopy = {
  title: 'Giới thiệu bạn bè',
  intro: (percent) => `Chia sẻ liên kết của bạn. Khi một gia đình mới đăng ký qua đó và trả tiền, bạn nhận hoa hồng ${percent}% trên mỗi khoản thanh toán của họ.`,
  rules: ({ percent, holdDays, windowDays, minPayout }) => [
    `Hoa hồng ${percent}% trên số tiền gia đình được giới thiệu thực trả, cho mọi thanh toán trong ${Math.round(windowDays / 30)} tháng đầu kể từ khi họ đăng ký.`,
    `Mỗi khoản được giữ ${holdDays} ngày (qua thời hạn hoàn tiền) rồi mới rút được. Đơn được hoàn tiền thì hoa hồng bị thu hồi.`,
    `Rút tối thiểu ${minPayout}. KidHabit chuyển khoản thủ công và báo khi đã chuyển.`,
    'Không tự giới thiệu mình, không gửi thư rác. Bạn không xem được thông tin của gia đình được giới thiệu.',
  ],
  terms: 'Tôi đã đọc và đồng ý với điều khoản chương trình giới thiệu.',
  termsLink: 'Xem điều khoản',
  join: 'Tham gia chương trình',
  joining: 'Đang đăng ký…',
  yourLink: 'Liên kết giới thiệu của bạn',
  copy: 'Sao chép',
  copied: 'Đã sao chép',
  share: 'Chia sẻ',
  shareText: 'KidHabit Hero giúp cả nhà cùng xây thói quen tốt cho con. Xem thử:',
  signups: 'Gia đình đã đăng ký',
  paying: 'Gia đình đã trả tiền',
  held: 'Đang giữ',
  available: 'Có thể rút',
  requested: 'Đã yêu cầu rút',
  paid: 'Đã chuyển',
  payoutTitle: 'Nhận tiền hoa hồng',
  bank: 'Ngân hàng',
  accountNumber: 'Số tài khoản',
  accountName: 'Tên chủ tài khoản',
  saveDetails: 'Lưu thông tin',
  editDetails: 'Sửa thông tin',
  requestPayout: 'Yêu cầu rút tiền',
  requesting: 'Đang gửi…',
  recent: 'Hoa hồng gần đây',
  noCommissions: 'Chưa có hoa hồng nào.',
  status: { pending: 'Đang giữ', available: 'Có thể rút', requested: 'Đã yêu cầu rút', paid: 'Đã chuyển', reversed: 'Đã thu hồi' },
  plan: { solo_monthly: 'Gói Một Bé', monthly: 'Gói Gia Đình · Tháng', yearly: 'Gói Năm', lifetime: 'Trọn Đời' },
  tax: 'Hoa hồng có thể thuộc diện chịu thuế thu nhập cá nhân; bạn tự chịu trách nhiệm kê khai theo quy định.',
  entry: {
    prompt: 'Có mã giới thiệu từ bạn bè?',
    hint: 'Nhập mã gồm 8 ký tự để người giới thiệu được ghi nhận. Chỉ nhập được một lần, trong lúc gia đình còn mới và chưa thanh toán.',
    label: 'Mã giới thiệu',
    placeholder: 'Ví dụ K7M2QX9P',
    submit: 'Áp dụng mã',
    submitting: 'Đang kiểm tra…',
    referred: 'Gia đình bạn đã được ghi nhận qua lời giới thiệu của một người bạn. Cảm ơn bạn!',
    results: {
      claimed: 'Đã ghi nhận mã giới thiệu. Cảm ơn bạn!',
      invalid: 'Mã không đúng hoặc không còn hiệu lực. Kiểm tra lại 8 ký tự bạn nhận được.',
      self: 'Bạn không thể dùng mã giới thiệu của chính mình.',
      already_referred: 'Gia đình bạn đã có một mã giới thiệu được ghi nhận.',
      expired: 'Rất tiếc, mã giới thiệu chỉ áp dụng cho gia đình mới và chưa thanh toán nên không thể ghi nhận.',
      disabled: 'Chương trình giới thiệu đang tạm dừng.',
      failed: 'Chưa ghi nhận được. Vui lòng thử lại.',
    },
  },
  messages: {
    saved: 'Đã lưu thông tin nhận tiền.',
    invalidDetails: 'Thông tin chưa hợp lệ. Kiểm tra lại ngân hàng, số tài khoản và tên chủ tài khoản.',
    requested: 'Đã gửi yêu cầu rút tiền. KidHabit sẽ chuyển khoản và báo cho bạn.',
    belowMinimum: 'Số tiền có thể rút chưa đạt mức tối thiểu.',
    missingDetails: 'Hãy lưu thông tin nhận tiền trước.',
    suspended: 'Tài khoản giới thiệu đang bị tạm khóa. Vui lòng liên hệ hỗ trợ.',
    failed: 'Chưa thực hiện được. Vui lòng thử lại.',
    loadFailed: 'Chưa tải được chương trình giới thiệu. Vui lòng thử lại sau.',
    pinRequired: 'Hãy nhập mã PIN phụ huynh rồi thử lại.',
  },
};

const en: AffiliateCopy = {
  title: 'Refer a friend',
  intro: (percent) => `Share your link. When a new family signs up through it and pays, you earn ${percent}% of each of their payments.`,
  rules: ({ percent, holdDays, windowDays, minPayout }) => [
    `${percent}% of what the referred family actually pays, on every payment in their first ${Math.round(windowDays / 30)} months after signing up.`,
    `Each commission is held for ${holdDays} days (past the refund window) before you can withdraw it. A refunded order takes its commission back.`,
    `Minimum withdrawal ${minPayout}. KidHabit pays by bank transfer by hand and tells you when it is sent.`,
    'No referring yourself and no spam. You cannot see any details of the families you refer.',
  ],
  terms: 'I have read and accept the referral programme terms.',
  termsLink: 'Read the terms',
  join: 'Join the programme',
  joining: 'Joining…',
  yourLink: 'Your referral link',
  copy: 'Copy',
  copied: 'Copied',
  share: 'Share',
  shareText: 'KidHabit Hero helps the whole family build good habits with their child. Take a look:',
  signups: 'Families signed up',
  paying: 'Families that paid',
  held: 'Held',
  available: 'Available',
  requested: 'Withdrawal requested',
  paid: 'Paid out',
  payoutTitle: 'Get your commission',
  bank: 'Bank',
  accountNumber: 'Account number',
  accountName: 'Account holder name',
  saveDetails: 'Save details',
  editDetails: 'Edit details',
  requestPayout: 'Request withdrawal',
  requesting: 'Sending…',
  recent: 'Recent commissions',
  noCommissions: 'No commissions yet.',
  status: { pending: 'Held', available: 'Available', requested: 'Withdrawal requested', paid: 'Paid out', reversed: 'Reversed' },
  plan: { solo_monthly: 'Single Child plan', monthly: 'Family plan · Monthly', yearly: 'Yearly plan', lifetime: 'Lifetime' },
  tax: 'Commissions may be subject to personal income tax; you are responsible for declaring them as required.',
  entry: {
    prompt: 'Have a referral code from a friend?',
    hint: 'Enter the 8-character code so your friend gets credit. It can be entered once, while your family is new and has not paid.',
    label: 'Referral code',
    placeholder: 'Example K7M2QX9P',
    submit: 'Apply code',
    submitting: 'Checking…',
    referred: 'Your family was referred by a friend. Thank you!',
    results: {
      claimed: 'Referral code recorded. Thank you!',
      invalid: 'That code is not right or is no longer valid. Check the 8 characters you were given.',
      self: 'You cannot use your own referral code.',
      already_referred: 'A referral code is already recorded for your family.',
      expired: 'Sorry, referral codes only apply to new families that have not paid yet, so this one cannot be recorded.',
      disabled: 'The referral programme is paused.',
      failed: 'Could not record it. Please try again.',
    },
  },
  messages: {
    saved: 'Payout details saved.',
    invalidDetails: 'Those details do not look right. Check the bank, account number and holder name.',
    requested: 'Withdrawal requested. KidHabit will transfer the money and let you know.',
    belowMinimum: 'The available amount is below the minimum.',
    missingDetails: 'Save your payout details first.',
    suspended: 'Your referral account is suspended. Please contact support.',
    failed: 'Something went wrong. Please try again.',
    loadFailed: 'Could not load the referral programme. Please try again later.',
    pinRequired: 'Enter the parent PIN and try again.',
  },
};

// The programme pays out to Vietnamese bank accounts, so the app offers it in Vietnamese and English;
// every other language reads the English text.
export function getAffiliateCopy(language: Language): AffiliateCopy {
  return language === 'vi' ? vi : en;
}
