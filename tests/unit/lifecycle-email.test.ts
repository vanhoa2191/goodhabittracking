import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getLifecycleEmailConfig,
  LifecycleDeliveryUncertainError,
  parseEmailSender,
  parseLifecycleMessage,
  renderLifecycleEmail,
  sendLifecycleEmail,
} from '@/lib/lifecycle/email';

describe('lifecycle email', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders transactional copy without child or habit content', () => {
    const rendered = renderLifecycleEmail(parseLifecycleMessage({
      templateKey: 'payment_receipt',
      locale: 'vi',
      payload: { orderCode: 123, amount: 49000, planId: 'monthly' },
    }));
    expect(rendered.subject).toContain('Xác nhận thanh toán');
    expect(rendered.html).toContain('49.000');
    expect(rendered.html).not.toMatch(/child name|tên bé|habit title|tên thói quen/i);
  });

  it('wraps every template in the shared shell and links to the app only with fixed URLs', () => {
    const keys = ['welcome_setup', 'trial_ending', 'payment_receipt', 'support_status', 'refund_status', 'subscription_cancelled', 'care_week1_tips', 'care_child_inactive', 'care_weekly_summary', 'care_space_alert', 'onboarding_day1', 'onboarding_day3', 'onboarding_day7'] as const;
    for (const templateKey of keys) {
      for (const locale of ['vi', 'en']) {
        const { html } = renderLifecycleEmail(parseLifecycleMessage({
          templateKey,
          locale,
          payload: { trialEndsAt: '2026-10-20T00:00:00.000Z', orderCode: 1, amount: 1000, planId: 'monthly', status: 'approved' },
        }));
        expect(html).toContain('<!doctype html>');
        expect(html).toContain(`lang="${locale}"`);
        expect(html).not.toMatch(/<script|<img/i);
        const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
        for (const link of links) expect(link).toMatch(/^https:\/\/(app\.kidhabithero\.com\/|youtu\.be\/[\w-]{11}$)/);
      }
    }
  });

  describe('tutorial videos and onboarding', () => {
    const videoLinks = (templateKey: string, locale = 'vi') => {
      const { html } = renderLifecycleEmail(parseLifecycleMessage({ templateKey, locale, payload: { trialEndsAt: '2026-10-20T00:00:00.000Z' } }));
      expect(html).not.toMatch(/<iframe|<video|<img/i);
      return [...html.matchAll(/href="(https:\/\/youtu\.be\/[^"]+)"/g)].map((match) => match[1]);
    };
    const id = (code: string) => `https://youtu.be/${code}`;

    it.each([
      ['welcome_setup', ['rWdlRY6dXyo', 'CD-ak4oJQco']],
      ['care_week1_tips', ['_rKUsay8s6E']],
      ['trial_ending', ['iYcroOEsTQY']],
      ['onboarding_day1', ['rWdlRY6dXyo', 'wKvK5c54XsY', 'CD-ak4oJQco']],
      ['onboarding_day3', ['_rKUsay8s6E', '3vhlOq71DgE']],
      ['onboarding_day7', ['q5GH78yGnOQ', 'MngkioDTqJI']],
    ])('%s links the right videos in order, as text buttons, in both languages', (templateKey, codes) => {
      for (const locale of ['vi', 'en']) expect(videoLinks(templateKey, locale)).toEqual(codes.map(id));
    });

    it.each(['onboarding_day1', 'onboarding_day3', 'onboarding_day7'])('%s renders vi and en with the opt-in footer', (templateKey) => {
      const vi = renderLifecycleEmail(parseLifecycleMessage({ templateKey, locale: 'vi', payload: {} }));
      const en = renderLifecycleEmail(parseLifecycleMessage({ templateKey, locale: 'en', payload: {} }));
      expect(vi.subject).not.toBe(en.subject);
      expect(vi.html).toContain('đồng ý nhận thông tin');
      expect(en.html).toContain('you agreed to updates');
      expect(vi.html).toContain('Video hướng dẫn');
      expect(en.html).toContain('tutorial videos');
    });

    it('does not put video links in unrelated mail', () => {
      expect(videoLinks('payment_receipt')).toEqual([]);
      expect(videoLinks('care_weekly_summary')).toEqual([]);
    });
  });

  describe('care templates', () => {
    const careKeys = ['care_week1_tips', 'care_child_inactive', 'care_weekly_summary', 'care_space_alert'] as const;

    it.each(careKeys)('%s renders vi and en with the opt-in footer and an app-only link', (templateKey) => {
      const vi = renderLifecycleEmail(parseLifecycleMessage({ templateKey, locale: 'vi', payload: { completedCount: 5, activeDays: 3, status: 'watch' } }));
      const en = renderLifecycleEmail(parseLifecycleMessage({ templateKey, locale: 'en-US', payload: { completedCount: 5, activeDays: 3, status: 'watch' } }));
      expect(vi.subject).not.toBe(en.subject);
      expect(vi.html).toContain('lang="vi"');
      expect(en.html).toContain('lang="en"');
      expect(vi.html).toContain('đồng ý nhận thông tin');
      expect(vi.html).toContain('hồ sơ phụ huynh');
      expect(en.html).toContain('you agreed to updates');
      expect(vi.html).not.toContain('Thư giao dịch tự động');
    });

    it('keeps transactional mail on the transactional footer', () => {
      const { html } = renderLifecycleEmail(parseLifecycleMessage({ templateKey: 'welcome_setup', locale: 'vi', payload: {} }));
      expect(html).toContain('Thư giao dịch tự động');
      expect(html).not.toContain('đồng ý nhận thông tin');
    });

    it('shows only the aggregate counts in the weekly summary', () => {
      const { html } = renderLifecycleEmail(parseLifecycleMessage({ templateKey: 'care_weekly_summary', locale: 'vi', payload: { completedCount: 12, activeDays: 5 } }));
      expect(html).toContain('<strong>12</strong>');
      expect(html).toContain('<strong>5</strong>');
    });

    it('keeps the space alert generic: no mood, note, diagnosis wording or child details', () => {
      for (const locale of ['vi', 'en']) {
        for (const status of ['watch', 'concern']) {
          const { subject, html } = renderLifecycleEmail(parseLifecycleMessage({ templateKey: 'care_space_alert', locale, payload: { status } }));
          const text = `${subject} ${html}`;
          expect(text).not.toMatch(/buồn|giận|\bsad\b|worried|angry|trầm cảm|depress|anxi|lo âu|disorder|khủng hoảng|\bconcern\b|\bwatch\b/i);
        }
      }
    });

    it('rejects payload fields that could carry child content', () => {
      expect(() => parseLifecycleMessage({ templateKey: 'care_space_alert', locale: 'vi', payload: { note: 'bé buồn vì bạn' } })).toThrow();
      expect(() => parseLifecycleMessage({ templateKey: 'care_weekly_summary', locale: 'vi', payload: { completedCount: -1 } })).toThrow();
      expect(() => parseLifecycleMessage({ templateKey: 'care_weekly_summary', locale: 'vi', payload: { activeDays: 8 } })).toThrow();
    });
  });

  it('escapes payload text and keeps the call to action on the checkout page for trial mail', () => {
    const { html } = renderLifecycleEmail(parseLifecycleMessage({
      templateKey: 'payment_receipt',
      locale: 'en',
      payload: { orderCode: 7, amount: 1000, planId: '<b>x</b>' },
    }));
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    const trial = renderLifecycleEmail(parseLifecycleMessage({
      templateKey: 'trial_ending',
      locale: 'vi',
      payload: { trialEndsAt: '2026-10-20T00:00:00.000Z' },
    }));
    expect(trial.html).toContain('href="https://app.kidhabithero.com/checkout"');
  });

  it('rejects free-form payload fields before sending', () => {
    expect(() => parseLifecycleMessage({
      templateKey: 'welcome_setup',
      locale: 'vi',
      payload: { childName: 'Không được gửi' },
    })).toThrow();
  });

  it('uses the durable dedupe key as the provider idempotency key', async () => {
    vi.stubEnv('LIFECYCLE_EMAILS_ENABLED', 'true');
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    vi.stubEnv('LIFECYCLE_EMAIL_FROM', 'KidHabit <support@example.test>');
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'email-1' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendLifecycleEmail({
      to: 'parent@example.test',
      dedupeKey: 'welcome-setup/user-1',
      message: parseLifecycleMessage({ templateKey: 'welcome_setup', locale: 'vi', payload: {} }),
    })).resolves.toBe('email-1');

    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      headers: expect.objectContaining({ 'idempotency-key': 'welcome-setup/user-1' }),
      signal: expect.any(AbortSignal),
    }));
  });

  it.each(['resend', 'brevo'])('quarantines an uncertain %s transport failure', async (provider) => {
    vi.stubEnv('LIFECYCLE_EMAILS_ENABLED', 'true');
    vi.stubEnv('LIFECYCLE_EMAIL_PROVIDER', provider);
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    vi.stubEnv('BREVO_API_KEY', 'test-key');
    vi.stubEnv('LIFECYCLE_EMAIL_FROM', 'sender@example.test');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError')));
    await expect(sendLifecycleEmail({ to: 'parent@example.test', dedupeKey: 'k1',
      message: parseLifecycleMessage({ templateKey: 'welcome_setup', locale: 'vi', payload: {} }),
    })).rejects.toBeInstanceOf(LifecycleDeliveryUncertainError);
  });

  describe('provider choice', () => {
    const message = parseLifecycleMessage({ templateKey: 'welcome_setup', locale: 'vi', payload: {} });

    it('keeps Resend as the default and needs its own key', () => {
      vi.stubEnv('LIFECYCLE_EMAILS_ENABLED', 'true');
      vi.stubEnv('LIFECYCLE_EMAIL_FROM', 'KidHabit <no-reply@example.test>');
      vi.stubEnv('RESEND_API_KEY', '');
      vi.stubEnv('BREVO_API_KEY', 'brevo-key');
      expect(getLifecycleEmailConfig()).toMatchObject({ provider: 'resend', enabled: false });
      vi.stubEnv('RESEND_API_KEY', 're_key');
      expect(getLifecycleEmailConfig()).toMatchObject({ provider: 'resend', enabled: true, apiKey: 're_key' });
    });

    it('selects Brevo only when asked and then needs the Brevo key', () => {
      vi.stubEnv('LIFECYCLE_EMAILS_ENABLED', 'true');
      vi.stubEnv('LIFECYCLE_EMAIL_FROM', 'no-reply@example.test');
      vi.stubEnv('RESEND_API_KEY', 're_key');
      vi.stubEnv('LIFECYCLE_EMAIL_PROVIDER', ' Brevo ');
      vi.stubEnv('BREVO_API_KEY', '');
      expect(getLifecycleEmailConfig()).toMatchObject({ provider: 'brevo', enabled: false });
      vi.stubEnv('BREVO_API_KEY', 'brevo-key');
      expect(getLifecycleEmailConfig()).toMatchObject({ provider: 'brevo', enabled: true, apiKey: 'brevo-key' });
      vi.stubEnv('LIFECYCLE_EMAIL_PROVIDER', 'something-else');
      expect(getLifecycleEmailConfig().provider).toBe('resend');
    });

    it('stays disabled without the switch or the sender', () => {
      vi.stubEnv('LIFECYCLE_EMAIL_PROVIDER', 'brevo');
      vi.stubEnv('BREVO_API_KEY', 'brevo-key');
      vi.stubEnv('LIFECYCLE_EMAIL_FROM', 'no-reply@example.test');
      vi.stubEnv('LIFECYCLE_EMAILS_ENABLED', 'false');
      expect(getLifecycleEmailConfig().enabled).toBe(false);
      vi.stubEnv('LIFECYCLE_EMAILS_ENABLED', 'true');
      vi.stubEnv('LIFECYCLE_EMAIL_FROM', '');
      expect(getLifecycleEmailConfig().enabled).toBe(false);
    });

    it.each([
      ['KidHabit Hero <no-reply@kidhabithero.com>', { name: 'KidHabit Hero', email: 'no-reply@kidhabithero.com' }],
      ['"KidHabit Hero" <no-reply@kidhabithero.com>', { name: 'KidHabit Hero', email: 'no-reply@kidhabithero.com' }],
      ['<no-reply@kidhabithero.com>', { email: 'no-reply@kidhabithero.com' }],
      ['no-reply@kidhabithero.com', { email: 'no-reply@kidhabithero.com' }],
    ])('reads the sender %j', (from, expected) => {
      expect(parseEmailSender(from)).toEqual(expected);
    });

    it('sends through Brevo with its key, sender object and the rendered message', async () => {
      vi.stubEnv('LIFECYCLE_EMAILS_ENABLED', 'true');
      vi.stubEnv('LIFECYCLE_EMAIL_PROVIDER', 'brevo');
      vi.stubEnv('BREVO_API_KEY', 'brevo-key');
      vi.stubEnv('LIFECYCLE_EMAIL_FROM', 'KidHabit Hero <no-reply@kidhabithero.com>');
      const fetchMock = vi.fn<(url: string, init: { headers: Record<string, string>; body: string }) => Promise<Response>>(async () => new Response(JSON.stringify({ messageId: '<abc@smtp-relay.mailin.fr>' }), { status: 201, headers: { 'content-type': 'application/json' } }));
      vi.stubGlobal('fetch', fetchMock);
      await expect(sendLifecycleEmail({ to: 'parent@example.test', dedupeKey: 'k1', message })).resolves.toBe('<abc@smtp-relay.mailin.fr>');
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.brevo.com/v3/smtp/email');
      expect(init.headers['api-key']).toBe('brevo-key');
      const body = JSON.parse(init.body);
      expect(body.sender).toEqual({ name: 'KidHabit Hero', email: 'no-reply@kidhabithero.com' });
      expect(body.to).toEqual([{ email: 'parent@example.test' }]);
      expect(body.subject).toContain('KidHabit Hero');
      expect(body.htmlContent).toContain('<!doctype html>');
    });

    it.each([400, 401, 429, 500])('turns a Brevo %i into a retryable provider error', async (status) => {
      vi.stubEnv('LIFECYCLE_EMAILS_ENABLED', 'true');
      vi.stubEnv('LIFECYCLE_EMAIL_PROVIDER', 'brevo');
      vi.stubEnv('BREVO_API_KEY', 'brevo-key');
      vi.stubEnv('LIFECYCLE_EMAIL_FROM', 'no-reply@kidhabithero.com');
      vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ code: 'x' }), { status })));
      await expect(sendLifecycleEmail({ to: 'parent@example.test', dedupeKey: 'k1', message })).rejects.toThrow(`email_provider_${status}`);
    });

    it('refuses to send when Brevo is selected but not configured', async () => {
      vi.stubEnv('LIFECYCLE_EMAILS_ENABLED', 'true');
      vi.stubEnv('LIFECYCLE_EMAIL_PROVIDER', 'brevo');
      vi.stubEnv('BREVO_API_KEY', '');
      vi.stubEnv('LIFECYCLE_EMAIL_FROM', 'no-reply@kidhabithero.com');
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      await expect(sendLifecycleEmail({ to: 'parent@example.test', dedupeKey: 'k1', message })).rejects.toThrow('lifecycle_email_not_configured');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
