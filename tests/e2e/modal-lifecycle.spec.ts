import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

test('the child profile dialog is named by its heading, closes on Escape and gives the page its scroll back', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await page.getByRole('tablist', { name: 'Khu vực phụ huynh' }).getByRole('tab', { name: 'Gia đình' }).click();
  await page.getByRole('tab', { name: /Hồ sơ các con/ }).click();

  const opener = page.getByRole('button', { name: 'Thêm hồ sơ bé mới' });
  await opener.click();

  const dialog = page.getByRole('dialog', { name: 'Thêm hồ sơ bé mới' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-labelledby', 'child-modal-title');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await expect(opener).toBeFocused();
});

test('deleting a reward asks in the app, names the action, and Cancel keeps the reward', async ({ page }) => {
  const nativeDialogs: string[] = [];
  page.on('dialog', (dialog) => { nativeDialogs.push(dialog.type()); void dialog.dismiss(); });
  await page.goto('/');
  await page.getByTestId('landing-primary-action').click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await page.getByRole('tablist', { name: 'Khu vực phụ huynh' }).getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: /Đổi quà/ }).click();

  const deleteButtons = page.getByRole('button', { name: /^Xóa / });
  const before = await deleteButtons.count();
  expect(before).toBeGreaterThan(0);

  await deleteButtons.first().click();
  const dialog = page.getByRole('dialog', { name: 'Xác nhận' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Hủy' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Hủy' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(deleteButtons).toHaveCount(before);

  await deleteButtons.first().click();
  await dialog.getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(deleteButtons).toHaveCount(before - 1);
  expect(nativeDialogs).toEqual([]);
});
