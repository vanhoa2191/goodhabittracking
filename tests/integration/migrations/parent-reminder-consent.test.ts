import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609260003_parent_reminder_consent.sql'), 'utf8');

describe('parent reminder consent migration', () => {
  it('extends the existing consent boundary without weakening prior scopes', () => {
    for (const scope of ['privacy', 'child_data', 'leaderboard', 'analytics', 'parent_reminders']) {
      expect(migration).toContain(`'${scope}'`);
    }
  });
});
