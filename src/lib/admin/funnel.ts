export type FunnelRow = {
  readonly cohortDay: string;
  readonly families: number;
  readonly withChild: number;
  readonly withPairedDevice: number;
  readonly withFirstCompletion: number;
  readonly withTrial: number;
  readonly withPayment: number;
};

export type RetentionSnapshot = {
  readonly familiesTotal: number;
  readonly familiesWithChild: number;
  readonly activeLast7Days: number;
  readonly activeLast30Days: number;
  readonly payingNow: number;
};

export type FunnelStep = { readonly key: keyof Omit<FunnelRow, 'cohortDay'>; readonly count: number; readonly share: number | null };

const STEPS = ['families', 'withChild', 'withPairedDevice', 'withFirstCompletion', 'withTrial', 'withPayment'] as const;

/** Adds up the cohorts and gives each step's share of the families that signed up. */
export function summarizeFunnel(rows: readonly FunnelRow[]): FunnelStep[] {
  const totals = STEPS.map((key) => ({ key, count: rows.reduce((sum, row) => sum + row[key], 0) }));
  const base = totals[0]!.count;
  return totals.map(({ key, count }) => ({ key, count, share: base > 0 ? count / base : null }));
}

type Raw = Record<string, unknown>;

function whole(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : 0;
}

export function parseFunnelRows(data: unknown): FunnelRow[] {
  if (!Array.isArray(data)) return [];
  return (data as Raw[]).map((row) => ({
    cohortDay: String(row.cohort_day ?? '').slice(0, 10),
    families: whole(row.families),
    withChild: whole(row.with_child),
    withPairedDevice: whole(row.with_paired_device),
    withFirstCompletion: whole(row.with_first_completion),
    withTrial: whole(row.with_trial),
    withPayment: whole(row.with_payment),
  }));
}

export function parseRetention(data: unknown): RetentionSnapshot {
  const row = (Array.isArray(data) ? data[0] : data) as Raw | undefined;
  return {
    familiesTotal: whole(row?.families_total),
    familiesWithChild: whole(row?.families_with_child),
    activeLast7Days: whole(row?.active_last_7_days),
    activeLast30Days: whole(row?.active_last_30_days),
    payingNow: whole(row?.paying_now),
  };
}
