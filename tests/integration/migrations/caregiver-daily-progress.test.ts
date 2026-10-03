import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(path), 'utf8');
const migration = read('supabase/migrations/202610030002_caregiver_daily_progress.sql');
const previous = read('supabase/migrations/202610030001_caregiver_progress_projection.sql');
const preflight = read('supabase/preflight/202610030002_caregiver_daily_progress.verify.sql');
const rollback = read('supabase/rollbacks/202610030002_caregiver_daily_progress.rollback.sql');

/** The whole create statement of the projection, from its signature to the closing dollar quote. */
function projectionFunction(sql: string, signature: string) {
  const start = sql.indexOf(`create or replace function public.caregiver_progress_snapshot(${signature})`);
  expect(start).toBeGreaterThan(-1);
  const end = sql.indexOf('$$;', sql.indexOf('as $$', start));
  return sql.slice(start, end + 3);
}

describe('caregiver daily progress migration', () => {
  it('parses, with its preflight and rollback', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(preflight)).resolves.toBeDefined();
    await expect(parse(rollback)).resolves.toBeDefined();
  });

  it('replaces the zero-argument function so a call without arguments is never ambiguous', () => {
    const dropped = migration.indexOf('drop function if exists public.caregiver_progress_snapshot();');
    const created = migration.indexOf('create or replace function public.caregiver_progress_snapshot(local_today date default null)');
    expect(dropped).toBeGreaterThan(-1);
    expect(created).toBeGreaterThan(dropped);
  });

  it('keeps the same quality bar as the projection it replaces', () => {
    const body = projectionFunction(migration, 'local_today date default null');
    expect(body).toContain('language plpgsql');
    expect(body).toContain('stable');
    expect(body).toContain('security definer');
    expect(body).toContain("set search_path = ''");
    expect(body).toContain("membership.role <> 'caregiver'");
    expect(migration).toContain('revoke all on function public.caregiver_progress_snapshot(date) from public, anon, service_role;');
    expect(migration).toContain('grant execute on function public.caregiver_progress_snapshot(date) to authenticated;');
  });

  it('returns the previous shape when no day is given, so a cached older build keeps working', () => {
    const body = projectionFunction(migration, 'local_today date default null');
    expect(body).toContain('if local_today is null then\n    return result;');
    expect(body).toContain("case when local_today is null then '{}'::jsonb else jsonb_build_object(");
    // The fields of the older shape are produced unchanged.
    for (const field of ["'familyId', membership.family_id", "'familyRole', membership.role", "'completionCounts'"]) {
      expect(body).toContain(field);
    }
  });

  it('accepts the browser day only within one day of the server day and covers seven days', () => {
    expect(migration).toContain('when local_today between current_date - 1 and current_date + 1 then local_today');
    expect(migration).toContain('else current_date');
    expect(migration).toContain('window_start := window_end - 6;');
    expect(migration).toContain('log.log_date between window_start and window_end');
  });

  it('exposes recurrence only to compute due days, and no log detail', () => {
    const body = projectionFunction(migration, 'local_today date default null');
    for (const field of ["'recurrence_type', activity.recurrence_type", "'recurrence_days', activity.recurrence_days", "'created_on'"]) {
      expect(body).toContain(field);
    }
    for (const forbidden of ['proof_note', 'completed_at', 'points_awarded', 'log.id', 'instructions', 'points,', 'requires_approval']) {
      expect(body).not.toContain(forbidden);
    }
    // The only thing read from a log row is who, which day and how many.
    expect(body).toContain('select log.child_id, log.log_date, count(*) as total');
    expect(body).toContain('group by log.child_id, log.log_date');
    expect(body).toContain("log.status in ('completed', 'approved')");
  });

  it('keeps the scope of the family and of active habits in the daily count', () => {
    const body = projectionFunction(migration, 'local_today date default null');
    expect(body).toContain('where log.family_id = membership.family_id');
    expect(body).toContain('activity.family_id = membership.family_id and activity.is_active');
  });

  it('is verified after applying by checking the signature, privileges and the day clamp', () => {
    expect(preflight).toContain("'public.caregiver_progress_snapshot(date)'::regprocedure");
    expect(preflight).toContain('pronargdefaults = 1');
    expect(preflight).toContain("has_function_privilege('anon', signature, 'EXECUTE')");
    expect(preflight).toContain("definition not like '%current_date - 1%'");
  });

  it('is undone by restoring the exact earlier function and its grants', () => {
    const dropped = rollback.indexOf('drop function if exists public.caregiver_progress_snapshot(date);');
    const restored = rollback.indexOf('create or replace function public.caregiver_progress_snapshot()');
    expect(dropped).toBeGreaterThan(-1);
    expect(restored).toBeGreaterThan(dropped);
    expect(projectionFunction(rollback, '')).toBe(projectionFunction(previous, ''));
    expect(rollback).toContain('revoke all on function public.caregiver_progress_snapshot() from public, anon, service_role;');
    expect(rollback).toContain('grant execute on function public.caregiver_progress_snapshot() to authenticated;');
    expect(rollback).not.toContain('local_today');
    expect(rollback).not.toContain("'daily'");
  });
});
