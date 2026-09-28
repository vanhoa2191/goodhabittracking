import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const route = (name: string) => readFileSync(
  join(process.cwd(), `src/app/api/admin/${name}/route.ts`),
  'utf8',
);

describe('admin route security contract', () => {
  it('removes email-only authorization from every admin API', () => {
    for (const name of ['customers', 'subscriptions', 'coupons', 'billing-cases', 'access']) {
      const source = route(name);
      expect(source).toContain('authorizeAdmin');
      expect(source).not.toContain('isAdminUser');
    }
  });

  it('requires AAL2, an explicit reason and an immutable audit for high-impact mutations', () => {
    for (const name of ['subscriptions', 'coupons', 'billing-cases', 'access']) {
      const source = route(name);
      expect(source).toContain('requireAal2: true');
      expect(source).toContain('recordAdminAudit');
    }
    expect(route('subscriptions')).toMatch(/reason:\s*z\.string\(\)/);
    expect(route('coupons')).toMatch(/reason:\s*z\.string\(\)/);
    expect(route('billing-cases')).toMatch(/reason:\s*z\.string\(\)/);
    expect(route('access')).toMatch(/reason:\s*z\.string\(\)/);
  });
});
