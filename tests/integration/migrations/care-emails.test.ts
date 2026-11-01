import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202611030001_care_emails.sql'), 'utf8');

describe('care emails migration', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
  });

  it('adds the four care templates to the outbox', () => {
    for (const key of ['care_week1_tips', 'care_child_inactive', 'care_weekly_summary', 'care_space_alert']) expect(migration).toContain(`'${key}'`);
  });

  it('queues as marketing so suppression and consent apply, capped at 7 days per family', () => {
    expect(migration).toContain("'marketing'");
    expect(migration).toContain("interval '7 days'");
    expect(migration).toContain('profile.marketing_consent = true');
    expect(migration).toContain('pg_advisory_xact_lock');
  });

  it('exposes producers to service_role only and never selects notes or names', () => {
    expect(migration).toContain('to service_role');
    expect(migration).not.toMatch(/grant execute[^;]*to (anon|authenticated|public)\b/);
    expect(migration).not.toMatch(/note_text|child_space_notes|\.name\b|reason/);
  });
});
