import { describe, expect, it } from 'vitest';
import {
  clearReferralCookieString,
  normalizeReferralCode,
  readReferralCookie,
  referralLink,
  REFERRAL_COOKIE,
} from '@/lib/referral/referral-code';

describe('referral code', () => {
  it.each([
    ['ABCD2345', 'ABCD2345'],
    [' abcd2345 ', 'ABCD2345'],
  ])('accepts %j', (input, expected) => expect(normalizeReferralCode(input)).toBe(expected));

  it.each(['', null, undefined, 'SHORT', 'ABCD234', 'ABCD23456', 'ABCD234O', 'ABCD234I', 'ABCD-345', '<script>'])(
    'ignores %j (wrong length, look-alike letters or symbols)',
    (input) => expect(normalizeReferralCode(input as string | null | undefined)).toBeNull(),
  );

  it('reads the code from a cookie header among other cookies', () => {
    expect(readReferralCookie(`a=1; ${REFERRAL_COOKIE}=abcd2345; b=2`)).toBe('ABCD2345');
    expect(readReferralCookie(`${REFERRAL_COOKIE}=ABCD2345`)).toBe('ABCD2345');
  });

  it('returns nothing for a missing or malformed cookie', () => {
    expect(readReferralCookie('')).toBeNull();
    expect(readReferralCookie('other=ABCD2345')).toBeNull();
    expect(readReferralCookie(`${REFERRAL_COOKIE}=nope`)).toBeNull();
    expect(readReferralCookie(`prefix${REFERRAL_COOKIE}=ABCD2345`)).toBeNull();
  });

  it('builds the share link on the public site and tolerates a trailing slash', () => {
    expect(referralLink('https://kidhabithero.com', 'ABCD2345')).toBe('https://kidhabithero.com/?ref=ABCD2345');
    expect(referralLink('https://kidhabithero.com/', 'ABCD2345')).toBe('https://kidhabithero.com/?ref=ABCD2345');
  });

  it('expires the cookie on the shared parent domain when one is configured', () => {
    expect(clearReferralCookieString('kidhabithero.com')).toContain('Domain=kidhabithero.com');
    expect(clearReferralCookieString('kidhabithero.com')).toContain('Max-Age=0');
    expect(clearReferralCookieString(null)).not.toContain('Domain=');
  });
});
