import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from '@libpg-query/parser';

const migration = readFileSync(resolve('supabase/migrations/202609230003_daily_mascot_letter.sql'), 'utf8');
const rollback = readFileSync(resolve('supabase/rollbacks/202609230003_daily_mascot_letter.rollback.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202609230003_daily_mascot_letter.verify.sql'), 'utf8');

describe('daily mascot letter migration', () => {
  it('has valid PostgreSQL syntax and a reversible function', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(rollback)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('checks family and paired-child authority before writing a dated letter', () => {
    expect(migration).toContain('public.can_manage_family(child_row.family_id)');
    expect(migration).toContain('session_row.child_id = target_child_id');
    expect(migration).toContain('session_row.family_id = child_row.family_id');
    expect(migration).toContain("'child:complete' = any(session_row.capabilities)");
    expect(migration).toContain('on conflict (child_id, local_date) do nothing');
  });
});
