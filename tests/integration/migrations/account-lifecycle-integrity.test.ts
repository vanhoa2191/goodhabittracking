import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609300007_account_lifecycle_integrity.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202609300007_account_lifecycle_integrity.verify.sql'), 'utf8');

function definition(name: string): string {
  const start = migration.indexOf(`create or replace function public.${name}(`);
  expect(start, `${name} is defined`).toBeGreaterThan(-1);
  return migration.slice(start, migration.indexOf('\n$$;', start));
}

describe('account lifecycle integrity migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('replaces only an untouched automatic family when accepting an invitation', () => {
    const accept = definition('accept_caregiver_invite');
    for (const guard of [
      'family.created_by = actor_id',
      'public.child_profiles child',
      'public.habit_activities activity',
      'public.rewards reward',
      'public.payment_orders payment_order',
      'other.user_id <> actor_id',
      "subscription.plan <> 'free' or subscription.trial_consumed_at is not null",
    ]) {
      expect(accept).toContain(guard);
    }
    expect(accept).toContain('delete from public.families where id = own_family_id;');
    expect(accept).toContain("raise exception 'account_already_belongs_to_family'");
  });

  it('never lets someone join the family they are already in', () => {
    expect(definition('accept_caregiver_invite')).toContain('if own_family_id = target.family_id then');
  });

  it('keeps the payment facts and drops provider payloads when a family is deleted', () => {
    const deletion = definition('delete_owned_family');
    expect(deletion).toContain("jsonb_build_object('orderCode', event.order_code, 'minimised', true)");
    expect(deletion).toContain("metadata = jsonb_build_object('minimised', true)");
    expect(deletion).toContain('payment_url = null');
    expect(deletion).not.toContain('delete from public.payment_orders');
    expect(deletion.indexOf('minimised')).toBeLessThan(deletion.indexOf('delete from public.families'));
  });

  it('recovers messages stranded in processing and dead-letters exhausted ones', () => {
    const claim = definition('claim_lifecycle_messages');
    expect(claim).toContain("message.status = 'processing' and message.locked_at < now() - interval '10 minutes'");
    expect(claim).toContain("set status = 'dead_letter'");
    expect(migration).toContain('grant execute on function public.claim_lifecycle_messages(integer) to service_role;');
  });
});
