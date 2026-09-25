import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const migrationPath = resolve(root, 'supabase/migrations/202609240008_legacy_template_backfill.sql');

function loadCatalog() {
  const entry = `
    import { WIT_HABIT_PACKS } from './src/lib/constants';
    import { localizeWitTemplate } from './src/lib/i18n/wit-template-copy';
    import { SUPPORTED_LANGUAGES } from './src/lib/i18n/context';
    export { WIT_HABIT_PACKS, localizeWitTemplate, SUPPORTED_LANGUAGES };
  `;
  const bundle = buildSync({
    stdin: { contents: entry, resolveDir: root, sourcefile: 'legacy-template-backfill-entry.ts' },
    bundle: true,
    format: 'cjs',
    platform: 'node',
    tsconfig: resolve(root, 'tsconfig.json'),
    write: false,
  });
  const catalog = { exports: {} };
  new Function('module', 'exports', bundle.outputFiles[0].text)(catalog, catalog.exports);
  return catalog.exports;
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function generateLegacyTemplateBackfill() {
  const { WIT_HABIT_PACKS, localizeWitTemplate, SUPPORTED_LANGUAGES } = loadCatalog();
  const matches = new Map();
  const ids = new Set();

  for (const pack of WIT_HABIT_PACKS) {
    pack.items.forEach((template, index) => {
      ids.add(template.id);
      for (const language of SUPPORTED_LANGUAGES) {
        const localized = localizeWitTemplate(template, index, language.code);
        const title = localized.title;
        const description = localized.description || '';
        const durationMinutes = template.durationMinutes || 0;
        const requiresApproval = Boolean(template.requiresApproval);
        const signature = JSON.stringify([title, description, template.category, template.icon, template.points, template.timeOfDay, durationMinutes, requiresApproval]);
        const existing = matches.get(signature);
        if (existing && existing.id !== template.id) {
          throw new Error(`Ambiguous catalog signature for ${existing.id} and ${template.id}`);
        }
        matches.set(signature, {
          id: template.id,
          title,
          description,
          category: template.category,
          icon: template.icon,
          points: template.points,
          timeOfDay: template.timeOfDay,
          durationMinutes,
          requiresApproval,
        });
      }
    });
  }

  if (ids.size !== 36 || SUPPORTED_LANGUAGES.length !== 9) {
    throw new Error('Legacy template coverage changed; review the backfill before regenerating it.');
  }

  const rows = [...matches.values()].sort((left, right) => {
    const leftKey = `${left.id}\0${left.title}`;
    const rightKey = `${right.id}\0${right.title}`;
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  const values = rows.map((row) => `  (${quote(row.id)}, ${quote(row.title)}, ${quote(row.description)}, ${quote(row.category)}, ${quote(row.icon)}, ${row.points}, ${quote(row.timeOfDay)}, ${row.durationMinutes}, ${row.requiresApproval})`);

  return `-- Generated from the shipped legacy habit catalog and all supported locales.
-- Only full template content and settings receive an ID; edited rows stay untouched.
begin;

with catalog (legacy_template_id, title, description, category, icon, points, time_of_day, duration_minutes, requires_approval) as (
  values
${values.join(',\n')}
)
update public.habit_activities as activity
set legacy_template_id = catalog.legacy_template_id
from catalog
where activity.legacy_template_id is null
  and activity.framework_habit_id is null
  and activity.journey_habit_key is null
  and activity.child_id is null
  and activity.is_active = true
  and activity.is_parent_role = false
  and activity.target_age_stage = 'all'
  and activity.portrait16_key is null
  and activity.bo_thi7_key is null
  and activity.title = catalog.title
  and activity.description = catalog.description
  and (activity.instructions is null or activity.instructions = catalog.description)
  and activity.category = catalog.category
  and activity.icon = catalog.icon
  and activity.points = catalog.points
  and activity.time_of_day = catalog.time_of_day
  and activity.duration_minutes = catalog.duration_minutes
  and activity.requires_approval = catalog.requires_approval
  and activity.recurrence_type = 'daily'
  and to_jsonb(activity.recurrence_days) = '[0,1,2,3,4,5,6]'::jsonb;

commit;
`;
}

const mode = process.argv[2];
if (mode === '--stdout') {
  process.stdout.write(generateLegacyTemplateBackfill());
} else if (mode === '--check') {
  const actual = readFileSync(migrationPath, 'utf8');
  if (actual !== generateLegacyTemplateBackfill()) {
    throw new Error('Legacy template backfill is out of sync with the catalog.');
  }
  process.stdout.write('Legacy template backfill matches the catalog.\n');
} else if (mode === '--write') {
  writeFileSync(migrationPath, generateLegacyTemplateBackfill());
  process.stdout.write('Legacy template backfill generated.\n');
} else {
  process.stderr.write('Usage: node scripts/generate-legacy-template-backfill.mjs --stdout|--check|--write\n');
  process.exitCode = 2;
}
