import { useCallback, useSyncExternalStore } from 'react';
import {
  buildParentSectionUrl,
  DEFAULT_PARENT_SECTION,
  parseParentSection,
  type ParentSection,
} from '@/lib/parent-section-url';

const SECTION_CHANGE_EVENT = 'kidhabit-parent-section-change';

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener('hashchange', onChange);
  window.addEventListener(SECTION_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener(SECTION_CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): ParentSection {
  return parseParentSection(window.location.search, window.location.hash);
}

function getServerSnapshot(): ParentSection {
  return DEFAULT_PARENT_SECTION;
}

/**
 * The parent section, read from the address bar so a reload or the Back button lands on the same tab.
 * Only mount it inside the parent area: the URL picks a tab there and never decides whether the area is shown.
 */
export function useParentSection(): readonly [ParentSection, (section: ParentSection) => void] {
  const section = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const select = useCallback((next: ParentSection) => {
    if (getSnapshot() === next) return;
    window.history.pushState(null, '', buildParentSectionUrl(window.location, next));
    window.dispatchEvent(new Event(SECTION_CHANGE_EVENT));
  }, []);
  return [section, select];
}
