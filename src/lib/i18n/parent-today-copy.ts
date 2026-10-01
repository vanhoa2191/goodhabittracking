import type { Language } from '@/types';
import type { SupportLevel } from '@/lib/habit-programs/types';

export type ParentTodayCopy = {
  readonly chooseChild: string;
  readonly todayOf: (name: string) => string;
  readonly doneOfTotal: (done: number, total: number) => string;
  readonly noTasksToday: string;
  readonly streak: (days: number) => string;
  readonly streakNote: string;
  readonly actionsTitle: string;
  readonly nothingToDo: string;
  readonly suggestionsWaiting: (count: number) => string;
  readonly seeSuggestions: string;
  readonly building: (count: number, limit: number) => string;
  readonly lastSevenDays: string;
  readonly doneOfSeven: (done: number) => string;
  readonly lean: Readonly<Record<SupportLevel, string>>;
  readonly dayDone: string;
  readonly dayMissed: string;
  readonly dayNone: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly emptyCta: string;
  readonly weeklyTitle: string;
  readonly weeklyIntro: string;
  readonly weeklyPraise: (title: string) => string;
  readonly weeklyAdjust: (title: string) => string;
  readonly weeklyAdd: string;
  readonly weeklyHold: string;
  readonly weeklyNoData: string;
};

const vi: ParentTodayCopy = {
  chooseChild: 'Chọn bé',
  todayOf: (name) => `Hôm nay của ${name}`,
  doneOfTotal: (done, total) => `${done} / ${total} việc đã xong`,
  noTasksToday: 'Hôm nay bé chưa có việc nào theo lịch',
  streak: (days) => `Chuỗi ${days} ngày`,
  streakNote: 'Bỏ lỡ một ngày không làm mất tiến triển',
  actionsTitle: 'Cần ba mẹ làm',
  nothingToDo: 'Hiện không có việc nào cần ba mẹ xử lý.',
  suggestionsWaiting: (count) => `Có ${count} gợi ý điều chỉnh cho thói quen của bé`,
  seeSuggestions: 'Xem gợi ý',
  building: (count, limit) => `Thói quen đang xây (${count} / ${limit})`,
  lastSevenDays: 'Bảy ngày gần nhất',
  doneOfSeven: (done) => `${done} / 7 ngày gần nhất`,
  lean: { alone: 'bé tự làm', prompted: 'cần nhắc', together: 'làm cùng ba mẹ' },
  dayDone: 'đã làm',
  dayMissed: 'chưa làm',
  dayNone: 'không có lịch',
  emptyTitle: 'Chưa có thói quen nào đang xây',
  emptyBody: 'Chọn một thói quen và đặt tín hiệu nhắc (cùng giờ, cùng chỗ) để bắt đầu theo dõi tiến triển của bé.',
  emptyCta: 'Đặt tín hiệu cho thói quen đầu tiên',
  weeklyTitle: 'Nhìn lại tuần này (5 phút)',
  weeklyIntro: 'Mỗi tuần một lần, cùng nhìn lại thay vì nhắc từng ngày.',
  weeklyPraise: (title) => `Một điều để khen: bé đều đặn với “${title}”.`,
  weeklyAdjust: (title) => `Một điều cần chỉnh: “${title}” còn chưa đều. Thử làm nhỏ hơn hoặc đổi giờ.`,
  weeklyAdd: 'Các thói quen đang khá đều. Nếu muốn, thêm một thói quen mới (không vượt giới hạn cùng lúc).',
  weeklyHold: 'Chưa nên thêm thói quen mới. Giữ nhịp thêm một tuần.',
  weeklyNoData: 'Chưa đủ dữ liệu tuần này. Ghi nhận “bé làm thế nào” vài ngày để có nhận xét.',
};

const en: ParentTodayCopy = {
  chooseChild: 'Choose a child',
  todayOf: (name) => `${name}’s day`,
  doneOfTotal: (done, total) => `${done} of ${total} tasks done`,
  noTasksToday: 'No tasks are scheduled for today',
  streak: (days) => `${days}-day streak`,
  streakNote: 'Missing a day does not undo progress',
  actionsTitle: 'Needs you',
  nothingToDo: 'Nothing needs you right now.',
  suggestionsWaiting: (count) => `${count} adjustment suggestion${count === 1 ? '' : 's'} for your child’s habits`,
  seeSuggestions: 'See suggestions',
  building: (count, limit) => `Habits being built (${count} of ${limit})`,
  lastSevenDays: 'Last seven days',
  doneOfSeven: (done) => `${done} of the last 7 days`,
  lean: { alone: 'did it alone', prompted: 'needed a reminder', together: 'did it with you' },
  dayDone: 'done',
  dayMissed: 'not done',
  dayNone: 'not scheduled',
  emptyTitle: 'No habits are being built yet',
  emptyBody: 'Pick a habit and set a cue (same time, same place) to start following your child’s progress.',
  emptyCta: 'Set a cue for the first habit',
  weeklyTitle: 'Look back at this week (5 minutes)',
  weeklyIntro: 'Once a week, look back together instead of reminding every day.',
  weeklyPraise: (title) => `One thing to praise: steady work on “${title}”.`,
  weeklyAdjust: (title) => `One thing to adjust: “${title}” is not steady yet. Try making it smaller or changing the time.`,
  weeklyAdd: 'The habits are fairly steady. If you like, add one new habit (within the limit for this age).',
  weeklyHold: 'Hold off on a new habit. Keep the rhythm another week.',
  weeklyNoData: 'Not enough data this week. Record how your child did it for a few days to get a note.',
};

// Like the programme copy, the other languages read English until they have their own text.
export function getParentTodayCopy(language: Language): ParentTodayCopy {
  return language === 'vi' ? vi : en;
}
