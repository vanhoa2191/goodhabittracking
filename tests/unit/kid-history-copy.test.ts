import { describe, expect, it } from 'vitest';
import { getKidHistoryCopy } from '@/lib/i18n/kid-history-copy';
import type { Language } from '@/types';

const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

describe('kid history copy', () => {
  it.each(languages)('has every line in %s', (language) => {
    const copy = getKidHistoryCopy(language);
    const lines = [copy.historyNote, copy.noTasksThatDay, copy.noTasksToday, copy.noChild, copy.statusDone, copy.statusPending, copy.statusNotDone, copy.dayProgress(2, 5)];
    for (const line of lines) expect(line.trim().length).toBeGreaterThan(1);
    expect(copy.dayProgress(2, 5)).toContain('2');
    expect(copy.dayProgress(2, 5)).toContain('5');
  });

  it('keeps the Vietnamese lines the product owner chose', () => {
    const copy = getKidHistoryCopy('vi');
    expect(copy.historyNote).toBe('Đây là lịch sử. Con chỉ có thể xem các nhiệm vụ của ngày này.');
    expect(copy.noChild).toBe('Chưa có hồ sơ của bé. Nhờ ba mẹ tạo hồ sơ hoặc ghép lại thiết bị.');
    expect(copy.noTasksToday).toBe('Hôm nay không có nhiệm vụ');
    expect(copy.noTasksThatDay).toBe('Ngày này không có nhiệm vụ');
  });

  it('does not reuse one language for another', () => {
    const notes = languages.map((language) => getKidHistoryCopy(language).historyNote);
    expect(new Set(notes).size).toBe(languages.length);
  });
});
