import { z } from 'zod';
import dailyLivingData from '@/data/daily-living-habits-v1.vi.json';
import { WIT_HABIT_PACKS, type HabitTemplate } from '@/lib/constants';
import type { ActivityCategory, TimeOfDay, HabitActivity } from '@/types';
import { matchesLegacyTemplateAssignment } from '@/lib/legacy-template-identity';
import { localizeWitTemplate } from '@/lib/i18n/wit-template-copy';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/context';
import { dailyLivingActivityId, isDailyLivingTemplateId } from './daily-living-habits-id';
import { generateAgeAdaptedHabits } from './wit-framework';

/** Content version constant exported for external reference. */
export const DAILY_LIVING_CONTENT_VERSION = 'daily-living-v1';

/** A single daily living habit template. */
export type DailyLivingTemplate = {
  readonly id: string;              // 'WIT-DLY-01'..'WIT-DLY-10' | 'WIT-NUT-01' | 'WIT-CAP-01'
  readonly source: 'daily' | 'legacy';
  readonly title: string;
  readonly shortTitle: string;
  readonly icon: string;
  readonly category: ActivityCategory;
  readonly timeOfDay: TimeOfDay;
  readonly points: number;
  readonly description: string;
  readonly support?: string;
  readonly cue?: string;
};

/** A curated set of daily living templates. */
export type DailyLivingSet = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly itemIds: readonly string[];
};

/** Raw JSON shape for validation. */
const rawTemplateSchema = z.strictObject({
  id: z.string().regex(/^WIT-(DLY-\d{2}|NUT-01|CAP-01)$/),
  source: z.enum(['daily', 'legacy']),
  title: z.string().optional(),
  shortTitle: z.string().min(1),
  icon: z.string().min(1).optional(),
  category: z.enum(['selfcare', 'health', 'chores']).optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'anytime']).optional(),
  points: z.number().int().min(0).optional(),
  description: z.string().min(1),
  support: z.string().optional(),
  cue: z.string().optional(),
});

const rawSetSchema = z.strictObject({
  id: z.string().regex(/^DLS-\d{2}$/),
  title: z.string().min(1),
  description: z.string().min(1),
  itemIds: z.array(z.string().regex(/^WIT-(DLY-\d{2}|NUT-01|CAP-01)$/)).min(2).max(5),
});

const rawDataSchema = z.strictObject({
  schemaVersion: z.literal('1.0.0'),
  contentVersion: z.literal('daily-living-v1'),
  language: z.literal('vi'),
  templates: z.array(rawTemplateSchema).length(12),
  sets: z.array(rawSetSchema).length(4),
});

/** The original catalog entry and its localized copies, so old rows without legacyTemplateId still match exactly. */
function legacyMatchInputs(templateId: string): { item: HabitTemplate; copies: HabitTemplate[] } | undefined {
  for (const pack of WIT_HABIT_PACKS) {
    const index = pack.items.findIndex((item) => item.id === templateId);
    if (index >= 0) {
      const item = pack.items[index];
      return { item, copies: SUPPORTED_LANGUAGES.map((option) => localizeWitTemplate(item, index, option.code)) };
    }
  }
  return undefined;
}

/** Validated, enriched templates with runtime-resolved legacy fields. */
const DAILY_LIVING_TEMPLATES: readonly DailyLivingTemplate[] = (() => {
  const parsed = rawDataSchema.parse(dailyLivingData);

  // Build a map of legacy templates for runtime resolution
  const legacyMap = new Map<string, {
    title: string;
    icon: string;
    category: ActivityCategory;
    timeOfDay: TimeOfDay;
    points: number;
  }>();
  for (const pack of WIT_HABIT_PACKS) {
    for (const item of pack.items) {
      if (item.id === 'WIT-NUT-01' || item.id === 'WIT-CAP-01') {
        legacyMap.set(item.id, {
          title: item.title,
          icon: item.icon,
          category: item.category,
          timeOfDay: item.timeOfDay,
          points: item.points,
        });
      }
    }
  }

  return parsed.templates.map((raw) => {
    if (raw.source === 'legacy') {
      const legacy = legacyMap.get(raw.id);
      if (!legacy) throw new Error(`Legacy template ${raw.id} not found in WIT_HABIT_PACKS`);
      return {
        id: raw.id,
        source: 'legacy' as const,
        title: legacy.title,
        shortTitle: raw.shortTitle,
        icon: legacy.icon,
        category: legacy.category,
        timeOfDay: legacy.timeOfDay,
        points: legacy.points,
        description: raw.description,
        support: raw.support,
        cue: raw.cue,
      };
    }
    // daily templates have all fields in JSON
    return {
      id: raw.id,
      source: 'daily' as const,
      title: raw.title!,
      shortTitle: raw.shortTitle,
      icon: raw.icon!,
      category: raw.category!,
      timeOfDay: raw.timeOfDay!,
      points: raw.points!,
      description: raw.description,
      support: raw.support,
      cue: raw.cue,
    };
  });
})();

