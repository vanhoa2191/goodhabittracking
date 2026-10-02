import type { Language } from '@/types';

export type GuideTask = readonly [label: string, slug: string, anchor: string];

type GuideCopy = {
  readonly back: string;
  readonly title: string;
  readonly intro: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly searchTooShort: string;
  readonly searchLoading: string;
  readonly searchEmpty: string;
  readonly searchResults: (count: number) => string;
  readonly searchFailed: string;
  readonly chapters: string;
  readonly chapterNumber: (number: string) => string;
  readonly tasksTitle: string;
  readonly tasks: readonly GuideTask[];
  readonly onThisPage: string;
  readonly allChapters: string;
  readonly previous: string;
  readonly next: string;
  readonly loading: string;
  readonly loadError: string;
  readonly retry: string;
  readonly vietnameseOnly: string;
  readonly quickGuide: string;
  readonly helpOpen: string;
  readonly helpDetails: string;
  readonly helpOpenFull: string;
  readonly helpClose: string;
  readonly helpBack: string;
  readonly helpLoading: string;
  readonly helpDetailsUnavailable: string;
  readonly helpButtonShort: string;
};

const vi: GuideCopy = {
  back: 'Quay lại ứng dụng',
  title: 'Tài liệu sử dụng KidHabit',
  intro: 'Hướng dẫn từng tính năng cho ba mẹ: đọc theo chương, tìm theo từ khóa, hoặc bấm dấu ? cạnh mỗi mục trong ứng dụng để xem đúng phần liên quan.',
  searchLabel: 'Tìm trong hướng dẫn',
  searchPlaceholder: 'Ví dụ: ghép máy cho bé, mã PIN, hoàn tiền',
  searchTooShort: 'Gõ ít nhất hai chữ để tìm.',
  searchLoading: 'Đang tìm…',
  searchEmpty: 'Không có mục nào khớp. Thử từ khóa khác ngắn hơn.',
  searchResults: (count) => `${count} kết quả`,
  searchFailed: 'Chưa tải được hướng dẫn để tìm. Vui lòng thử lại.',
  chapters: 'Các chương',
  chapterNumber: (number) => `Chương ${number}`,
  tasksTitle: 'Tôi muốn…',
  tasks: [
    ['Tạo hồ sơ cho bé', 'gia-dinh-va-cai-dat', 'ho-so'],
    ['Ghép máy cho bé', 'gia-dinh-va-cai-dat', 'ghep-thiet-bi'],
    ['Thêm việc cho bé', 'thiet-ke-thoi-quen', 'quan-ly-viec'],
    ['Đặt tín hiệu cho một thói quen', 'thiet-ke-thoi-quen', 'chuong-trinh'],
    ['Duyệt việc và quà của bé', 'hom-nay-va-duyet-viec', 'duyet'],
    ['Tạo phần thưởng', 'thiet-ke-thoi-quen', 'kho-qua'],
    ['Đặt mã PIN', 'gia-dinh-va-cai-dat', 'pin'],
    ['Mua gói và thanh toán', 'goi-va-thanh-toan', 'thanh-toan'],
    ['Nhập mã tặng hoặc mã giới thiệu', 'goi-va-thanh-toan', 'coupon'],
    ['Cho cả nhà tạm nghỉ', 'gia-dinh-va-cai-dat', 'tam-nghi'],
    ['Xử lý khi bé báo "Chưa lưu được"', 'ban-do-lien-ket', 'su-co'],
    ['Xóa dữ liệu gia đình', 'bao-mat-va-rieng-tu', 'xoa-du-lieu'],
  ],
  onThisPage: 'Trong chương này',
  allChapters: 'Tất cả các chương',
  previous: 'Chương trước',
  next: 'Chương sau',
  loading: 'Đang tải hướng dẫn…',
  loadError: 'Chưa tải được hướng dẫn. Kiểm tra mạng rồi thử lại.',
  retry: 'Thử lại',
  vietnameseOnly: 'Hướng dẫn đầy đủ hiện có bằng tiếng Việt. Bản tóm tắt bên dưới có ngôn ngữ của bạn.',
  quickGuide: 'Tóm tắt nhanh',
  helpOpen: 'Xem giải thích',
  helpDetails: 'Xem chi tiết',
  helpOpenFull: 'Mở hướng dẫn đầy đủ',
  helpClose: 'Đóng',
  helpBack: 'Quay lại',
  helpLoading: 'Đang tải…',
  helpDetailsUnavailable: 'Chưa tải được phần hướng dẫn này. Bạn có thể mở hướng dẫn đầy đủ.',
  helpButtonShort: 'Hướng dẫn',
};

const en: GuideCopy = {
  back: 'Back to the app',
  title: 'KidHabit user guide',
  intro: 'A guide to every feature for parents: read by chapter, search by keyword, or tap the ? next to any item in the app to see exactly the part that matches.',
  searchLabel: 'Search the guide',
  searchPlaceholder: 'For example: pair a device, PIN, refund',
  searchTooShort: 'Type at least two letters to search.',
  searchLoading: 'Searching…',
  searchEmpty: 'Nothing matches. Try a shorter keyword.',
  searchResults: (count) => `${count} ${count === 1 ? 'result' : 'results'}`,
  searchFailed: 'The guide could not be loaded for searching. Please try again.',
  chapters: 'Chapters',
  chapterNumber: (number) => `Chapter ${number}`,
  tasksTitle: 'I want to…',
  tasks: [
    ['Create a child profile', 'gia-dinh-va-cai-dat', 'ho-so'],
    ['Pair a device for my child', 'gia-dinh-va-cai-dat', 'ghep-thiet-bi'],
    ['Add a task for my child', 'thiet-ke-thoi-quen', 'quan-ly-viec'],
    ['Set a cue for a habit', 'thiet-ke-thoi-quen', 'chuong-trinh'],
    ['Approve tasks and rewards', 'hom-nay-va-duyet-viec', 'duyet'],
    ['Create a reward', 'thiet-ke-thoi-quen', 'kho-qua'],
    ['Set a PIN', 'gia-dinh-va-cai-dat', 'pin'],
    ['Buy a plan and pay', 'goi-va-thanh-toan', 'thanh-toan'],
    ['Enter a gift or referral code', 'goi-va-thanh-toan', 'coupon'],
    ['Pause for the whole family', 'gia-dinh-va-cai-dat', 'tam-nghi'],
    ['Fix "Could not save" on my child’s screen', 'ban-do-lien-ket', 'su-co'],
    ['Delete the family data', 'bao-mat-va-rieng-tu', 'xoa-du-lieu'],
  ],
  onThisPage: 'In this chapter',
  allChapters: 'All chapters',
  previous: 'Previous chapter',
  next: 'Next chapter',
  loading: 'Loading the guide…',
  loadError: 'The guide could not be loaded. Check your connection and try again.',
  retry: 'Try again',
  vietnameseOnly: 'The full guide is currently in Vietnamese. The quick summary below is in your language.',
  quickGuide: 'Quick summary',
  helpOpen: 'Show explanation',
  helpDetails: 'See details',
  helpOpenFull: 'Open the full guide',
  helpClose: 'Close',
  helpBack: 'Back',
  helpLoading: 'Loading…',
  helpDetailsUnavailable: 'This part of the guide could not be loaded. You can open the full guide instead.',
  helpButtonShort: 'Guide',
};

export function getGuideCopy(language: Language): GuideCopy {
  return language === 'vi' ? vi : en;
}
