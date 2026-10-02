import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

async function openParent(page: import('@playwright/test').Page) {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
}

test('the settings links stay in view while scrolling and mark the section you are in', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openParent(page);
  await page.getByRole('tablist', { name: 'Khu vực phụ huynh' }).getByRole('tab', { name: 'Gia đình' }).click();
  await page.getByRole('tab', { name: /Cài đặt/ }).click();

  const nav = page.getByRole('navigation', { name: 'Nhóm cài đặt' });
  await expect(nav).toBeVisible();
  await expect(nav.locator('a[aria-current="location"]')).toHaveCount(1);

  await page.locator('#settings-security').scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 200);
  await expect(nav).toBeInViewport();
  await expect(nav.locator('a[aria-current="location"]')).toHaveAttribute('href', '#settings-security');

  await nav.getByRole('link', { name: 'Tài khoản', exact: true }).click();
  await expect(page.locator('#settings-account')).toBeInViewport();
  await expect(page.locator('#settings-account')).not.toHaveCSS('visibility', 'hidden');
});

test('an empty approvals list is a finished empty state, and each day of the weekly chart is named', async ({ page }) => {
  await openParent(page);
  const empty = page.getByText('Hiện không có nhiệm vụ nào cần phê duyệt.');
  await expect(empty).toBeVisible();
  await expect(empty.locator('xpath=ancestor::div[contains(@class,"border-dashed")][1]')).toBeVisible();

  await page.getByRole('tab', { name: /Thống kê/ }).click();
  const days = page.getByRole('img', { name: /: \d+$/ });
  await expect(days).toHaveCount(7);
  const names = await days.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')));
  expect(new Set(names.map((name) => name?.split(':')[0])).size).toBe(7);
});
