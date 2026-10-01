import type { JourneyPlan } from '@/types';

// Roadmaps by age stage, about twelve weeks each. Habit research gives no single number of days, and the
// published timings (weeks to months) come from adults, so a stage does not run on a calendar: each step adds
// ONE new habit and keeps the earlier ones, and a family stays on a step until it holds. The week ranges are
// where a family can expect to start looking, not a deadline.

export type JourneyStageId = 'GD1' | 'GD2' | 'GD3' | 'GD4' | 'GD5';

type Bilingual = { readonly vi: string; readonly en: string };

export const JOURNEY_STAGES: ReadonlyArray<{
  readonly id: JourneyStageId;
  readonly ageRange: string;
  readonly minAge: number;
  readonly maxAge: number;
  readonly title: Bilingual;
  readonly adultRole: Bilingual;
}> = [
  { id: 'GD1', ageRange: '0–3', minAge: 0, maxAge: 3, title: { vi: 'An toàn và giác quan', en: 'Safety and senses' }, adultRole: { vi: 'Ba mẹ làm mẫu và mô tả', en: 'You model and describe' } },
  { id: 'GD2', ageRange: '3–6', minAge: 3, maxAge: 6, title: { vi: 'Khám phá và ý chí', en: 'Exploring and willpower' }, adultRole: { vi: 'Ba mẹ làm cùng và nhắc nhẹ', en: 'You do it together and remind gently' } },
  { id: 'GD3', ageRange: '6–12', minAge: 6, maxAge: 12, title: { vi: 'Cần cù và kỹ năng', en: 'Effort and skills' }, adultRole: { vi: 'Ba mẹ theo dõi và cùng làm', en: 'You supervise and join in' } },
  { id: 'GD4', ageRange: '12–15', minAge: 12, maxAge: 15, title: { vi: 'Bản sắc và cảm xúc', en: 'Identity and emotions' }, adultRole: { vi: 'Ba mẹ đồng hành, cùng tuân luật chung', en: 'You walk alongside and follow the shared rules too' } },
  { id: 'GD5', ageRange: '15–18', minAge: 15, maxAge: 18, title: { vi: 'Định hướng và trách nhiệm', en: 'Direction and responsibility' }, adultRole: { vi: 'Ba mẹ làm cố vấn và hậu thuẫn', en: 'You advise and back them up' } },
];

/** The stage for a child's age in years; ages outside the framework fall to the nearest stage. */
export function journeyStageForAge(age: number | null | undefined): JourneyStageId {
  if (age === null || age === undefined || !Number.isFinite(age)) return 'GD3';
  const stage = JOURNEY_STAGES.find((candidate) => age >= candidate.minAge && age < candidate.maxAge);
  if (stage) return stage.id;
  return age < 0 ? 'GD1' : 'GD5';
}

const PACING: Readonly<Record<1 | 2 | 3, Bilingual>> = {
  1: {
    vi: 'Bước đầu chỉ thêm MỘT thói quen mới. Hai tuần đầu làm cùng con và giữ một tín hiệu cố định (cùng giờ, cùng chỗ); hai tuần sau để con làm nhiều hơn, bớt nhắc. Cuối mỗi tuần dành vài phút nhìn lại. Bỏ lỡ một ngày thì cứ tiếp tục; bỏ lỡ nhiều ngày liền thì làm nhỏ hơn.',
    en: 'This first step adds just ONE new habit. In the first two weeks do it together and keep one fixed cue (same time, same place); in the next two let your child do more with fewer reminders. Spend a few minutes looking back at the end of each week. Missing one day changes nothing; missing several in a row means making it smaller.',
  },
  2: {
    vi: 'Giữ thói quen của bước 1 rồi thêm MỘT thói quen mới. Chỉ thêm khi bước 1 đã khá đều; chưa đều thì ở lại thêm vài tuần, không cần chạy theo lịch.',
    en: 'Keep the habit from step 1 and add ONE new habit. Add it only when step 1 is fairly steady; if it is not, stay a few more weeks. There is no calendar to catch up with.',
  },
  3: {
    vi: 'Thêm thói quen thứ ba và bắt đầu rút dần nhắc nhở ở các thói quen cũ. Hết bước này mỗi thói quen đã lặp lại nhiều tuần, nhưng nhiều bé cần lâu hơn: cứ tiếp tục theo nhịp của con và chỉ chuyển sang giai đoạn tuổi kế tiếp khi cả nhà thấy vững.',
    en: 'Add the third habit and begin easing off reminders on the older ones. By the end each habit has been repeated for many weeks, but many children need longer: keep going at your child’s pace and move to the next age stage only when it feels steady.',
  },
};

