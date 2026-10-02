import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202610020003_age_band_override.sql'), 'utf8');
const preflight = readFileSync(resolve('supabase/preflight/202610020003_age_band_override.verify.sql'), 'utf8');
const rollback = readFileSync(resolve('supabase/rollbacks/202610020003_age_band_override.rollback.sql'), 'utf8');

describe('age band override migration', () => {
  it('parses, with the migration and its rollback', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(rollback)).resolves.toBeDefined();
    await expect(parse(preflight)).resolves.toBeDefined();
  });

  it('adds a column limited to the three bands and off', () => {
    expect(migration).toContain('add column age_band_override text');
    expect(migration).toContain("check (age_band_override in ('young', 'tween', 'teen', 'off'))");
  });

  it('lets a parent update it through the existing profile command, not a new write path', () => {
    expect(migration).toContain("age_band_override = case when updates_input ? 'ageBandOverride'");
    expect(migration).toContain('public.can_manage_family(actor_family_id)');
    expect(migration).toContain("to_jsonb(activity.\"recurrenceDays\")");
  });

  it("returns it to the child's own device with the rest of the profile", () => {
    expect(migration).toContain("'ageBandOverride', child.age_band_override");
  });

  it('is undone by restoring both functions before dropping the column', () => {
    const restoredProfile = rollback.indexOf('create or replace function public.mutate_child_profile_command');
    const restoredSession = rollback.indexOf('create or replace function public.get_child_session');
    const dropped = rollback.indexOf('drop column if exists age_band_override');
    expect(restoredProfile).toBeGreaterThan(-1);
    expect(restoredSession).toBeGreaterThan(-1);
    expect(dropped).toBeGreaterThan(Math.max(restoredProfile, restoredSession));
    expect(rollback).not.toContain('age_band_override =');
    expect(rollback).not.toContain("'ageBandOverride'");
  });
});
