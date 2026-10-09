import { describe, expect, it } from 'vitest';
import { PRICING_PLANS } from '@/lib/payos';
describe('billing catalog claims', () => {
  it('does not claim instant sync, competition, obsolete catalog content or milk-tea pricing', () => {
    expect(JSON.stringify(PRICING_PLANS)).not.toMatch(/Đồng bộ tức thì|thi đua|7 Bố thí|1\/2 ly trà sữa/);
  });
});
