import { z } from 'zod';

export const SPACE_MOODS = ['happy', 'calm', 'tired', 'worried', 'sad', 'angry'] as const;
export type SpaceMood = (typeof SPACE_MOODS)[number];
export const SPACE_REASONS = ['friends', 'school', 'family', 'body', 'other'] as const;
export type SpaceReason = (typeof SPACE_REASONS)[number];
export const SPACE_NOTE_KINDS = ['learned', 'grateful', 'proud'] as const;
export type SpaceNoteKind = (typeof SPACE_NOTE_KINDS)[number];
export const SPACE_NOTE_MAX_LENGTH = 140;
export const SPACE_GOAL_STATUSES = ['open', 'done', 'not_yet'] as const;
export type SpaceGoalStatus = (typeof SPACE_GOAL_STATUSES)[number];
export const SPACE_GOAL_MAX_LENGTH = 60;
export const SPACE_LETTER_MAX_LENGTH = 300;
export const SPACE_GOAL_PRESETS = [
  'Tự dọn đồ chơi', 'Đọc sách mỗi ngày', 'Nói lời cảm ơn', 'Giúp ba mẹ một việc nhà', 'Đi ngủ đúng giờ', 'Chơi cùng bạn thật vui',
] as const;

/** Moods that count towards the gentle parent alert; tiredness alone does not. */
const LOW_MOODS: ReadonlySet<SpaceMood> = new Set(['worried', 'sad', 'angry']);

export const spaceMoodSchema = z.object({
  local_date: z.iso.date(),
  mood: z.enum(SPACE_MOODS),
  reason: z.enum(SPACE_REASONS).nullable(),
});
export const spaceNoteSchema = z.object({
  local_date: z.iso.date(),
  kind: z.enum(SPACE_NOTE_KINDS),
  note_text: z.string().min(1),
  shared_with_parent: z.boolean(),
});
export const spaceGoalSchema = z.object({
  week_start: z.iso.date(),
  goal_text: z.string().min(1),
  status: z.enum(SPACE_GOAL_STATUSES),
});
export const spaceLetterSchema = z.object({
  id: z.string().min(1),
  local_date: z.iso.date(),
  letter_text: z.string().min(1),
  read: z.boolean(),
  parent_heart: z.boolean(),
});
export type SpaceMoodEntry = z.infer<typeof spaceMoodSchema>;
export type SpaceNote = z.infer<typeof spaceNoteSchema>;
export type SpaceGoal = z.infer<typeof spaceGoalSchema>;
export type SpaceLetter = z.infer<typeof spaceLetterSchema>;

/** `goals` and `letters` default to empty so phase-1 payloads and older local copies still parse. */
export const spaceSnapshotSchema = z.object({
  moods: z.array(spaceMoodSchema),
  notes: z.array(spaceNoteSchema),
  goals: z.array(spaceGoalSchema).default([]),
  letters: z.array(spaceLetterSchema).default([]),
});
export type SpaceSnapshot = z.infer<typeof spaceSnapshotSchema>;

export function normalizeSpaceNote(input: string): string | null {
  const normalized = input.normalize('NFKC').replace(/\s+/gu, ' ').trim();
  if (normalized.length === 0 || Array.from(normalized).length > SPACE_NOTE_MAX_LENGTH) return null;
  return normalized;
}

/** One short line: whitespace collapsed, at most 60 characters. */
export function normalizeSpaceGoal(input: string): string | null {
  const normalized = input.normalize('NFKC').replace(/\s+/gu, ' ').trim();
  if (normalized.length === 0 || Array.from(normalized).length > SPACE_GOAL_MAX_LENGTH) return null;
  return normalized;
}

/** A letter keeps its line breaks (at most one blank line), up to 300 characters. */
export function normalizeSpaceLetter(input: string): string | null {
  const normalized = input.normalize('NFKC').replace(/\r\n?/gu, '\n').replace(/[^\S\n]+/gu, ' ')
    .replace(/ ?\n ?/gu, '\n').replace(/\n{3,}/gu, '\n\n').trim();
  if (normalized.length === 0 || Array.from(normalized).length > SPACE_LETTER_MAX_LENGTH) return null;
  return normalized;
}

