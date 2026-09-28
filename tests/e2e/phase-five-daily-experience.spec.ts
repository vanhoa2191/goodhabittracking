import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

test('task actions keep click, details and touch guidance as equivalent paths', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  const taskCard = page
    .getByRole('heading', { name: 'Nhan thí: Tươi cười chào buổi sáng' })
    .locator('xpath=ancestor::*[@data-task-card][1]');

  await expect(taskCard.getByRole('button', { name: /Xem chi tiết/ })).toBeVisible();
  await expect(taskCard.getByRole('button', { name: /Đánh dấu nhiệm vụ/ })).toBeVisible();
  if (isMobile) await expect(taskCard.getByTestId('swipe-hint')).toBeVisible();
  else await expect(taskCard.getByTestId('swipe-hint')).toBeHidden();

  await taskCard.getByRole('button', { name: /Xem chi tiết/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Chi tiết nhiệm vụ' });
  await expect(dialog.getByRole('heading', { name: 'Ý nghĩa' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(taskCard.getByRole('button', { name: /Xem chi tiết/ })).toBeFocused();
});

test('haptic feedback happens only after a successful completion and respects reduced motion', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: () => {
        const target = window as typeof window & { __hapticCount?: number };
        target.__hapticCount = (target.__hapticCount ?? 0) + 1;
        return true;
      },
    });
  });
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  const taskCard = page.locator('[data-task-card]').first();
  await taskCard.getByRole('button', { name: /Đánh dấu nhiệm vụ/ }).click();
  await expect.poll(() => page.evaluate(() => (window as typeof window & { __hapticCount?: number }).__hapticCount ?? 0)).toBe(1);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const nextTask = page.locator('[data-task-card][data-complete="false"]').first();
  await nextTask.getByRole('button', { name: /Đánh dấu nhiệm vụ/ }).click();
  expect(await page.evaluate(() => (window as typeof window & { __hapticCount?: number }).__hapticCount ?? 0)).toBe(1);
});

test('parent rewards show the active family catalog before the optional template library', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await page.getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: 'Đổi quà' }).click();

  const activeReward = page.getByRole('heading', { name: 'Xem phim hoạt hình 30 phút' });
  const library = page.getByText('Khám phá thư viện quà tặng ý nghĩa');
  await expect(activeReward).toBeVisible();
  await expect(library).toBeVisible();
  expect((await activeReward.boundingBox())!.y).toBeLessThan((await library.boundingBox())!.y);
  await expect(page.getByRole('heading', { name: 'Gợi ý quà tặng ý nghĩa' })).toBeHidden();
  await library.click();
  await expect(page.getByRole('heading', { name: 'Gợi ý quà tặng ý nghĩa' })).toBeVisible();
});

test('parent settings expose task-oriented groups with stable deep links', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await page.getByRole('tab', { name: 'Gia đình' }).click();
  await page.getByRole('tab', { name: 'Cài đặt' }).click();

  const nav = page.getByRole('navigation', { name: 'Nhóm cài đặt' });
  for (const label of ['Thiết bị & nhịp gia đình', 'Tài khoản', 'Riêng tư & thông báo', 'Giao diện', 'Bảo vệ bằng PIN']) {
    await expect(nav.getByRole('link', { name: label })).toBeVisible();
  }
  await nav.getByRole('link', { name: 'Bảo vệ bằng PIN' }).click();
  await expect(page).toHaveURL(/#settings-security$/);
  await expect(page.getByRole('heading', { name: 'Bảo vệ khu vực phụ huynh' })).toBeVisible();
});
