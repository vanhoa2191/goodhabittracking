import { describe, expect, it } from 'vitest';
import { createOrderCode, isUniqueViolation } from '@/lib/billing/order-code';

describe('createOrderCode', () => {
  it('keeps the 15-digit shape already used with PayOS and a payment description within 25 characters', () => {
    const code = createOrderCode(Date.UTC(2026, 9, 1), () => 99);
    expect(Number.isSafeInteger(code)).toBe(true);
    expect(String(code)).toHaveLength(15);
    expect(`KIDHABIT ${code}`.length).toBeLessThanOrEqual(25);
  });

  it('only ever adds two digits, 00 to 99', () => {
    const codes = Array.from({ length: 500 }, () => createOrderCode(1_790_000_000_000) - 179_000_000_000_000);
    expect(Math.min(...codes)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...codes)).toBeLessThanOrEqual(99);
    expect(new Set(codes).size).toBeGreaterThan(60);
  });

  it('orders codes by time so a later checkout never gets a smaller code', () => {
    expect(createOrderCode(2, () => 0)).toBeGreaterThan(createOrderCode(1, () => 99));
  });
});

describe('isUniqueViolation', () => {
  it('recognises only a duplicate key', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
    expect(isUniqueViolation({ code: '42501' })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
