export function DocsSection({ id, title, children }: { readonly id: string; readonly title: string; readonly children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><h2 className="mb-3 text-xl font-black text-slate-900 dark:text-white">{title}</h2><div className="text-base leading-7 text-slate-600 dark:text-slate-300">{children}</div></section>;
}
