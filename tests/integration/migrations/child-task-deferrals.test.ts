import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609250001_child_task_deferrals.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202609250001_child_task_deferrals.verify.sql'), 'utf8');

describe('child task deferral migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('serializes deferral with completion and clears choices only after insertion', () => {
    expect(migration).toContain('for update;');
    expect(migration).toContain('after insert on public.activity_logs');
    expect(migration).toContain('delete from public.child_task_deferrals task');
    expect(migration).toContain("log.status in ('completed', 'pending_approval', 'approved')");
  });
});