type HabitSeed = {
  readonly title: Bilingual;
  readonly description: Bilingual;
  readonly icon: string;
  readonly category: JourneyPlan['habits'][number]['category'];
  readonly timeOfDay: JourneyPlan['habits'][number]['timeOfDay'];
  readonly durationMinutes?: number;
};

type StepSeed = { readonly theme: Bilingual; readonly icon: string; readonly color: string; readonly habit: HabitSeed };

const STEPS: Readonly<Record<JourneyStageId, readonly [StepSeed, StepSeed, StepSeed]>> = {
  GD1: [
    { theme: { vi: 'Nếp ngày êm và ngủ lành', en: 'A calm routine and good sleep' }, icon: '🌙', color: '#6366f1', habit: { title: { vi: 'Nghi thức trước giờ ngủ, cùng giờ mỗi tối', en: 'A bedtime ritual at the same time every evening' }, description: { vi: 'Giảm ánh sáng, nói nhỏ, kể một câu chuyện ngắn rồi ngủ; mỗi tối làm giống nhau.', en: 'Dim the lights, speak softly, tell one short story, then sleep; the same each evening.' }, icon: '🌙', category: 'health', timeOfDay: 'evening', durationMinutes: 20 } },
    { theme: { vi: 'Được đáp lại mỗi ngày', en: 'Being answered every day' }, icon: '💬', color: '#0ea5e9', habit: { title: { vi: 'Nhìn – chờ – đáp khi bé phát tiếng', en: 'Look, wait, answer when your baby makes a sound' }, description: { vi: 'Khi bé bập bẹ hoặc chỉ tay, nhìn vào mắt bé, nhắc lại âm đó, chờ bé đáp rồi đáp lại.', en: 'When your baby babbles or points, look into their eyes, repeat the sound, wait for a reply, then answer.' }, icon: '💬', category: 'personality', timeOfDay: 'anytime' } },
    { theme: { vi: 'Sách và vui chơi', en: 'Books and play' }, icon: '📚', color: '#f59e0b', habit: { title: { vi: 'Mỗi ngày một cuốn sách và một câu chuyện', en: 'One book and one story every day' }, description: { vi: 'Đọc cho bé nghe một cuốn sách ngắn, chỉ vào hình và gọi tên.', en: 'Read a short book aloud, pointing at the pictures and naming them.' }, icon: '📚', category: 'wisdom', timeOfDay: 'afternoon', durationMinutes: 10 } },
  ],
  GD2: [
    { theme: { vi: 'Cảm xúc bình yên', en: 'Calm feelings' }, icon: '💬', color: '#6366f1', habit: { title: { vi: 'Gọi tên cảm xúc: nói “con đang thấy…” mỗi tối', en: 'Name a feeling: say “I feel…” each evening' }, description: { vi: 'Cùng con chọn một từ cho cảm xúc hôm nay và một cách để bình tĩnh lại, như ba nhịp thở.', en: 'Choose one word for today’s feeling together and one way to calm down, like three slow breaths.' }, icon: '💬', category: 'mindset', timeOfDay: 'evening', durationMinutes: 5 } },
    { theme: { vi: 'Giấc ngủ và màn hình', en: 'Sleep and screens' }, icon: '📵', color: '#0ea5e9', habit: { title: { vi: 'Màn hình đi ngủ trước con', en: 'Screens go to sleep before you do' }, description: { vi: 'Tới giờ thì cùng con tắt màn hình và cất ở chỗ cố định, rồi làm nghi thức đi ngủ.', en: 'At the set time switch screens off together, put them in their place, then start the bedtime routine.' }, icon: '📵', category: 'health', timeOfDay: 'evening', durationMinutes: 10 } },
    { theme: { vi: 'Việc nhà của con', en: 'My own chore' }, icon: '🧺', color: '#10b981', habit: { title: { vi: 'Một việc nhà nhỏ của riêng con mỗi ngày', en: 'One small chore of your own every day' }, description: { vi: 'Con có một việc cố định như cất giày hoặc bày khăn ăn; ba mẹ làm cùng lúc đầu rồi rút dần.', en: 'A fixed job such as putting shoes away or laying napkins; do it together at first, then step back.' }, icon: '🧺', category: 'chores', timeOfDay: 'afternoon', durationMinutes: 10 } },
  ],
  GD3: [
    { theme: { vi: 'Biết ơn mỗi tối', en: 'Gratitude each evening' }, icon: '📓', color: '#6366f1', habit: { title: { vi: 'Mỗi tối một điều biết ơn và một điều con làm tốt', en: 'Each evening one thing to be grateful for and one thing you did well' }, description: { vi: 'Con nói hoặc viết hai câu ngắn trước khi ngủ; ba mẹ khen đúng việc cụ thể.', en: 'Say or write two short sentences before bed; parents praise the specific thing.' }, icon: '📓', category: 'mindset', timeOfDay: 'evening', durationMinutes: 5 } },
    { theme: { vi: 'Học có phương pháp', en: 'Learning with a method' }, icon: '🧠', color: '#0ea5e9', habit: { title: { vi: 'Đọc xong thì tự hỏi rồi tự trả lời', en: 'After reading, ask yourself a question and answer it' }, description: { vi: 'Sau mỗi bài, con tự đặt hai câu hỏi và trả lời không nhìn sách, thay vì đọc lại nhiều lần.', en: 'After each lesson ask yourself two questions and answer without the book, instead of rereading.' }, icon: '🧠', category: 'study', timeOfDay: 'afternoon', durationMinutes: 20 } },
    { theme: { vi: 'Vận động có con số', en: 'Moving, with numbers' }, icon: '🏃', color: '#10b981', habit: { title: { vi: 'Vận động 60 phút và ghi con số tiến bộ', en: 'Move for 60 minutes and note one number that improves' }, description: { vi: 'Chọn một môn con thích và ghi một chỉ số đơn giản, như số lần hoặc thời gian, để thấy mình tiến bộ.', en: 'Pick a sport your child likes and note one simple number, like reps or time, to see progress.' }, icon: '🏃', category: 'physical', timeOfDay: 'afternoon', durationMinutes: 60 } },
  ],
  GD4: [
    { theme: { vi: 'Ngủ đủ, đầu óc nhẹ', en: 'Enough sleep, a clearer head' }, icon: '😴', color: '#6366f1', habit: { title: { vi: 'Đi ngủ đúng giờ, không màn hình trước khi ngủ', en: 'Sleep on time, no screens before bed' }, description: { vi: 'Cùng thống nhất giờ ngủ và giờ cất điện thoại; cả nhà cùng giữ, không chỉ riêng con.', en: 'Agree a bedtime and a time to put phones away; the whole family keeps it, not only your teen.' }, icon: '😴', category: 'health', timeOfDay: 'evening', durationMinutes: 10 } },
    { theme: { vi: 'Luật của riêng mình', en: 'My own rules' }, icon: '📜', color: '#0ea5e9', habit: { title: { vi: 'Giữ ba luật con tự đặt cho mình', en: 'Keep three rules you set for yourself' }, description: { vi: 'Con tự viết ba luật ngắn, kiểm tra mỗi tối đã giữ được chưa và không cần ai nhắc.', en: 'Write three short rules, check each evening whether you kept them, with no one reminding you.' }, icon: '📜', category: 'personality', timeOfDay: 'evening', durationMinutes: 5 } },
    { theme: { vi: 'Học tự chủ', en: 'Taking charge of learning' }, icon: '🗂️', color: '#10b981', habit: { title: { vi: 'Lập kế hoạch học tuần, tự đánh giá và tự chịu kết quả', en: 'Plan the study week, self-assess and own the result' }, description: { vi: 'Đầu tuần con ghi việc cần học; cuối tuần tự chấm điều làm được và điều cần chỉnh.', en: 'At the start of the week list what to study; at the end rate what worked and what to change.' }, icon: '🗂️', category: 'study', timeOfDay: 'evening', durationMinutes: 20 } },
  ],
  GD5: [
    { theme: { vi: 'Người con muốn trở thành', en: 'Who I want to become' }, icon: '✍️', color: '#6366f1', habit: { title: { vi: 'Viết lại và đọc tuyên ngôn của con mỗi tuần', en: 'Rewrite and reread your own statement each week' }, description: { vi: 'Vài câu về người con muốn trở thành và một việc nhỏ tuần này đưa con tới gần hơn.', en: 'A few sentences about who you want to be and one small step this week that moves you closer.' }, icon: '✍️', category: 'mindset', timeOfDay: 'evening', durationMinutes: 10 } },
    { theme: { vi: 'Thân khỏe', en: 'A healthy body' }, icon: '🏋️', color: '#0ea5e9', habit: { title: { vi: 'Tập, ăn và nghỉ theo lịch trong tuần', en: 'Train, eat and rest to a weekly schedule' }, description: { vi: 'Con lên lịch tập, bữa ăn chính và ngày nghỉ, rồi làm theo cả năm chứ không chỉ vài tuần.', en: 'Set training, main meals and rest days, then follow them through the year, not just a few weeks.' }, icon: '🏋️', category: 'physical', timeOfDay: 'afternoon', durationMinutes: 45 } },
    { theme: { vi: 'Thử nghề', en: 'Trying a path' }, icon: '🧭', color: '#10b981', habit: { title: { vi: 'Thử một lĩnh vực nghề: tìm hiểu, trải nghiệm, ghi lại', en: 'Try one career area: learn, experience, write it down' }, description: { vi: 'Mỗi tuần một việc nhỏ như nói chuyện với người trong nghề hoặc làm thử một dự án; ghi con thích và không thích điều gì.', en: 'Each week one small step, like talking to someone in the field or trying a mini project; note what you like and dislike.' }, icon: '🧭', category: 'wisdom', timeOfDay: 'anytime', durationMinutes: 30 } },
  ],
};

