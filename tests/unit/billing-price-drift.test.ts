import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PAID_PLAN_IDS, PLAN_PRICES, planCycle, planTier } from '@/lib/billing/plan-catalog';

describe('database checkout price catalog', () => {
  it('charges every sellable plan at the same list price as the application catalog', () => {
    const migration = readFileSync(resolve('supabase/migrations/202610110001_pro_plus_and_addons.sql'), 'utf8');
    const priceCase = migration.match(/list_price := case selected_plan([\s\S]*?)end;/)?.[1];
    expect(priceCase).toBeDefined();
    const amounts = Object.fromEntries(Array.from(priceCase!.matchAll(/when '([^']+)' then (\d+)/g), ([, plan, amount]) => [plan, Number(amount)]));
    expect(Object.keys(amounts).sort()).toEqual([...PAID_PLAN_IDS, 'ai_addon_monthly', 'printables'].sort());
    expect(PAID_PLAN_IDS).toContain('pro_plus_monthly');
    expect(PAID_PLAN_IDS).toContain('pro_plus_yearly');
    expect(amounts.ai_addon_monthly).toBe(29000);
    expect(amounts.printables).toBe(99000);
    for (const plan of PAID_PLAN_IDS) expect(amounts[plan]).toBe(PLAN_PRICES[planTier(plan)][planCycle(plan)]);
  });
});
