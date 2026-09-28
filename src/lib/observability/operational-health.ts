export const OPERATIONAL_THRESHOLDS = {
  paymentWebhookFailures: 3,
  profileMutationFailures: 5,
  pairingFailures: 20,
  deadLetters: 1,
  stuckOutbox: 1,
} as const;

export type OperationalHealthInput = {
  readonly paymentWebhookFailures: number;
  readonly profileMutationFailures: number;
  readonly pairingFailures: number;
  readonly deadLetters: number;
  readonly stuckOutbox: number;
};

export type OperationalAlert = {
  readonly signal: keyof OperationalHealthInput;
  readonly value: number;
  readonly threshold: number;
};

export function evaluateOperationalHealth(input: OperationalHealthInput): {
  readonly ready: boolean;
  readonly alerts: readonly OperationalAlert[];
} {
  const thresholds: Record<keyof OperationalHealthInput, number> = {
    paymentWebhookFailures: OPERATIONAL_THRESHOLDS.paymentWebhookFailures,
    profileMutationFailures: OPERATIONAL_THRESHOLDS.profileMutationFailures,
    pairingFailures: OPERATIONAL_THRESHOLDS.pairingFailures,
    deadLetters: OPERATIONAL_THRESHOLDS.deadLetters,
    stuckOutbox: OPERATIONAL_THRESHOLDS.stuckOutbox,
  };
  const alerts = (Object.keys(thresholds) as (keyof OperationalHealthInput)[])
    .filter((signal) => input[signal] >= thresholds[signal])
    .map((signal) => ({ signal, value: input[signal], threshold: thresholds[signal] }));
  return { ready: alerts.length === 0, alerts };
}
