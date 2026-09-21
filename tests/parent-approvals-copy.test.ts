import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { parentApprovalsCopy } from '@/lib/i18n/parent-approvals-copy';

const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

describe('parent approvals localization', () => {
  it('provides complete copy for every supported language', () => {
    for (const language of languages) {
      const copy = parentApprovalsCopy[language];
      expect(copy.pendingTasks).toBeTruthy();
      expect(copy.noPendingTasks).toBeTruthy();
      expect(copy.pendingRewards).toBeTruthy();
      expect(copy.noPendingRewards).toBeTruthy();
      expect(copy.todayDone(2)).toContain('2');
      expect(copy.rewardCompleted(10, '2026-09-19')).toContain('10');
      expect(copy.redemptionRequested(20, '08:30')).toContain('20');
    }
  });

  it('does not leak Vietnamese approval labels into other locales', () => {
    for (const language of languages.filter((item) => item !== 'vi')) {
      const copy = parentApprovalsCopy[language];
      const renderedCopy = [
        copy.todayDone(2), copy.pendingTasks, copy.noPendingTasks,
        copy.rewardCompleted(10, '2026-09-19'), copy.pendingRewards,
        copy.noPendingRewards, copy.redemptionRequested(20, '08:30'),
      ].join(' ');
      expect(renderedCopy).not.toMatch(/Hôm nay|Nhiệm vụ|bố mẹ|Không có|Yêu cầu|Đã trừ|Hoàn thành/);
    }
  });
});
