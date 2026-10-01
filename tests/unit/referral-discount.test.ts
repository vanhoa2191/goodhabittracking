import { describe, expect, it } from 'vitest';
import { discountedPrice } from '@/lib/billing/referral-discount';

describe('discountedPrice', () => {
  it('takes basis points off and rounds the discount down to a whole dong', () => {
    expect(discountedPrice(399000, 1000)).toBe(359100);
    expect(discountedPrice(399001, 1000)).toBe(359101);
    expect(discountedPrice(399000, 1)).toBe(398961);
  });
  it('leaves the price alone for no or invalid discount', () => {
    for (const bps of [0, -5, 1.5, Number.NaN]) expect(discountedPrice(399000, bps)).toBe(399000);
  });
  it('never goes below one dong', () => {
    expect(discountedPrice(1, 5000)).toBe(1);
    expect(discountedPrice(2, 10000)).toBe(1);
  });
});
