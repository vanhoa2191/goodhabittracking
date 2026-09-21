import { expect, test, type Locator, type Page } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

async function expectSafeBodyPortal(page: Page, dialog: Locator) {
  await expect(dialog).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

  const isBodyPortal = await dialog.evaluate(
    (element) => element.parentElement?.parentElement === document.body
  );
  expect(isBodyPortal).toBe(true);

  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(812);
}

test('pricing dialog stays in the mobile viewport after deep scrolling', async ({ page }) => {
  // Given a demo session scrolled to the end of the document.
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const opener = page.getByRole('button', { name: 'PRO' });

  // When the pricing dialog opens.
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Bảng Giá Nâng Cấp KidHabit Hero Pro' });

  // Then it is a safe body portal and keyboard dismissal restores focus.
  await expectSafeBodyPortal(page, dialog);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('habit timer traps focus inside a mobile body portal', async ({ page }) => {
  // Given a demo child dashboard scrolled near the end of the document.
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const opener = page.getByRole('button', { name: /\d+m Bắt đầu/ }).first();

  // When the habit timer opens.
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Đồng hồ thói quen' });

  // Then tabbing wraps within the dialog and Escape restores the trigger.
  await expectSafeBodyPortal(page, dialog);
  const firstControl = dialog.getByRole('button', { name: 'Đóng' });
  await expect(firstControl).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Bắt đầu' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(firstControl).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
