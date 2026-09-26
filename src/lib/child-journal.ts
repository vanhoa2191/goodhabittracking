import { z } from 'zod';

export const JOURNAL_TEXT_MAX_LENGTH = 280;

export const journalEntrySchema = z.object({
  family_id: z.string().uuid(),
  child_id: z.string().uuid(),
  local_date: z.iso.date(),
  entry_text: z.string().min(1).refine((value) => (
    Array.from(value).length <= JOURNAL_TEXT_MAX_LENGTH && !/[\r\n]/u.test(value)
  )),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export type JournalEntry = z.infer<typeof journalEntrySchema>;

export type JournalCsvLabels = {
  readonly date: string;
  readonly childName: string;
  readonly reflection: string;
};

const defaultCsvLabels: JournalCsvLabels = {
  date: 'Ngày',
  childName: 'Tên bé',
  reflection: 'Điều con muốn ghi nhớ',
};

export function normalizeJournalText(input: string): string | null {
  const normalized = input.normalize('NFKC').replace(/\s+/gu, ' ').trim();
  if (normalized.length === 0 || Array.from(normalized).length > JOURNAL_TEXT_MAX_LENGTH) return null;
  return normalized;
}

export function parseJournalEntry(input: unknown): JournalEntry {
  return journalEntrySchema.parse(input);
}

export function parseJournalEntries(input: unknown): JournalEntry[] {
  return z.array(journalEntrySchema).parse(input);
}

function csvCell(input: string): string {
  const spreadsheetSafe = /^[=+\-@\t\r]/u.test(input) ? `'${input}` : input;
  return `"${spreadsheetSafe.replaceAll('"', '""')}"`;
}

export function createJournalCsv(
  entries: readonly JournalEntry[],
  childNames: ReadonlyMap<string, string>,
  labels: JournalCsvLabels = defaultCsvLabels,
): string {
  const rows = entries
    .map((entry) => [entry.local_date, childNames.get(entry.child_id) ?? '', entry.entry_text])
    .sort(([leftDate], [rightDate]) => rightDate.localeCompare(leftDate));
  return [
    [labels.date, labels.childName, labels.reflection],
    ...rows,
  ].map((row) => row.map(csvCell).join(',')).join('\r\n');
}
