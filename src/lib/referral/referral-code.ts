export const REFERRAL_COOKIE = 'kidhabit_ref';
export const REFERRAL_COOKIE_DAYS = 60;

const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;

/** A referral code is 8 characters from an alphabet without look-alikes; anything else is ignored. */
export function normalizeReferralCode(input: string | null | undefined): string | null {
  const candidate = (input ?? '').trim().toUpperCase();
  return CODE_PATTERN.test(candidate) ? candidate : null;
}

export function readReferralCookie(cookieHeader: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== REFERRAL_COOKIE) continue;
    return normalizeReferralCode(decodeURIComponent(part.slice(separator + 1).trim()));
  }
  return null;
}

export function referralLink(marketingOrigin: string, code: string): string {
  return `${marketingOrigin.replace(/\/$/, '')}/?ref=${code}`;
}

export function clearReferralCookieString(domain: string | null): string {
  const attributes = ['Path=/', 'Max-Age=0', 'SameSite=Lax'];
  if (domain) attributes.push(`Domain=${domain}`);
  if (typeof location !== 'undefined' && location.protocol === 'https:') attributes.push('Secure');
  return `${REFERRAL_COOKIE}=; ${attributes.join('; ')}`;
}
