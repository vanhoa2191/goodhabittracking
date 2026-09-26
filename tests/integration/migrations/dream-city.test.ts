import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';
import { cityItems } from '@/lib/dream-city';

const migration = readFileSync(resolve('supabase/migrations/202609260002_dream_city.sql'), 'utf8');

describe('dream city migration', () => {
  it('is valid PostgreSQL and keeps purchases family-scoped and server-authoritative', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    expect(migration).toContain('foreign key (child_id, family_id)');
    expect(migration).toContain('force row level security');
    expect(migration).toContain('for update');
    expect(migration).toContain('set points = points - item_cost');
    expect(migration).not.toContain('set total_earned =');
    expect(migration).toContain('public.can_manage_family(target_family_id)');
    expect(migration).toContain("'child:read' = any(device.capabilities)");
    expect(migration).toContain("'child:complete' = any(device.capabilities)");
    expect(migration).toContain('revoke all on function public.purchase_city_item_internal');
    const databaseCosts = [...migration.matchAll(/when '([a-z]+)' then (\d+)/g)]
      .map((match) => [match[1], Number(match[2])]);
    expect(databaseCosts).toEqual(cityItems.map((item) => [item.id, item.cost]));
  });
});
