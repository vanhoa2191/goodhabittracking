import { validatePuzzle } from './checkers';
import { getGameMechanic, isRuleVariantForGame } from './registry';
import { manifestSchema, parseManifest } from './schema';
import type {
  CatalogValidationError,
  CatalogValidationMetrics,
  CatalogValidationResult,
  PuzzleItem,
  ThinkingGamesManifest,
} from './types';

export type CatalogValidationProfile = 'pilot' | 'release';

export type EditorialRow = Readonly<{
  day: number;
  mainId: string;
  mainTypeId: string;
  mainSkill: string;
  mainRuleVariant: string;
  bonusId: string;
  bonusTypeId: string;
  bonusSkill: string;
  bonusRuleVariant: string;
  mainStatus: string;
  bonusStatus: string;
}>;

const REQUIRED_SKILLS = 8;
const RELEASE_DAYS = 365;
const PILOT_DAYS = 7;

const SKILL_ALIASES: Readonly<Record<string, string>> = {
  'Quy luật': 'rule',
  'Không gian': 'spatial',
  'Trí nhớ': 'memory',
  'Suy luận': 'reasoning',
  'Số lượng': 'quantity',
  'Lập kế hoạch': 'planning',
  'Linh hoạt': 'flexibility',
  'Quan sát': 'observation',
};

function normalizeSkill(value: string): string {
  return SKILL_ALIASES[value] ?? value;
}

function emptyMetrics(kind: CatalogValidationMetrics['coverageKind']): CatalogValidationMetrics {
  return {
    coverageKind: kind,
    dayCount: 0,
    slotCount: 0,
    typeIds: 0,
    variantPairs: 0,
    skillCount: 0,
    equalSkillDays: 0,
    rollingEightDayWindows: 0,
    rollingEightDayCovered: 0,
    minFormatSpacingDays: 0,
    itemCount: 0,
  };
}

function error(code: string, path: string, message: string): CatalogValidationError {
  return { code, path, message };
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function spacingFor(items: readonly { dayIndex: number; gameTypeId: string }[]): number {
  const daysByType = new Map<string, Set<number>>();
  for (const item of items) {
    const days = daysByType.get(item.gameTypeId) ?? new Set<number>();
    days.add(item.dayIndex);
    daysByType.set(item.gameTypeId, days);
  }
  let minimum = Number.POSITIVE_INFINITY;
  for (const days of daysByType.values()) {
    const sorted = [...days].sort((a, b) => a - b);
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (previous === undefined || current === undefined) continue;
      minimum = Math.min(minimum, current - previous);
    }
  }
  return Number.isFinite(minimum) ? minimum : 0;
}

function rollingCoverage(
  days: readonly number[],
  skillsByDay: ReadonlyMap<number, ReadonlySet<string>>,
): { windows: number; covered: number } {
  if (days.length === 0) return { windows: 0, covered: 0 };
  const first = Math.min(...days);
  const last = Math.max(...days);
  const windows = Math.max(0, last - first + 1 - 7);
  let covered = 0;
  for (let start = first; start + 7 <= last; start += 1) {
    const skills = new Set<string>();
    for (let day = start; day < start + 8; day += 1) {
      for (const skill of skillsByDay.get(day) ?? []) skills.add(skill);
    }
    if (skills.size >= REQUIRED_SKILLS) covered += 1;
  }
  return { windows, covered };
}

function manifestMetrics(
  items: readonly PuzzleItem[],
  coverageKind: 'pilot' | 'release',
): CatalogValidationMetrics {
  const days = unique(items.map((item) => item.dayIndex)).sort((a, b) => a - b);
  const skillsByDay = new Map<number, Set<string>>();
  const slotsByDay = new Map<number, Set<string>>();
  for (const item of items) {
    const skills = skillsByDay.get(item.dayIndex) ?? new Set<string>();
    skills.add(item.skillGroup);
    skillsByDay.set(item.dayIndex, skills);
    const slots = slotsByDay.get(item.dayIndex) ?? new Set<string>();
    slots.add(item.slotType);
    slotsByDay.set(item.dayIndex, slots);
  }
  let equalSkillDays = 0;
  for (const day of days) {
    const dayItems = items.filter((item) => item.dayIndex === day);
    for (const ageTrack of unique(dayItems.map((item) => item.ageTrack))) {
      const trackItems = dayItems.filter((item) => item.ageTrack === ageTrack);
      const mainSkills = new Set(trackItems.filter((item) => item.slotType === 'main').map((item) => item.skillGroup));
      const bonusSkills = new Set(trackItems.filter((item) => item.slotType === 'bonus').map((item) => item.skillGroup));
      if (mainSkills.size === 1 && bonusSkills.size === 1 && [...mainSkills][0] === [...bonusSkills][0]) {
        equalSkillDays += 1;
      }
    }
  }
  const rolling = rollingCoverage(days, skillsByDay);
  return {
    coverageKind,
    dayCount: days.length,
    slotCount: new Set(items.map((item) => item.id)).size,
    typeIds: unique(items.map((item) => item.gameTypeId)).length,
    variantPairs: unique(items.map((item) => item.ruleVariantId)).length,
    skillCount: unique(items.map((item) => item.skillGroup)).length,
    equalSkillDays,
    rollingEightDayWindows: rolling.windows,
    rollingEightDayCovered: rolling.covered,
    minFormatSpacingDays: spacingFor(items),
    itemCount: items.length,
  };
}

