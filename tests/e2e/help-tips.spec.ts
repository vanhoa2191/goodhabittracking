import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

async function openParentArea(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'vi'));
  await page.reload();
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
}

test('a ? explains a feature in a sentence or two and opens the matching part of the guide', async ({ page }) => {
  test.setTimeout(90_000);
  await openParentArea(page);

  const tip = page.locator('[data-help-topic="approvals.tasks"]');
  await expect(tip).toBeVisible();
  await tip.click();
  const popover = page.getByRole('dialog', { name: 'Việc chờ duyệt' });
  await expect(popover).toContainText('cần duyệt');

  await popover.getByRole('button', { name: 'Xem chi tiết' }).click();
  const detail = page.getByRole('dialog', { name: /Việc chờ duyệt/ });
  // The first open compiles and downloads the detail window and the guide chapter, which is slow on a cold dev server.
  await expect(detail.getByRole('heading', { name: /Việc và quà cần duyệt/ })).toBeVisible({ timeout: 30_000 });
  await expect(detail).toContainText('Nhiệm vụ chờ ba mẹ duyệt', { timeout: 30_000 });

  // A link to another part of the guide opens inside the same window, and Back returns.
  await detail.getByRole('link', { name: 'PIN' }).first().click();
  await expect(detail.getByRole('button', { name: 'Quay lại' })).toBeVisible({ timeout: 15_000 });
  await detail.getByRole('button', { name: 'Quay lại' }).click();
  await expect(detail).toContainText('Nhiệm vụ chờ ba mẹ duyệt');

  await detail.getByRole('button', { name: 'Đóng' }).last().click();
  await expect(detail).toHaveCount(0);
  await expect(tip).toBeFocused();
});

test('the explanation closes with Escape and a tap elsewhere, and stays inside the screen on a phone', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 375, height: 800 });
  await openParentArea(page);
  const tip = page.locator('[data-help-topic="approvals.tasks"]');
  await tip.click();
  const popover = page.getByRole('dialog', { name: 'Việc chờ duyệt' });
  await expect(popover).toBeVisible();
  const box = await popover.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  await page.keyboard.press('Escape');
  await expect(popover).toHaveCount(0);
  await tip.click();
  await expect(popover).toBeVisible();
  await page.getByRole('heading', { name: /Yêu cầu đổi quà/ }).click({ force: true });
  await expect(popover).toHaveCount(0);
});

test('every parent area carries ? help and the guide link opens the in-app guide', async ({ page }) => {
  test.setTimeout(120_000);
  await openParentArea(page);
  await expect(page.locator('[data-help-topic]').first()).toBeVisible();
  await page.getByRole('tab', { name: 'Gia đình', exact: true }).click();
  await expect(page.locator('[data-help-topic="children.profiles"]')).toBeVisible();
  await page.getByRole('tab', { name: /Cài đặt/ }).click();
  await expect(page.locator('[data-help-topic="settings.pin"]')).toBeVisible();
  await expect(page.getByRole('link', { name: /tài liệu hướng dẫn/i })).toHaveAttribute('href', '/docs');
});
