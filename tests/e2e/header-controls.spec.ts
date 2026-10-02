import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

async function openParent(page: import('@playwright/test').Page) {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
}

for (const width of [1280, 1440]) {
  test(`at ${width}px the language, text size, sound and theme controls are in the header, not behind the menu`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await openParent(page);
    const header = page.locator('header');
    await expect(header.getByTestId('sound-toggle')).toBeVisible();
    await expect(header.getByRole('button', { name: /Aa/ })).toBeVisible();
    await expect(header.getByRole('button', { expanded: false, name: /Tiếng Việt|VI/i }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll').toBe(true);
  });
}

test('the "more" menu is a dialog: it traps focus, closes on Escape and gives focus back to its button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await openParent(page);
  const opener = page.getByTestId('more-menu');
  await expect(opener).toHaveAttribute('aria-expanded', 'false');
  await opener.click();
  await expect(opener).toHaveAttribute('aria-expanded', 'true');

  const menu = page.getByRole('dialog', { name: /Menu|Thêm|More/i });
  await expect(menu).toBeVisible();
  const close = menu.getByRole('button', { name: /Đóng|Close/ });
  const box = await close.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(43.5);
  expect(box!.height).toBeGreaterThanOrEqual(43.5);

  for (let press = 0; press < 12; press += 1) await page.keyboard.press('Tab');
  expect(await menu.evaluate((node) => node.contains(document.activeElement)), 'focus stays inside the menu').toBe(true);

  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(opener).toHaveAttribute('aria-expanded', 'false');
});

test('the parent-mode button says where it leads', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openParent(page);
  await expect(page.locator('header').getByRole('button', { name: 'Về màn hình của bé' })).toBeVisible();
});
