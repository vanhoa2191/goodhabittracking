import type { GuideChapter } from './guide-types';

/** Lower case, no accents: "Đặt tín hiệu" is found by "dat tin hieu". */
export function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase();
}

export type GuideSearchHit = {
  readonly slug: string;
  readonly chapterTitle: string;
  readonly sectionId: string;
  readonly sectionTitle: string;
  readonly snippet: string;
};

const MAX_HITS = 20;
const SNIPPET_LENGTH = 140;

function snippetAround(text: string, normalizedText: string, term: string): string {
  const position = normalizedText.indexOf(term);
  if (position < 0) return text.slice(0, SNIPPET_LENGTH);
  const start = Math.max(0, position - 40);
  const slice = text.slice(start, start + SNIPPET_LENGTH).trim();
  return `${start > 0 ? '… ' : ''}${slice}${start + SNIPPET_LENGTH < text.length ? ' …' : ''}`;
}

/** Every word of the query must appear in a section; a word in the title ranks it higher. */
export function searchGuide(chapters: readonly GuideChapter[], query: string): GuideSearchHit[] {
  const terms = normalizeForSearch(query).split(/\s+/).filter((term) => term.length > 1);
  if (terms.length === 0) return [];
  const scored: Array<{ score: number; hit: GuideSearchHit }> = [];
  for (const chapter of chapters) {
    for (const section of chapter.sections) {
      const normalizedTitle = normalizeForSearch(section.title);
      const normalizedText = normalizeForSearch(section.text);
      if (!terms.every((term) => normalizedText.includes(term) || normalizedTitle.includes(term))) continue;
      const score = terms.reduce((total, term) => total + (normalizedTitle.includes(term) ? 3 : 0) + (normalizeForSearch(chapter.title).includes(term) ? 1 : 0), 0);
      scored.push({
        score,
        hit: {
          slug: chapter.slug,
          chapterTitle: chapter.title,
          sectionId: section.id,
          sectionTitle: section.title,
          snippet: snippetAround(section.text, normalizedText, terms[0] as string),
        },
      });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, MAX_HITS).map((entry) => entry.hit);
}
