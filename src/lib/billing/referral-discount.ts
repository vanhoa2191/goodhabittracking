/** The price after taking `bps` basis points off, rounded down to a whole đồng (never below 1). */
export function discountedPrice(listPrice: number, bps: number): number {
  if (!Number.isInteger(bps) || bps <= 0) return listPrice;
  return Math.max(1, listPrice - Math.floor((listPrice * bps) / 10000));
}
