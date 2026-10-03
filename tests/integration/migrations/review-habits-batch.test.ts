import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202610040001_review_habits_batch.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202610040001_review_habits_batch.verify.sql'), 'utf8');

describe('batch review migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('requires manage rights and caps the batch', () => {
    expect(migration).toContain('public.can_manage_family(actor_family_id)');
    expect(migration).toContain("raise exception 'too_many_logs'");
    expect(migration).toContain('cardinality(ordered_ids) > 50');
  });

  it('reviews each log through the single-log command so stars are credited once', () => {
    expect(migration).toContain('public.review_habit_command(current_id, decision)');
    expect(migration).toContain('order by id');
    expect(migration).not.toMatch(/update public\.child_profiles/);
  });

  it('keeps execution to signed-in parents', () => {
    expect(migration).toContain('revoke all on function public.review_habits_command(uuid[], text) from public, anon, service_role;');
    expect(migration).toContain('grant execute on function public.review_habits_command(uuid[], text) to authenticated;');
  });

  it('locks the logs and then the children in id order before reviewing, as a single review does', () => {
    const logs = migration.indexOf('from public.activity_logs\n  where id = any(ordered_ids)');
    const children = migration.indexOf('perform 1 from public.child_profiles');
    const loop = migration.indexOf('foreach current_id');
    expect(logs).toBeGreaterThan(-1);
    expect(children).toBeGreaterThan(logs);
    expect(loop).toBeGreaterThan(children);
    expect(migration.match(/order by id for update/g)).toHaveLength(2);
  });

  it('reports logs of another family as not found instead of touching them', () => {
    expect(migration).toContain('family_id = actor_family_id');
    expect(migration).toContain("'status', 'not_found'");
  });
});