function editorialMetrics(rows: readonly EditorialRow[]): CatalogValidationMetrics {
  const days = unique(rows.map((row) => row.day)).sort((a, b) => a - b);
  const skillsByDay = new Map<number, Set<string>>();
  const items: { dayIndex: number; gameTypeId: string }[] = [];
  let equalSkillDays = 0;
  for (const row of rows) {
    const skills = skillsByDay.get(row.day) ?? new Set<string>();
    skills.add(normalizeSkill(row.mainSkill));
    skills.add(normalizeSkill(row.bonusSkill));
    skillsByDay.set(row.day, skills);
    if (normalizeSkill(row.mainSkill) === normalizeSkill(row.bonusSkill)) equalSkillDays += 1;
    items.push({ dayIndex: row.day, gameTypeId: row.mainTypeId });
    items.push({ dayIndex: row.day, gameTypeId: row.bonusTypeId });
  }
  const rolling = rollingCoverage(days, skillsByDay);
  return {
    coverageKind: 'editorial',
    dayCount: days.length,
    slotCount: unique(rows.flatMap((row) => [row.mainId, row.bonusId])).length,
    typeIds: unique(rows.flatMap((row) => [row.mainTypeId, row.bonusTypeId])).length,
    variantPairs: unique(rows.flatMap((row) => [
      `${row.mainTypeId}:${row.mainRuleVariant}`,
      `${row.bonusTypeId}:${row.bonusRuleVariant}`,
    ])).length,
    skillCount: unique(rows.flatMap((row) => [normalizeSkill(row.mainSkill), normalizeSkill(row.bonusSkill)])).length,
    equalSkillDays,
    rollingEightDayWindows: rolling.windows,
    rollingEightDayCovered: rolling.covered,
    minFormatSpacingDays: spacingFor(items),
    itemCount: 0,
  };
}

function validateEditorialShape(rows: readonly EditorialRow[]): CatalogValidationError[] {
  const errors: CatalogValidationError[] = [];
  if (rows.length !== RELEASE_DAYS) errors.push(error('editorial_day_count', 'rows', `expected ${RELEASE_DAYS} rows`));
  const days = unique(rows.map((row) => row.day)).sort((a, b) => a - b);
  if (days.length !== RELEASE_DAYS || days.some((day, index) => day !== index + 1)) {
    errors.push(error('editorial_days_not_continuous', 'rows', 'days must be 1..365'));
  }
  const ids = rows.flatMap((row) => [row.mainId, row.bonusId]);
  if (unique(ids).length !== RELEASE_DAYS * 2) {
    errors.push(error('editorial_slot_ids', 'rows', 'main/bonus ids must be 730 unique values'));
  }
  for (const row of rows) {
    for (const [slot, typeId, variant, skill] of [
      ['main', row.mainTypeId, row.mainRuleVariant, row.mainSkill],
      ['bonus', row.bonusTypeId, row.bonusRuleVariant, row.bonusSkill],
    ] as const) {
      const mechanic = getGameMechanic(typeId);
      if (!mechanic) {
        errors.push(error('editorial_unknown_type', `${row.day}.${slot}`, `unknown ${typeId}`));
        continue;
      }
      if (!isRuleVariantForGame(typeId, `${typeId}:${variant}`)) {
        errors.push(error('editorial_unknown_variant', `${row.day}.${slot}`, `${typeId}:${variant}`));
      }
      if (mechanic.skillGroup !== normalizeSkill(skill)) {
        errors.push(error('editorial_skill_mismatch', `${row.day}.${slot}`, `${typeId} is ${mechanic.skillGroup}`));
      }
    }
    if (row.mainStatus !== 'design_only' || row.bonusStatus !== 'design_only') {
      errors.push(error('editorial_status', String(row.day), 'current CSV must remain design_only'));
    }
    if (normalizeSkill(row.mainSkill) === normalizeSkill(row.bonusSkill)) {
      errors.push(error('editorial_equal_skill', String(row.day), 'main and bonus must differ'));
    }
  }
  return errors;
}

