import { expect, test } from '@playwright/test';

const locales = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as const;

test('the parent areas stay usable by keyboard at 375px in every supported language', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: /Khám phá thử ngay/ }).click();
  await page.getByRole('button', { name: 'Phụ huynh', exact: true }).click();
  const pinDialog = page.getByRole('dialog', { name: 'Nhập mã PIN phụ huynh' });
  for (const digit of ['1', '2', '3', '4']) await pinDialog.getByRole('button', { name: digit, exact: true }).click();

  for (const locale of locales) {
    const menuButton = page.getByTestId('more-menu');
    await menuButton.click();
    await menuButton.locator('xpath=..').getByRole('button', { name: new RegExp(`${locale.toUpperCase()}$`) }).click();
    await menuButton.click();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);

    const areas = page.locator('[role="tablist"]').filter({ has: page.locator('#parent-area-today') });
    await expect(areas.getByRole('tab')).toHaveCount(3);
    await areas.locator('#parent-area-family').click();
    await expect(page.locator('#parent-section-children')).toHaveAttribute('aria-selected', 'true');
    await areas.locator('#parent-area-family').focus();
    await page.keyboard.press('Home');
    await expect(areas.locator('#parent-area-today')).toHaveAttribute('aria-selected', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${locale} should fit 375px`).toBe(true);
  }
});