/** Validated sets referencing template IDs. */
const DAILY_LIVING_SETS: readonly DailyLivingSet[] = (() => {
  const parsed = rawDataSchema.parse(dailyLivingData);
  return parsed.sets.map((raw) => ({
    id: raw.id,
    title: raw.title,
    description: raw.description,
    itemIds: raw.itemIds,
  }));
})();

/** Map for fast template lookup by ID. */
const TEMPLATE_BY_ID = new Map(DAILY_LIVING_TEMPLATES.map((t) => [t.id, t]));

/** Returns the template for a given ID, or undefined if not found. */
export function getDailyLivingTemplate(id: string): DailyLivingTemplate | undefined {
  return TEMPLATE_BY_ID.get(id);
}

/** Validates the daily living catalog integrity. */
export function validateDailyLivingCatalog(): void {
  // 1. All template IDs are unique
  const templateIds = DAILY_LIVING_TEMPLATES.map((t) => t.id);
  if (new Set(templateIds).size !== templateIds.length) {
    throw new Error('Duplicate template IDs in daily living catalog');
  }

  // 2. All set itemIds reference valid templates
  const validTemplateIds = new Set(templateIds);
  for (const set of DAILY_LIVING_SETS) {
    for (const itemId of set.itemIds) {
      if (!validTemplateIds.has(itemId)) {
        throw new Error(`Set ${set.id} references unknown template ID: ${itemId}`);
      }
    }
    // 3. Each set has 2-5 items (already enforced by schema)
    if (set.itemIds.length < 2 || set.itemIds.length > 5) {
      throw new Error(`Set ${set.id} must have 2-5 items, got ${set.itemIds.length}`);
    }
  }

  // 4. Legacy templates exist in WIT_HABIT_PACKS
  for (const template of DAILY_LIVING_TEMPLATES) {
    if (template.source === 'legacy') {
      const exists = WIT_HABIT_PACKS.some((pack) =>
        pack.items.some((item) => item.id === template.id)
      );
      if (!exists) {
        throw new Error(`Legacy template ${template.id} not found in WIT_HABIT_PACKS`);
      }
    }
  }
}

/** Assignment options when creating an activity from a daily living template. */
export type DailyLivingAssignment = {
  readonly childId: string | null;   // null only when user explicitly chooses "all children"
  readonly points?: number;
  readonly timeOfDay?: TimeOfDay;
  readonly cue?: string;
};

/** Converts a daily living template into a HabitActivity (without createdAt). */
export async function toHabitActivity(
  template: DailyLivingTemplate,
  familyId: string,
  assignment: DailyLivingAssignment,
): Promise<Omit<HabitActivity, 'createdAt'>> {
  const isDaily = isDailyLivingTemplateId(template.id);
  const activityId = isDaily
    ? await dailyLivingActivityId(familyId, assignment.childId, template.id)
    : undefined; // let store generate for legacy templates

  return {
    id: activityId ?? crypto.randomUUID(),
    childId: assignment.childId,
    title: template.title,
    description: template.description,
    instructions: template.support,
    icon: template.icon,
    category: template.category,
    points: assignment.points ?? template.points,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    timeOfDay: assignment.timeOfDay ?? template.timeOfDay,
    durationMinutes: 0,
    requiresApproval: false,
    isActive: true,
    targetAgeStage: 'all',
    isParentRole: false,
    legacyTemplateId: template.id,
  };
}

/** Status of a daily living template for a specific child. */
export type DailyLivingStatus =
  | 'available'
  | 'added'
  | 'archived'
  | 'graduated'
  | 'sharedCovers';

/** Determines the status of a template for a given child. */
export function dailyLivingStatus(
  template: DailyLivingTemplate,
  childId: string,
  activities: readonly HabitActivity[],
): DailyLivingStatus {
  // Find activities matching this template for this child
  const matchingActivities = activities.filter((activity) => {
    // For daily templates: match by deterministic legacyTemplateId
    if (isDailyLivingTemplateId(template.id)) {
      return activity.legacyTemplateId === template.id;
    }
    // For legacy templates (WIT-NUT-01, WIT-CAP-01): match against the original catalog entry.
    const inputs = legacyMatchInputs(template.id);
    return inputs !== undefined && matchesLegacyTemplateAssignment(activity, inputs.item, inputs.copies);
  });

  // Another child's assignment never decides this child's state; only this child's own or a shared one counts.
  const relevant = matchingActivities.filter((a) => a.childId === childId || a.childId === null);

  const graduated = relevant.find((a) => a.graduatedAt && a.childId === childId);
  if (graduated) return 'graduated';

  const activeForChild = relevant.find((a) => a.isActive && a.childId === childId);
  if (activeForChild) return 'added';

  const activeShared = relevant.find((a) => a.isActive && a.childId === null);
  if (activeShared) return 'sharedCovers';

  const archived = relevant.find((a) => !a.isActive && !a.graduatedAt);
  if (archived) return 'archived';

  return 'available';
}

