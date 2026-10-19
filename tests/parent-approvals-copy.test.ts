import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { getParentActionsCopy } from '@/lib/i18n/parent-actions-copy';
import { parentApprovalsCopy } from '@/lib/i18n/parent-approvals-copy';

const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

describe('parent approvals localization', () => {
  it('provides complete copy for every supported language', () => {
    for (const language of languages) {
      const copy = parentApprovalsCopy[language];
      expect(copy.pendingTasks).toBeTruthy();
      expect(copy.noPendingTasks).toBeTruthy();
      expect(copy.inboxTitle).toBeTruthy();
      expect(copy.inboxEmptyBody).toBeTruthy();
      expect(copy.pendingRewards).toBeTruthy();
      expect(copy.noPendingRewards).toBeTruthy();
      expect(copy.todayDone(2)).toContain('2');
      expect(copy.rewardCompleted(10, '2026-09-19')).toContain('10');
      expect(copy.redemptionRequested(20, '08:30')).toContain('20');
    }
  });

  it('names the all-family scope and every truthful queue state in every language', () => {
    for (const language of languages) {
      const copy = parentApprovalsCopy[language];
      expect(copy.allChildrenScope, language).toBeTruthy();
      expect(copy.approvedAwaitingDelivery, language).toBeTruthy();
      expect(copy.deliveryUnfulfilled, language).toBeTruthy();
      expect(copy.deliveryFailed, language).toBeTruthy();
      expect(copy.deliveredStale, language).toBeTruthy();
      expect(copy.deliveredDone, language).toBeTruthy();
      expect(copy.rejectedDone, language).toBeTruthy();
      expect(copy.reconcileMessage, language).toBeTruthy();
    }
    expect(parentApprovalsCopy.vi.allChildrenScope).toContain('tất cả bé');
    expect(parentApprovalsCopy.vi.inboxTitle).toBe('Cần duyệt — tất cả bé');
  });

  it('does not leak Vietnamese approval labels into other locales', () => {
    for (const language of languages.filter((item) => item !== 'vi')) {
      const copy = parentApprovalsCopy[language];
      const renderedCopy = [
        copy.inboxTitle, copy.inboxEmptyBody,
        copy.todayDone(2), copy.pendingTasks, copy.noPendingTasks,
        copy.rewardCompleted(10, '2026-09-19'), copy.pendingRewards,
        copy.noPendingRewards, copy.redemptionRequested(20, '08:30'),
        copy.allChildrenScope, copy.approvedAwaitingDelivery,
        copy.deliveryUnfulfilled, copy.deliveryFailed, copy.deliveredStale,
        copy.deliveredDone, copy.rejectedDone, copy.reconcileMessage,
      ].join(' ');
      expect(renderedCopy).not.toMatch(/Hôm nay|Nhiệm vụ|bố mẹ|Không có|Yêu cầu|Đã trừ|Hoàn thành|Đã trao|Đã từ chối|chờ trao|Dữ liệu|Làm mới|thử lại|danh sách/);
    }
  });
  it.each(languages)('%s names uncertainty and successful refresh without claiming mutation success', (language) => {
    expect(getParentActionsCopy(language)).toHaveProperty('reviewUnconfirmed', expect.any(String));
    expect(getParentActionsCopy(language)).toHaveProperty('refreshed', expect.any(String));
  });

});
