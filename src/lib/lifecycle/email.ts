import 'server-only';

import { z } from 'zod';

const lifecycleTemplateSchema = z.enum([
  'welcome_setup',
  'trial_ending',
  'payment_receipt',
  'support_status',
  'refund_status',
  'subscription_cancelled',
]);

const lifecyclePayloadSchema = z.object({
  trialEndsAt: z.string().datetime().optional(),
  orderCode: z.number().int().positive().optional(),
  amount: z.number().int().nonnegative().optional(),
  planId: z.string().max(40).optional(),
  caseId: z.string().uuid().optional(),
  status: z.string().max(40).optional(),
}).strict();

export type LifecycleMessage = {
  readonly templateKey: z.infer<typeof lifecycleTemplateSchema>;
  readonly locale: string;
  readonly payload: z.infer<typeof lifecyclePayloadSchema>;
};

type RenderedEmail = {
  readonly subject: string;
  readonly html: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}

function frame(title: string, body: string): string {
  return `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033;line-height:1.6"><h1 style="font-size:24px">${escapeHtml(title)}</h1>${body}<p style="margin-top:32px;color:#64748b">KidHabit Hero</p></main>`;
}

function statusLabel(status: string | undefined, vietnamese: boolean): string {
  const labels: Record<string, readonly [string, string]> = {
    requested: ['Đã tiếp nhận', 'Received'],
    reviewing: ['Đang xem xét', 'Under review'],
    approved: ['Đã chấp thuận', 'Approved'],
    rejected: ['Chưa đủ điều kiện', 'Not eligible'],
    completed: ['Đã hoàn tất', 'Completed'],
  };
  const label = labels[status ?? ''] ?? [status ?? 'Đang cập nhật', status ?? 'Updating'];
  return vietnamese ? label[0] : label[1];
}

export function parseLifecycleMessage(input: unknown): LifecycleMessage {
  const parsed = z.object({
    templateKey: lifecycleTemplateSchema,
    locale: z.string().min(2).max(16),
    payload: lifecyclePayloadSchema,
  }).parse(input);
  return parsed;
}

export function renderLifecycleEmail(message: LifecycleMessage): RenderedEmail {
  const vietnamese = message.locale.toLowerCase().startsWith('vi');
  const payload = message.payload;

  switch (message.templateKey) {
    case 'welcome_setup': {
      const subject = vietnamese ? 'Bắt đầu cùng KidHabit Hero' : 'Get started with KidHabit Hero';
      const body = vietnamese
        ? '<p>Hồ sơ phụ huynh đã sẵn sàng. Bước tiếp theo là tạo hồ sơ bé, chọn thói quen phù hợp và ghép thiết bị nếu cần.</p>'
        : '<p>Your parent profile is ready. Next, create a child profile, choose suitable habits, and pair a device if needed.</p>';
      return { subject, html: frame(subject, body) };
    }
    case 'trial_ending': {
      const end = payload.trialEndsAt
        ? new Intl.DateTimeFormat(vietnamese ? 'vi-VN' : 'en-US', { dateStyle: 'long' }).format(new Date(payload.trialEndsAt))
        : '';
      const subject = vietnamese ? 'Gói dùng thử sắp kết thúc' : 'Your trial is ending soon';
      const body = vietnamese
        ? `<p>Thời gian dùng thử dự kiến kết thúc vào <strong>${escapeHtml(end)}</strong>. KidHabit Hero không tự động trừ tiền; bạn chỉ thanh toán khi chủ động chọn gói.</p>`
        : `<p>Your trial is expected to end on <strong>${escapeHtml(end)}</strong>. KidHabit Hero does not charge automatically; payment happens only when you actively choose a plan.</p>`;
      return { subject, html: frame(subject, body) };
    }
    case 'payment_receipt': {
      const amount = new Intl.NumberFormat(vietnamese ? 'vi-VN' : 'en-US', { style: 'currency', currency: 'VND' }).format(payload.amount ?? 0);
      const subject = vietnamese ? 'Xác nhận thanh toán KidHabit Hero' : 'KidHabit Hero payment confirmation';
      const body = vietnamese
        ? `<p>Thanh toán <strong>${escapeHtml(amount)}</strong> cho gói <strong>${escapeHtml(payload.planId ?? '')}</strong> đã được ghi nhận.</p><p>Mã đơn hàng: <strong>${payload.orderCode ?? ''}</strong>.</p>`
        : `<p>Your payment of <strong>${escapeHtml(amount)}</strong> for plan <strong>${escapeHtml(payload.planId ?? '')}</strong> has been recorded.</p><p>Order code: <strong>${payload.orderCode ?? ''}</strong>.</p>`;
      return { subject, html: frame(subject, body) };
    }
    case 'refund_status':
    case 'support_status': {
      const isRefund = message.templateKey === 'refund_status';
      const subject = vietnamese
        ? `${isRefund ? 'Hoàn tiền' : 'Yêu cầu hỗ trợ'}: ${statusLabel(payload.status, true)}`
        : `${isRefund ? 'Refund' : 'Support request'}: ${statusLabel(payload.status, false)}`;
      const body = vietnamese
        ? `<p>Trạng thái yêu cầu của bạn đã được cập nhật: <strong>${escapeHtml(statusLabel(payload.status, true))}</strong>.</p><p>Mã theo dõi: <strong>${escapeHtml(payload.caseId ?? '')}</strong>.</p>`
        : `<p>Your request status is now <strong>${escapeHtml(statusLabel(payload.status, false))}</strong>.</p><p>Tracking ID: <strong>${escapeHtml(payload.caseId ?? '')}</strong>.</p>`;
      return { subject, html: frame(subject, body) };
    }
    case 'subscription_cancelled': {
      const subject = vietnamese ? 'Gói KidHabit Hero đã được hủy' : 'Your KidHabit Hero plan was cancelled';
      const body = vietnamese
        ? '<p>Gói đăng ký đã được chuyển sang trạng thái hủy. Không có khoản thanh toán tự động nào được tạo.</p>'
        : '<p>Your subscription has been marked as cancelled. No automatic payment has been created.</p>';
      return { subject, html: frame(subject, body) };
    }
  }
}

export function getLifecycleEmailConfig() {
  const enabled = process.env.LIFECYCLE_EMAILS_ENABLED === 'true';
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  const from = process.env.LIFECYCLE_EMAIL_FROM?.trim() ?? '';
  return { enabled: enabled && Boolean(apiKey) && Boolean(from), apiKey, from };
}

export async function sendLifecycleEmail(input: {
  readonly to: string;
  readonly dedupeKey: string;
  readonly message: LifecycleMessage;
}): Promise<string> {
  const config = getLifecycleEmailConfig();
  if (!config.enabled) throw new Error('lifecycle_email_not_configured');
  const rendered = renderLifecycleEmail(input.message);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
      'idempotency-key': input.dedupeKey,
    },
    body: JSON.stringify({
      from: config.from,
      to: [input.to],
      subject: rendered.subject,
      html: rendered.html,
    }),
  });
  const body = await response.json().catch(() => null) as { id?: string } | null;
  if (!response.ok || !body?.id) throw new Error(`email_provider_${response.status}`);
  return body.id;
}
