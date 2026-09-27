import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

function latestProfileMutationMigration(): string {
  const migrationDirectory = resolve('supabase/migrations');
  const filename = readdirSync(migrationDirectory)
    .filter((candidate) => candidate.endsWith('.sql'))
    .sort()
    .reverse()
    .find((candidate) =>
      readFileSync(resolve(migrationDirectory, candidate), 'utf8')
        .includes('create or replace function public.mutate_child_profile_command'),
    );

  if (!filename) throw new Error('Profile mutation migration not found.');
  return readFileSync(resolve(migrationDirectory, filename), 'utf8');
}

describe('profile starter activities migration', () => {
  it('converts recurrence day arrays to the jsonb column type', async () => {
    const migration = latestProfileMutationMigration();

    await expect(parse(migration)).resolves.toBeDefined();
    expect(migration).toContain(
      'to_jsonb(activity."recurrenceDays")',
    );
  });
});
