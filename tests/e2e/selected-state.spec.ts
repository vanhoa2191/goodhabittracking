import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

test('the child navigation says which section is open', async ({ page }) => {
  await page.goto('/?demo=1');
  const tabs = page.getByRole('button', { pressed: true });
  await expect(tabs.first()).toBeVisible();
  const nav = page.locator('div.grid').filter({ has: page.getByRole('button', { name: /Nhiệm vụ|Tasks/i }) }).first();
  await expect(nav.getByRole('button', { pressed: true })).toHaveCount(1);
  await expect(nav.getByRole('button', { pressed: true })).toContainText(/Nhiệm vụ|Tasks/i);
  const second = nav.getByRole('button', { pressed: false }).first();
  await second.click();
  await expect(nav.getByRole('button', { pressed: true })).toHaveCount(1);
  await expect(nav.getByRole('button', { pressed: true })).not.toContainText(/Nhiệm vụ|Tasks/i);
});

test('the text size and font choices report which one is selected', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await page.locator('header').getByRole('button', { name: /Aa/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Cài đặt chữ' });
  await expect(dialog).toBeVisible();

  const sizes = dialog.getByRole('button', { pressed: true });
  expect(await sizes.count()).toBeGreaterThanOrEqual(2); // one size and one font
  const unselected = dialog.getByRole('button', { pressed: false });
  const before = await dialog.getByRole('button', { pressed: true }).allTextContents();
  await unselected.first().click();
  const after = await dialog.getByRole('button', { pressed: true }).allTextContents();
  expect(after).not.toEqual(before);
});
