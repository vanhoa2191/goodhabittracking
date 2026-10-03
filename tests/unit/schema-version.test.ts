import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EXPECTED_SCHEMA_VERSION } from '@/lib/schema-version';

describe('schema version attestation', () => {
  it('matches the newest migration in the build', () => {
    const versions = readdirSync(new URL('../../supabase/migrations', import.meta.url))
      .filter((name) => name.endsWith('.sql')).map((name) => name.split('_')[0]).sort();
    expect(EXPECTED_SCHEMA_VERSION).toBe(versions.at(-1));
  });
});
