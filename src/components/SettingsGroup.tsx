'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * One collapsible settings group. The heading keeps the group's anchor id, so links such as #settings-security still land on it.
 * The body stays mounted while collapsed (hidden, not removed), so cards keep their state and load as before.
 */
export function SettingsGroup({ id, title, open, onToggle, children }: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  const panelId = `${id}-panel`;
  return (
    <div className="space-y-3">
      <h4 id={id} className="scroll-mt-40 text-base font-black text-slate-900 dark:text-white">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onToggle(id)}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <span>{title}</span>
          <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
        </button>
      </h4>
      <div id={panelId} hidden={!open} className="space-y-4">{children}</div>
    </div>
  );
}