export function validateEditorialRows(rows: readonly EditorialRow[]): CatalogValidationResult {
  const metrics = editorialMetrics(rows);
  const errors = validateEditorialShape(rows);
  if (metrics.typeIds !== 24) errors.push(error('editorial_type_ids', 'rows', `expected 24, got ${metrics.typeIds}`));
  if (metrics.variantPairs !== 96) errors.push(error('editorial_variant_pairs', 'rows', `expected 96, got ${metrics.variantPairs}`));
  if (metrics.skillCount !== 8) errors.push(error('editorial_skill_count', 'rows', `expected 8, got ${metrics.skillCount}`));
  if (metrics.equalSkillDays !== 0) errors.push(error('editorial_equal_days', 'rows', `expected 0, got ${metrics.equalSkillDays}`));
  if (metrics.rollingEightDayWindows !== 358) {
    errors.push(error('editorial_rolling_windows', 'rows', `expected 358, got ${metrics.rollingEightDayWindows}`));
  }
  if (metrics.rollingEightDayCovered !== 358) {
    errors.push(error('editorial_rolling_coverage', 'rows', `expected 358 covered, got ${metrics.rollingEightDayCovered}`));
  }
  if (metrics.minFormatSpacingDays < 11) {
    errors.push(error('editorial_spacing', 'rows', `expected >= 11, got ${metrics.minFormatSpacingDays}`));
  }
  return errors.length === 0 ? { ok: true, metrics } : { ok: false, errors, metrics };
}

function validatePilotManifest(
  manifest: ThinkingGamesManifest,
  metrics: CatalogValidationMetrics,
): CatalogValidationError[] {
  const errors: CatalogValidationError[] = [];
  if (!manifest.isPilotFixture) errors.push(error('pilot_fixture_required', 'isPilotFixture', 'pilot profile requires true'));
  if (manifest.minFormatSpacingDays !== 1) {
    errors.push(error('pilot_spacing_exception', 'minFormatSpacingDays', 'pilot profile requires 1'));
  }
  if (!manifest.spacingException) {
    errors.push(error('pilot_spacing_exception', 'spacingException', 'explicit exception required'));
  }
  if (manifest.coverage) errors.push(error('pilot_coverage_claim', 'coverage', 'pilot must not claim release coverage'));
  if (manifest.items.length !== 28) {
    errors.push(error('pilot_item_count', 'items', `expected 28, got ${manifest.items.length}`));
  }
  const days = unique(manifest.items.map((item) => item.dayIndex)).sort((a, b) => a - b);
  if (days.length !== PILOT_DAYS || days.some((day, index) => day !== index + 1)) {
    errors.push(error('pilot_days', 'items', 'expected days 1..7'));
  }
  if (metrics.typeIds !== 3) errors.push(error('pilot_type_ids', 'items', `expected 3, got ${metrics.typeIds}`));
  if (metrics.skillCount !== 3) errors.push(error('pilot_skills', 'items', `expected 3, got ${metrics.skillCount}`));
  for (const ageTrack of manifest.ageTracks) {
    for (let day = 1; day <= PILOT_DAYS; day += 1) {
      const trackItems = manifest.items.filter((item) => item.ageTrack === ageTrack && item.dayIndex === day);
      const mainSkill = trackItems.find((item) => item.slotType === 'main')?.skillGroup;
      const bonusSkill = trackItems.find((item) => item.slotType === 'bonus')?.skillGroup;
      if (mainSkill && bonusSkill && mainSkill === bonusSkill) {
        errors.push(error('pilot_equal_skill', `${ageTrack}.${day}`, 'main and bonus skills must differ'));
      }
    }
  }
  if (manifest.ageTracks.length !== 2 || !manifest.ageTracks.includes('age_6_8') || !manifest.ageTracks.includes('age_9_12')) {
    errors.push(error('pilot_age_tracks', 'ageTracks', 'both released tracks required'));
  }
  if (manifest.locales.length !== 1 || manifest.locales[0] !== 'vi') {
    errors.push(error('pilot_locale', 'locales', 'only vi is released'));
  }
  for (const ageTrack of manifest.ageTracks) {
    for (let day = 1; day <= PILOT_DAYS; day += 1) {
      const slots = new Set(manifest.items
        .filter((item) => item.ageTrack === ageTrack && item.dayIndex === day)
        .map((item) => item.slotType));
      if (slots.size !== 2) {
        errors.push(error('pilot_slots', `${ageTrack}.${day}`, 'main and bonus required'));
      }
    }
  }
  const ids = new Set<string>();
  const fingerprints = new Map<string, number>();
  for (const item of manifest.items) {
    if (ids.has(item.id)) errors.push(error('pilot_duplicate_id', item.id, 'duplicate id'));
    ids.add(item.id);
    if (item.status === 'approved') errors.push(error('pilot_approved_item', item.id, 'pilot items are not human-approved'));
    if (item.status === 'retired') errors.push(error('pilot_retired_item', item.id, 'retired item in pilot'));
    const previousDay = fingerprints.get(item.fingerprint);
    if (previousDay !== undefined) {
      errors.push(error('pilot_duplicate_fingerprint', item.id, 'duplicate canonical board'));
    }
    fingerprints.set(item.fingerprint, item.dayIndex);
    const validation = validatePuzzle(item);
    if (!validation.ok) errors.push(error(validation.code, item.id, validation.details.join('; ')));
  }
  return errors;
}

