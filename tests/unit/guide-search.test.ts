import { describe, expect, it } from 'vitest';
import { guideHref, parseGuideHref, sectionWithChildren } from '@/lib/guide/guide-sections';
import { normalizeForSearch, searchGuide } from '@/lib/guide/guide-search';
import type { GuideChapter } from '@/lib/guide/guide-types';

const section = (id: string, level: number, title: string, text: string) => ({ id, level, title, html: `<p>${text}</p>`, text });

const chapter: GuideChapter = {
  slug: 'gia-dinh',
  number: '05',
  title: 'Gia đình và cài đặt',
  summary: '',
  sections: [
    section('ho-so', 2, 'Hồ sơ các con', 'Mỗi bé có một hồ sơ riêng gồm tên, biệt danh và tuổi.'),
    section('ghep', 3, 'Ghép thiết bị cho bé', 'Quét QR hoặc nhập mã trên máy của bé. Đặt mã PIN để bảo vệ.'),
    section('thiet-bi', 2, 'Quản lý thiết bị', 'Thu hồi quyền khi mất máy.'),
    section('nho', 0, 'Chi tiết nhỏ', 'Một đoạn không có tiêu đề riêng.'),
  ],
};

describe('guide search', () => {
  it('ignores accents and case', () => {
    expect(normalizeForSearch('Đặt TÍN hiệu')).toBe('dat tin hieu');
  });

  it('finds sections that contain every word, best title match first', () => {
    const hits = searchGuide([chapter], 'ghep thiet bi');
    expect(hits.map((hit) => hit.sectionId)).toEqual(['ghep']);
    expect(hits[0]?.snippet).toContain('QR');
    // A word that is in a title ranks that section above one that only mentions it in the text.
    expect(searchGuide([chapter], 'quet qr').map((hit) => hit.sectionId)).toEqual(['ghep']);
    expect(searchGuide([chapter], 'thiet bi').map((hit) => hit.sectionId).sort()).toEqual(['ghep', 'thiet-bi']);
  });

  it('needs at least two letters and returns nothing for no match', () => {
    expect(searchGuide([chapter], 'a')).toEqual([]);
    expect(searchGuide([chapter], 'khong co tu nay')).toEqual([]);
  });
});

describe('guide sections', () => {
  it('a heading brings the parts nested under it, a part without heading stands alone', () => {
    expect(sectionWithChildren(chapter, 'ho-so').map((item) => item.id)).toEqual(['ho-so', 'ghep']);
    expect(sectionWithChildren(chapter, 'ghep').map((item) => item.id)).toEqual(['ghep']);
    expect(sectionWithChildren(chapter, 'nho').map((item) => item.id)).toEqual(['nho']);
    expect(sectionWithChildren(chapter, 'khong-co')).toEqual([]);
  });

  it('reads and writes guide links', () => {
    expect(parseGuideHref('/docs/goi-va-thanh-toan#coupon')).toEqual({ slug: 'goi-va-thanh-toan', anchor: 'coupon' });
    expect(parseGuideHref('/docs/goi-va-thanh-toan')).toEqual({ slug: 'goi-va-thanh-toan', anchor: null });
    expect(parseGuideHref('https://example.com/docs/x')).toBeNull();
    expect(parseGuideHref('/pricing')).toBeNull();
    expect(guideHref('bat-dau', 'demo')).toBe('/docs/bat-dau#demo');
    expect(guideHref('bat-dau')).toBe('/docs/bat-dau');
  });
});
