import type { Language } from '@/types';
import type { HabitStatus } from '@/lib/habit-programs/status';
import type { CompetenceMilestone } from '@/lib/habit-programs/competence';

export type IndependenceCopy = {
  readonly status: Readonly<Record<HabitStatus, string>>;
  readonly trendTitle: string;
  readonly trendEasing: string;
  readonly trendNotEnough: string;
  readonly trendWeek: (start: string) => string;
  readonly legend: { readonly alone: string; readonly prompted: string; readonly together: string; readonly unknown: string; readonly missed: string };
  readonly readyToGraduate: (child: string, habit: string) => string;
  readonly graduate: string;
  readonly reduceStars: (from: number, to: number) => string;
  readonly keepAsIs: string;
  readonly graduatedNotice: (habit: string) => string;
  readonly starsReduced: (habit: string, to: number) => string;
  readonly undo: string;
  readonly failed: string;
  readonly recheck: (child: string, habit: string) => string;
  readonly stillAlone: string;
  readonly bringBack: string;
  readonly graduatedTitle: string;
  readonly graduatedEmpty: string;
  readonly graduatedSince: (date: string) => string;
  readonly restoreStars: (to: number) => string;
  readonly rhythm: (done: number, of: number) => string;
  readonly rhythmNote: string;
  readonly newDay: string;
  readonly kidGraduatedTitle: string;
  readonly kidGraduatedBody: string;
  readonly kidPracticeTitle: string;
  readonly milestone: Readonly<Record<CompetenceMilestone, (habit: string) => string>>;
};

const vi: IndependenceCopy = {
  status: { 'not-started': 'Chưa bắt đầu', forming: 'Đang hình thành', 'needs-help': 'Cần hỗ trợ', steady: 'Đang ổn định' },
  trendTitle: 'Mức hỗ trợ 6 tuần gần đây',
  trendEasing: 'Mức hỗ trợ đang giảm: bé tự làm nhiều hơn so với đầu kỳ.',
  trendNotEnough: 'Chưa đủ dữ liệu để nói.',
  trendWeek: (start) => `Tuần ${start}`,
  legend: { alone: 'Tự làm', prompted: 'Cần nhắc', together: 'Làm cùng', unknown: 'Chưa ghi', missed: 'Chưa làm' },
  readyToGraduate: (child, habit) => `${child} đã tự làm “${habit}” đều đặn nhiều tuần. Ba mẹ có thể cho thói quen này tốt nghiệp, hoặc giữ nguyên.`,
  graduate: 'Tốt nghiệp',
  reduceStars: (from, to) => `Giảm sao (${from} → ${to})`,
  keepAsIs: 'Giữ nguyên',
  graduatedNotice: (habit) => `Đã cho “${habit}” tốt nghiệp. Bé vẫn thấy nó trong mục “Con đã làm được”.`,
  starsReduced: (habit, to) => `“${habit}” giờ thưởng ${to} sao cho các lần sau.`,
  undo: 'Hoàn tác',
  failed: 'Chưa lưu được. Bạn thử lại nhé.',
  recheck: (child, habit) => `Con vẫn tự làm “${habit}” chứ? (${child})`,
  stillAlone: 'Vẫn tự làm',
  bringBack: 'Cần đưa lại',
  graduatedTitle: 'Con đã làm được',
  graduatedEmpty: 'Chưa có thói quen nào tốt nghiệp.',
  graduatedSince: (date) => `từ ${date}`,
  restoreStars: (to) => `Trả lại ${to} sao`,
  rhythm: (done, of) => `${done}/${of} ngày tuần này`,
  rhythmNote: 'Nhịp đều quan trọng hơn chuỗi: lỡ một ngày không mất gì.',
  newDay: 'Ngày mới, mình làm tiếp nhé!',
  kidGraduatedTitle: 'Con đã làm được!',
  kidGraduatedBody: 'Những việc con làm đều đến mức không cần nhắc nữa.',
  kidPracticeTitle: 'Việc con đang tập',
  milestone: {
    'first-alone': (habit) => `Lần đầu con tự làm “${habit}”! Con làm được rồi.`,
    'three-alone': (habit) => `Con đã tự làm “${habit}” 3 lần. Con thật giỏi!`,
    'seven-in-a-row': (habit) => `7 lần liền con tự làm “${habit}”. Con tự làm được rồi!`,
    'two-weeks-unprompted': (habit) => `Hai tuần nay con không cần nhắc “${habit}”. Con thật đáng tự hào!`,
  },
};

const en: IndependenceCopy = {
  status: { 'not-started': 'Not started', forming: 'Taking shape', 'needs-help': 'Needs support', steady: 'Steady' },
  trendTitle: 'Support over the last 6 weeks',
  trendEasing: 'Support is easing: your child does it alone more than at the start.',
  trendNotEnough: 'Not enough data to say yet.',
  trendWeek: (start) => `Week of ${start}`,
  legend: { alone: 'Alone', prompted: 'With a reminder', together: 'Together', unknown: 'Not recorded', missed: 'Not done' },
  readyToGraduate: (child, habit) => `${child} has done “${habit}” alone steadily for several weeks. You can let this habit graduate, or keep it as it is.`,
  graduate: 'Graduate',
  reduceStars: (from, to) => `Lower stars (${from} → ${to})`,
  keepAsIs: 'Keep as is',
  graduatedNotice: (habit) => `“${habit}” has graduated. Your child still sees it under “What I can do”.`,
  starsReduced: (habit, to) => `“${habit}” now gives ${to} stars from the next time.`,
  undo: 'Undo',
  failed: 'Could not save. Please try again.',
  recheck: (child, habit) => `Does your child still do “${habit}” alone? (${child})`,
  stillAlone: 'Still alone',
  bringBack: 'Bring it back',
  graduatedTitle: 'What I can do',
  graduatedEmpty: 'No habit has graduated yet.',
  graduatedSince: (date) => `since ${date}`,
  restoreStars: (to) => `Restore ${to} stars`,
  rhythm: (done, of) => `${done}/${of} days this week`,
  rhythmNote: 'A steady rhythm matters more than a streak: missing a day costs nothing.',
  newDay: 'A new day, let’s keep going!',
  kidGraduatedTitle: 'What I can do!',
  kidGraduatedBody: 'Things you do so steadily that nobody needs to remind you any more.',
  kidPracticeTitle: 'What I’m practising',
  milestone: {
    'first-alone': (habit) => `The first time you did “${habit}” on your own! You did it.`,
    'three-alone': (habit) => `You did “${habit}” on your own 3 times. Well done!`,
    'seven-in-a-row': (habit) => `7 times in a row you did “${habit}” on your own. You can do it!`,
    'two-weeks-unprompted': (habit) => `Two weeks without a reminder for “${habit}”. Be proud!`,
  },
};

const COPY: Partial<Record<Language, IndependenceCopy>> = { vi, en };

export function getIndependenceCopy(language: Language): IndependenceCopy {
  return COPY[language] ?? en;
}
