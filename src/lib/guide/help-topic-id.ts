// The ids of every help topic. Kept apart from the texts so a screen can name a topic without loading them.
export const HELP_TOPIC_IDS = [
  'today.card',
  'approvals.tasks', 'approvals.rewards', 'support.prompt', 'progress.summary', 'weekly.review',
  'stats.weekly', 'stats.print', 'stats.journal', 'stats.share', 'stats.deleteFamily',
  'habits.inUse', 'habits.library', 'habits.programs', 'habits.framework', 'habits.handbook', 'habits.cue', 'habits.programStart',
  'habits.form.points', 'habits.form.recurrence', 'habits.form.time', 'habits.form.duration', 'habits.form.approval', 'habits.form.assign',
  'journeys.overview',
  'rewards.manage', 'rewards.templates',
  'children.profiles', 'children.age', 'children.leaderboard', 'children.ageTheme', 'children.pairing', 'children.regenerate', 'children.adjustPoints', 'children.ageBundle',
  'settings.devices', 'settings.pwa', 'settings.caregivers', 'settings.pause', 'settings.account', 'settings.coupon', 'settings.referralCode', 'settings.affiliate',
  'settings.familyData', 'settings.leaderboardSharing', 'settings.analytics', 'settings.reminders', 'settings.theme', 'settings.pin',
  'payment.plans', 'payment.trial', 'payment.memo', 'payment.timer', 'payment.activation',
] as const;

export type HelpTopicId = (typeof HELP_TOPIC_IDS)[number];
