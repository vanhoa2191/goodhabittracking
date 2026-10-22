import { describe, expect, it } from 'vitest';

import {
  validateCatalog,
  validateEditorialRows,
} from '@/lib/thinking-games';
import type { EditorialRow } from '@/lib/thinking-games';
import { loadEditorialCsv, loadPilot } from './helpers';

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows.filter((entry) => entry.length > 1);
}

function editorialRows(): EditorialRow[] {
  const [header, ...rows] = parseCsv(loadEditorialCsv());
  const index = new Map((header ?? []).map((name, position) => [name.replace(/^\uFEFF/, ''), position]));
  return rows.map((row) => ({
    day: Number(row[index.get('day') as number]),
    mainId: row[index.get('main_id') as number] as string,
    mainTypeId: row[index.get('main_type_id') as number] as string,
    mainSkill: row[index.get('main_skill') as number] as string,
    mainRuleVariant: row[index.get('main_rule_variant') as number] as string,
    bonusId: row[index.get('bonus_id') as number] as string,
    bonusTypeId: row[index.get('bonus_type_id') as number] as string,
    bonusSkill: row[index.get('bonus_skill') as number] as string,
    bonusRuleVariant: row[index.get('bonus_rule_variant') as number] as string,
    mainStatus: row[index.get('main_status') as number] as string,
    bonusStatus: row[index.get('bonus_status') as number] as string,
  }));
}

describe('editorial catalog validator', () => {
  it('reports the measured 365/730/24/96 baseline with 358 covered windows and 11-day spacing', () => {
    const result = validateEditorialRows(editorialRows());
    expect(result.ok).toBe(true);
    expect(result.metrics).toMatchObject({
      coverageKind: 'editorial',
      dayCount: 365,
      slotCount: 730,
      typeIds: 24,
      variantPairs: 96,
      skillCount: 8,
      equalSkillDays: 0,
      rollingEightDayWindows: 358,
      rollingEightDayCovered: 358,
      minFormatSpacingDays: 11,
    });
  });

  it('rejects equal skills, duplicate ids, unknown types and missing days', () => {
    const rows = editorialRows();
    const equal = rows.map((row, index) => index === 0 ? { ...row, mainSkill: row.bonusSkill } : row);
    expect(validateEditorialRows(equal).ok).toBe(false);

    const duplicate = rows.map((row, index) => index === 1 ? { ...row, mainId: rows[0]!.mainId } : row);
    expect(validateEditorialRows(duplicate).ok).toBe(false);

    const unknown = rows.map((row, index) => index === 0 ? { ...row, mainTypeId: 'g99-t9' } : row);
    expect(validateEditorialRows(unknown).ok).toBe(false);

    expect(validateEditorialRows(rows.slice(0, -1)).ok).toBe(false);
  });

  it('validates the pilot only for the pilot profile and rejects it for release', () => {
    const rows = editorialRows();
    const pilot = loadPilot();
    expect(validateCatalog({ rows, manifest: pilot, profile: 'pilot' }).ok).toBe(true);
    expect(validateCatalog({ rows, manifest: pilot, profile: 'release' }).ok).toBe(false);
  });
});
