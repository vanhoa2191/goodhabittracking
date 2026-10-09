import { describe, expect, it } from 'vitest';

describe('referralDiscountLine', () => {
  it('names the percentage and the list price in Vietnamese and English', async () => {
    const { referralDiscountLine } = await import('@/lib/i18n/referral-discount-copy');
    expect(referralDiscountLine('vi', 10, '399.000 ₫')).toBe('Đã giảm 10% nhờ mã giới thiệu (giá gốc 399.000 ₫).');
    expect(referralDiscountLine('en', 10, '399,000 ₫')).toBe('10% off with your referral code (list price 399,000 ₫).');
    expect(referralDiscountLine('ja', 10, '399,000 ₫')).toContain('10%');
  });
});
