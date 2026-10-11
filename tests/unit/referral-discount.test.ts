import { describe, expect, it } from 'vitest';

describe('referralDiscountLine', () => {
  it('names the discount amount and the referrer in Vietnamese and English', async () => {
    const { referralDiscountLine } = await import('@/lib/i18n/referral-discount-copy');
    expect(referralDiscountLine('vi', '40.000 ₫', 'Lan')).toBe('Ba/mẹ được giảm 40.000 ₫ thông qua giới thiệu của Lan.');
    expect(referralDiscountLine('en', '40,000 ₫', 'Lan')).toBe('You save 40,000 ₫ thanks to a referral from Lan.');
  });

  it('falls back to another parent for a missing or blank name', async () => {
    const { referralDiscountLine } = await import('@/lib/i18n/referral-discount-copy');
    expect(referralDiscountLine('vi', '40.000 ₫', null)).toBe('Ba/mẹ được giảm 40.000 ₫ thông qua giới thiệu của một phụ huynh khác.');
    expect(referralDiscountLine('vi', '40.000 ₫', '  ')).toBe('Ba/mẹ được giảm 40.000 ₫ thông qua giới thiệu của một phụ huynh khác.');
    expect(referralDiscountLine('en', '40,000 ₫', null)).toBe('You save 40,000 ₫ thanks to a referral from another parent.');
  });
});
