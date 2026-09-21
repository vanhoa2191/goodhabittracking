export function DocsNavigation({ sections }: { readonly sections: ReadonlyArray<readonly [string, string, string]> }) {
  return <nav aria-label="Mục tài liệu" className="flex gap-2 overflow-x-auto pb-2">{sections.map(([id, title]) => <a key={id} href={`#${id}`} className="min-h-11 shrink-0 rounded-full border border-indigo-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-300">{title}</a>)}</nav>;
}
