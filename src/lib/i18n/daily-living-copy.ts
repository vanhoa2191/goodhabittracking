import type { Language } from '@/types';

/** Daily living habit copy for Vietnamese (MVP language). */
const DAILY_LIVING_COPY_VI = {
  // Tab/section labels
  tabLabel: 'Sinh hoạt hằng ngày',
  libraryTitle: 'Thư viện sinh hoạt',
  setsTitle: 'Bộ sinh hoạt',

  // Actions
  addButton: 'Thêm',
  addedButton: 'Đã thêm',
  restoreButton: 'Khôi phục',
  graduatedLabel: 'Bé đã tự làm',
  practiceAgainButton: 'Luyện lại',

  // Notifications
  savedNotice: 'Đã lưu thói quen sinh hoạt',
  saveUnconfirmedNotice: 'Lưu chưa được xác nhận',
  restoreNotice: 'Đã khôi phục thói quen',
  practiceAgainNotice: 'Đã đặt lại thói quen để luyện tập',

  // Hand washing explanation
  handWashingNote: 'Rửa tay là tổng kết theo ngày, không ghi từng lần rửa.',

  // Set descriptions
  setDescriptions: {
    'DLS-01': 'Hai việc cơ bản mỗi sáng: đánh răng và rửa mặt.',
    'DLS-02': 'Nếp sinh hoạt sáng hoàn chỉnh: vệ sinh, thay đồ, gấp chăn.',
    'DLS-03': 'Tự lo cho tối và ngày mai: đánh răng, cất đồ, chuẩn bị, ngủ đúng giờ.',
    'DLS-04': 'Vệ sinh toàn diện: đánh răng sáng/tối, rửa mặt, rửa tay, tắm/rửa.',
  },

  // Template short titles (display in lists)
  shortTitles: {
    'WIT-DLY-01': 'Đánh răng sáng',
    'WIT-DLY-02': 'Đánh răng tối',
    'WIT-DLY-03': 'Rửa mặt',
    'WIT-DLY-04': 'Chải tóc',
    'WIT-DLY-05': 'Thay đồ sạch',
    'WIT-DLY-06': 'Tắm/rửa',
    'WIT-DLY-07': 'Cất áo bẩn',
    'WIT-DLY-08': 'Cất đồ chơi',
    'WIT-DLY-09': 'Chuẩn bị đồ',
    'WIT-DLY-10': 'Lên giường đúng giờ',
    'WIT-NUT-01': 'Rửa tay trước ăn',
    'WIT-CAP-01': 'Gấp chăn, sắp giường',
  },

  // Cue suggestions
  cues: {
    'WIT-DLY-01': 'Sau khi thức dậy',
    'WIT-DLY-02': 'Trước khi đi ngủ',
    'WIT-DLY-03': 'Sau khi thức dậy',
    'WIT-DLY-04': 'Sau khi rửa mặt',
    'WIT-DLY-05': 'Sau khi vệ sinh xong',
    'WIT-DLY-06': 'Trước khi ăn tối hoặc trước ngủ',
    'WIT-DLY-07': 'Sau khi thay đồ',
    'WIT-DLY-08': 'Sau khi chơi xong',
    'WIT-DLY-09': 'Trước khi đi ngủ',
    'WIT-DLY-10': 'Theo giờ gia đình chọn',
    'WIT-NUT-01': 'Trước mỗi bữa ăn',
    'WIT-CAP-01': 'Sau khi thức dậy',
  },

  // Support text (adult guidance)
  support: {
    'WIT-DLY-01': 'Người lớn có thể giúp bé cầm bàn chải, hướng dẫn chải đúng khuôn mặt răng.',
    'WIT-DLY-02': 'Người lớn nhắc nhở và kiểm tra bé đã chải hết các bề mặt răng.',
    'WIT-DLY-03': 'Người lớn có thể giúp bé bôi xà phòng, rửa sạch bọt kem.',
    'WIT-DLY-04': 'Người lớn giúp bé chải từ ngọn tóc lên, khéo léo gỡ các nút rối.',
    'WIT-DLY-05': 'Người lớn chuẩn bị đồ sạch, giúp bé mặc nếu bé còn nhỏ.',
    'WIT-DLY-06': 'Người lớn điều chỉnh nhiệt độ nước, giúp bé tắm an toàn.',
    'WIT-DLY-07': 'Người lớn đặt giỏ giặt ở nơi dễ thấy, nhắc nhở bé cất ngay sau khi thay.',
    'WIT-DLY-08': 'Người lớn chơi cùng và làm mẫu cất đồ, biến việc cất thành trò chơi.',
    'WIT-DLY-09': 'Người lớn kiểm tra lịch, nhắc nhớ những gì cần mang.',
    'WIT-DLY-10': 'Người lớn tạo không gian yên tĩnh, đọc truyện hoặc trò chuyện nhẹ nhàng trước ngủ.',
    'WIT-NUT-01': 'Người lớn nhắc nhở bé rửa tay bằng xà phòng trước khi ăn.',
    'WIT-CAP-01': 'Người lớn làm mẫu gấp chăn gọn gàng, khen ngợi khi bé tự làm.',
  },

  // Empty states
  noTemplates: 'Chưa có thói quen sinh hoạt nào.',
  noSets: 'Chưa có bộ sinh hoạt nào.',

  // Errors
  errorLoadFailed: 'Không thể tải thư viện sinh hoạt.',
  errorSaveFailed: 'Không thể lưu thói quen. Vui lòng thử lại.',
  errorNoChildSelected: 'Vui lòng chọn bé để thêm thói quen.',
} as const;

