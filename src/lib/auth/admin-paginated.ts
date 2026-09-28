import 'server-only';

const PAGE_SIZE = 1000;
const MAX_PAGES = 100;

type PageResult<T> = {
  readonly data: readonly T[] | null;
  readonly error: unknown | null;
};

export async function listAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<{ readonly rows: readonly T[]; readonly error: boolean }> {
  const rows: T[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await fetchPage(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (result.error) return { rows: [], error: true };
    const pageRows = result.data ?? [];
    rows.push(...pageRows);
    if (pageRows.length < PAGE_SIZE) return { rows, error: false };
  }
  return { rows: [], error: true };
}
