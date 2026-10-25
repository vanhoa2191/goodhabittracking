import { readFileSync } from 'node:fs';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const load = (path: string) => readFileSync(path, 'utf8');
const migration = load('supabase/migrations/202610250001_daily_living_template_refs.sql');
const verification = load('supabase/preflight/202610250001_daily_living_template_refs.verify.sql');
const rollback = load('supabase/rollbacks/202610250001_daily_living_template_refs.rollback.sql');

describe('daily living template namespace migration', () => {
  it('parses the migration, verification and rollback as PostgreSQL', async () => {
    for (const sql of [migration, verification, rollback]) await expect(parse(sql)).resolves.toBeDefined();
  });

  it('widens only the existing template check without rewriting rows or changing privileges', () => {
    expect(migration).toContain('^WIT-(NUT|GIV|VIR|MIN|PER|WIS|CAP|PHY|DLY)-[0-9]{2}$');
    expect(migration).toContain('legacy_template_id is null');
    expect(migration).toContain('drop constraint if exists habit_activities_legacy_template_id_check');
    expect(migration).not.toMatch(/\b(insert|update|delete|grant|revoke|create policy)\b/i);
  });

  it('refuses rollback before changing the check when daily living rows still exist', () => {
    expect(rollback).toContain("legacy_template_id like 'WIT-DLY-%'");
    expect(rollback).toContain("raise exception 'daily_living_template_rows_prevent_rollback'");
    expect(rollback.indexOf('raise exception')).toBeLessThan(rollback.indexOf('drop constraint'));
    expect(rollback).toContain('^WIT-(NUT|GIV|VIR|MIN|PER|WIS|CAP|PHY)-[0-9]{2}$');
    expect(verification).toContain('convalidated');
    expect(verification).toContain('daily_living_template_rollback_blocked');
  });
});
