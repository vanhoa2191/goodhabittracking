import type { GuideChapter, GuideSection } from './guide-types';

/**
 * The part of a chapter a link to `id` means: the section itself and, for a heading, the sections nested under it
 * (a level 2 heading brings its level 3 parts; a part without a heading stands alone).
 */
export function sectionWithChildren(chapter: GuideChapter, id: string): readonly GuideSection[] {
  const start = chapter.sections.findIndex((section) => section.id === id);
  if (start < 0) return [];
  const first = chapter.sections[start] as GuideSection;
  if (first.level === 0) return [first];
  let end = start + 1;
  while (end < chapter.sections.length) {
    const next = chapter.sections[end] as GuideSection;
    if (next.level !== 0 && next.level <= first.level) break;
    end += 1;
  }
  return chapter.sections.slice(start, end);
}

export type GuideTarget = { readonly slug: string; readonly anchor: string | null };

/** `/docs/goi-va-thanh-toan#coupon` → `{ slug: 'goi-va-thanh-toan', anchor: 'coupon' }`; anything else is not a guide link. */
export function parseGuideHref(href: string): GuideTarget | null {
  const match = /^\/docs\/([a-z0-9-]+)(?:#([a-z0-9-]+))?$/.exec(href);
  return match ? { slug: match[1] as string, anchor: match[2] ?? null } : null;
}

export function guideHref(slug: string, anchor?: string | null): string {
  return `/docs/${slug}${anchor ? `#${anchor}` : ''}`;
}
