const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const publicPolicyVersion = '2026-09-28';

export function getPublicPolicyConfig() {
  const candidate = process.env.SUPPORT_EMAIL?.trim() ?? '';
  const supportEmail = emailPattern.test(candidate) ? candidate : null;
  return {
    approved: process.env.NEXT_PUBLIC_LEGAL_PAGES_APPROVED === 'true' && supportEmail !== null,
    supportEmail,
  } as const;
}
