import { describe, expect, it } from 'vitest';
import { buildLocalCityItem, cityItems, parseCityPurchase } from '@/lib/dream-city';

const garden = cityItems.find((item) => item.id === 'garden');

describe('dream city', () => {
  it('spends available points once while preserving earned progress', () => {
    expect(garden?.cost).toBe(30);
    const result = buildLocalCityItem({ points: 50, totalEarned: 150 }, [], 'garden');
    expect(result).toEqual({ status: 'built', points: 20, totalEarned: 150, builtIds: ['garden'] });
  });

  it('does not charge twice or allow a purchase without enough points', () => {
    expect(buildLocalCityItem({ points: 50, totalEarned: 150 }, ['garden'], 'garden')).toMatchObject({
      status: 'already_built', points: 50, totalEarned: 150,
    });
    expect(buildLocalCityItem({ points: 29, totalEarned: 150 }, [], 'garden')).toMatchObject({
      status: 'insufficient_points', points: 29, totalEarned: 150,
    });
  });

  it('parses one family-scoped permanent purchase', () => {
    expect(parseCityPurchase({
      family_id: '11111111-1111-4111-8111-111111111111',
      child_id: '22222222-2222-4222-8222-222222222222',
      item_id: 'garden',
      points_spent: 30,
      purchased_at: '2026-09-26T10:00:00.000Z',
    }).item_id).toBe('garden');
  });
});
