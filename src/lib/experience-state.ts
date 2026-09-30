import { z } from 'zod';
import { journalEntrySchema } from '@/lib/child-journal';
import type { JournalEntry } from '@/lib/child-journal';
import { cityPurchaseSchema } from '@/lib/dream-city';
import type { CityPurchase } from '@/lib/dream-city';

const uuid = z.string().uuid();
const timestamp = z.string().datetime({ offset: true });
const pausePeriodRow = z.object({
  startedAt: timestamp,
  endedAt: timestamp.nullable(),
});

const childEngagementRow = z.object({
  family_id: uuid,
  child_id: uuid,
  mascot_selected_at: timestamp.nullable(),
});
const familySettingsRow = z.object({
  family_id: uuid,
  paused_at: timestamp.nullable(),
  pause_reason: z.string().nullable(),
  pause_periods: z.array(pausePeriodRow).default([]),
});
const dailyLetterRow = z.object({
  family_id: uuid,
  child_id: uuid,
  local_date: z.iso.date(),
  template_key: z.string(),
  read_at: timestamp.nullable(),
});
const secretQuestRow = z.object({
  family_id: uuid,
  child_id: uuid,
  local_date: z.iso.date(),
  quest_key: z.string(),
  unlocked_at: timestamp,
  expires_at: timestamp,
  completed_at: timestamp.nullable(),
});
const wishlistRow = z.object({
  family_id: uuid,
  child_id: uuid,
  reward_id: uuid,
  chosen_at: timestamp,
});
const deferredTaskRow = z.object({
  family_id: uuid,
  child_id: uuid,
  activity_id: uuid,
  local_date: z.iso.date(),
  deferred_at: timestamp,
});
const supportObservationRow = z.object({
  log_id: uuid,
  family_id: uuid,
  child_id: uuid,
  activity_id: uuid,
  support_level: z.enum(['alone', 'prompted', 'together']),
  recorded_by: z.enum(['parent', 'child']),
  recorded_at: timestamp,
});
const cuePlanShape = {
  family_id: uuid,
  child_id: uuid,
  activity_id: uuid,
  cue_kind: z.enum(['event', 'time']),
  cue_text: z.string().trim().min(1).max(200),
  cue_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable(),
  place_text: z.string().max(120).nullable(),
  weekend_variant_text: z.string().max(200).nullable(),
  created_at: timestamp,
  updated_at: timestamp,
};
const timeMatchesKind = (plan: { cue_kind: string; cue_time: string | null }) => (
  (plan.cue_kind === 'time') === (plan.cue_time !== null)
);
const timeMatchesKindMessage = { message: 'A time cue needs a time of day and an event cue must not have one.' };
const cuePlanRow = z.object(cuePlanShape).refine(timeMatchesKind, timeMatchesKindMessage);

export type ChildEngagement = z.infer<typeof childEngagementRow>;
export type FamilyEngagementSettings = z.infer<typeof familySettingsRow>;
export type FamilyPausePeriod = z.infer<typeof pausePeriodRow>;
export type DailyMascotLetter = z.infer<typeof dailyLetterRow>;
export type SecretQuest = z.infer<typeof secretQuestRow>;
export type ChildWishlist = z.infer<typeof wishlistRow>;
export type DeferredTask = z.infer<typeof deferredTaskRow>;
export type SupportObservation = z.infer<typeof supportObservationRow>;
export type CuePlan = z.infer<typeof cuePlanRow>;

export function parseChildWishlist(input: unknown): ChildWishlist {
  return wishlistRow.parse(input);
}

export function parseDeferredTask(input: unknown): DeferredTask {
  return deferredTaskRow.parse(input);
}

export function parseDeferredTasks(input: unknown): DeferredTask[] {
  return z.array(deferredTaskRow).parse(input);
}

export function parseSupportObservation(input: unknown): SupportObservation {
  return supportObservationRow.parse(input);
}

export function parseSupportObservations(input: unknown): SupportObservation[] {
  return z.array(supportObservationRow).parse(input);
}

export function parseCuePlan(input: unknown): CuePlan {
  return cuePlanRow.parse(input);
}

export function parseCuePlans(input: unknown): CuePlan[] {
  return z.array(cuePlanRow).parse(input);
}

export type ExperienceState = {
  readonly children: readonly ChildEngagement[];
  readonly settings: FamilyEngagementSettings | null;
  readonly letters: readonly DailyMascotLetter[];
  readonly quests: readonly SecretQuest[];
  readonly wishlists: readonly ChildWishlist[];
  readonly deferredTasks: readonly DeferredTask[];
  readonly supportObservations: readonly SupportObservation[];
  readonly cuePlans: readonly CuePlan[];
  readonly journalEntries: readonly JournalEntry[];
  readonly cityPurchases: readonly CityPurchase[];
};

