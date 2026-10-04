import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

test('parents see that AI suggestions are coming, and nothing about them can be pressed', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?demo=1');
  await page.evaluate(() => localStorage.setItem('kidhabit_language', 'vi'));
  await page.reload();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);

  await page.getByRole('tablist', { name: 'Khu vực phụ huynh' }).getByRole('tab', { name: 'Gia đình' }).click();
  await page.getByRole('tab', { name: /Cài đặt/ }).click();
  const card = page.getByTestId('ai-coming-soon-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Sắp ra mắt');
  await expect(card).toContainText('không bao giờ gửi tên hay nhật ký của bé');
  await expect(page.getByTestId('ai-consent-card')).toHaveCount(0);

  await page.getByRole('tablist', { name: 'Khu vực phụ huynh' }).getByRole('tab', { name: 'Hôm nay' }).click();
  await page.getByRole('tablist', { name: 'Khu vực phụ huynh' }).getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: /Quản lý việc/ }).click();
  await page.getByRole('button', { name: /Thêm|Tạo/ }).first().click();
  const breakdown = page.getByTestId('ai-coming-soon-breakdown');
  await expect(breakdown).toBeVisible();
  await expect(breakdown).toBeDisabled();
  await expect(breakdown).toContainText('Sắp ra mắt');
});

test('the pricing dialog announces the AI plans as coming soon, with no price and nothing to buy', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?pricing=1');
  const section = page.getByTestId('upcoming-plans');
  await expect(section).toBeVisible({ timeout: 30_000 });
  await expect(section).toContainText('Sắp ra mắt');
  await expect(section.locator('[data-plan]')).toHaveCount(2);
  await expect(section).not.toContainText(/\d{3}/);
  for (const button of await section.getByRole('button').all()) await expect(button).toBeDisabled();
  // The three plans that can be bought are still there and unchanged.
  await expect(page.getByTestId('paid-plan-grid').locator('> div')).toHaveCount(3);
});
