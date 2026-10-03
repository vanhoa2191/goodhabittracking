import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202610040003_habit_coach.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202610040003_habit_coach.verify.sql'), 'utf8');
const rollback = readFileSync(resolve('supabase/rollbacks/202610040003_habit_coach.rollback.sql'), 'utf8');

function definition(name: string): string {
  const start = migration.indexOf(`create function public.${name}(`);
  const replaceStart = migration.indexOf(`create or replace function public.${name}(`);
  const definitionStart = Math.max(start, replaceStart);
  expect(definitionStart, `${name} is defined`).toBeGreaterThan(-1);
  return migration.slice(definitionStart, migration.indexOf('\n$$;', definitionStart));
}

describe('habit coach migration contract', () => {
  it('parses every migration SQL file as PostgreSQL', async () => {
    for (const sql of [migration, verification, rollback]) await expect(parse(sql)).resolves.toBeDefined();
  });

  it('uses an empty search_path for every function; the snapshot still runs as the caller so row policies decide what it returns', () => {
    const functions = migration.match(/create(?: or replace)? function public\.[\s\S]*?\n\$\$;/g) ?? [];
    expect(functions.length).toBe(6);
    for (const body of functions) expect(body).toMatch(/set search_path = ''/);
    expect(definition('family_snapshot')).toMatch(/security invoker/);
    for (const name of ['start_habit_try', 'resolve_habit_try', 'set_weekly_focus_for_child', 'set_child_weekly_focus', 'get_child_session']) {
      expect(definition(name)).toMatch(/security definer/);
    }
  });

  it('allows one open try per child, whichever habit it is about, on the family calendar day', () => {
    const body = definition('start_habit_try');
    expect(body).toContain('where family_id = actor_family_id and child_id = target_child_id and outcome is null');
    expect(body).not.toContain('activity_id = target_activity_id and outcome is null');
    expect(body).toContain('start_day not between current_date - 1 and current_date + 1');
    expect(body).toContain('start_day + try_days');
    expect(body).toContain('try_previous');
  });

  it('returns the saved row from each write so the app can show it without reloading', () => {
    expect(definition('start_habit_try')).toContain("'habitTry', to_jsonb(created_try)");
    expect(definition('resolve_habit_try')).toContain("'habitTry', to_jsonb(try_row)");
    expect(definition('set_weekly_focus_for_child')).toContain("'weeklyFocus', to_jsonb(focus_row)");
    expect(definition('set_child_weekly_focus')).toContain("'weeklyFocus', to_jsonb(focus_row)");
  });

  it('keeps direct table access read-only and routes parent writes through managed RPCs', () => {
    expect(migration).toMatch(/revoke all on public\.habit_tries from public, anon, authenticated/);
    expect(migration).toMatch(/revoke all on public\.child_weekly_focus from public, anon, authenticated/);
    expect(migration).toMatch(/grant select on public\.habit_tries to authenticated/);
    expect(migration).toMatch(/grant select on public\.child_weekly_focus to authenticated/);
    expect(migration).not.toMatch(/grant\s+(?:insert|update|delete|all)[\s\S]{0,100}on public\.(?:habit_tries|child_weekly_focus)/i);
    for (const name of ['start_habit_try', 'resolve_habit_try', 'set_weekly_focus_for_child']) {
      expect(definition(name)).toContain('public.can_manage_family(actor_family_id)');
      expect(migration).toContain(`revoke all on function public.${name}`);
    }
  });

  it('authenticates a paired child device and writes only for its session child', () => {
    const body = definition('set_child_weekly_focus');
    expect(body).toContain('device.token_hash = session_token_hash');
    expect(body).toContain('device.revoked_at is null');
    expect(body).toContain('device.expires_at > now()');
    expect(body).toContain("'child:complete' = any(device.capabilities)");
    expect(body).toContain('child_session.child_id');
    expect(body).toContain("values (child_session.family_id, child_session.child_id, focus_week, normalized_ids, 'child')");
    expect(migration).toMatch(/grant execute on function public\.set_child_weekly_focus\(text, date, uuid\[\]\) to anon, authenticated/);
  });

  it('limits focus to two deduplicated, offered active activities for the chosen child', () => {
    for (const name of ['set_weekly_focus_for_child', 'set_child_weekly_focus']) {
      const body = definition(name);
      expect(body).toContain('focus_week not between current_date - 7 and current_date + 7');
      expect(body).toContain('array_agg(distinct requested.id order by requested.id)');
      expect(body).toContain('cardinality(normalized_ids) > 2');
      expect(body).toContain('activity.is_active and activity.offered_for_focus');
      expect(body).toContain('(activity.child_id is null or activity.child_id =');
    }
    expect(migration).toContain("'offered_for_focus', t.offered_for_focus");
    expect(migration).toContain("'offeredForFocus', activity.offered_for_focus");
  });

  it('adds explicitly keyed experience data and the child weekly focus projection', () => {
    const snapshot = definition('family_snapshot');
    expect(snapshot).toContain("'graduated_at', t.graduated_at, 'graduation_check_due', t.graduation_check_due, 'base_points', t.base_points");
    expect(snapshot).toContain("'offered_for_focus', t.offered_for_focus");
    expect(snapshot).toContain("'habitTries', case when include_experience");
    expect(snapshot).toContain("'weeklyFocus', case when include_experience");
    expect(snapshot).toContain("'id', t.id, 'family_id', t.family_id, 'child_id', t.child_id, 'activity_id', t.activity_id");
    expect(snapshot).not.toMatch(/to_jsonb\(/);

    const childSession = definition('get_child_session');
    expect(childSession).toContain("'weeklyFocus'");
    expect(childSession).toContain("'weekStart', focus.week_start");
    expect(childSession).toContain("'activityIds', focus.activity_ids");
    expect(childSession).toContain("'chosenBy', focus.chosen_by");
    expect(childSession).toContain('focus.week_start >= current_date - 14');
  });

  it('rolls back by dropping what it added and putting the previous snapshot and child session back', () => {
    for (const signature of [
      'set_child_weekly_focus(text, date, uuid[])',
      'set_weekly_focus_for_child(uuid, date, uuid[])',
      'resolve_habit_try(uuid, text)',
      'start_habit_try(uuid, uuid, text, integer, date, jsonb)',
    ]) expect(rollback).toContain(`drop function if exists public.${signature}`);
    expect(rollback).not.toContain('drop function if exists public.family_snapshot');
    expect(rollback).not.toContain('drop function if exists public.get_child_session');
    expect(rollback).toContain('create or replace function public.family_snapshot(');
    expect(rollback).toContain('create or replace function public.get_child_session(');
    expect(rollback).not.toContain('offered_for_focus, t.offered_for_focus');
    expect(rollback).toContain('drop table if exists public.child_weekly_focus');
    expect(rollback).toContain('drop table if exists public.habit_tries');
    expect(rollback).toContain('drop column if exists offered_for_focus');
  });
});