export const emptyExperienceState: ExperienceState = {
  children: [],
  settings: null,
  letters: [],
  quests: [],
  wishlists: [],
  deferredTasks: [],
  supportObservations: [],
  cuePlans: [],
  journalEntries: [],
  cityPurchases: [],
};

const experienceRows = z.object({
  children: z.array(childEngagementRow),
  settings: familySettingsRow.nullable(),
  letters: z.array(dailyLetterRow),
  quests: z.array(secretQuestRow),
  wishlists: z.array(wishlistRow),
  deferredTasks: z.array(deferredTaskRow).default([]),
  supportObservations: z.array(supportObservationRow).default([]),
  cuePlans: z.array(cuePlanRow).default([]),
  journalEntries: z.array(journalEntrySchema).default([]),
  cityPurchases: z.array(cityPurchaseSchema).default([]),
});

const demoChildId = z.string().min(1);
const demoExperienceRows = experienceRows.extend({
  children: z.array(childEngagementRow.extend({ child_id: demoChildId })),
  letters: z.array(dailyLetterRow.extend({ child_id: demoChildId })),
  quests: z.array(secretQuestRow.extend({ child_id: demoChildId })),
  wishlists: z.array(wishlistRow.extend({ child_id: demoChildId, reward_id: z.string().min(1) })),
  deferredTasks: z.array(deferredTaskRow.extend({ child_id: demoChildId, activity_id: z.string().min(1) })).default([]),
  supportObservations: z.array(supportObservationRow.extend({
    log_id: z.string().min(1), child_id: demoChildId, activity_id: z.string().min(1),
  })).default([]),
  cuePlans: z.array(z.object({ ...cuePlanShape, child_id: demoChildId, activity_id: z.string().min(1) })
    .refine(timeMatchesKind, timeMatchesKindMessage)).default([]),
  journalEntries: z.array(journalEntrySchema.extend({ child_id: demoChildId })).default([]),
  cityPurchases: z.array(cityPurchaseSchema.extend({ child_id: demoChildId })).default([]),
});

export function parseExperienceState(input: unknown, familyId: string, isDemo = false): ExperienceState {
  const state = (isDemo ? demoExperienceRows : experienceRows).parse(input);
  const rows = [
    ...state.children,
    ...state.letters,
    ...state.quests,
    ...state.wishlists,
    ...state.deferredTasks,
    ...state.supportObservations,
    ...state.cuePlans,
    ...state.journalEntries,
    ...state.cityPurchases,
    ...(state.settings ? [state.settings] : []),
  ];
  if (rows.some((row) => row.family_id !== familyId)) {
    throw new Error('Experience state contains another family.');
  }
  return state;
}

export function setJournalEntry(state: ExperienceState, entry: JournalEntry): ExperienceState {
  return {
    ...state,
    journalEntries: [
      ...state.journalEntries.filter((row) => (
        row.child_id !== entry.child_id || row.local_date !== entry.local_date
      )),
      entry,
    ],
  };
}

export function setDeferredTask(
  state: ExperienceState,
  task: DeferredTask,
  deferred: boolean,
): ExperienceState {
  const exists = state.deferredTasks.some((row) =>
    row.child_id === task.child_id
    && row.activity_id === task.activity_id
    && row.local_date === task.local_date,
  );
  if (exists === deferred) return state;
  return {
    ...state,
    deferredTasks: deferred
      ? [...state.deferredTasks, task]
      : state.deferredTasks.filter((row) =>
          row.child_id !== task.child_id
          || row.activity_id !== task.activity_id
          || row.local_date !== task.local_date,
        ),
  };
}

export function setSupportObservation(state: ExperienceState, observation: SupportObservation): ExperienceState {
  const existing = state.supportObservations.find((row) => row.log_id === observation.log_id);
  if (existing && JSON.stringify(existing) === JSON.stringify(observation)) return state;
  return {
    ...state,
    supportObservations: [
      ...state.supportObservations.filter((row) => row.log_id !== observation.log_id),
      observation,
    ],
  };
}

export function setCuePlan(state: ExperienceState, plan: CuePlan): ExperienceState {
  return {
    ...state,
    cuePlans: [
      ...state.cuePlans.filter((row) => row.child_id !== plan.child_id || row.activity_id !== plan.activity_id),
      plan,
    ],
  };
}

/** The recorded support level of each of one child's logs, ready for buildOpportunities. */
export function supportLevelsByLogId(
  state: ExperienceState,
  childId: string,
): Map<string, SupportObservation['support_level']> {
  return new Map(state.supportObservations
    .filter((row) => row.child_id === childId)
    .map((row) => [row.log_id, row.support_level] as const));
}

