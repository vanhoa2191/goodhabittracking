'use client';

import { Check } from 'lucide-react';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { keepInViewportShift, menuEntryIndex, menuKeyAction } from '@/lib/dropdown-menu-navigation';

const ITEM_SELECTOR = '[role="menuitemradio"]';

function menuItems(panel: HTMLElement | null): HTMLElement[] {
  return Array.from(panel?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
}

const MenuContext = createContext<{ readonly close: () => void } | null>(null);

interface DropdownMenuProps {
  readonly menuLabel: string;
  readonly trigger: ReactNode;
  readonly triggerClassName: string;
  readonly triggerLabel?: string;
  readonly panelClassName: string;
  readonly rootClassName?: string;
  readonly heading?: ReactNode;
  readonly defaultOpen?: boolean;
  readonly children?: ReactNode;
}

/**
 * A button that opens a single-choice menu. Enter, Space and the arrow keys open it with focus on the chosen item;
 * arrows, Home and End move between items, Escape closes it and gives focus back to the button, and Tab or a press
 * outside closes it and lets focus carry on.
 */
export function DropdownMenu({
  menuLabel,
  trigger,
  triggerClassName,
  triggerLabel,
  panelClassName,
  rootClassName,
  heading,
  defaultOpen = false,
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const closeToTrigger = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (panel) {
      panel.style.marginLeft = '';
      const { left, right } = panel.getBoundingClientRect();
      const shift = keepInViewportShift(left, right, document.documentElement.clientWidth);
      if (shift !== 0) panel.style.marginLeft = `${shift}px`;
    }
    const entries = menuItems(panel);
    const selected = entries.findIndex((item) => item.getAttribute('aria-checked') === 'true');
    entries[menuEntryIndex(selected, entries.length)]?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!open) {
      if (event.target === triggerRef.current && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    const entries = menuItems(panelRef.current);
    const action = menuKeyAction(event.key, entries.indexOf(document.activeElement as HTMLElement), entries.length);
    if (!action) return;
    if (action.type === 'focus') {
      event.preventDefault();
      entries[action.index]?.focus();
      return;
    }
    if (action.consume) event.preventDefault();
    closeToTrigger();
  };

  return (
    <div ref={rootRef} className={rootClassName} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={triggerLabel}
        onClick={() => setOpen((current) => !current)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div ref={panelRef} className={panelClassName}>
          {heading && (
            <div aria-hidden="true" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {heading}
            </div>
          )}
          <MenuContext.Provider value={{ close: closeToTrigger }}>
            <div id={menuId} role="menu" aria-label={menuLabel}>
              {children}
            </div>
          </MenuContext.Provider>
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  selected,
  onSelect,
  className = '',
  children,
}: {
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  const menu = useContext(MenuContext);
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      // The chosen item is the menu's one tab stop (roving tabindex), so a scrolling panel always holds focusable content.
      tabIndex={selected ? 0 : -1}
      onClick={() => {
        onSelect();
        menu?.close();
      }}
      className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        selected
          ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-zinc-800'
      } ${className}`}
    >
      <span className="flex min-w-0 items-center gap-2.5">{children}</span>
      {selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />}
    </button>
  );
}
