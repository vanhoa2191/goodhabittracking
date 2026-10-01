/**
 * Order codes keep the 15-digit shape production already uses with PayOS: the time in milliseconds followed by two
 * random digits. Two checkouts in the same millisecond collide only one time in a hundred, and the caller
 * retries on that one, so a collision never reaches the customer.
 */
export function createOrderCode(now: number = Date.now(), random: () => number = randomHundred): number {
  return now * 100 + random();
}

function randomHundred(): number {
  // Rejection sampling keeps the two digits uniform.
  const limit = 256 - (256 % 100);
  for (;;) {
    const value = crypto.getRandomValues(new Uint8Array(1))[0];
    if (value < limit) return value % 100;
  }
}

/** Postgres reports a duplicate key as 23505. */
export function isUniqueViolation(error: { code?: string } | null | undefined): boolean {
  return error?.code === '23505';
}
