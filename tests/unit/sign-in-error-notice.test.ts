import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const language = vi.hoisted(() => ({ current: 'vi' as 'vi' | 'ja' }));
vi.mock('@/lib/i18n/context', () => ({ useTranslation: () => ({ language: language.current }) }));

import { SignInErrorNotice } from '@/components/SignInErrorNotice';

describe('SignInErrorNotice', () => {
  it('renders nothing while there is no error', () => {
    expect(renderToStaticMarkup(createElement(SignInErrorNotice, { message: null, onDismiss: () => undefined }))).toBe('');
  });

  it('explains the failure as an alert with the reason and a dismiss button, in the current language', () => {
    language.current = 'vi';
    const vi_ = renderToStaticMarkup(createElement(SignInErrorNotice, { message: 'popup_blocked', onDismiss: () => undefined }));
    expect(vi_).toContain('role="alert"');
    expect(vi_).toContain('Không thể mở đăng nhập Google: popup_blocked');
    expect(vi_).toContain('Đóng');

    language.current = 'ja';
    const ja = renderToStaticMarkup(createElement(SignInErrorNotice, { message: 'popup_blocked', onDismiss: () => undefined }));
    expect(ja).toContain('Googleログインを開けませんでした：popup_blocked');
    expect(ja).not.toMatch(/[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/);
  });
});