function validateReleaseManifest(
  manifest: ThinkingGamesManifest,
  metrics: CatalogValidationMetrics,
): CatalogValidationError[] {
  const errors: CatalogValidationError[] = [];
  if (manifest.isPilotFixture) errors.push(error('release_pilot_fixture', 'isPilotFixture', 'release requires false'));
  if (manifest.spacingException) errors.push(error('release_spacing_exception', 'spacingException', 'not allowed'));
  if (manifest.minFormatSpacingDays < 7) {
    errors.push(error('release_spacing_minimum', 'minFormatSpacingDays', 'must be >= 7'));
  }
  if (!manifest.coverage) {
    errors.push(error('release_coverage', 'coverage', 'coverage is required'));
  } else if (
    manifest.coverage.dayCount !== 365
    || manifest.coverage.slotsPerDay !== 2
    || manifest.coverage.typeIds !== 24
    || manifest.coverage.variantPairs !== 96
  ) {
    errors.push(error('release_coverage', 'coverage', 'must be 365/2/24/96'));
  }
  if (!manifest.editorialApproval) {
    errors.push(error('release_editorial', 'editorialApproval', 'human approval is required'));
  }
  const expectedItems = 365 * 2 * manifest.ageTracks.length * manifest.locales.length;
  if (manifest.items.length !== expectedItems) {
    errors.push(error('release_item_count', 'items', `expected ${expectedItems}, got ${manifest.items.length}`));
  }
  if (metrics.typeIds !== 24) errors.push(error('release_type_ids', 'items', `expected 24, got ${metrics.typeIds}`));
  if (metrics.variantPairs !== 96) errors.push(error('release_variant_pairs', 'items', `expected 96, got ${metrics.variantPairs}`));
  if (metrics.skillCount !== 8) errors.push(error('release_skills', 'items', `expected 8, got ${metrics.skillCount}`));
  if (metrics.equalSkillDays !== 0) errors.push(error('release_equal_skill', 'items', 'main and bonus skills must differ'));
  const keys = new Set<string>();
  const fingerprintDays = new Map<string, number[]>();
  for (const item of manifest.items) {
    const key = `${item.dayIndex}:${item.slotType}:${item.ageTrack}:${item.locale}:${item.contentVersion}`;
    if (keys.has(key)) errors.push(error('release_duplicate_slot', item.id, key));
    keys.add(key);
    if (item.status !== 'approved') errors.push(error('release_unapproved', item.id, item.status));
    if (!item.editorial) errors.push(error('release_editorial_item', item.id, 'editorial is required'));
    const validation = validatePuzzle(item);
    if (!validation.ok) errors.push(error(validation.code, item.id, validation.details.join('; ')));
    const days = fingerprintDays.get(item.fingerprint) ?? [];
    days.push(item.dayIndex);
    fingerprintDays.set(item.fingerprint, days);
  }
  for (const [fingerprint, days] of fingerprintDays) {
    const sorted = unique(days).sort((a, b) => a - b);
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (previous === undefined || current === undefined) continue;
      if (current - previous < manifest.minFormatSpacingDays) {
        errors.push(error('release_fingerprint_spacing', fingerprint, `${current - previous} < ${manifest.minFormatSpacingDays}`));
      }
    }
  }
  for (const ageTrack of manifest.ageTracks) {
    for (const locale of manifest.locales) {
      const group = manifest.items.filter((item) => item.ageTrack === ageTrack && item.locale === locale);
      const days = unique(group.map((item) => item.dayIndex)).sort((a, b) => a - b);
      if (days.length !== 365 || days.some((day, index) => day !== index + 1)) {
        errors.push(error('release_days', `${ageTrack}.${locale}`, 'days must be 1..365'));
      }
      const skillsByDay = new Map<number, Set<string>>();
      const slotsByDay = new Map<number, Set<string>>();
      for (const item of group) {
        const skills = skillsByDay.get(item.dayIndex) ?? new Set<string>();
        skills.add(item.skillGroup);
        skillsByDay.set(item.dayIndex, skills);
        const slots = slotsByDay.get(item.dayIndex) ?? new Set<string>();
        slots.add(item.slotType);
        slotsByDay.set(item.dayIndex, slots);
      }
      for (const [day, slots] of slotsByDay) {
        if (slots.size !== 2) errors.push(error('release_slots', `${ageTrack}.${locale}.${day}`, 'two slots required'));
        const dayItems = group.filter((item) => item.dayIndex === day);
        const mainSkill = dayItems.find((item) => item.slotType === 'main')?.skillGroup;
        const bonusSkill = dayItems.find((item) => item.slotType === 'bonus')?.skillGroup;
        if (mainSkill && bonusSkill && mainSkill === bonusSkill) {
          errors.push(error('release_equal_skill', `${ageTrack}.${locale}.${day}`, 'main and bonus must differ'));
        }
      }
      const rolling = rollingCoverage(days, skillsByDay);
      if (rolling.windows !== 358 || rolling.covered !== 358) {
        errors.push(error('release_rolling', `${ageTrack}.${locale}`, `${rolling.covered}/${rolling.windows}`));
      }
      if (spacingFor(group) < manifest.minFormatSpacingDays) {
        errors.push(error('release_spacing', `${ageTrack}.${locale}`, 'format spacing below declared minimum'));
      }
    }
  }
  return errors;
}

