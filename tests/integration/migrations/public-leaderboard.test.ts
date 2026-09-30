import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609300002_public_leaderboard.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202609300002_public_leaderboard.verify.sql'), 'utf8');

describe('public leaderboard migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('starts every child private and takes back the older fixed public default', () => {
    expect(migration).toContain('alter column is_public_on_leaderboard set default false;');
    expect(migration).toContain('update public.child_profiles set is_public_on_leaderboard = false where is_public_on_leaderboard;');
  });

  it('replaces the old board that ranked by the spendable balance and returned a child id', () => {
    expect(migration).toContain('drop function if exists public.get_public_leaderboard(integer);');
    const columns = migration.slice(migration.indexOf('returns table ('), migration.indexOf('language sql'));
    expect(columns).not.toMatch(/child_id|family_id|user_id|\bid\b/);
    expect(migration).not.toMatch(/child\.points/);
  });

  it('shows only children that both the family and the child agreed to share', () => {
    expect(migration).toContain('where settings.is_public_leaderboard\n      and child.is_public_on_leaderboard');
  });

  it('counts verified logs of the viewer\'s calendar period and nothing invented', () => {
    expect(migration).toContain("log.status in ('completed', 'approved')");
    expect(migration).toContain('log.log_date between bounds.first_day and bounds.today');
    expect(migration).toContain("date_trunc('week', today)::date");
    expect(migration).toContain("date_trunc('month', today)::date");
    expect(migration).toContain('when viewer_today between current_date - 1 and current_date + 1 then viewer_today');
    expect(migration).not.toMatch(/greatest\([^)]*points/i);
  });

  it('never publishes a real name: the alias is the nickname or a fixed fallback', () => {
    expect(migration).toContain("coalesce(nullif(trim(child.nickname), ''), 'Bé Siêu Nhân')");
    expect(migration).not.toMatch(/child\.name\b/);
  });

  it('runs with a protected search path, capped, and open to anyone only for reading', () => {
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain('limit least(greatest(result_limit, 1), 100)');
    expect(migration).toContain('grant execute on function public.get_public_leaderboard(text, date, uuid, integer) to anon, authenticated;');
  });

  it('lets only a parent of the family change whether it shares, and records the choice as a consent', () => {
    expect(migration).toContain('if not public.can_manage_family(target_family_id) then');
    expect(migration).toContain('revoke all on function public.set_family_public_leaderboard(uuid, boolean) from public, anon, authenticated;');
    expect(migration).toContain('grant execute on function public.set_family_public_leaderboard(uuid, boolean) to authenticated;');
    expect(migration).toContain("'leaderboard'");
    expect(migration).toContain('revoked_at = excluded.revoked_at');
  });
});
