import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202611020001_child_space.sql'), 'utf8');

describe('child space migration', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
  });

  it('keeps both tables behind commands only', () => {
    for (const table of ['child_space_moods', 'child_space_notes']) {
      expect(migration).toContain(`alter table public.${table} force row level security`);
      expect(migration).toContain(`revoke all on public.${table} from public, anon, authenticated`);
    }
  });

  it('lets a manager read shared notes only, and never grants the parent read to anon', () => {
    expect(migration).toContain('n.shared_with_parent');
    expect(migration).toContain('public.can_manage_family(target_family_id)');
    expect(migration).toContain('grant execute on function public.read_parent_child_space(uuid, uuid) to authenticated');
    expect(migration).not.toMatch(/read_parent_child_space[^;]*to anon/);
  });

  it('defaults notes to private', () => {
    expect(migration).toContain('shared_with_parent boolean not null default false');
  });
});