/** English fallback (used when locale is not Vietnamese). */
const DAILY_LIVING_COPY_EN = {
  tabLabel: 'Daily Living',
  libraryTitle: 'Daily Living Library',
  setsTitle: 'Daily Living Sets',
  addButton: 'Add',
  addedButton: 'Added',
  restoreButton: 'Restore',
  graduatedLabel: 'Child does it alone',
  practiceAgainButton: 'Practice again',
  savedNotice: 'Daily living habits saved',
  saveUnconfirmedNotice: 'Save not confirmed',
  restoreNotice: 'Habit restored',
  practiceAgainNotice: 'Habit reset for practice',
  handWashingNote: 'Hand washing is a daily summary, not tracked per meal.',
  setDescriptions: {
    'DLS-01': 'Two basic morning tasks: brush teeth and wash face.',
    'DLS-02': 'Complete morning routine: hygiene, change clothes, make bed.',
    'DLS-03': 'Evening prep for tomorrow: brush teeth, tidy up, prepare, bed on time.',
    'DLS-04': 'Full daily hygiene: brush teeth AM/PM, wash face, wash hands, shower.',
  },
  shortTitles: {
    'WIT-DLY-01': 'Morning brush',
    'WIT-DLY-02': 'Evening brush',
    'WIT-DLY-03': 'Wash face',
    'WIT-DLY-04': 'Brush hair',
    'WIT-DLY-05': 'Change clothes',
    'WIT-DLY-06': 'Shower/wash',
    'WIT-DLY-07': 'Laundry dirty clothes',
    'WIT-DLY-08': 'Put away toys',
    'WIT-DLY-09': 'Prep for tomorrow',
    'WIT-DLY-10': 'Bed on time',
    'WIT-NUT-01': 'Wash hands',
    'WIT-CAP-01': 'Make bed',
  },
  cues: {
    'WIT-DLY-01': 'After waking up',
    'WIT-DLY-02': 'Before bed',
    'WIT-DLY-03': 'After waking up',
    'WIT-DLY-04': 'After washing face',
    'WIT-DLY-05': 'After hygiene',
    'WIT-DLY-06': 'Before dinner or bedtime',
    'WIT-DLY-07': 'After changing',
    'WIT-DLY-08': 'After playing',
    'WIT-DLY-09': 'Before bed',
    'WIT-DLY-10': 'Family bedtime',
    'WIT-NUT-01': 'Before meals',
    'WIT-CAP-01': 'After waking up',
  },
  support: {
    'WIT-DLY-01': 'Adult helps hold brush, guides proper technique.',
    'WIT-DLY-02': 'Adult reminds and checks all surfaces brushed.',
    'WIT-DLY-03': 'Adult helps apply soap, rinse clean.',
    'WIT-DLY-04': 'Adult brushes from ends up, gently detangles.',
    'WIT-DLY-05': 'Adult prepares clean clothes, helps dress if young.',
    'WIT-DLY-06': 'Adult adjusts water temp, ensures safety.',
    'WIT-DLY-07': 'Adult places laundry basket visibly, reminds to use it.',
    'WIT-DLY-08': 'Adult plays along, models tidying as a game.',
    'WIT-DLY-09': 'Adult checks schedule, prompts what to pack.',
    'WIT-DLY-10': 'Adult creates calm space, reads or chats before sleep.',
    'WIT-NUT-01': 'Adult reminds to wash hands with soap before eating.',
    'WIT-CAP-01': 'Adult models neat bed-making, praises independence.',
  },
  noTemplates: 'No daily living habits yet.',
  noSets: 'No daily living sets yet.',
  errorLoadFailed: 'Failed to load daily living library.',
  errorSaveFailed: 'Failed to save habit. Please try again.',
  errorNoChildSelected: 'Please select a child to add habit.',
} as const;

