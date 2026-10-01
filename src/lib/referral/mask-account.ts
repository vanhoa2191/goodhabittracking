export type AffiliateOverviewPayload = {
  readonly payouts?: ReadonlyArray<{ readonly accountNumber: string } & Record<string, unknown>>;
} & Record<string, unknown>;

/** Only finance and super admins transfer money, so support sees the last four digits of a bank account. */
export function maskAccountNumber(accountNumber: string): string {
  const compact = accountNumber.replace(/[\s-]/g, '');
  return compact.length <= 4 ? '••••' : `•••• ${compact.slice(-4)}`;
}

export function maskPayoutAccounts<T extends AffiliateOverviewPayload>(overview: T): T {
  return {
    ...overview,
    payouts: (overview.payouts ?? []).map((payout) => ({ ...payout, accountNumber: maskAccountNumber(String(payout.accountNumber ?? '')) })),
  };
}
