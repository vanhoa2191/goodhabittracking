import { expect, type Page } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

/** Shared, audit-scoped helpers. Keeps ui-audit-regression.spec.ts free of navigation duplication. */

/** Enters the demo kid dashboard straight from the ?demo=1 entry param. */
export async function enterDemoKid(page: Page): Promise<void> {
  await page.goto('/?demo=1');
  await expect(page.getByTestId('kid-hero')).toBeVisible();
}

/** Enters parent mode from the cloud fixture and opens the Today/approvals area. Mirrors the
 *  flow used by reward-mutation.spec.ts (no landing gate when a cloud session exists). Tolerates
 *  an already-parent/already-unlocked session so it works whether the cloud app lands in kid or
 *  parent mode. */
export async function enterParentApprovals(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('app-surface')).toHaveAttribute('data-app-mode', /^(kid|parent)$/);
  const parentButton = page.getByRole('button', { name: 'Phụ huynh', exact: true });
  if (await parentButton.isVisible()) {
    await parentButton.click();
    await setupOrUnlockParent(page);
  } else {
    const pinDialog = page.getByRole('dialog', { name: /PIN/i });
    if (await pinDialog.isVisible()) await setupOrUnlockParent(page);
  }
  await page.getByRole('tab', { name: /^Hôm nay/ }).click();
  await expect(page.getByRole('tab', { name: /^Duyệt việc/ })).toBeVisible();
}

/** Usable vertical band between the sticky header and the bottom navigation, in CSS px (viewport-relative). */
export async function usableBand(page: Page): Promise<{ readonly top: number; readonly bottom: number }> {
  const band = await page.evaluate(() => {
    const header = document.querySelector('header[data-app-shell]');
    const nav = document.querySelector('[data-testid="kid-bottom-nav"]');
    const gcr = (el: Element | null) => el ? el.getBoundingClientRect() : null;
    const top = gcr(header) ? gcr(header)!.y + gcr(header)!.height : 0;
    const bottom = gcr(nav) ? gcr(nav)!.y : 812;
    if (!header) throw new Error('sticky header not found');
    if (!nav) throw new Error('kid bottom nav not found');
    return { top, bottom };
  });
  return band as { top: number; bottom: number };
}

/** Viewport-relative bounding boxes for the first due task's title and mark toggle. */
export async function taskTitleAndToggleBoxes(page: Page): Promise<{ readonly title: { x: number; y: number; width: number; height: number } | null; readonly toggle: { x: number; y: number; width: number; height: number } | null }> {
  return page.evaluate(() => {
    const card = document.querySelector('[data-task-card]');
    if (!card) return { title: null, toggle: null };
    const heading = card.querySelector('h2, h3, h4');
    if (!heading?.textContent?.trim()) throw new Error('Populated task card is missing visible title text');
    const gcr = (sel: string) => {
      const el = card.querySelector(sel);
      const r = el ? el.getBoundingClientRect() : null;
      return r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
    };
    const title = gcr('h2, h3, h4');
    const toggle = gcr('[data-task-toggle]');
    if (!title || !toggle) throw new Error('Populated task card is missing its semantic title or primary action');
    if (title.width <= 0 || title.height <= 0 || toggle.width <= 0 || toggle.height <= 0) {
      throw new Error('Populated task title and primary action must have visible bounds');
    }
    return { title, toggle };
  });
}
