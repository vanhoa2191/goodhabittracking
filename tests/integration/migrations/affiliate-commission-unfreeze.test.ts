import { readFileSync } from 'node:fs';
import { parse, parsePlPgSQL } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const name = '202610090040_affiliate_commission_unfreeze';
const migration = readFileSync(`supabase/migrations/${name}.sql`, 'utf8');
const verification = readFileSync(`supabase/preflight/${name}.verify.sql`, 'utf8');
const scenarios = readFileSync('tests/integration/migrations/affiliate-commission-unfreeze.scenarios.sql', 'utf8');
describe('admin commission unfreeze SQL syntax', () => {
  it('parses the migration functions and regression scenarios', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parsePlPgSQL(migration)).resolves.toBeDefined();
    await expect(parse(scenarios)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });
});
