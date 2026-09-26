import { describe, expect, it } from 'vitest';
import {
  createJournalCsv,
  normalizeJournalText,
  parseJournalEntry,
} from '@/lib/child-journal';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';

describe('child journal', () => {
  it('normalizes a one-line reflection when the child enters extra whitespace', () => {
    expect(normalizeJournalText('  Hôm nay con\nđã giúp mẹ.  ')).toBe('Hôm nay con đã giúp mẹ.');
  });

  it('rejects empty or overlong reflections', () => {
    expect(normalizeJournalText(' \n ')).toBeNull();
    expect(normalizeJournalText('a'.repeat(281))).toBeNull();
  });

  it('parses a family-scoped journal row', () => {
    expect(parseJournalEntry({
      family_id: familyId,
      child_id: childId,
      local_date: '2026-09-26',
      entry_text: 'Con đã kiên trì đến cùng.',
      created_at: '2026-09-26T12:00:00.000Z',
      updated_at: '2026-09-26T12:00:00.000Z',
    })).toMatchObject({ child_id: childId, entry_text: 'Con đã kiên trì đến cùng.' });
  });

  it('accepts 280 Unicode characters consistently with the database limit', () => {
    const text = '😊'.repeat(280);
    expect(normalizeJournalText(text)).toBe(text);
    expect(parseJournalEntry({
      family_id: familyId,
      child_id: childId,
      local_date: '2026-09-26',
      entry_text: text,
      created_at: '2026-09-26T12:00:00.000Z',
      updated_at: '2026-09-26T12:00:00.000Z',
    }).entry_text).toBe(text);
  });

  it('exports spreadsheet-safe CSV without leaking internal family identifiers', () => {
    const csv = createJournalCsv([{
      family_id: familyId,
      child_id: childId,
      local_date: '2026-09-26',
      entry_text: '=IMPORTXML("https://example.test")',
      created_at: '2026-09-26T12:00:00.000Z',
      updated_at: '2026-09-26T12:00:00.000Z',
    }], new Map([[childId, 'An']]));

    expect(csv.split('\r\n')[0]).toBe('"Ngày","Tên bé","Điều con muốn ghi nhớ"');
    expect(csv).toContain("'=IMPORTXML");
    expect(csv).not.toContain(familyId);
    expect(csv).not.toContain(childId);
  });
});
