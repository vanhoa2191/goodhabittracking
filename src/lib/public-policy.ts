const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export { legalVersion as publicPolicyVersion } from '../../apps/marketing/legal-content.mjs';

export function getPublicPolicyConfig() {
  const candidate = process.env.SUPPORT_EMAIL?.trim() ?? '';
  return {
    approved: process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true',
    supportEmail: emailPattern.test(candidate) ? candidate : null,
  } as const;
}
