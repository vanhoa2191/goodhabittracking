import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CheckoutPaymentDetails } from '@/components/CheckoutPaymentDetails';
import { I18nProvider } from '@/lib/i18n/context';
import { getPaymentErrorCopy } from '@/lib/i18n/payment-error-copy';
import type { Language } from '@/types';
import type { PaymentResult } from '@/lib/payos';

const payment = {
  orderCode: 123456, amount: 49000, description: 'KIDHABIT 123456', accountNumber: '0123456789',
  accountName: 'KIDHABIT HERO', bankBin: '970422', bankName: 'MBBank', qrCode: '000201010212',
  vietQrUrl: 'data:image/png;base64,cXJjb2Rl', checkoutUrl: 'https://pay.payos.vn/web/123456', planId: 'monthly',
};

describe('checkout payment details', () => {
  function renderPayment(overrides: Partial<PaymentResult> & { discountPercent?: number }) {
    const details = createElement(CheckoutPaymentDetails, {
      payment: { ...payment, ...overrides }, copiedField: null, statusErrorMessage: null, onCopy: () => undefined,
    });
    const providerProps = { initialLanguage: 'vi' as const, children: null };
    return renderToStaticMarkup(createElement(I18nProvider, providerProps, details));
  }

  it('shows the referral savings and referrer name', () => {
    const html = renderPayment({ amount: 359000, listPrice: 399000, discountAmount: 40000, referrerName: 'Lan' });
    expect(html).toMatch(/Ba\/mẹ được giảm 40\.000[^<]*Lan\./);
  });

  it('renders a referrer name containing markup as literal text', () => {
    const html = renderPayment({ discountAmount: 40000, referrerName: '<b>x</b>' });
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).not.toMatch(/<b(?:\s|>)/);
  });

  it('uses another parent when the referrer name is unavailable', () => {
    const html = renderPayment({ discountAmount: 40000, referrerName: null });
    expect(html).toMatch(/Ba\/mẹ được giảm 40\.000[^<]*một phụ huynh khác\./);
  });

  it('shows the actual savings and fallback name for a legacy payment', () => {
    const html = renderPayment({ discountPercent: 10, listPrice: 399000, amount: 359100 });
    expect(html).toMatch(/Ba\/mẹ được giảm 39\.900[^<]*một phụ huynh khác\./);
  });

  it.each<Language>(['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'])('announces a translated status failure in %s and has no countdown', (language) => {
    const message = getPaymentErrorCopy(language).status.status_failed;
    const providerProps = { initialLanguage: language, children: null };
    const details = createElement(CheckoutPaymentDetails, { payment, copiedField: null, statusErrorMessage: message, onCopy: () => undefined });
    const html = renderToStaticMarkup(createElement(I18nProvider, providerProps, details));
    const escaped = renderToStaticMarkup(createElement('span', null, message)).slice(6, -7);
    expect(html).toContain('role="alert"');
    expect(html).toContain(escaped);
    expect(html).not.toMatch(/15:00|00:00|payment\.timer/);
    expect(html).toContain(payment.accountNumber);
    expect(html).toContain(payment.description);
    const copyButtons = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].filter(([button]) => button.includes('lucide-copy'));
    expect(copyButtons).toHaveLength(3);
    for (const [button] of copyButtons) expect(button).toContain('min-h-11');
  });
});
