import { expect, test } from '@playwright/test';
import { setupOrUnlockParent } from './pin-helper';

test('the edit and delete buttons of a habit name the habit and are 44px targets', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  await setupOrUnlockParent(page);
  await page.getByRole('tablist', { name: 'Khu vực phụ huynh' }).getByRole('tab', { name: 'Thiết kế' }).click();
  await page.getByRole('tab', { name: /Quản lý việc/ }).click();

  const edit = page.getByRole('button', { name: /^Chỉnh sửa: .+/ }).first();
  const remove = page.getByRole('button', { name: /^Xóa: .+/ }).first();
  await expect(edit).toBeVisible();
  for (const button of [edit, remove]) {
    const box = await button.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(43.5);
    expect(box!.height).toBeGreaterThanOrEqual(43.5);
  }
});