export function validateManifest(
  input: unknown,
  options: { profile: CatalogValidationProfile; allowPilotProfile?: boolean },
): CatalogValidationResult {
  const parsed = manifestSchema.safeParse(input);
  if (!parsed.success) {
    const kind = options.profile === 'pilot' ? 'pilot' : 'release';
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => error('manifest_schema', issue.path.join('.'), issue.message)),
      metrics: emptyMetrics(kind),
    };
  }
  const manifest = parsed.data as ThinkingGamesManifest;
  const isPilot = manifest.isPilotFixture;
  if (options.profile === 'release' && isPilot && !options.allowPilotProfile) {
    return {
      ok: false,
      errors: [error('pilot_fixture_not_release', 'isPilotFixture', 'release profile rejects pilot fixtures')],
      metrics: manifestMetrics(manifest.items, 'pilot'),
    };
  }
  if (options.profile === 'pilot' && !isPilot) {
    return {
      ok: false,
      errors: [error('pilot_fixture_required', 'isPilotFixture', 'pilot profile requires a pilot fixture')],
      metrics: manifestMetrics(manifest.items, 'release'),
    };
  }
  const coverageKind = isPilot ? 'pilot' : 'release';
  const metrics = manifestMetrics(manifest.items, coverageKind);
  const errors = isPilot
    ? validatePilotManifest(manifest, metrics)
    : validateReleaseManifest(manifest, metrics);
  return errors.length === 0 ? { ok: true, metrics } : { ok: false, errors, metrics };
}

export function validateCatalog(input: {
  rows?: readonly EditorialRow[];
  manifest?: unknown;
  profile: CatalogValidationProfile;
  allowPilotProfile?: boolean;
}): CatalogValidationResult {
  const results: CatalogValidationResult[] = [];
  if (input.rows) results.push(validateEditorialRows(input.rows));
  if (input.manifest) results.push(validateManifest(input.manifest, {
    profile: input.profile,
    allowPilotProfile: input.allowPilotProfile,
  }));
  if (results.length === 0) {
    return { ok: false, errors: [error('catalog_empty', '', 'no input')], metrics: emptyMetrics('release') };
  }
  const errors = results.flatMap((result) => (result.ok ? [] : result.errors));
  const metrics = results[0]?.metrics ?? emptyMetrics('release');
  return errors.length === 0 ? { ok: true, metrics } : { ok: false, errors, metrics };
}

export function assertReleaseManifest(input: unknown): ThinkingGamesManifest {
  const result = validateManifest(input, { profile: 'release' });
  if (!result.ok) {
    throw new Error(result.errors.map((entry) => `${entry.code}:${entry.path}:${entry.message}`).join('; '));
  }
  return parseManifest(input);
}
