import { z } from 'zod';

export const cityItems = [
  { id: 'garden', cost: 30 },
  { id: 'library', cost: 60 },
  { id: 'bridge', cost: 90 },
  { id: 'observatory', cost: 120 },
] as const;

export const cityItemIdSchema = z.enum(['garden', 'library', 'bridge', 'observatory']);
export type CityItemId = z.infer<typeof cityItemIdSchema>;

export const cityPurchaseSchema = z.object({
  family_id: z.string().uuid(),
  child_id: z.string().uuid(),
  item_id: cityItemIdSchema,
  points_spent: z.number().int().positive(),
  purchased_at: z.string().datetime({ offset: true }),
});

export type CityPurchase = z.infer<typeof cityPurchaseSchema>;

export function parseCityPurchase(input: unknown): CityPurchase {
  return cityPurchaseSchema.parse(input);
}

export function parseCityPurchases(input: unknown): CityPurchase[] {
  return z.array(cityPurchaseSchema).parse(input);
}

type CityBalance = {
  readonly points: number;
  readonly totalEarned: number;
};

type LocalCityResult = CityBalance & {
  readonly status: 'built' | 'already_built' | 'insufficient_points';
  readonly builtIds: readonly CityItemId[];
};

export function buildLocalCityItem(
  balance: CityBalance,
  builtIds: readonly CityItemId[],
  itemId: CityItemId,
): LocalCityResult {
  if (builtIds.includes(itemId)) return { ...balance, status: 'already_built', builtIds };
  const item = cityItems.find((candidate) => candidate.id === itemId);
  if (!item || balance.points < item.cost) {
    return { ...balance, status: 'insufficient_points', builtIds };
  }
  return {
    status: 'built',
    points: balance.points - item.cost,
    totalEarned: balance.totalEarned,
    builtIds: [...builtIds, itemId],
  };
}
