import { guideChapterSchema, guideIndexSchema, type GuideChapter, type GuideIndex } from './guide-types';

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

export const loadGuideIndex = (): Promise<GuideIndex> => load('/guide/index.json', (value) => guideIndexSchema.parse(value));

export const loadGuideChapter = (slug: string): Promise<GuideChapter> =>
  load(`/guide/${encodeURIComponent(slug)}.json`, (value) => guideChapterSchema.parse(value));

export async function loadAllGuideChapters(): Promise<GuideChapter[]> {
  const index = await loadGuideIndex();
  return Promise.all(index.map((entry) => loadGuideChapter(entry.slug)));
}
