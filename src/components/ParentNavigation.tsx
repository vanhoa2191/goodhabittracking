'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { BarChart3, Calendar, CheckCircle2, Compass, Gift, Settings, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getParentNavigationCopy } from '@/lib/i18n/parent-navigation-copy';

export type ParentSection = 'approvals' | 'habits' | 'journeys' | 'rewards' | 'children' | 'analytics' | 'settings';
type ParentArea = 'today' | 'design' | 'family';

const SECTION_BY_AREA: Record<ParentArea, readonly ParentSection[]> = {
  today: ['approvals', 'analytics'],
  design: ['habits', 'journeys', 'rewards'],
  family: ['children', 'settings'],
};
const AREAS = ['today', 'design', 'family'] as const;

function getArea(section: ParentSection): ParentArea {
  if (SECTION_BY_AREA.today.includes(section)) return 'today';
  if (SECTION_BY_AREA.design.includes(section)) return 'design';
  return 'family';
}

function selectWithKeyboard<T extends string>(event: KeyboardEvent<HTMLButtonElement>, values: readonly T[], current: T, onSelect: (value: T) => void, idPrefix: string): void {
  const index = values.indexOf(current);
  const nextIndex = event.key === 'ArrowRight' ? (index + 1) % values.length
    : event.key === 'ArrowLeft' ? (index - 1 + values.length) % values.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? values.length - 1 : -1;
  if (nextIndex < 0) return;
  event.preventDefault();
  const next = values[nextIndex];
  onSelect(next);
  requestAnimationFrame(() => document.getElementById(`${idPrefix}-${next}`)?.focus());
}

type ParentNavigationProps = Readonly<{
  activeSection: ParentSection;
  onSelectSection: (section: ParentSection) => void;
  pendingCount: number;
  children: ReactNode;
}>;

export function ParentNavigation({ activeSection, onSelectSection, pendingCount, children }: ParentNavigationProps) {
  const { t, language } = useTranslation();
  const copy = getParentNavigationCopy(language);
  const area = getArea(activeSection);
  const sections = SECTION_BY_AREA[area];
  const labels: Record<ParentSection, string> = {
    approvals: t.approvals, habits: t.manageHabits, journeys: t.journeys, rewards: t.rewards,
    children: t.manageProfiles, analytics: t.analytics, settings: t.settings,
  };
  const icons = { approvals: CheckCircle2, habits: Calendar, journeys: Compass, rewards: Gift, children: Users, analytics: BarChart3, settings: Settings } as const;

  return (
    <>
      <div role="tablist" aria-label={copy.areasLabel} className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-zinc-900">
        {AREAS.map((candidate) => (
          <button
            key={candidate}
            id={`parent-area-${candidate}`}
            type="button"
            role="tab"
            aria-selected={area === candidate}
            aria-controls="parent-area-panel"
            tabIndex={area === candidate ? 0 : -1}
            onClick={() => onSelectSection(SECTION_BY_AREA[candidate][0])}
            onKeyDown={(event) => selectWithKeyboard(event, AREAS, area, (next) => onSelectSection(SECTION_BY_AREA[next][0]), 'parent-area')}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${area === candidate ? 'bg-white text-indigo-700 shadow-sm dark:bg-zinc-800 dark:text-indigo-300' : 'text-slate-700 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-zinc-800/60'}`}
          >
            {copy[candidate]}
            {candidate === 'today' && pendingCount > 0 && <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-xs text-white">{pendingCount}</span>}
          </button>
        ))}
      </div>
      <div id="parent-area-panel" role="tabpanel" aria-labelledby={`parent-area-${area}`} className="space-y-6">
        <div role="tablist" aria-label={copy.sectionsLabel} className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = icons[section];
            return (
              <button
                key={section}
                id={`parent-section-${section}`}
                type="button"
                role="tab"
                aria-selected={activeSection === section}
                aria-controls="parent-section-panel"
                tabIndex={activeSection === section ? 0 : -1}
                onClick={() => onSelectSection(section)}
                onKeyDown={(event) => selectWithKeyboard(event, sections, activeSection, onSelectSection, 'parent-section')}
                className={`flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${activeSection === section ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-indigo-50 dark:bg-zinc-900 dark:text-slate-200 dark:hover:bg-zinc-800'}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {labels[section]}
                {section === 'approvals' && pendingCount > 0 && <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-xs text-white">{pendingCount}</span>}
              </button>
            );
          })}
        </div>
        <div id="parent-section-panel" role="tabpanel" aria-labelledby={`parent-section-${activeSection}`}>{children}</div>
      </div>
    </>
  );
}