/** The Monday (ISO week start) of the week containing `day`, as YYYY-MM-DD. */
export function weekStartOf(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

/** The goal a child may still mark: this week's, or last week's until it is judged. */
export function goalForWeek(goals: readonly SpaceGoal[], weekStart: string): SpaceGoal | null {
  return goals.find((goal) => goal.week_start === weekStart) ?? null;
}

export type TimelineCell = { day: string; mood: SpaceMood | null };

/** The last `length` days ending today, oldest first, plus the blank cells that line the first day up under its weekday (Monday first). */
export function buildMoodTimeline(
  moods: readonly Pick<SpaceMoodEntry, 'local_date' | 'mood'>[], today: string, length = 30,
): { leading: number; cells: TimelineCell[] } {
  const byDay = new Map(moods.map((entry) => [entry.local_date, entry.mood]));
  const cells = Array.from({ length }, (_, index) => {
    const date = new Date(`${today}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - (length - 1 - index));
    const day = date.toISOString().slice(0, 10);
    return { day, mood: byDay.get(day) ?? null };
  });
  return { leading: (new Date(`${cells[0].day}T00:00:00Z`).getUTCDay() + 6) % 7, cells };
}

export type MoodAlert = { level: 'none' | 'watch' | 'concern'; streak: number; lowDaysInWeek: number };

function dayNumber(day: string): number {
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
}

/**
 * A gentle signal for parents, never a diagnosis: `watch` after three low days in a row, `concern` after five in a row
 * or five low days within the last seven. The streak may end yesterday, so a child who has not checked in yet today
 * does not reset it.
 */
export function evaluateMoodAlert(moods: readonly Pick<SpaceMoodEntry, 'local_date' | 'mood'>[], today: string): MoodAlert {
  const byDay = new Map(moods.map((entry) => [dayNumber(entry.local_date), entry.mood]));
  const todayNumber = dayNumber(today);
  const isLow = (day: number) => {
    const mood = byDay.get(day);
    return mood !== undefined && LOW_MOODS.has(mood);
  };
  let cursor = byDay.has(todayNumber) ? todayNumber : todayNumber - 1;
  let streak = 0;
  while (isLow(cursor)) { streak += 1; cursor -= 1; }
  let lowDaysInWeek = 0;
  for (let offset = 0; offset < 7; offset += 1) if (isLow(todayNumber - offset)) lowDaysInWeek += 1;
  const level = streak >= 5 || lowDaysInWeek >= 5 ? 'concern' : streak >= 3 ? 'watch' : 'none';
  return { level, streak, lowDaysInWeek };
}

export const MOOD_VISUAL: Readonly<Record<SpaceMood, { emoji: string; label: string; tone: string }>> = {
  happy: { emoji: '😄', label: 'Vui', tone: 'bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100' },
  calm: { emoji: '😌', label: 'Bình yên', tone: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100' },
  tired: { emoji: '🥱', label: 'Mệt', tone: 'bg-slate-200 text-slate-900 dark:bg-zinc-800 dark:text-slate-100' },
  worried: { emoji: '😟', label: 'Lo', tone: 'bg-violet-100 text-violet-950 dark:bg-violet-950/40 dark:text-violet-100' },
  sad: { emoji: '😢', label: 'Buồn', tone: 'bg-sky-100 text-sky-950 dark:bg-sky-950/40 dark:text-sky-100' },
  angry: { emoji: '😠', label: 'Giận', tone: 'bg-rose-100 text-rose-950 dark:bg-rose-950/40 dark:text-rose-100' },
};
export const REASON_LABEL: Readonly<Record<SpaceReason, string>> = {
  friends: 'Bạn bè', school: 'Học tập', family: 'Gia đình', body: 'Cơ thể', other: 'Khác',
};
export const NOTE_KIND_COPY: Readonly<Record<SpaceNoteKind, { label: string; prompt: string; placeholder: string }>> = {
  learned: { label: 'Điều con học được', prompt: 'Hôm nay con học được…', placeholder: 'Ví dụ: cách chia sẻ đồ chơi' },
  grateful: { label: 'Điều con biết ơn', prompt: 'Con biết ơn…', placeholder: 'Ví dụ: mẹ nấu món con thích' },
  proud: { label: 'Điều con tự hào', prompt: 'Con tự hào vì…', placeholder: 'Ví dụ: con tự dọn bàn học' },
};
export const GOAL_STATUS_COPY: Readonly<Record<SpaceGoalStatus, string>> = {
  open: 'Đang thực hiện', done: 'Con đã làm được', not_yet: 'Chưa được, tuần sau con thử tiếp',
};
