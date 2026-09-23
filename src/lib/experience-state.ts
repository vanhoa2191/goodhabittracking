import { z } from 'zod';

const uuid = z.string().uuid();
const timestamp = z.string().datetime({ offset: true });

const childEngagementRow = z.object({
  family_id: uuid,
  child_id: uuid,
  mascot_selected_at: timestamp.nullable(),
});
const familySettingsRow = z.object({
  family_id: uuid,
  paused_at: timestamp.nullable(),
  pause_reason: z.string().nullable(),
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

export type ChildEngagement = z.infer<typeof childEngagementRow>;
export type FamilyEngagementSettings = z.infer<typeof familySettingsRow>;
export type DailyMascotLetter = z.infer<typeof dailyLetterRow>;
export type SecretQuest = z.infer<typeof secretQuestRow>;
export type ChildWishlist = z.infer<typeof wishlistRow>;

export type ExperienceState = {
  readonly children: readonly ChildEngagement[];
  readonly settings: FamilyEngagementSettings | null;
  readonly letters: readonly DailyMascotLetter[];
  readonly quests: readonly SecretQuest[];
  readonly wishlists: readonly ChildWishlist[];
};

export const emptyExperienceState: ExperienceState = {
  children: [],
  settings: null,
  letters: [],
  quests: [],
  wishlists: [],
};

const experienceRows = z.object({
  children: z.array(childEngagementRow),
  settings: familySettingsRow.nullable(),
  letters: z.array(dailyLetterRow),
  quests: z.array(secretQuestRow),
  wishlists: z.array(wishlistRow),
});

export function parseExperienceState(input: unknown, familyId: string): ExperienceState {
  const state = experienceRows.parse(input);
  const rows = [
    ...state.children,
    ...state.letters,
    ...state.quests,
    ...state.wishlists,
    ...(state.settings ? [state.settings] : []),
  ];
  if (rows.some((row) => row.family_id !== familyId)) {
    throw new Error('Experience state contains another family.');
  }
  return state;
}
