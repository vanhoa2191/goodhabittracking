import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(path), 'utf8');
const migration = read('supabase/migrations/202610040004_parent_ai.sql');
const verification = read('supabase/preflight/202610040004_parent_ai.verify.sql');
const rollback = read('supabase/rollbacks/202610040004_parent_ai.rollback.sql');

describe('parent AI migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    for (const sql of [migration, verification, rollback]) await expect(parse(sql)).resolves.toBeDefined();
  });

  it('keeps every earlier consent type and adds parent_ai', () => {
    for (const type of ['privacy', 'child_data', 'leaderboard', 'analytics', 'parent_reminders', 'parent_ai']) {
      expect(migration).toContain(`'${type}'`);
    }
  });

  it('keeps the usage tables out of reach of every client role', () => {
    expect(migration).toContain('alter table public.ai_usage force row level security;');
    expect(migration).toContain('alter table public.ai_system_usage force row level security;');
    expect(migration).toContain('revoke all on public.ai_usage, public.ai_system_usage from public, anon, authenticated;');
    expect(migration).not.toMatch(/grant\s+(?:select|insert|update|delete|all)[\s\S]{0,80}ai_(?:system_)?usage/i);
    expect(migration).not.toMatch(/create policy/i);
  });

  it('counts under a lock, first the whole account, then the family, and refuses with a reason', () => {
    expect(migration).toContain('security definer');
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain('public.can_manage_family(actor_family_id)');
    const system = migration.indexOf('from public.ai_system_usage where day = today for update');
    const family = migration.indexOf('from public.ai_usage where family_id = actor_family_id and day = today for update');
    expect(system).toBeGreaterThan(-1);
    expect(family).toBeGreaterThan(system);
    for (const reason of ['system_day', 'family_day', 'too_fast']) expect(migration).toContain(`'reason', '${reason}'`);
    expect(migration).toContain("(now() at time zone 'utc')::date");
  });

  it('takes the actor family from the session, never from an argument', () => {
    expect(migration).toContain('actor_family_id uuid := public.current_family_id()');
    expect(migration).not.toMatch(/consume_ai_quota\([^)]*family/i);
  });

  it('bounds its inputs', () => {
    expect(migration).toContain("raise exception 'invalid_ai_quota'");
  });

  it('is executable by signed-in parents only', () => {
    expect(migration).toContain('revoke all on function public.consume_ai_quota(integer, integer, integer) from public, anon, service_role;');
    expect(migration).toContain('grant execute on function public.consume_ai_quota(integer, integer, integer) to authenticated;');
  });

  it('is undone completely, restoring the earlier constraint', () => {
    expect(rollback).toContain('drop function if exists public.consume_ai_quota(integer, integer, integer)');
    expect(rollback).toContain('drop table if exists public.ai_usage');
    expect(rollback).toContain('drop table if exists public.ai_system_usage');
    expect(rollback).not.toContain("'parent_ai')");
    expect(rollback).toContain("'parent_reminders')");
  });
});
