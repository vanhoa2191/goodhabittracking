import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(path), 'utf8');
const migration = read('supabase/migrations/202610040002_habit_graduation.sql');
const verification = read('supabase/preflight/202610040002_habit_graduation.verify.sql');
const rollback = read('supabase/rollbacks/202610040002_habit_graduation.rollback.sql');

describe('habit graduation migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    for (const sql of [migration, verification, rollback]) await expect(parse(sql)).resolves.toBeDefined();
  });

  it('returns the new columns from the family snapshot and the graduated habits, marked, to a paired child', () => {
    const snapshot = migration.slice(migration.indexOf('function public.family_snapshot('));
    expect(snapshot).toContain("'graduated_at', t.graduated_at, 'graduation_check_due', t.graduation_check_due, 'base_points', t.base_points");
    expect(snapshot).not.toMatch(/to_jsonb\(/);
    const child = migration.slice(migration.indexOf('function public.get_child_session('));
    expect(child).toContain("'graduatedAt', activity.graduated_at");
    expect(child).toContain('(activity.is_active or activity.graduated_at is not null)');
  });

  it('adds the three columns without new policies, so child devices gain no way in', () => {
    for (const column of ['graduated_at timestamptz', 'graduation_check_due date', 'base_points integer']) {
      expect(migration).toContain(`add column if not exists ${column}`);
    }
    expect(migration).not.toMatch(/\bcreate policy\b|\balter policy\b/i);
  });

  it('keeps the base stars in range and a check day only on a graduated habit', () => {
    expect(migration).toContain('base_points >= 1 and base_points <= 10000');
    expect(migration).toContain('graduation_check_due is null or graduated_at is not null');
  });

  it('is undone by dropping exactly the three columns', () => {
    for (const column of ['base_points', 'graduation_check_due', 'graduated_at']) expect(rollback).toContain(`drop column if exists ${column}`);
  });
});
