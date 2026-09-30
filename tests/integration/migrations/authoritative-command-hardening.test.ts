import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609300004_authoritative_command_hardening.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202609300004_authoritative_command_hardening.verify.sql'), 'utf8');

function definition(name: string): string {
  const start = migration.indexOf(`create or replace function public.${name}(`);
  expect(start, `${name} is defined`).toBeGreaterThan(-1);
  return migration.slice(start, migration.indexOf('\n$$;', start));
}

describe('authoritative command hardening migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it.each(['complete_habit_command', 'complete_child_habit_command'])(
    '%s only accepts days within a day of the server date on either side',
    (name) => {
      const body = definition(name);
      expect(body).toContain('target_log_date not between current_date - 2 and current_date + 1');
      expect(body).toContain("raise exception 'log_date_out_of_range'");
    },
  );

  it.each([
    'complete_habit_command',
    'undo_habit_command',
    'review_habit_command',
    'redeem_reward_command',
    'transition_redemption_command',
  ])('%s requires manage rights, not only membership', (name) => {
    expect(definition(name)).toContain('public.can_manage_family(actor_family_id)');
  });

  it.each(['undo_habit_command', 'undo_child_habit_command'])(
    '%s refuses to take back points that were already spent',
    (name) => {
      const body = definition(name);
      expect(body).toContain('child.points < log_row.points_awarded');
      expect(body).toContain("'points_already_spent'");
      expect(body).not.toContain('greatest(0, points -');
    },
  );

  it('keeps anonymous execution to child device functions, the pairing exchange and the public board', () => {
    expect(migration).toContain("not like '%session_token_hash%'");
    expect(migration).toContain("'exchange_pairing_credential', 'get_public_leaderboard'");
    expect(migration).toContain('alter default privileges in schema public revoke execute on functions from public, anon;');
    expect(migration).toContain('revoke execute on function %s from public, anon');
    expect(migration).toContain('grant execute on function %s to authenticated');
  });

  it('removes anonymous table access and cuts secret columns from signed-in parents', () => {
    expect(migration).toContain('revoke all on all tables in schema public from anon;');
    expect(migration).toContain('revoke truncate, references, trigger on all tables in schema public from authenticated;');
    const parentSettingsGrant = migration.slice(migration.indexOf('grant select (family_id, family_title'));
    expect(parentSettingsGrant.slice(0, parentSettingsGrant.indexOf(';'))).not.toContain('parent_pin_hash');
    const deviceGrant = migration.slice(migration.indexOf('grant select (id, family_id, child_id, capabilities'));
    expect(deviceGrant.slice(0, deviceGrant.indexOf(';'))).not.toContain('token_hash');
    expect(migration).toContain('revoke select on public.pairing_credentials, public.pairing_challenges from authenticated;');
  });

  it('keeps direct writes only where a route still needs them', () => {
    const first = migration.indexOf('revoke insert, update, delete on');
    const revoked = migration.slice(first, migration.indexOf('from authenticated;', first));
    for (const table of ['child_profiles', 'parent_settings', 'family_memberships', 'families', 'kudos']) {
      expect(revoked).toContain(`public.${table}`);
    }
    for (const table of ['habit_activities', 'rewards', 'family_consents']) {
      expect(revoked).not.toContain(`public.${table}`);
    }
  });
});
