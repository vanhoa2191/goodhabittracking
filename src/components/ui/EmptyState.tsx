import type { LucideIcon } from 'lucide-react';

/** A calm "nothing here yet" block, so an empty parent panel looks as finished as the child's. */
export function EmptyState({ icon: Icon, title, description }: {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 px-4 py-6 text-center dark:border-zinc-700">
      <Icon aria-hidden="true" className="h-8 w-8 text-slate-400 dark:text-slate-500" />
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">{description}</p>}
    </div>
  );
}
