import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202611040001_onboarding_emails.sql'), 'utf8');
const rollback = readFileSync(resolve('supabase/rollbacks/202611040001_onboarding_emails.rollback.sql'), 'utf8');

describe('onboarding emails migration', () => {
  it('parses as PostgreSQL SQL, rollback too', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(rollback)).resolves.toBeDefined();
  });

  it('adds the three onboarding templates and queues as marketing with consent and suppression checks', () => {
    for (const key of ['onboarding_day1', 'onboarding_day3', 'onboarding_day7']) expect(migration).toContain(`'${key}'`);
    expect(migration).toContain("'marketing'");
    expect(migration).toContain('profile.marketing_consent = true');
    expect(migration).toContain('email_suppressions');
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain("'onboarding/' || target_template_key || '/' || target_family_id::text");
  });

  it('is exempt from the 7-day cap but limited to one message per Vietnam day', () => {
    const onboardingGate = migration.slice(migration.indexOf('function public.enqueue_onboarding_message'), migration.indexOf('function public.schedule_onboarding_messages'));
    expect(onboardingGate).not.toContain("interval '7 days'");
    expect(onboardingGate).toContain("at time zone 'Asia/Ho_Chi_Minh')::date");
  });

  it('exposes producers to service_role only and carries no free text', () => {
    expect(migration).toContain('to service_role');
    expect(migration).not.toMatch(/grant execute[^;]*to (anon|authenticated|public)\b/);
    expect(migration).not.toMatch(/note_text|child_space_notes|\.name\b|reason/);
  });

  it('rollback drops the new functions and restores the old template list', () => {
    expect(rollback).toContain('drop function if exists public.schedule_onboarding_messages');
    expect(rollback).toContain('drop function if exists public.enqueue_onboarding_message');
    expect(rollback).not.toContain("'onboarding_day1',");
  });
});
