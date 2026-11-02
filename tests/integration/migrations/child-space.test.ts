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

const phase2 = readFileSync(resolve('supabase/migrations/202611030001_child_space_phase2.sql'), 'utf8');
const rollback = readFileSync(resolve('supabase/rollbacks/202611030001_child_space_phase2.rollback.sql'), 'utf8');

describe('child space phase 2 migration', () => {
  it('parses as PostgreSQL SQL, rollback included', async () => {
    await expect(parse(phase2)).resolves.toBeDefined();
    await expect(parse(rollback)).resolves.toBeDefined();
  });

  it('keeps both new tables behind commands only', () => {
    for (const table of ['child_space_weekly_goals', 'child_space_letters']) {
      expect(phase2).toContain(`alter table public.${table} force row level security`);
      expect(phase2).toContain(`revoke all on public.${table} from public, anon, authenticated`);
    }
  });

  it('lets only a family manager answer a letter and never exposes weekly goals to parents', () => {
    expect(phase2).toContain('public.can_manage_family(target_family_id)');
    expect(phase2).toContain('grant execute on function public.respond_child_space_letter(uuid, uuid, boolean) to authenticated');
    expect(phase2).not.toMatch(/respond_child_space_letter[^;]*to anon/);
    const parentRead = phase2.slice(phase2.indexOf('function public.read_parent_child_space'));
    expect(parentRead).not.toContain('child_space_weekly_goals');
  });
});
