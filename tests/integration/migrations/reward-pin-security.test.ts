import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from '@libpg-query/parser';

const migration = readFileSync(resolve('supabase/migrations/202610120001_reward_pin_security.sql'), 'utf8');
const rollback = readFileSync(resolve('supabase/rollbacks/202610120001_reward_pin_security.rollback.sql'), 'utf8');

describe('reward PIN grants migration', () => {
  it('revokes authenticated reward mutations while preserving read access', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    expect(migration).toMatch(/revoke\s+insert\s*,\s*update\s*,\s*delete\s+on\s+table\s+public\.rewards\s+from\s+authenticated/i);
    expect(migration).not.toMatch(/revoke\s+select/i);
  });

  it('has a rollback that restores the prior mutation grants', async () => {
    await expect(parse(rollback)).resolves.toBeDefined();
    expect(rollback).toMatch(/grant\s+insert\s*,\s*update\s*,\s*delete\s+on\s+table\s+public\.rewards\s+to\s+authenticated/i);
  });
});
