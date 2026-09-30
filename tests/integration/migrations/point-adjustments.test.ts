import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609300009_point_adjustments.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202609300009_point_adjustments.verify.sql'), 'utf8');

describe('point adjustment migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('needs manage rights, a bounded non-zero amount and a locked child row', () => {
    expect(migration).toContain('public.can_manage_family(actor_family_id)');
    expect(migration).toContain('amount not between -1000 and 1000');
    expect(migration).toContain('where id = target_child_id and family_id = actor_family_id for update;');
  });

  it('is idempotent per command and never takes the balance below zero', () => {
    expect(migration).toContain("return jsonb_build_object('status', 'duplicate'");
    expect(migration).toContain('next_points := greatest(0, child.points + amount);');
  });

  it('only raises lifetime points for a bonus, like the local behaviour', () => {
    expect(migration).toContain('next_total := child.total_earned + greatest(0, applied);');
  });

  it('keeps the history private and stores the reason', () => {
    expect(migration).toContain('alter table public.child_point_adjustments force row level security;');
    expect(migration).toContain('revoke all on public.child_point_adjustments from public, anon, authenticated;');
    expect(migration).toContain('char_length(reason) <= 120');
  });
});
