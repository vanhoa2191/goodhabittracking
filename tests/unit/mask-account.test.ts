import { describe, expect, it } from 'vitest';
import { maskAccountNumber, maskPayoutAccounts, type AffiliateOverviewPayload } from '@/lib/referral/mask-account';

describe('payout account masking', () => {
  it('keeps only the last four digits', () => {
    expect(maskAccountNumber('0123456789')).toBe('•••• 6789');
    expect(maskAccountNumber('0123 4567-89')).toBe('•••• 6789');
    expect(maskAccountNumber('123')).toBe('••••');
    expect(maskAccountNumber('')).toBe('••••');
  });

  it('masks every payout and leaves the totals alone', () => {
    const masked = maskPayoutAccounts({ affiliates: 2, payouts: [{ id: 'a', accountNumber: '0123456789', amount: 5 }, { id: 'b', accountNumber: '98765432', amount: 7 }] });
    expect(masked.affiliates).toBe(2);
    expect(masked.payouts?.map((payout) => payout.accountNumber)).toEqual(['•••• 6789', '•••• 5432']);
    expect(JSON.stringify(masked)).not.toContain('0123456789');
  });

  it('copes with an overview that has no payouts', () => {
    expect(maskPayoutAccounts<AffiliateOverviewPayload>({ affiliates: 0 }).payouts).toEqual([]);
  });
});
