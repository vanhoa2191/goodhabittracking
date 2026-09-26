import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609260001_child_journal.sql'), 'utf8');

describe('child journal migration', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
  });

  it('keeps child free text private and routes writes through scoped commands', () => {
    expect(migration).toContain('alter table public.child_journal_entries force row level security');
    expect(migration).toContain('revoke all on public.child_journal_entries from public, anon, authenticated');
    expect(migration).toContain('public.save_parent_child_journal');
    expect(migration).toContain('public.save_child_journal');
    expect(migration).toContain('public.read_child_journal');
  });
});
