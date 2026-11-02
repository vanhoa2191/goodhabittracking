import { expect, test, type Page } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

async function openSettings(page: Page) {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await page.getByRole('tablist', { name: 'Khu vực phụ huynh' }).getByRole('tab', { name: 'Gia đình' }).click();
  await page.getByRole('tab', { name: /Cài đặt/ }).click();
}

test('mobile settings are compact: groups collapse, and nothing fixed floats over the content', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openSettings(page);

  const security = page.locator('#settings-security');
  const securityToggle = security.getByRole('button');
  await expect(securityToggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#settings-security-panel')).toBeHidden();
  await securityToggle.click();
  await expect(securityToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#settings-security-panel')).toBeVisible();
  await securityToggle.click();
  await expect(page.locator('#settings-security-panel')).toBeHidden();

  // The group links scroll away with the page on a phone instead of pinning over the content.
  const nav = page.getByRole('navigation', { name: 'Nhóm cài đặt' });
  await expect(nav).toHaveCSS('position', 'static');

  // Scroll to the bottom: no fixed element other than the app's own header may sit over the content.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2)).toBe(true);
  const floating = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('body *'))
    .filter((el) => {
      const style = getComputedStyle(el);
      if (style.position !== 'fixed' || style.display === 'none' || style.visibility === 'hidden') return false;
      if (el.closest('[role="dialog"]')) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > window.innerHeight / 2;
    })
    .map((el) => el.tagName + (el.getAttribute('aria-label') ? `[${el.getAttribute('aria-label')}]` : '')));
  expect(floating).toEqual([]);
});
