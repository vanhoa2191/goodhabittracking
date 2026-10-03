import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CheckoutPaymentDetails } from '@/components/CheckoutPaymentDetails';
import { I18nProvider } from '@/lib/i18n/context';
import { getPaymentErrorCopy } from '@/lib/i18n/payment-error-copy';
import type { Language } from '@/types';

const payment = {
  orderCode: 123456, amount: 49000, description: 'KIDHABIT 123456', accountNumber: '0123456789',
  accountName: 'KIDHABIT HERO', bankBin: '970422', bankName: 'MBBank', qrCode: '000201010212',
  vietQrUrl: 'data:image/png;base64,cXJjb2Rl', checkoutUrl: 'https://pay.payos.vn/web/123456', planId: 'monthly',
};

describe('checkout payment details', () => {
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
