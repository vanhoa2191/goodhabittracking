import { afterEach, describe, expect, it, vi } from 'vitest';
import {
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
    const keys = ['welcome_setup', 'trial_ending', 'payment_receipt', 'support_status', 'refund_status', 'subscription_cancelled'] as const;
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
        for (const link of links) expect(link).toMatch(/^https:\/\/app\.kidhabithero\.com\//);
      }
    }
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
    }));
  });
});
