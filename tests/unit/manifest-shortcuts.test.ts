import { describe, expect, it } from 'vitest';
import manifest from '@/app/manifest';

describe('web app manifest shortcuts', () => {
  const shortcuts = manifest().shortcuts ?? [];

  it('offers a way to the approvals and to the guide, both inside the app scope', () => {
    expect(shortcuts.map((shortcut) => shortcut.url)).toEqual(['/?section=approvals', '/docs']);
    for (const shortcut of shortcuts) expect(shortcut.url.startsWith('/')).toBe(true);
  });

  it('names every shortcut so it can be shown on the icon menu', () => {
    for (const shortcut of shortcuts) {
      expect(shortcut.name.trim().length).toBeGreaterThan(0);
      expect(shortcut.icons?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