const WEEKS: Readonly<Record<1 | 2 | 3, readonly [number, number]>> = { 1: [1, 4], 2: [5, 8], 3: [9, 12] };

export const AGE_JOURNEY_PLANS: readonly JourneyPlan[] = JOURNEY_STAGES.flatMap((stage) => (
  ([1, 2, 3] as const).map<JourneyPlan>((step) => {
    const seed = STEPS[stage.id][step - 1];
    const weeks = WEEKS[step];
    return {
      id: `${stage.id.toLowerCase()}-step-${step}`,
      type: 'stage',
      ageStageId: stage.id,
      weeks,
      periodLabel: `Tuần ${weeks[0]}–${weeks[1]}`,
      icon: seed.icon,
      themeColor: seed.color,
      title: {
        vi: `Bước ${step} · ${seed.theme.vi}`,
        en: `Step ${step} · ${seed.theme.en}`,
      },
      description: {
        vi: `${PACING[step].vi}`,
        en: `${PACING[step].en}`,
      },
      habits: [{
        id: `${stage.id.toLowerCase()}-${step}`,
        title: seed.habit.title.vi,
        description: seed.habit.description.vi,
        en: { title: seed.habit.title.en, description: seed.habit.description.en },
        icon: seed.habit.icon,
        category: seed.habit.category,
        points: 10,
        timeOfDay: seed.habit.timeOfDay,
        durationMinutes: seed.habit.durationMinutes,
      }],
    };
  })
));

export const journeyPlansForStage = (stageId: JourneyStageId): readonly JourneyPlan[] =>
  AGE_JOURNEY_PLANS.filter((plan) => plan.ageStageId === stageId);