export type ToothbrushingConversion = {
  readonly combinedActivities: readonly HabitActivity[];
  readonly missingTemplates: readonly DailyLivingTemplate[];
  readonly blockedReason: 'shared' | 'inactiveReplacement' | 'childReplacement' | null;
  readonly canConvert: boolean;
  readonly pairConfirmed: boolean;
  readonly previousPoints: number;
  readonly replacementPoints: number;
  readonly replacements: readonly { readonly template: DailyLivingTemplate; readonly activity?: HabitActivity }[];
};

function isCombinedToothbrushing(activity: HabitActivity): boolean {
  if (activity.legacyTemplateId) return activity.legacyTemplateId === 'WIT-PHY-02';
  const legacy = legacyMatchInputs('WIT-PHY-02');
  if (legacy && matchesLegacyTemplateAssignment(activity, legacy.item, legacy.copies)) return true;
  if (activity.frameworkHabitId || activity.journeyHabitKey) return false;

  // The age starter has no template ID. Require its full known structure;
  // a custom habit with just the same title is never sufficient evidence.
  const starter = generateAgeAdaptedHabits(activity.childId, '3-6')[1];
  return Object.entries(starter).every(([key, value]) => {
    const actual = activity[key as keyof HabitActivity];
    return Array.isArray(value)
      ? Array.isArray(actual) && value.length === actual.length && value.every((day, index) => day === actual[index])
      : actual === value;
  }) && !activity.isParentRole && !activity.boThi7Key;
}

/** Plans a conversion without changing assignments, points, or historical logs. */
export function getToothbrushingConversion(
  scope: string,
  activities: readonly HabitActivity[],
): ToothbrushingConversion {
  const childId = scope === 'shared' ? null : scope;
  const combinedActivities = scope ? activities.filter((activity) => (
    activity.isActive && !activity.graduatedAt && !activity.isParentRole
    && (activity.childId === childId || (scope !== 'shared' && activity.childId === null))
    && isCombinedToothbrushing(activity)
  )) : [];
  const missingTemplates: DailyLivingTemplate[] = [];
  let inactiveReplacement = false;
  let confirmedCount = 0;
  let replacementPoints = 0;
  const replacements: { template: DailyLivingTemplate; activity?: HabitActivity }[] = [];
  for (const id of ['WIT-DLY-01', 'WIT-DLY-02']) {
    const template = getDailyLivingTemplate(id)!;
    const matching = activities.filter((activity) => (
      activity.legacyTemplateId === id && !activity.isParentRole
      && (activity.childId === childId || (scope !== 'shared' && activity.childId === null))
    ));
    const active = matching.find((activity) => activity.isActive && !activity.graduatedAt);
    replacements.push({ template, activity: active ?? matching[0] });
    replacementPoints += active?.points ?? matching[0]?.points ?? template.points;
    if (active) confirmedCount++;
    else if (matching.length > 0) inactiveReplacement = true;
    else missingTemplates.push(template);
  }
  const overlapsChildReplacement = scope === 'shared' && activities.some((activity) => (
    activity.childId !== null && (activity.legacyTemplateId === 'WIT-DLY-01' || activity.legacyTemplateId === 'WIT-DLY-02')
  ));
  const blockedReason = scope !== 'shared' && combinedActivities.some((activity) => activity.childId === null)
    ? 'shared' : overlapsChildReplacement ? 'childReplacement' : inactiveReplacement ? 'inactiveReplacement' : null;
  return {
    combinedActivities, missingTemplates, blockedReason, replacements,
    canConvert: Boolean(scope) && combinedActivities.length > 0 && blockedReason === null,
    pairConfirmed: Boolean(scope) && confirmedCount === 2,
    previousPoints: combinedActivities.reduce((total, activity) => total + activity.points, 0),
    replacementPoints,
  };
}

/** Returns all daily living templates. */
export function getAllDailyLivingTemplates(): readonly DailyLivingTemplate[] {
  return DAILY_LIVING_TEMPLATES;
}

/** Returns all daily living sets. */
export function getAllDailyLivingSets(): readonly DailyLivingSet[] {
  return DAILY_LIVING_SETS;
}

/** Returns templates belonging to a set. */
export function getTemplatesForSet(setId: string): readonly DailyLivingTemplate[] {
  const set = DAILY_LIVING_SETS.find((s) => s.id === setId);
  if (!set) return [];
  return set.itemIds.map((id) => TEMPLATE_BY_ID.get(id)!).filter(Boolean) as DailyLivingTemplate[];
}

// Export constants for testing
export { DAILY_LIVING_TEMPLATES, DAILY_LIVING_SETS };
