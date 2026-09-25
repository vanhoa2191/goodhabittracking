import { z } from 'zod';

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

export type ChildEngagement = z.infer<typeof childEngagementRow>;
export type FamilyEngagementSettings = z.infer<typeof familySettingsRow>;
export type FamilyPausePeriod = z.infer<typeof pausePeriodRow>;
export type DailyMascotLetter = z.infer<typeof dailyLetterRow>;
export type SecretQuest = z.infer<typeof secretQuestRow>;
export type ChildWishlist = z.infer<typeof wishlistRow>;
export type DeferredTask = z.infer<typeof deferredTaskRow>;

export function parseChildWishlist(input: unknown): ChildWishlist {
  return wishlistRow.parse(input);
}

export function parseDeferredTask(input: unknown): DeferredTask {
  return deferredTaskRow.parse(input);
}

export function parseDeferredTasks(input: unknown): DeferredTask[] {
  return z.array(deferredTaskRow).parse(input);
}

export type ExperienceState = {
  readonly children: readonly ChildEngagement[];
  readonly settings: FamilyEngagementSettings | null;
  readonly letters: readonly DailyMascotLetter[];
  readonly quests: readonly SecretQuest[];
  readonly wishlists: readonly ChildWishlist[];
  readonly deferredTasks: readonly DeferredTask[];
};

export const emptyExperienceState: ExperienceState = {
  children: [],
  settings: null,
  letters: [],
  quests: [],
  wishlists: [],
  deferredTasks: [],
};

const experienceRows = z.object({
  children: z.array(childEngagementRow),
  settings: familySettingsRow.nullable(),
  letters: z.array(dailyLetterRow),
  quests: z.array(secretQuestRow),
  wishlists: z.array(wishlistRow),
  deferredTasks: z.array(deferredTaskRow).default([]),
});

const demoChildId = z.string().min(1);
const demoExperienceRows = experienceRows.extend({
  children: z.array(childEngagementRow.extend({ child_id: demoChildId })),
  letters: z.array(dailyLetterRow.extend({ child_id: demoChildId })),
  quests: z.array(secretQuestRow.extend({ child_id: demoChildId })),
  wishlists: z.array(wishlistRow.extend({ child_id: demoChildId, reward_id: z.string().min(1) })),
  deferredTasks: z.array(deferredTaskRow.extend({ child_id: demoChildId, activity_id: z.string().min(1) })).default([]),
});

export function parseExperienceState(input: unknown, familyId: string, isDemo = false): ExperienceState {
  const state = (isDemo ? demoExperienceRows : experienceRows).parse(input);
  const rows = [
    ...state.children,
    ...state.letters,
    ...state.quests,
    ...state.wishlists,
    ...state.deferredTasks,
    ...(state.settings ? [state.settings] : []),
  ];
  if (rows.some((row) => row.family_id !== familyId)) {
    throw new Error('Experience state contains another family.');
  }
  return state;
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
