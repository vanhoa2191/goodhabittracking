import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202610050001_pin_gated_server_wrappers.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202610050001_pin_gated_server_wrappers.verify.sql'), 'utf8');

const wrappers: ReadonlyArray<readonly [string, string, string]> = [
  ['review_habit_command', 'review_habit_command_as', '(uuid, uuid, text)'],
  ['review_habits_command', 'review_habits_command_as', '(uuid, uuid[], text)'],
  ['transition_redemption_command', 'transition_redemption_command_as', '(uuid, uuid, text)'],
  ['adjust_child_points_command', 'adjust_child_points_command_as', '(uuid, uuid, integer, text, uuid)'],
  ['revoke_device_session', 'revoke_device_session_as', '(uuid, uuid)'],
  ['ensure_pairing_credential', 'ensure_pairing_credential_as', '(uuid, uuid, uuid, text, text, text)'],
  ['rotate_pairing_credential', 'rotate_pairing_credential_as', '(uuid, uuid, uuid, text, text, text)'],
  ['delete_owned_family', 'delete_owned_family_as', '(uuid, text)'],
  ['consume_ai_quota', 'consume_ai_quota_as', '(uuid, integer, integer, integer)'],
];

describe('PIN-gated server wrappers migration', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it.each(wrappers)('opens the wrapper of %s to the service role only', (_original, wrapper, signature) => {
    expect(migration).toContain(`revoke all on function public.${wrapper}${signature} from public, anon, authenticated;`);
    expect(migration).toContain(`grant execute on function public.${wrapper}${signature} to service_role;`);
    const grants = migration.split('\n').filter((line) => line.startsWith(`grant execute on function public.${wrapper}(`));
    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatch(/ to service_role;$/);
  });

  it('keeps the identity helper out of every API role', () => {
    expect(migration).toContain('revoke all on function public.act_as_user(uuid) from public, anon, authenticated, service_role;');
    expect(migration).not.toMatch(/grant execute on function public\.act_as_user/);
  });

  it('sets the acting parent for one transaction only', () => {
    expect(migration).toContain("perform set_config('request.jwt.claim.sub', actor_user_id::text, true);");
    expect(migration).toMatch(/'request\.jwt\.claims',[\s\S]*?true\s*\)/);
    expect(migration).toContain("raise exception 'actor_not_found'");
  });

  it('runs every function with a protected search path', () => {
    const count = wrappers.length + 1;
    expect(migration.match(/create or replace function/g)).toHaveLength(count);
    expect(migration.match(/set search_path = ''/g)).toHaveLength(count);
    expect(migration.match(/security definer/g)).toHaveLength(count);
  });

  it.each(wrappers)('the wrapper of %s names the actor first and then runs the original unchanged', (original, wrapper) => {
    const start = migration.indexOf(`create or replace function public.${wrapper}(`);
    expect(start).toBeGreaterThan(-1);
    const body = migration.slice(start, migration.indexOf('$$;', start));
    const actor = body.indexOf('perform public.act_as_user(actor_user_id);');
    expect(actor).toBeGreaterThan(-1);
    expect(actor).toBeLessThan(body.indexOf(`public.${original}(`));
  });

  it('does not close the originals yet, so the code that is already deployed keeps working', () => {
    for (const [original] of wrappers) {
      expect(migration).not.toMatch(new RegExp(`revoke [^;]*on function public\\.${original}\\(`));
    }
  });
});
