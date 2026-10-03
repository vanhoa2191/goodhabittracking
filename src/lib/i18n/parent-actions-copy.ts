import type { Language } from '@/types';

export type ParentActionsCopy = {
  readonly title: string;
  readonly nothing: string;
  readonly reviewTasks: (count: number) => string;
  readonly reviewRewards: (count: number) => string;
  readonly suggestions: (count: number) => string;
  readonly selectAll: string;
  readonly clearSelection: string;
  readonly selectedCount: (count: number, names: string) => string;
  readonly selectOne: (title: string, child: string) => string;
  readonly approveSelected: (count: number) => string;
  readonly rejectSelected: (count: number) => string;
  readonly reviewing: string;
  readonly reviewedApproved: (count: number) => string;
  readonly reviewedRejected: (count: number) => string;
  readonly reviewedSkipped: (count: number) => string;
  readonly reviewFailed: string;
  readonly limitNote: (limit: number) => string;
};

const vi: ParentActionsCopy = {
  title: 'Cần bạn xử lý',
  nothing: 'Hiện không có việc nào cần ba mẹ xử lý.',
  reviewTasks: (count) => `Duyệt ${count} việc của bé`,
  reviewRewards: (count) => `Xem ${count} yêu cầu đổi quà`,
  suggestions: (count) => `Xem ${count} gợi ý điều chỉnh`,
  selectAll: 'Chọn tất cả',
  clearSelection: 'Bỏ chọn',
  selectedCount: (count, names) => `Đã chọn ${count} việc · ${names}`,
  selectOne: (title, child) => `Chọn “${title}” của ${child}`,
  approveSelected: (count) => `Duyệt ${count} việc`,
  rejectSelected: (count) => `Từ chối ${count} việc`,
  reviewing: 'Đang lưu…',
  reviewedApproved: (count) => `Đã duyệt ${count} việc.`,
  reviewedRejected: (count) => `Đã từ chối ${count} việc.`,
  reviewedSkipped: (count) => `${count} việc đã được xử lý trước đó nên được bỏ qua.`,
  reviewFailed: 'Chưa lưu được. Bạn thử lại nhé.',
  limitNote: (limit) => `Mỗi lần chọn tối đa ${limit} việc.`,
};

const en: ParentActionsCopy = {
  title: 'Needs you',
  nothing: 'Nothing needs you right now.',
  reviewTasks: (count) => `Review ${count} task${count === 1 ? '' : 's'}`,
  reviewRewards: (count) => `See ${count} reward request${count === 1 ? '' : 's'}`,
  suggestions: (count) => `See ${count} suggestion${count === 1 ? '' : 's'}`,
  selectAll: 'Select all',
  clearSelection: 'Clear selection',
  selectedCount: (count, names) => `${count} selected · ${names}`,
  selectOne: (title, child) => `Select “${title}” for ${child}`,
  approveSelected: (count) => `Approve ${count} task${count === 1 ? '' : 's'}`,
  rejectSelected: (count) => `Reject ${count} task${count === 1 ? '' : 's'}`,
  reviewing: 'Saving…',
  reviewedApproved: (count) => `Approved ${count} task${count === 1 ? '' : 's'}.`,
  reviewedRejected: (count) => `Rejected ${count} task${count === 1 ? '' : 's'}.`,
  reviewedSkipped: (count) => `${count} already handled earlier, so skipped.`,
  reviewFailed: 'Could not save. Please try again.',
  limitNote: (limit) => `Up to ${limit} tasks at a time.`,
};

const COPY: Partial<Record<Language, ParentActionsCopy>> = { vi, en };

export function getParentActionsCopy(language: Language): ParentActionsCopy {
  return COPY[language] ?? en;
}
