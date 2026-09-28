import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/202609280001_lifecycle_revenue_operations.sql'),
  'utf8',
);

describe('lifecycle and revenue operations migration', () => {
  it('parses as PostgreSQL before deployment', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
  });

  it('uses durable dedupe, bounded retries and skip-locked claiming', () => {
    expect(migration).toContain('dedupe_key text not null unique');
    expect(migration).toContain('attempts integer not null default 0');
    expect(migration).toContain('for update skip locked');
    expect(migration).toContain("'dead_letter'");
  });

  it('keeps marketing consent and suppression authoritative', () => {
    expect(migration).toContain('profile.marketing_consent = true');
    expect(migration).toContain("suppression.scope = 'all' or message.category = 'marketing'");
    expect(migration).toContain("status = 'suppressed'");
  });

  it('limits message payload keys and never models child content', () => {
    expect(migration).toContain('allowed_payload_keys');
    expect(migration).not.toMatch(/child_name|childName|habit_title|activity_title/i);
  });

  it('records billing case transitions before queuing customer status', () => {
    expect(migration).toContain('billing_support_case_events');
    expect(migration).toContain('audit_and_queue_billing_case');
    expect(migration).toContain("new.case_type = 'refund'");
  });
});
