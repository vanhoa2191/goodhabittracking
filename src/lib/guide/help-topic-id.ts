// The ids of every help topic. Kept apart from the texts so a screen can name a topic without loading them.
export const HELP_TOPIC_IDS = [
  'today.card', 'today.actions',
  'approvals.tasks', 'approvals.rewards', 'support.prompt', 'progress.summary', 'progress.graduation', 'progress.supportTrend', 'weekly.review',
  'stats.weekly', 'stats.print', 'stats.journal', 'stats.share', 'stats.deleteFamily',
  'habits.inUse', 'habits.library', 'habits.programs', 'habits.framework', 'habits.handbook', 'habits.cue', 'habits.programStart',
  'habits.form.points', 'habits.form.recurrence', 'habits.form.time', 'habits.form.duration', 'habits.form.approval', 'habits.form.assign',
  'journeys.overview',
  'rewards.manage', 'rewards.templates',
  'children.profiles', 'children.age', 'children.leaderboard', 'children.ageTheme', 'children.pairing', 'children.regenerate', 'children.adjustPoints', 'children.ageBundle',
  'settings.devices', 'settings.pwa', 'settings.caregivers', 'settings.pause', 'settings.account', 'settings.coupon', 'settings.referralCode', 'settings.affiliate',
  'settings.familyData', 'settings.leaderboardSharing', 'settings.analytics', 'settings.reminders', 'settings.theme', 'settings.pin',
  'payment.plans', 'payment.trial', 'payment.memo', 'payment.activation',
] as const;

export type HelpTopicId = (typeof HELP_TOPIC_IDS)[number];

// Topics added since the last translation pass. A language without them reads the English text until the pass is done;
// the ones listed here are the only ones a translation table may leave out.
export const HELP_TOPICS_AWAITING_TRANSLATION = ['today.actions', 'progress.graduation', 'progress.supportTrend'] as const satisfies readonly HelpTopicId[];
type AwaitingTranslation = (typeof HELP_TOPICS_AWAITING_TRANSLATION)[number];

export type HelpTranslationTable<Text> = Readonly<Record<Exclude<HelpTopicId, AwaitingTranslation>, Text>>
  & Readonly<Partial<Record<AwaitingTranslation, Text>>>;
