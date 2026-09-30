import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

async function render(flag: string | undefined, language: 'vi' | 'en' = 'vi') {
  vi.resetModules();
  if (flag === undefined) vi.unstubAllEnvs(); else vi.stubEnv('NEXT_PUBLIC_EMAIL_CODE_LOGIN', flag);
  const { EmailCodeSignIn } = await import('@/components/EmailCodeSignIn');
  return renderToStaticMarkup(createElement(EmailCodeSignIn, { language }));
}

describe('EmailCodeSignIn', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('shows nothing until the flag is turned on', async () => {
    expect(await render(undefined)).toBe('');
    expect(await render('false')).toBe('');
  });

  it('starts with the email step, labelled for assistive technology', async () => {
    const html = await render('true');
    expect(html).toContain('Hoặc nhận mã đăng nhập qua email');
    expect(html).toContain('type="email"');
    expect(html).toContain('autoComplete="email"');
    expect(html).toMatch(/<label[^>]*for="[^"]+"[^>]*>Email của ba mẹ<\/label>/);
    expect(html).toContain('Gửi mã đăng nhập');
    expect(html).toContain('disabled');
    expect(html).not.toContain('one-time-code');
  });

  it('follows the app language', async () => {
    expect(await render('true', 'en')).toContain('Or get a sign-in code by email');
  });
});
