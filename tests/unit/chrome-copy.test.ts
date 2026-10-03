import { describe, expect, it } from 'vitest';
import { getChromeCopy } from '@/lib/i18n/chrome-copy';
import type { Language } from '@/types';

const languages: Language[] = ['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'it', 'es'];
const title = 'Đọc sách';

describe('chrome copy', () => {
  it.each(languages)('has every label in %s', (language) => {
    const copy = getChromeCopy(language);
    for (const key of ['home', 'docs', 'userGuide', 'avatarAlt', 'habitInstructionsLabel', 'habitInstructionsPlaceholder', 'viewDetails'] as const) {
      expect(copy[key].trim().length, key).toBeGreaterThan(0);
    }
  });

  it.each(languages)('puts the task name in every task label in %s', (language) => {
    const copy = getChromeCopy(language);
    const labels = [copy.taskSaving, copy.taskWaitingApproval, copy.taskUnmark, copy.taskMark, copy.taskUpdated].map((label) => label(title));
    for (const label of labels) expect(label).toContain(title);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('does not show English to the other eight languages', () => {
    const english = getChromeCopy('en');
    for (const language of languages.filter((code) => code !== 'en')) {
      const copy = getChromeCopy(language);
      expect(copy.userGuide, language).not.toBe(english.userGuide);
      expect(copy.viewDetails, language).not.toBe(english.viewDetails);
      expect(copy.taskMark(title), language).not.toBe(english.taskMark(title));
    }
  });

  it('keeps the Vietnamese wording that was hard-coded before', () => {
    const copy = getChromeCopy('vi');
    expect(copy.home).toBe('Trang chủ');
    expect(copy.docs).toBe('Tài liệu');
    expect(copy.viewDetails).toBe('Xem chi tiết');
    expect(copy.taskMark('A')).toBe('Đánh dấu nhiệm vụ “A” là hoàn thành');
  });
});
