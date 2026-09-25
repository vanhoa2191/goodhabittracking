import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';
import { WIT_HABIT_PACKS } from '@/lib/constants';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/context';
import { localizeWitTemplate } from '@/lib/i18n/wit-template-copy';

const generator = resolve('scripts/generate-legacy-template-backfill.mjs');
const migration = readFileSync(
  resolve('supabase/migrations/202609240008_legacy_template_backfill.sql'),
  'utf8',
);
const verification = readFileSync(
  resolve('supabase/preflight/202609240008_legacy_template_backfill.verify.sql'),
  'utf8',
);

type Signature = readonly [
  id: string,
  title: string,
  description: string,
  category: string,
  icon: string,
  points: number,
  timeOfDay: string,
  durationMinutes: number,
  requiresApproval: boolean,
];

function catalogSignatures(): Signature[] {
  return WIT_HABIT_PACKS.flatMap((pack) =>
    pack.items.flatMap((template, index) =>
      SUPPORTED_LANGUAGES.map(({ code }) => {
        const localized = localizeWitTemplate(template, index, code);
        return [
          template.id,
          localized.title,
          localized.description || '',
          template.category,
          template.icon,
          template.points,
          template.timeOfDay,
          template.durationMinutes || 0,
          Boolean(template.requiresApproval),
        ] as const;
      }),
    ),
  );
}

function sqlSignatures(sql: string): Signature[] {
  const literal = "'((?:''|[^'])*)'";
  const row = new RegExp(
    `^\\s*\\(${literal},\\s*${literal},\\s*${literal},\\s*${literal},\\s*${literal},\\s*(\\d+),\\s*${literal},\\s*(\\d+),\\s*(true|false)\\)(?:,)?\\s*$`,
    'gm',
  );
  const unquote = (value: string) => value.replaceAll("''", "'");
  return [...sql.matchAll(row)].map((match) => [
    unquote(match[1]),
    unquote(match[2]),
    unquote(match[3]),
    unquote(match[4]),
    unquote(match[5]),
    Number(match[6]),
    unquote(match[7]),
    Number(match[8]),
    match[9] === 'true',
  ]);
}

describe('legacy template ID backfill', () => {
  it('generates the committed migration deterministically and passes its check mode', () => {
    const generate = () => execFileSync(process.execPath, [generator, '--stdout'], { encoding: 'utf8' });

    expect(generate()).toBe(migration);
    expect(generate()).toBe(migration);
    expect(() => execFileSync(process.execPath, [generator, '--check'])).not.toThrow();
  });

  it('parses the migration and preflight verifier as PostgreSQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('maps every distinct catalog signature across all nine locales to the correct ID', () => {
    const signatures = catalogSignatures();
    const expected = new Map<string, Signature>();

    expect(SUPPORTED_LANGUAGES).toHaveLength(9);
    expect(new Set(signatures.map(([id]) => id)).size).toBe(36);

    for (const signature of signatures) {
      const key = JSON.stringify(signature.slice(1));
      const previous = expected.get(key);
      expect(previous?.[0] ?? signature[0]).toBe(signature[0]);
      expected.set(key, signature);
    }

    const actual = sqlSignatures(migration);
    expect(actual).toHaveLength(expected.size);
    expect(new Set(actual.map((signature) => JSON.stringify(signature.slice(1)))).size).toBe(actual.length);
    expect(new Set(actual.map((signature) => JSON.stringify(signature)))).toEqual(
      new Set([...expected.values()].map((signature) => JSON.stringify(signature))),
    );
  });

  it('updates only fully matching, unassigned activities', () => {
    expect(migration).toMatch(/update\s+public\.habit_activities\s+as\s+activity/i);
    expect(migration).toMatch(/set\s+legacy_template_id\s*=\s*catalog\.legacy_template_id/i);
    for (const column of ['legacy_template_id', 'framework_habit_id', 'journey_habit_key']) {
      expect(migration).toContain(`activity.${column} is null`);
    }
    for (const column of ['child_id', 'portrait16_key', 'bo_thi7_key']) {
      expect(migration).toContain(`activity.${column} is null`);
    }
    expect(migration).toContain('activity.is_active = true');
    expect(migration).toContain('activity.is_parent_role = false');
    expect(migration).toContain("activity.target_age_stage = 'all'");
    for (const column of ['title', 'description', 'category', 'icon', 'points', 'time_of_day', 'duration_minutes', 'requires_approval']) {
      expect(migration).toContain(`activity.${column} = catalog.${column}`);
    }
    expect(migration).toContain('activity.instructions is null or activity.instructions = catalog.description');
    expect(migration).toContain("activity.recurrence_type = 'daily'");
    expect(migration).toContain("to_jsonb(activity.recurrence_days) = '[0,1,2,3,4,5,6]'::jsonb");
    expect(migration).not.toMatch(/\b(?:insert\s+into|delete\s+from|truncate)\s+public\.habit_activities\b/i);
  });
});
