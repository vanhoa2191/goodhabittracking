import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from '@libpg-query/parser';

const migration = readFileSync(resolve('supabase/migrations/202610120002_parent_role_activity_guard.sql'), 'utf8');
const rollback = readFileSync(resolve('supabase/rollbacks/202610120002_parent_role_activity_guard.rollback.sql'), 'utf8');

describe('parent-role habit completion migration', () => {
  it('blocks parent-role completion in both parent and child commands before writing logs', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    const guards = migration.match(/if activity\.is_parent_role then\s+return jsonb_build_object\('status', 'parent_role_activity'\);\s+end if;/g);
    expect(guards).toHaveLength(2);
    expect(migration.match(/insert into public\.activity_logs/gi)).toHaveLength(2);
  });

  it('restores the prior authoritative command behavior on rollback', async () => {
    await expect(parse(rollback)).resolves.toBeDefined();
    expect(rollback).toContain('create or replace function public.complete_habit_command(');
    expect(rollback).toContain('create or replace function public.complete_child_habit_command(');
    expect(rollback).not.toContain('activity.is_parent_role');
  });
});
