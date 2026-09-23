import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('mascot selection migration guard', () => {
  it('rejects changed unknown avatars without blocking unrelated legacy profile updates', () => {
    const migration = readFileSync(join(process.cwd(), 'supabase/migrations/202609230004_reject_unknown_mascot_changes.sql'), 'utf8');
    expect(migration).toContain("if tg_op = 'INSERT' then");
    expect(migration).toContain('elsif new.avatar is distinct from old.avatar then');
    expect(migration).toContain("raise exception 'invalid_mascot_selection'");
    expect(migration).toContain('return new;');
  });
});
