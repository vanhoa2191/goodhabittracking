import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609300003_close_service_function_exposure.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202609300003_close_service_function_exposure.verify.sql'), 'utf8');

const serviceOnly = [
  'process_payos_webhook',
  'claim_lifecycle_messages',
  'enqueue_lifecycle_message',
  'finish_lifecycle_message',
  'schedule_trial_ending_messages',
];

describe('service function exposure migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it.each(serviceOnly)('closes %s to clients and keeps it for the service role', (name) => {
    expect(migration).toContain(`'${name}'`);
    expect(verification).toContain(`'${name}'`);
  });

  it('revokes the direct anon and authenticated grants, not only the public one', () => {
    expect(migration).toContain('revoke all on function %s from public, anon, authenticated');
    expect(migration).toContain('grant execute on function %s to service_role');
  });

  it('retires the pairing exchange that accepted an empty verifier without a replacement grant', () => {
    expect(migration).toContain("'exchange_pairing_challenge'");
    expect(migration).toContain("not like 'exchange_pairing_challenge(%'");
  });
});