/** Type for the copy object. */
type DailyLivingCopy = {
  readonly tabLabel: string;
  readonly libraryTitle: string;
  readonly setsTitle: string;
  readonly addButton: string;
  readonly addedButton: string;
  readonly restoreButton: string;
  readonly graduatedLabel: string;
  readonly practiceAgainButton: string;
  readonly savedNotice: string;
  readonly saveUnconfirmedNotice: string;
  readonly restoreNotice: string;
  readonly practiceAgainNotice: string;
  readonly handWashingNote: string;
  readonly setDescriptions: Record<string, string>;
  readonly shortTitles: Record<string, string>;
  readonly cues: Record<string, string>;
  readonly support: Record<string, string>;
  readonly noTemplates: string;
  readonly noSets: string;
  readonly errorLoadFailed: string;
  readonly errorSaveFailed: string;
  readonly errorNoChildSelected: string;
};

/** All supported languages map to either VI or EN for MVP. */
const COPY_BY_LANGUAGE: Record<Language, DailyLivingCopy> = {
  vi: DAILY_LIVING_COPY_VI,
  en: DAILY_LIVING_COPY_EN,
  zh: DAILY_LIVING_COPY_EN,
  ja: DAILY_LIVING_COPY_EN,
  ko: DAILY_LIVING_COPY_EN,
  fr: DAILY_LIVING_COPY_EN,
  de: DAILY_LIVING_COPY_EN,
  it: DAILY_LIVING_COPY_EN,
  es: DAILY_LIVING_COPY_EN,
};

/**
 * Returns the daily living copy for a given language.
 * MVP: Only Vietnamese has full copy; other languages fall back to English.
 */
export function getDailyLivingCopy(language: Language): DailyLivingCopy {
  return COPY_BY_LANGUAGE[language] ?? DAILY_LIVING_COPY_EN;
}

/**
 * Gets the short display title for a template ID.
 */
export function getDailyLivingShortTitle(templateId: string, language: Language = 'vi'): string {
  const copy = getDailyLivingCopy(language);
  return copy.shortTitles[templateId as keyof typeof copy.shortTitles] ?? templateId;
}

/**
 * Gets the cue suggestion for a template ID.
 */
export function getDailyLivingCue(templateId: string, language: Language = 'vi'): string {
  const copy = getDailyLivingCopy(language);
  return copy.cues[templateId as keyof typeof copy.cues] ?? '';
}

/**
 * Gets the adult support text for a template ID.
 */
export function getDailyLivingSupport(templateId: string, language: Language = 'vi'): string {
  const copy = getDailyLivingCopy(language);
  return copy.support[templateId as keyof typeof copy.support] ?? '';
}

/**
 * Gets the set description for a set ID.
 */
export function getDailyLivingSetDescription(setId: string, language: Language = 'vi'): string {
  const copy = getDailyLivingCopy(language);
  return copy.setDescriptions[setId as keyof typeof copy.setDescriptions] ?? '';
}