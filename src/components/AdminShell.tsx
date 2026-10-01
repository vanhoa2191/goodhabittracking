'use client';

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { ADMIN_TABS, DEFAULT_ADMIN_TAB, parseAdminTab, type AdminTabId } from '@/lib/admin/admin-view';

const AdminTabContext = createContext<AdminTabId>(DEFAULT_ADMIN_TAB);

/** The tab that is open, for the parts of the screen that stay mounted across tabs. */
export function useAdminTab(): AdminTabId {
  return useContext(AdminTabContext);
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}
const readHash = () => window.location.hash;
const serverHash = () => '';

type Props = {
  readonly overview: ReactNode;
  readonly referral: ReactNode;
  readonly funnel: ReactNode;
  /** One client component that holds the data of the customer, payment and coupon tabs and shows the open one. */
  readonly workspace: ReactNode;
};

/**
 * The admin screen: a sticky row of tabs (the open one lives in the URL hash, so a link or a refresh returns to it)
 * and the matching panel. Panels stay mounted and are only hidden, so a half-typed form survives a tab change.
 */
export function AdminShell({ overview, referral, funnel, workspace }: Props) {
  const tab = parseAdminTab(useSyncExternalStore(subscribe, readHash, serverHash));
  const panels: ReadonlyArray<readonly [AdminTabId, ReactNode]> = [
    ['tong-quan', overview],
    ['gioi-thieu', referral],
    ['phieu', funnel],
  ];

  return (
    <AdminTabContext.Provider value={tab}>
      <div role="tablist" aria-label="Khu vực quản trị" className="sticky top-0 z-20 -mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:mx-0 sm:rounded-2xl sm:border">
        {ADMIN_TABS.map((item) => (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls={`panel-${item.id}`}
            onClick={() => { window.location.hash = item.id; }}
            className={`min-h-11 shrink-0 rounded-xl px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${tab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-zinc-800'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {panels.map(([id, content]) => (
        <div key={id} id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} hidden={tab !== id} className="space-y-6">
          {content}
        </div>
      ))}
      <div id="panel-workspace">{workspace}</div>
    </AdminTabContext.Provider>
  );
}
