import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublicPolicyConfig, publicPolicyVersion } from '@/lib/public-policy';

describe('public policy publication gate', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('keeps policy pages unapproved without the explicit build flag', () => {
    vi.stubEnv('NEXT_PUBLIC_LEGAL_PAGES_APPROVED', 'false');
    vi.stubEnv('SUPPORT_EMAIL', '');
    expect(getPublicPolicyConfig()).toEqual({ approved: false, supportEmail: null });
    expect(publicPolicyVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('accepts only a plausible approved support address', () => {
    vi.stubEnv('NEXT_PUBLIC_LEGAL_PAGES_APPROVED', 'true');
    vi.stubEnv('SUPPORT_EMAIL', 'support@example.test');
    expect(getPublicPolicyConfig()).toEqual({ approved: true, supportEmail: 'support@example.test' });
    vi.stubEnv('SUPPORT_EMAIL', 'not-an-email');
    expect(getPublicPolicyConfig()).toEqual({ approved: false, supportEmail: null });
  });

  it('does not publish approved legal routes without a working support address', () => {
    vi.stubEnv('NEXT_PUBLIC_LEGAL_PAGES_APPROVED', 'true');
    vi.stubEnv('SUPPORT_EMAIL', '');
    expect(getPublicPolicyConfig()).toEqual({ approved: false, supportEmail: null });
  });
});
