import { describe, expect, it } from 'vitest';
import { emptyWhenTableMissing, isMissingTable } from '@/lib/supabase/missing-table';

describe('missing table handling', () => {
  it('recognises the PostgREST and PostgreSQL codes for an unknown table only', () => {
    expect(isMissingTable({ code: 'PGRST205' })).toBe(true);
    expect(isMissingTable({ code: '42P01' })).toBe(true);
    expect(isMissingTable({ code: '23503' })).toBe(false);
    expect(isMissingTable({})).toBe(false);
    expect(isMissingTable(null)).toBe(false);
    expect(isMissingTable(undefined)).toBe(false);
  });

  it('turns a missing table into an empty list and leaves every other result alone', () => {
    expect(emptyWhenTableMissing({ data: null, error: { code: 'PGRST205' } })).toEqual({ data: [], error: null });
    const rows = { data: [{ id: 1 }], error: null };
    expect(emptyWhenTableMissing(rows)).toBe(rows);
    const failure = { data: null, error: { code: '42501' } };
    expect(emptyWhenTableMissing(failure)).toBe(failure);
  });
});
