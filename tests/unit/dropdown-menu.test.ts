import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';

function render(defaultOpen: boolean) {
  return renderToStaticMarkup(createElement(
    DropdownMenu,
    {
      menuLabel: 'Language',
      triggerLabel: 'English',
      triggerClassName: 'trigger',
      panelClassName: 'panel',
      trigger: 'EN',
      defaultOpen,
    },
    createElement(
      Fragment,
      null,
      createElement(DropdownMenuItem, { selected: true, onSelect: () => undefined }, 'English'),
      createElement(DropdownMenuItem, { selected: false, onSelect: () => undefined }, 'Français'),
    ),
  ));
}

describe('dropdown menu markup', () => {
  it('announces a closed menu button without rendering the menu', () => {
    const html = render(false);
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="English"');
    expect(html).not.toContain('role="menu"');
  });

  it('opens a labelled menu whose items are radio items with the chosen one checked', () => {
    const html = render(true);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toMatch(/role="menu" aria-label="Language"/);
    expect(html.match(/role="menuitemradio"/g)).toHaveLength(2);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(html.match(/aria-checked="false"/g)).toHaveLength(1);
  });

  it('keeps every item at least 44px high and only the chosen one in the Tab order', () => {
    const html = render(true);
    expect(html.match(/min-h-11/g)).toHaveLength(2);
    // The chosen item is the one tab stop; the others are reached with the arrow keys.
    expect(html.match(/tabindex="-1"/g)).toHaveLength(1);
    expect(html.match(/tabindex="0"/g)).toHaveLength(1);
  });
});
