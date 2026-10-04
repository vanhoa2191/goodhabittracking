import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202610050002_close_pin_gated_originals.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202610050002_close_pin_gated_originals.verify.sql'), 'utf8');
const wrapperMigration = readFileSync(resolve('supabase/migrations/202610050001_pin_gated_server_wrappers.sql'), 'utf8');

const originals = [
  'review_habit_command(uuid, text)',
  'review_habits_command(uuid[], text)',
  'transition_redemption_command(uuid, text)',
  'adjust_child_points_command(uuid, integer, text, uuid)',
  'revoke_device_session(uuid)',
  'ensure_pairing_credential(uuid, uuid, text, text, text)',
  'rotate_pairing_credential(uuid, uuid, text, text, text)',
  'delete_owned_family(text)',
  'consume_ai_quota(integer, integer, integer)',
];

describe('close the PIN-gated originals migration', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it.each(originals)('closes %s to every API role', (signature) => {
    expect(migration).toContain(`revoke all on function public.${signature} from public, anon, authenticated, service_role;`);
  });

  it('grants nothing', () => {
    const statements = migration.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n');
    expect(statements).not.toMatch(/\bgrant\b/i);
  });

  it('only runs after the migration that adds the wrappers', () => {
    for (const original of originals) {
      const name = original.split('(')[0];
      expect(wrapperMigration).toContain(`public.${name}_as(`);
    }
  });
});
