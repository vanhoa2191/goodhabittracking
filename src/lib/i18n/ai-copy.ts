import type { Language } from '@/types';
import type { AiFailureCode } from '@/lib/store/ai-client';

export type AiCopy = {
  readonly consentTitle: string;
  readonly consentIntro: string;
  readonly consentSends: string;
  readonly consentNever: string;
  readonly consentOnlyHelp: string;
  readonly consentToggle: string;
  readonly consentFailed: string;
  readonly breakdownButton: string;
  readonly breakdownWorking: string;
  readonly breakdownTitle: string;
  readonly aiLabel: string;
  readonly minutes: (count: number) => string;
  readonly use: string;
  readonly dismiss: string;
  readonly summaryButton: string;
  readonly summaryWorking: string;
  readonly summaryTitle: string;
  readonly needConsent: string;
  readonly errors: Readonly<Record<AiFailureCode, string>>;
};

const vi: AiCopy = {
  consentTitle: 'Gợi ý bằng AI',
  consentIntro: 'Khi bạn bấm, ứng dụng nhờ một mô hình AI (Cloudflare Workers AI) soạn gợi ý. Mặc định tắt, bạn rút lại được bất cứ lúc nào.',
  consentSends: 'Chỉ gửi: tên một thói quen bạn vừa gõ (để chia nhỏ việc; ứng dụng tự xóa tên các bé nếu bạn lỡ gõ vào, nhưng bạn đừng gõ tên bé) hoặc các con số của tuần (để tóm tắt tuần).',
  consentNever: 'Không bao giờ gửi: tên hay biệt danh của bé, nhật ký, văn bản bé viết, ảnh, email của bạn.',
  consentOnlyHelp: 'Kết quả chỉ là gợi ý; bạn đọc và quyết định. Mỗi ngày chỉ có một số lượt giới hạn.',
  consentToggle: 'Cho phép gợi ý bằng AI',
  consentFailed: 'Chưa lưu được. Bạn thử lại nhé.',
  breakdownButton: 'Gợi ý bước nhỏ bằng AI',
  breakdownWorking: 'Đang soạn gợi ý…',
  breakdownTitle: 'Ba bước nhỏ gợi ý',
  aiLabel: 'Gợi ý do AI soạn. Ba mẹ đọc kỹ trước khi dùng.',
  minutes: (count) => `${count} phút`,
  use: 'Dùng các bước này',
  dismiss: 'Bỏ qua',
  summaryButton: 'Tóm tắt tuần bằng AI',
  summaryWorking: 'Đang soạn tóm tắt…',
  summaryTitle: 'Tóm tắt tuần (AI)',
  needConsent: 'Bật “Gợi ý bằng AI” trong Cài đặt → Quyền riêng tư để dùng.',
  errors: {
    ai_consent_required: 'Bạn chưa đồng ý dùng gợi ý AI. Bật ở Cài đặt → Quyền riêng tư.',
    ai_quota: 'Hôm nay đã hết lượt gợi ý. Mai bạn thử lại nhé.',
    ai_disabled: 'Gợi ý AI đang tạm tắt.',
    ai_timeout: 'Gợi ý mất quá lâu. Bạn thử lại sau nhé.',
    ai_invalid_output: 'Chưa có gợi ý phù hợp lần này. Bạn thử lại hoặc tự viết nhé.',
    ai_error: 'Chưa soạn được gợi ý. Bạn thử lại sau nhé.',
    pin: 'Cần mở khóa bằng mã PIN trước.',
    network: 'Không kết nối được. Bạn kiểm tra mạng rồi thử lại nhé.',
  },
};

const en: AiCopy = {
  consentTitle: 'AI suggestions',
  consentIntro: 'When you tap a button, the app asks an AI model (Cloudflare Workers AI) to draft a suggestion. Off by default, and you can withdraw at any time.',
  consentSends: 'Only sent: the name of a habit you just typed (to split it into steps; the app removes your children’s names if you type them, but please do not) or the week’s counts (to summarise the week).',
  consentNever: 'Never sent: your child’s name or nickname, journal, anything your child wrote, photos, your email.',
  consentOnlyHelp: 'The result is only a suggestion; you read it and decide. There is a limited number of suggestions each day.',
  consentToggle: 'Allow AI suggestions',
  consentFailed: 'Could not save. Please try again.',
  breakdownButton: 'Suggest small steps with AI',
  breakdownWorking: 'Drafting a suggestion…',
  breakdownTitle: 'Three small steps suggested',
  aiLabel: 'Drafted by AI. Read it carefully before you use it.',
  minutes: (count) => `${count} min`,
  use: 'Use these steps',
  dismiss: 'Dismiss',
  summaryButton: 'Summarise the week with AI',
  summaryWorking: 'Drafting a summary…',
  summaryTitle: 'Week summary (AI)',
  needConsent: 'Turn on “AI suggestions” in Settings → Privacy to use this.',
  errors: {
    ai_consent_required: 'You have not agreed to AI suggestions. Turn them on in Settings → Privacy.',
    ai_quota: 'No suggestions left for today. Please try again tomorrow.',
    ai_disabled: 'AI suggestions are switched off for now.',
    ai_timeout: 'The suggestion took too long. Please try again later.',
    ai_invalid_output: 'No suitable suggestion this time. Try again or write your own.',
    ai_error: 'Could not draft a suggestion. Please try again later.',
    pin: 'Unlock with your PIN first.',
    network: 'Could not connect. Check your network and try again.',
  },
};

const COPY: Partial<Record<Language, AiCopy>> = { vi, en };

export function getAiCopy(language: Language): AiCopy {
  return COPY[language] ?? en;
}
