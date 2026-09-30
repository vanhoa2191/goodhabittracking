import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { getLeaderboardCopy } from '@/lib/i18n/leaderboard-copy';

const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const vietnameseOnly = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/;

describe('leaderboard copy', () => {
  const reference = getLeaderboardCopy('en');

  it('has every message, filled in, for every language', () => {
    for (const language of languages) {
      const copy = getLeaderboardCopy(language);
      expect(Object.keys(copy).sort(), language).toEqual(Object.keys(reference).sort());
      for (const [key, value] of Object.entries(copy)) expect(value.trim(), `${language}.${key}`).not.toBe('');
    }
  });

  it('is translated, without Vietnamese leaking into other languages (apart from the fixed fallback name)', () => {
    for (const language of languages.filter((item) => item !== 'vi')) {
      const copy = getLeaderboardCopy(language);
      for (const [key, value] of Object.entries(copy)) {
        expect(value.replaceAll('Bé Siêu Nhân', ''), `${language}.${key}`).not.toMatch(vietnameseOnly);
      }
      if (language !== 'en') expect(copy.globalEmptyTitle, language).not.toBe(reference.globalEmptyTitle);
    }
  });

  it('names the fallback nickname exactly as the server shows it', () => {
    for (const language of languages) expect(getLeaderboardCopy(language).sharingWhatShown, language).toContain('Bé Siêu Nhân');
  });

  it('never promises a ranking result or a prize', () => {
    for (const language of languages) {
      const text = Object.values(getLeaderboardCopy(language)).join('\n');
      expect(text, language).not.toMatch(/guarantee|đảm bảo|chắc chắn|100%/i);
    }
  });
});
