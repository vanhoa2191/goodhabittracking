import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609250002_analytics_parent_consent.sql'), 'utf8');

describe('analytics parent consent migration', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
  });

  it('adds analytics without removing the existing consent scopes', () => {
    for (const scope of ['privacy', 'child_data', 'leaderboard', 'analytics']) {
      expect(migration).toContain(`'${scope}'`);
    }
  });
});
