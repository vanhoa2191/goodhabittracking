import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { familyCoreColumns } from '@/lib/supabase/mappers';
import { experienceColumns } from '@/lib/experience-state';

const migrationsDirectory = join(process.cwd(), 'supabase/migrations');

/** The newest migration that defines family_snapshot is the one the database runs. */
function latestSnapshotDefinition(): string {
  const files = readdirSync(migrationsDirectory).filter((name) => name.endsWith('.sql')).sort();
  const sources = files.map((name) => readFileSync(join(migrationsDirectory, name), 'utf8'));
  const latest = sources.filter((source) => source.includes('function public.family_snapshot(')).at(-1);
  if (!latest) throw new Error('No migration defines family_snapshot.');
  return latest.slice(latest.indexOf('function public.family_snapshot('));
}

/** Maps each table to the keys its jsonb_build_object returns. */
function snapshotColumns(sql: string): Map<string, string[]> {
  const columns = new Map<string, string[]>();
  const pattern = /jsonb_build_object\(([^()]*)\)\)?\s*from (?:public\.(\w+) t|\(select \* from public\.(\w+) )/g;
  for (const match of sql.matchAll(pattern)) {
    const keys = Array.from(match[1].matchAll(/'(\w+)', t\.\w+/g), (key) => key[1]);
    columns.set(match[2] ?? match[3], keys);
  }
  return columns;
}

describe('family_snapshot columns', () => {
  const sql = latestSnapshotDefinition();
  const returned = snapshotColumns(sql);

  it('never returns a whole row', () => {
    expect(sql).not.toMatch(/to_jsonb\(/);
  });

  it.each(Object.entries({ ...familyCoreColumns, ...experienceColumns }))(
    'returns exactly the columns the app parses from %s',
    (table, expected) => {
      expect([...(returned.get(table) ?? [])].sort()).toEqual([...expected].sort());
    },
  );
});
