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
