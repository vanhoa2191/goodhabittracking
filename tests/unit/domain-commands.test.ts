import { describe, expect, it } from 'vitest';
import { domainCommandSchema } from '@/lib/domain/commands';

const uuid = '11111111-1111-4111-8111-111111111111';
const base = { type: 'adjustPoints', childId: uuid, reason: 'Extra help', commandId: uuid } as const;

describe('adjustPoints command', () => {
  it.each([10, -25, 1000, -1000])('accepts %i', (amount) => {
    expect(domainCommandSchema.safeParse({ ...base, amount }).success).toBe(true);
  });

  it.each([0, 1001, -1001, 2.5])('rejects %s', (amount) => {
    expect(domainCommandSchema.safeParse({ ...base, amount }).success).toBe(false);
  });

  it('limits the reason and refuses unknown fields', () => {
    expect(domainCommandSchema.safeParse({ ...base, amount: 5, reason: 'x'.repeat(121) }).success).toBe(false);
    expect(domainCommandSchema.safeParse({ ...base, amount: 5, userId: 'someone' }).success).toBe(false);
  });
});
