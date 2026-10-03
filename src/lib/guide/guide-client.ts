import { guideChapterSchema, guideIndexSchema, type GuideChapter, type GuideIndex } from './guide-types';
import { guideFilePath, type GuideLocale } from './guide-locale';

// The guide is a set of static files under /guide (built from docs/huong-dan). Each one is fetched once per page
// load and kept; a failed download is forgotten so the next attempt tries again.
const cache = new Map<string, Promise<unknown>>();

function load<T>(path: string, parse: (value: unknown) => T): Promise<T> {
  let pending = cache.get(path) as Promise<T> | undefined;
  if (!pending) {
    pending = fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error(`The guide file ${path} could not be loaded.`);
        return response.json() as Promise<unknown>;
      })
      .then(parse);
    pending.catch(() => cache.delete(path));
    cache.set(path, pending);
  }
  return pending;
}

export const loadGuideIndex = (locale: GuideLocale = 'vi'): Promise<GuideIndex> =>
  load(guideFilePath(locale, 'index'), (value) => guideIndexSchema.parse(value));

export const loadGuideChapter = (slug: string, locale: GuideLocale = 'vi'): Promise<GuideChapter> =>
  load(guideFilePath(locale, encodeURIComponent(slug)), (value) => guideChapterSchema.parse(value));

export async function loadAllGuideChapters(locale: GuideLocale = 'vi'): Promise<GuideChapter[]> {
  const index = await loadGuideIndex(locale);
  return Promise.all(index.map((entry) => loadGuideChapter(entry.slug, locale)));
}
