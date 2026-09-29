import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609300001_habit_programs.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202609300001_habit_programs.verify.sql'), 'utf8');

describe('habit program migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('keeps observations and cue plans family scoped, forced under row level security and read-only for members', () => {
    expect(migration).toContain('alter table public.habit_cue_plans force row level security;');
    expect(migration).toContain('alter table public.habit_support_observations force row level security;');
    expect(migration).toContain('public.is_family_member(family_id)');
    expect(migration).toContain('grant select on public.habit_cue_plans, public.habit_support_observations to authenticated;');
    expect(migration).not.toMatch(/grant (insert|update|delete)[^;]*habit_(cue_plans|support_observations)/i);
  });

  it('removes observations with their log, child, activity or family', () => {
    expect(migration).toContain('log_id uuid primary key references public.activity_logs(id) on delete cascade');
    expect(migration).toContain('family_id uuid not null references public.families(id) on delete cascade');
    expect(migration).toContain('references public.child_profiles(id, family_id) on delete cascade');
    expect(migration).toContain('references public.habit_activities(id, family_id) on delete cascade');
  });

  it('records support only for a verified log of the right child and only saves an unchanged level as a no-op', () => {
    expect(migration).toContain("log.status in ('completed', 'approved')");
    expect(migration).toContain('(target_child_id is null or log.child_id = target_child_id)');
    expect(migration).toContain('on conflict (log_id) do update');
    expect(migration).toContain('is distinct from excluded.support_level');
  });

  it('exposes the internal writer to nobody and the child channel only through a device session', () => {
    expect(migration).toContain('revoke all on function public.record_habit_support_internal(uuid, uuid, uuid, text, text)\n  from public, anon, authenticated;');
    expect(migration).toContain("and 'child:complete' = any(device.capabilities)");
    expect(migration).toContain("and 'child:read' = any(device.capabilities)");
    expect(migration).toContain('public.can_manage_family(target_family_id)');
  });

  it('remembers when a cue plan was first saved and keeps that moment when the plan is edited', () => {
    const table = migration.slice(migration.indexOf('create table public.habit_cue_plans'), migration.indexOf('create table public.habit_support_observations'));
    expect(table).toContain('created_at timestamptz not null default now()');
    const upsert = migration.slice(migration.indexOf('on conflict (child_id, activity_id) do update'), migration.indexOf('returning * into saved;'));
    expect(upsert).toContain('updated_at = now()');
    expect(upsert).not.toContain('created_at');
  });

  it('requires a time for time cues and none for event cues', () => {
    expect(migration).toContain("(cue_kind = 'time' and cue_time is not null) or (cue_kind = 'event' and cue_time is null)");
  });
});
