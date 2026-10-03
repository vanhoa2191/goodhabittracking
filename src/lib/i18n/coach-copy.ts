import type { Language } from '@/types';
import type { TryKind } from '@/lib/habit-programs/coach';

export type CoachCopy = {
  readonly title: string;
  readonly intro: string;
  readonly change: Readonly<Record<TryKind, (habit: string) => string>>;
  readonly whyBetterTime: (habit: string, time: string) => string;
  readonly tryIt: string;
  readonly running: (habit: string, kind: string, endsOn: string) => string;
  readonly kindName: Readonly<Record<TryKind, string>>;
  readonly review: (habit: string, kind: string) => string;
  readonly helped: string;
  readonly notYet: string;
  readonly dropped: string;
  readonly backToFull: string;
  readonly started: string;
  readonly failed: string;
  readonly nothing: string;
  readonly cueChangeHint: string;
  readonly focusTitle: string;
  readonly focusIntro: string;
  readonly offer: (habit: string) => string;
  readonly pickFocus: (name: string) => string;
  readonly focusSaved: string;
  readonly kidFocusTitle: string;
  readonly kidFocusPick: string;
  readonly kidFocusProgress: (done: number) => string;
  readonly kidFocusSave: string;
  readonly kidFocusChange: string;
  readonly kidFocusMax: string;
};

const vi: CoachCopy = {
  title: 'Một thay đổi tuần này',
  intro: 'Mỗi lần chỉ thử một thay đổi trong 7 ngày, rồi xem có giúp không.',
  change: {
    smaller: (habit) => `Thử làm “${habit}” nhỏ hơn (bản hai phút) trong 7 ngày.`,
    retime: (habit) => `Thử đổi giờ của “${habit}” sang lúc bé thường làm.`,
    together: (habit) => `Làm “${habit}” cùng bé vài ngày; không tính là bé lỡ.`,
    cue_change: (habit) => `Thử đổi tín hiệu nhắc của “${habit}” (hình ảnh, hoặc để bé tự đặt).`,
    reduce_support: (habit) => `Thử nhắc ít đi với “${habit}”: chờ bé tự bắt đầu trước.`,
  },
  whyBetterTime: (habit, time) => `Bé thường làm “${habit}” vào khoảng ${time}.`,
  tryIt: 'Thử trong 7 ngày',
  running: (habit, kind, endsOn) => `Đang thử “${habit}”: ${kind}, đến ${endsOn}.`,
  kindName: { smaller: 'làm nhỏ hơn', retime: 'đổi giờ', together: 'làm cùng', cue_change: 'đổi tín hiệu', reduce_support: 'nhắc ít đi' },
  review: (habit, kind) => `Thay đổi “${kind}” cho “${habit}” có giúp không?`,
  helped: 'Có giúp',
  notYet: 'Chưa',
  dropped: 'Bỏ',
  backToFull: 'Chọn “Chưa” hoặc “Bỏ” thì thói quen trở lại như trước khi thử.',
  started: 'Đã bắt đầu thử. Ứng dụng sẽ hỏi lại sau 7 ngày.',
  failed: 'Chưa lưu được. Bạn thử lại nhé.',
  nothing: 'Tuần này chưa cần đổi gì. Cứ giữ nhịp.',
  cueChangeHint: 'Mở Quản lý việc để sửa tín hiệu của thói quen này.',
  focusTitle: 'Mục tiêu tuần của bé',
  focusIntro: 'Chọn 2 đến 4 việc để bé tự chọn một hoặc hai việc làm mục tiêu tuần. Bé dưới 6 tuổi thì ba mẹ chọn cùng bé.',
  offer: (habit) => `Cho bé chọn “${habit}”`,
  pickFocus: (name) => `Mục tiêu tuần của ${name}`,
  focusSaved: 'Đã lưu mục tiêu tuần.',
  kidFocusTitle: 'Mục tiêu tuần này',
  kidFocusPick: 'Chọn 1 hoặc 2 việc con muốn tập trung tuần này',
  kidFocusProgress: (done) => `${done}/7 ngày`,
  kidFocusSave: 'Chọn xong',
  kidFocusChange: 'Đổi lựa chọn',
  kidFocusMax: 'Chọn tối đa 2 việc.',
};

const en: CoachCopy = {
  title: 'One change this week',
  intro: 'Try just one change at a time for 7 days, then see whether it helped.',
  change: {
    smaller: (habit) => `Try a smaller version of “${habit}” (two minutes) for 7 days.`,
    retime: (habit) => `Try moving “${habit}” to the time your child usually does it.`,
    together: (habit) => `Do “${habit}” together for a few days; it does not count as a miss.`,
    cue_change: (habit) => `Try a different cue for “${habit}” (a picture, or let your child set the reminder).`,
    reduce_support: (habit) => `Try fewer reminders for “${habit}”: wait for your child to start first.`,
  },
  whyBetterTime: (habit, time) => `Your child usually does “${habit}” around ${time}.`,
  tryIt: 'Try it for 7 days',
  running: (habit, kind, endsOn) => `Trying “${habit}”: ${kind}, until ${endsOn}.`,
  kindName: { smaller: 'a smaller version', retime: 'a new time', together: 'doing it together', cue_change: 'a new cue', reduce_support: 'fewer reminders' },
  review: (habit, kind) => `Did ${kind} help with “${habit}”?`,
  helped: 'It helped',
  notYet: 'Not yet',
  dropped: 'Drop it',
  backToFull: 'Choosing “Not yet” or “Drop it” puts the habit back as it was before the try.',
  started: 'Started. The app will ask again in 7 days.',
  failed: 'Could not save. Please try again.',
  nothing: 'Nothing to change this week. Keep the rhythm.',
  cueChangeHint: 'Open Manage tasks to edit this habit’s cue.',
  focusTitle: 'Your child’s weekly focus',
  focusIntro: 'Mark 2 to 4 tasks your child may choose from, then your child picks one or two as the week’s focus. For a child under 6 you choose together.',
  offer: (habit) => `Let your child choose “${habit}”`,
  pickFocus: (name) => `${name}’s weekly focus`,
  focusSaved: 'Weekly focus saved.',
  kidFocusTitle: 'This week’s focus',
  kidFocusPick: 'Pick 1 or 2 things you want to focus on this week',
  kidFocusProgress: (done) => `${done}/7 days`,
  kidFocusSave: 'Done choosing',
  kidFocusChange: 'Change my choice',
  kidFocusMax: 'Pick at most 2.',
};

const COPY: Partial<Record<Language, CoachCopy>> = { vi, en };

export function getCoachCopy(language: Language): CoachCopy {
  return COPY[language] ?? en;
}
